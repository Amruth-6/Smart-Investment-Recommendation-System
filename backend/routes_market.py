from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from db import db
from security import get_current_user
import store
from seed import MARKET_INDICES

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/overview")
async def market_overview():
    return {
        "indices": MARKET_INDICES,
        "as_of": "Demo data (illustrative)",
        "is_demo": True,
    }


@router.get("/investments")
async def market_investments(category: Optional[str] = None, user: dict = Depends(get_current_user)):
    investments = await store.get_investments()
    if category and category != "all":
        investments = [i for i in investments if i.get("category") == category]
    return investments


@router.get("/investments/{investment_id}")
async def investment_detail(investment_id: str, user: dict = Depends(get_current_user)):
    inv = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    return inv


@router.get("/categories")
async def market_categories(user: dict = Depends(get_current_user)):
    investments = await store.get_investments()
    cats = {}
    for inv in investments:
        c = inv.get("category")
        cats.setdefault(c, {"category": c, "count": 0, "avg_return": 0, "avg_volatility": 0, "returns": [], "vols": []})
        cats[c]["count"] += 1
        cats[c]["returns"].append(inv.get("expected_return", 0))
        cats[c]["vols"].append(inv.get("volatility", 0))
    result = []
    for c, d in cats.items():
        result.append({
            "category": c,
            "count": d["count"],
            "avg_return": round(sum(d["returns"]) / len(d["returns"]), 1),
            "avg_volatility": round(sum(d["vols"]) / len(d["vols"]), 1),
        })
    return sorted(result, key=lambda x: -x["avg_return"])
