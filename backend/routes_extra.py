import os
import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from db import db
from security import get_current_user, require_admin
import store
import finance_engine as fe

router = APIRouter(prefix="/api", tags=["extra"])

DISCLAIMER = (
    "This platform provides educational and analytical information and does not "
    "guarantee investment returns or constitute personalized regulated financial advice."
)


# ---------------- Notifications ----------------
async def _build_notifications(user_id):
    financial = await store.get_financial(user_id)
    risk = await store.get_risk(user_id)
    goals = await store.get_goals(user_id)
    holdings = await store.get_holdings(user_id)
    notes = []

    expenses = max(financial.get("monthly_expenses", 0) or 1, 1)
    emergency_months = (financial.get("emergency_fund", 0) or 0) / expenses
    if emergency_months < 3:
        notes.append(("Emergency Fund Below Target",
                      f"Your emergency fund covers only {round(emergency_months,1)} months. Aim for 3-6 months.",
                      "warning"))

    if holdings:
        analysis = fe.analyze_portfolio(holdings, risk)
        if analysis["allocation"] and analysis["allocation"][0]["percentage"] > 60:
            top = analysis["allocation"][0]
            notes.append(("Portfolio Highly Concentrated",
                          f"{top['percentage']}% is in {top['category']}. Consider diversifying.",
                          "warning"))

    for g in goals:
        yrs = g.get("years_remaining", 5)
        m = fe.compute_goal_metrics(g)
        if yrs < 1:
            notes.append(("Goal Deadline Approaching",
                          f"Your '{g.get('goal_type')}' goal is due within a year.",
                          "info"))
        if m["status"] == "Off Track":
            notes.append(("Goal Off Track",
                          f"Your '{g.get('goal_type')}' goal needs a higher monthly contribution.",
                          "warning"))

    if not risk:
        notes.append(("Complete Risk Assessment",
                      "Assess your risk profile to unlock personalized recommendations.",
                      "info"))
    notes.append(("Portfolio Review Reminder",
                  "Review your portfolio allocation quarterly to stay aligned with your goals.",
                  "info"))
    return notes


@router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    generated = await _build_notifications(user["id"])
    existing = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    existing_titles = {(n["title"], n["message"]) for n in existing}
    for title, message, ntype in generated:
        if (title, message) not in existing_titles:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "title": title,
                "message": message,
                "type": ntype,
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    notes = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    notes.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    return notes


