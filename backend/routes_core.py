from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from db import db
from security import get_current_user
import store
import finance_engine as fe
import ml_model

router = APIRouter(prefix="/api", tags=["core"])


# ---------------- Personal Profile ----------------
class PersonalProfile(BaseModel):
    age: Optional[int] = None
    occupation: Optional[str] = None
    employment_status: Optional[str] = None
    dependents: Optional[int] = 0
    financial_experience: Optional[str] = None


@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return await store.get_personal(user["id"])


@router.put("/profile")
async def update_profile(payload: PersonalProfile, user: dict = Depends(get_current_user)):
    data = payload.model_dump()
    data["user_id"] = user["id"]
    await db.user_profiles.update_one({"user_id": user["id"]}, {"$set": data}, upsert=True)
    return {"message": "Profile updated", "profile": data}


# ---------------- Financial Profile ----------------
class FinancialProfile(BaseModel):
    monthly_income: Optional[float] = 0
    monthly_expenses: Optional[float] = 0
    monthly_savings: Optional[float] = 0
    total_debt: Optional[float] = 0
    monthly_emi: Optional[float] = 0
    emergency_fund: Optional[float] = 0
    investment_capacity: Optional[float] = 0
    current_investments: Optional[float] = 0
    monthly_sip_capacity: Optional[float] = 0


@router.get("/financial-profile")
async def get_financial(user: dict = Depends(get_current_user)):
    return await store.get_financial(user["id"])


@router.put("/financial-profile")
async def update_financial(payload: FinancialProfile, user: dict = Depends(get_current_user)):
    data = payload.model_dump()
    data["user_id"] = user["id"]
    await db.financial_profiles.update_one({"user_id": user["id"]}, {"$set": data}, upsert=True)
    return {"message": "Financial profile updated", "financial_profile": data}


# ---------------- Risk Assessment ----------------
class RiskQuestionnaire(BaseModel):
    market_decline_reaction: int = 3
    experience_level: int = 2
    investment_horizon_years: float = 5
    loss_tolerance_pct: float = 10
    equity_exposure_willingness_pct: float = 40


@router.post("/risk/assess")
async def assess_risk(payload: RiskQuestionnaire, user: dict = Depends(get_current_user)):
    personal = await store.get_personal(user["id"])
    financial = await store.get_financial(user["id"])
    questionnaire = payload.model_dump()
    result = fe.classify_risk(personal, financial, questionnaire)

    # ML classification (blended with rule-based)
    vec = fe.build_risk_feature_vector(personal, financial, questionnaire)
    ml_idx = ml_model.predict_risk_category(vec)
    if ml_idx is not None:
        result["ml_risk_category"] = fe.RISK_CATEGORIES[ml_idx]
        result["model_source"] = "hybrid (ML + rules)"
    else:
        result["ml_risk_category"] = result["risk_category"]
        result["model_source"] = "rule-based"

    doc = {**result, "user_id": user["id"], "questionnaire": questionnaire,
           "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.risk_profiles.update_one({"user_id": user["id"]}, {"$set": doc}, upsert=True)
    return result


@router.get("/risk/profile")
async def get_risk_profile(user: dict = Depends(get_current_user)):
    return await store.get_risk(user["id"])


# ---------------- Financial Health ----------------
@router.get("/financial-health")
async def get_financial_health(user: dict = Depends(get_current_user)):
    financial = await store.get_financial(user["id"])
    goals = await store.get_goals(user["id"])
    holdings = await store.get_holdings(user["id"])
    return fe.financial_health(financial, goals, holdings)


# ---------------- ML status ----------------
@router.get("/ml/status")
async def ml_status():
    return ml_model.models_status()
