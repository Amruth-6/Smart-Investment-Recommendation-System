"""Data access helpers assembling a user's full financial context."""
from db import db


async def get_personal(user_id):
    doc = await db.user_profiles.find_one({"user_id": user_id}, {"_id": 0})
    return doc or {}


async def get_financial(user_id):
    doc = await db.financial_profiles.find_one({"user_id": user_id}, {"_id": 0})
    return doc or {}


async def get_risk(user_id):
    doc = await db.risk_profiles.find_one({"user_id": user_id}, {"_id": 0})
    return doc or {}


async def get_goals(user_id):
    return await db.financial_goals.find({"user_id": user_id}, {"_id": 0}).to_list(200)


async def get_holdings(user_id):
    return await db.user_holdings.find({"user_id": user_id}, {"_id": 0}).to_list(500)


async def get_investments():
    return await db.investments.find({}, {"_id": 0}).to_list(500)


async def build_user_ctx(user_id):
    """Assemble the context object consumed by the recommendation engine."""
    risk = await get_risk(user_id)
    financial = await get_financial(user_id)
    goals = await get_goals(user_id)
    holdings = await get_holdings(user_id)
    from finance_engine import financial_health

    health = financial_health(financial, goals, holdings)
    primary_goal = None
    if goals:
        primary_goal = sorted(goals, key=lambda g: g.get("priority", 3))[0]
    return {
        "risk_category": risk.get("risk_category", "Moderate"),
        "horizon_years": risk.get("investment_horizon", 5),
        "max_equity_exposure": risk.get("max_equity_exposure", 55),
        "risk_capacity": risk.get("risk_capacity", 60),
        "financial_health": health["overall_score"],
        "goal_type": primary_goal.get("goal_type") if primary_goal else None,
        "holdings_categories": list({h.get("category") for h in holdings if h.get("category")}),
    }
