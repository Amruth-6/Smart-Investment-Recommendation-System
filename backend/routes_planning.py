import uuid
from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from db import db
from security import get_current_user
import store
import finance_engine as fe
import ml_model

router = APIRouter(prefix="/api", tags=["planning"])


def _years_remaining(target_date: str) -> float:
    try:
        td = datetime.fromisoformat(target_date).date()
        delta = (td - date.today()).days
        return max(round(delta / 365.25, 2), 0.05)
    except Exception:
        return 5.0


# ---------------- Goals ----------------
class GoalInput(BaseModel):
    goal_type: str
    name: Optional[str] = None
    target_amount: float
    current_amount: float = 0
    target_date: str
    monthly_contribution: float = 0
    priority: int = 3


def _enrich_goal(g):
    g = dict(g)
    g["years_remaining"] = _years_remaining(g.get("target_date", ""))
    g["metrics"] = fe.compute_goal_metrics(g)
    return g


@router.post("/goals")
async def create_goal(payload: GoalInput, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.financial_goals.insert_one(dict(doc))
    return _enrich_goal(doc)


@router.get("/goals")
async def list_goals(user: dict = Depends(get_current_user)):
    goals = await store.get_goals(user["id"])
    return [_enrich_goal(g) for g in goals]


@router.get("/goals/{goal_id}")
async def get_goal(goal_id: str, user: dict = Depends(get_current_user)):
    g = await db.financial_goals.find_one({"id": goal_id, "user_id": user["id"]}, {"_id": 0})
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _enrich_goal(g)


@router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, payload: GoalInput, user: dict = Depends(get_current_user)):
    existing = await db.financial_goals.find_one({"id": goal_id, "user_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Goal not found")
    data = payload.model_dump()
    await db.financial_goals.update_one({"id": goal_id, "user_id": user["id"]}, {"$set": data})
    updated = await db.financial_goals.find_one({"id": goal_id, "user_id": user["id"]}, {"_id": 0})
    return _enrich_goal(updated)


@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user: dict = Depends(get_current_user)):
    res = await db.financial_goals.delete_one({"id": goal_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}


# ---------------- Recommendations ----------------
@router.post("/recommendations/generate")
async def generate_recommendations(user: dict = Depends(get_current_user)):
    ctx = await store.build_user_ctx(user["id"])
    investments = await store.get_investments()
    ranked = fe.rank_recommendations(investments, ctx, ml_predict=ml_model.predict_suitability, top_n=8)

    await db.recommendations.delete_many({"user_id": user["id"]})
    docs = []
    for item in ranked:
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "investment_id": item["investment"].get("id"),
            "investment_name": item["investment"].get("name"),
            "category": item["investment"].get("category"),
            "suitability_score": item["suitability_score"],
            "subscores": item["subscores"],
            "rule_score": item["rule_score"],
            "ml_score": item["ml_score"],
            "reasons": item["reasons"],
            "cautions": item["cautions"],
            "investment": item["investment"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        docs.append(doc)
    if docs:
        await db.recommendations.insert_many([dict(d) for d in docs])
    for d in docs:
        d.pop("_id", None)
    return {"context": ctx, "recommendations": docs}


@router.get("/recommendations")
async def list_recommendations(user: dict = Depends(get_current_user)):
    recs = await db.recommendations.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    recs.sort(key=lambda r: r.get("suitability_score", 0), reverse=True)
    return recs


@router.get("/recommendations/{rec_id}")
async def get_recommendation(rec_id: str, user: dict = Depends(get_current_user)):
    rec = await db.recommendations.find_one({"id": rec_id, "user_id": user["id"]}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return rec


# ---------------- Portfolio ----------------
@router.post("/portfolio/generate")
async def generate_portfolio(user: dict = Depends(get_current_user)):
    risk = await store.get_risk(user["id"])
    personal = await store.get_personal(user["id"])
    financial = await store.get_financial(user["id"])
    goals = await store.get_goals(user["id"])
    horizon = risk.get("investment_horizon", 5)
    if goals:
        primary = sorted(goals, key=lambda g: g.get("priority", 3))[0]
        horizon = _years_remaining(primary.get("target_date", ""))
    portfolio = fe.generate_portfolio(risk, personal, financial, horizon)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **portfolio,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.portfolios.update_one({"user_id": user["id"]}, {"$set": dict(doc)}, upsert=True)
    doc.pop("_id", None)
    return doc


@router.get("/portfolio")
async def get_portfolio(user: dict = Depends(get_current_user)):
    p = await db.portfolios.find_one({"user_id": user["id"]}, {"_id": 0})
    if not p:
        return None
    return p


@router.get("/portfolio/analysis")
async def portfolio_analysis(user: dict = Depends(get_current_user)):
    holdings = await store.get_holdings(user["id"])
    risk = await store.get_risk(user["id"])
    return fe.analyze_portfolio(holdings, risk)


# ---------------- Holdings ----------------
class HoldingInput(BaseModel):
    name: str
    category: str
    amount: float
    units: Optional[float] = None


@router.get("/holdings")
async def list_holdings(user: dict = Depends(get_current_user)):
    return await store.get_holdings(user["id"])


@router.post("/holdings")
async def add_holding(payload: HoldingInput, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["id"]
    await db.user_holdings.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@router.delete("/holdings/{holding_id}")
async def delete_holding(holding_id: str, user: dict = Depends(get_current_user)):
    res = await db.user_holdings.delete_one({"id": holding_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"message": "Holding removed"}


# ---------------- Simulation & What-If ----------------
class SimulationInput(BaseModel):
    initial_amount: float = 0
    monthly_contribution: float = 5000
    duration_years: float = 10
    expected_return: Optional[float] = None  # annual %; if None -> scenarios


@router.post("/simulation")
async def run_simulation(payload: SimulationInput, user: dict = Depends(get_current_user)):
    if payload.expected_return is not None:
        result = fe.simulate(
            payload.initial_amount,
            payload.monthly_contribution,
            payload.duration_years,
            payload.expected_return / 100,
        )
        out = {"single": result}
    else:
        out = {"scenarios": fe.simulate_scenarios(
            payload.initial_amount, payload.monthly_contribution, payload.duration_years
        )}
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "initial_amount": payload.initial_amount,
        "monthly_contribution": payload.monthly_contribution,
        "duration": payload.duration_years,
        "expected_return": payload.expected_return,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.simulations.insert_one(dict(doc))
    return out


class WhatIfInput(BaseModel):
    goal_id: Optional[str] = None
    initial_amount: float = 0
    current_monthly: float = 5000
    new_monthly: float = 8000
    duration_years: float = 10
    expected_return: float = 10


@router.post("/what-if")
async def what_if(payload: WhatIfInput, user: dict = Depends(get_current_user)):
    rate = payload.expected_return / 100
    base = fe.simulate(payload.initial_amount, payload.current_monthly, payload.duration_years, rate)
    changed = fe.simulate(payload.initial_amount, payload.new_monthly, payload.duration_years, rate)
    result = {
        "base": base,
        "changed": changed,
        "difference": changed["estimated_value"] - base["estimated_value"],
    }
    if payload.goal_id:
        goal = await db.financial_goals.find_one({"id": payload.goal_id, "user_id": user["id"]}, {"_id": 0})
        if goal:
            target = goal.get("target_amount", 0)
            result["goal_target"] = target
            result["base_goal_pct"] = round(min(base["estimated_value"] / target * 100, 100), 1) if target else 0
            result["changed_goal_pct"] = round(min(changed["estimated_value"] / target * 100, 100), 1) if target else 0
    return result