@router.put("/notifications/{note_id}/read")
async def mark_read(note_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": note_id, "user_id": user["id"]}, {"$set": {"is_read": True}})
    return {"message": "Marked read"}


@router.put("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"is_read": True}})
    return {"message": "All marked read"}


# ---------------- Dashboard summary ----------------
@router.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    financial = await store.get_financial(user["id"])
    risk = await store.get_risk(user["id"])
    goals = await store.get_goals(user["id"])
    holdings = await store.get_holdings(user["id"])
    health = fe.financial_health(financial, goals, holdings)
    portfolio = await db.portfolios.find_one({"user_id": user["id"]}, {"_id": 0})
    recs = await db.recommendations.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    recs.sort(key=lambda r: r.get("suitability_score", 0), reverse=True)

    enriched_goals = []
    for g in goals:
        m = fe.compute_goal_metrics(g)
        enriched_goals.append({
            "id": g.get("id"), "goal_type": g.get("goal_type"), "name": g.get("name"),
            "target_amount": g.get("target_amount"), "current_amount": g.get("current_amount"),
            "progress_pct": m["progress_pct"], "status": m["status"],
        })

    action_items = []
    for s in health["suggestions"][:4]:
        action_items.append(s)

    return {
        "financial_health": health["overall_score"],
        "risk_profile": risk.get("risk_category"),
        "risk_score": risk.get("risk_score"),
        "goals": enriched_goals,
        "portfolio": portfolio,
        "top_recommendations": recs[:3],
        "action_items": action_items,
        "has_financial_profile": bool(financial),
        "has_risk_profile": bool(risk),
    }


# ---------------- AI Financial Assistant (Claude Sonnet 4.6, streaming) ----------------
class ChatInput(BaseModel):
    message: str
    session_id: str = "default"


async def _system_context(user_id, user_name):
    financial = await store.get_financial(user_id)
    risk = await store.get_risk(user_id)
    goals = await store.get_goals(user_id)
    health_data = fe.financial_health(financial, goals, await store.get_holdings(user_id))
    goals_txt = "; ".join(
        f"{g.get('goal_type')} target ₹{g.get('target_amount')}, current ₹{g.get('current_amount')}, "
        f"~{g.get('years_remaining', '?')} yrs left" for g in goals
    ) or "none set"
    return (
        f"You are a helpful, careful financial education assistant for the Smart Investment "
        f"Recommendation System. The user's name is {user_name}. "
        f"Use ONLY the user's stored profile to answer with specific numbers where possible.\n\n"
        f"USER PROFILE:\n"
        f"- Monthly income: ₹{financial.get('monthly_income', 'unknown')}, expenses: ₹{financial.get('monthly_expenses', 'unknown')}, "
        f"savings: ₹{financial.get('monthly_savings', 'unknown')}\n"
        f"- Emergency fund: ₹{financial.get('emergency_fund', 'unknown')}, total debt: ₹{financial.get('total_debt', 'unknown')}\n"
        f"- Risk profile: {risk.get('risk_category', 'not assessed')} (score {risk.get('risk_score', 'NA')}/100), "
        f"max equity exposure {risk.get('max_equity_exposure', 'NA')}%\n"
        f"- Financial health score: {health_data['overall_score']}/100\n"
        f"- Goals: {goals_txt}\n\n"
        f"RULES: Be concise and practical. Explain reasoning. Do NOT promise guaranteed returns. "
        f"When relevant, remind the user: '{DISCLAIMER}'. "
        f"If asked about a recommendation, explain it using their risk profile, horizon and goals."
    )


@router.post("/assistant/chat")
async def assistant_chat(payload: ChatInput, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

    api_key = os.environ["EMERGENT_LLM_KEY"]
    system_message = await _system_context(user["id"], user.get("name", "there"))
    session_id = f"{user['id']}:{payload.session_id}"

    # persist user message
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "session_id": payload.session_id,
        "role": "user", "content": payload.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system_message).with_model(
        "anthropic", "claude-sonnet-4-6"
    )

    async def event_generator():
        collected = []
        try:
            async for event in chat.stream_message(UserMessage(text=payload.message)):
                if isinstance(event, TextDelta):
                    collected.append(event.content)
                    yield f"data: {json.dumps({'delta': event.content})}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        full = "".join(collected)
        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"], "session_id": payload.session_id,
            "role": "assistant", "content": full,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/assistant/history")
async def assistant_history(session_id: str = "default", user: dict = Depends(get_current_user)):
    msgs = await db.chat_messages.find(
        {"user_id": user["id"], "session_id": session_id}, {"_id": 0}
    ).to_list(200)
    msgs.sort(key=lambda m: m.get("created_at", ""))
    return msgs


# ---------------- Admin ----------------
@router.get("/admin/users")
async def admin_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"password_hash": 0}).to_list(1000)
    for u in users:
        u["id"] = str(u.pop("_id"))
    return users


@router.get("/admin/statistics")
async def admin_statistics(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({"role": "user"})
    total_recs = await db.recommendations.count_documents({})
    total_goals = await db.financial_goals.count_documents({})

    risk_dist = {}
    async for r in db.risk_profiles.find({}, {"risk_category": 1}):
        c = r.get("risk_category", "Unknown")
        risk_dist[c] = risk_dist.get(c, 0) + 1

    goal_dist = {}
    async for g in db.financial_goals.find({}, {"goal_type": 1}):
        c = g.get("goal_type", "Unknown")
        goal_dist[c] = goal_dist.get(c, 0) + 1

    cat_dist = {}
    async for rec in db.recommendations.find({}, {"category": 1}):
        c = rec.get("category", "Unknown")
        cat_dist[c] = cat_dist.get(c, 0) + 1

    active_users = len(await db.risk_profiles.distinct("user_id"))

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_recommendations": total_recs,
        "total_goals": total_goals,
        "risk_distribution": [{"name": k, "value": v} for k, v in risk_dist.items()],
        "goal_distribution": [{"name": k, "value": v} for k, v in goal_dist.items()],
        "category_distribution": [{"name": k, "value": v} for k, v in cat_dist.items()],
    }


class InvestmentInput(BaseModel):
    name: str
    category: str
    risk_level: int
    expected_return: float
    volatility: float
    liquidity: int
    minimum_investment: float
    horizon_min_years: float = 1
    horizon_max_years: float = 10
    description: str = ""
    suitable_profiles: list = []
    goal_suitability: list = []


@router.post("/admin/investments")
async def admin_add_investment(payload: InvestmentInput, admin: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["historical_performance"] = []
    await db.investments.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@router.delete("/admin/investments/{investment_id}")
async def admin_delete_investment(investment_id: str, admin: dict = Depends(require_admin)):
    await db.investments.delete_one({"id": investment_id})
    return {"message": "Investment removed"}


@router.get("/disclaimer")
async def disclaimer():
    return {"disclaimer": DISCLAIMER}
