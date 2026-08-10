"""
Core financial intelligence engine.

Pure, deterministic, testable functions used by the Business Logic / Recommendation
layer. Kept free of DB and web-framework concerns so it can be evaluated in isolation
(academic requirement) and reused by the ML training pipeline as the single source of
truth for the rule-based scoring.
"""
import math

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
RISK_CATEGORIES = [
    "Conservative",
    "Moderately Conservative",
    "Moderate",
    "Moderately Aggressive",
    "Aggressive",
]

# Recommended maximum equity exposure per risk category (%)
MAX_EQUITY_BY_CATEGORY = {
    "Conservative": 20,
    "Moderately Conservative": 35,
    "Moderate": 55,
    "Moderately Aggressive": 70,
    "Aggressive": 85,
}

# Target instrument risk level (1-5) per risk category
TARGET_RISK_LEVEL = {
    "Conservative": 1,
    "Moderately Conservative": 2,
    "Moderate": 3,
    "Moderately Aggressive": 4,
    "Aggressive": 5,
}

EMPLOYMENT_STABILITY = {
    "salaried_permanent": 100,
    "government": 100,
    "salaried_contract": 65,
    "self_employed": 55,
    "business_owner": 60,
    "freelancer": 45,
    "student": 40,
    "retired": 50,
    "unemployed": 15,
}

# Annual return assumptions for the three planning scenarios
SCENARIO_RETURNS = {"conservative": 0.07, "moderate": 0.10, "optimistic": 0.13}

CATEGORY_CODES = {
    "Equity": 0,
    "Mutual Funds": 1,
    "ETFs": 2,
    "Bonds": 3,
    "Fixed Deposits": 4,
    "Gold": 5,
    "Government Securities": 6,
    "REITs": 7,
}


def _clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


# ---------------------------------------------------------------------------
# Risk profiling
# ---------------------------------------------------------------------------
def compute_risk_capacity(personal: dict, financial: dict) -> float:
    """Financial ABILITY to absorb losses (objective)."""
    age = personal.get("age", 35) or 35
    dependents = personal.get("dependents", 0) or 0
    employment = personal.get("employment_status", "salaried_permanent")

    income = max(financial.get("monthly_income", 0) or 0, 1)
    expenses = max(financial.get("monthly_expenses", 0) or 1, 1)
    savings = financial.get("monthly_savings", 0) or 0
    debt = financial.get("total_debt", 0) or 0
    emi = financial.get("monthly_emi", 0) or 0
    emergency = financial.get("emergency_fund", 0) or 0

    age_score = _clamp(100 - max(0, age - 25) * 1.4)
    emergency_months = emergency / expenses
    emergency_score = _clamp((emergency_months / 6.0) * 100)
    savings_ratio = savings / income
    savings_score = _clamp((savings_ratio / 0.30) * 100)
    dti = emi / income
    dti_score = _clamp(100 - dti * 250)
    debt_load = debt / (income * 12)
    debt_score = _clamp(100 - debt_load * 60)
    employment_score = EMPLOYMENT_STABILITY.get(employment, 55)
    dependent_score = _clamp(100 - dependents * 12)

    capacity = (
        0.18 * age_score
        + 0.20 * emergency_score
        + 0.16 * savings_score
        + 0.14 * dti_score
        + 0.10 * debt_score
        + 0.14 * employment_score
        + 0.08 * dependent_score
    )
    return round(_clamp(capacity), 1)


def compute_risk_tolerance(questionnaire: dict) -> float:
    """Psychological WILLINGNESS to take risk (subjective)."""
    # 1-5 scale where 5 = most risk seeking
    decline = questionnaire.get("market_decline_reaction", 3) or 3
    experience = questionnaire.get("experience_level", 2) or 2
    horizon = questionnaire.get("investment_horizon_years", 5) or 5
    loss_tol = questionnaire.get("loss_tolerance_pct", 10) or 10
    equity_willing = questionnaire.get("equity_exposure_willingness_pct", 40) or 40

    decline_score = _clamp((decline - 1) / 4 * 100)
    experience_score = _clamp((experience - 1) / 4 * 100)
    horizon_score = _clamp((min(horizon, 20) / 20) * 100)
    loss_score = _clamp((min(loss_tol, 40) / 40) * 100)
    equity_score = _clamp(min(equity_willing, 100))

    tolerance = (
        0.28 * decline_score
        + 0.18 * experience_score
        + 0.20 * horizon_score
        + 0.17 * loss_score
        + 0.17 * equity_score
    )
    return round(_clamp(tolerance), 1)


def build_risk_feature_vector(personal, financial, questionnaire):
    income = financial.get("monthly_income", 0) or 0
    expenses = max(financial.get("monthly_expenses", 0) or 1, 1)
    return [
        personal.get("age", 35) or 35,
        income,
        expenses,
        financial.get("monthly_savings", 0) or 0,
        financial.get("total_debt", 0) or 0,
        (financial.get("emergency_fund", 0) or 0) / expenses,
        personal.get("dependents", 0) or 0,
        EMPLOYMENT_STABILITY.get(personal.get("employment_status", "salaried_permanent"), 55),
        questionnaire.get("investment_horizon_years", 5) or 5,
        questionnaire.get("loss_tolerance_pct", 10) or 10,
        questionnaire.get("equity_exposure_willingness_pct", 40) or 40,
        questionnaire.get("market_decline_reaction", 3) or 3,
        questionnaire.get("experience_level", 2) or 2,
    ]


def score_to_category(score: float) -> str:
    idx = min(4, int(score // 20))
    return RISK_CATEGORIES[idx]


def classify_risk(personal: dict, financial: dict, questionnaire: dict) -> dict:
    capacity = compute_risk_capacity(personal, financial)
    tolerance = compute_risk_tolerance(questionnaire)
    # Prudent combination: overall score weighted, but capped by the lower of the two
    blended = 0.5 * capacity + 0.5 * tolerance
    prudent = min(blended, min(capacity, tolerance) + 15)
    risk_score = round(_clamp(prudent), 0)
    category = score_to_category(risk_score)
    max_equity = MAX_EQUITY_BY_CATEGORY[category]
    # If capacity is much lower than tolerance, further trim equity (safety rule)
    if capacity + 15 < tolerance:
        max_equity = int(max_equity * 0.8)
    horizon = questionnaire.get("investment_horizon_years", 5) or 5
    return {
        "risk_score": int(risk_score),
        "risk_category": category,
        "risk_tolerance": tolerance,
        "risk_capacity": capacity,
        "investment_horizon": horizon,
        "max_equity_exposure": int(max_equity),
        "breakdown": {
            "capacity": capacity,
            "tolerance": tolerance,
            "blended": round(blended, 1),
        },
    }


# ---------------------------------------------------------------------------
# Financial health score
# ---------------------------------------------------------------------------
def financial_health(financial: dict, goals: list, holdings: list) -> dict:
    income = max(financial.get("monthly_income", 0) or 1, 1)
    expenses = max(financial.get("monthly_expenses", 0) or 1, 1)
    savings = financial.get("monthly_savings", 0) or 0
    debt = financial.get("total_debt", 0) or 0
    emi = financial.get("monthly_emi", 0) or 0
    emergency = financial.get("emergency_fund", 0) or 0
    capacity_amt = financial.get("investment_capacity", 0) or 0

    savings_ratio = savings / income
    savings_score = _clamp((savings_ratio / 0.30) * 100)

    dti = emi / income
    debt_score = _clamp(100 - dti * 250)

    emergency_months = emergency / expenses
    emergency_score = _clamp((emergency_months / 6.0) * 100)

    discipline_ratio = capacity_amt / income
    discipline_score = _clamp((discipline_ratio / 0.20) * 100)

    if goals:
        readiness = []
        for g in goals:
            tgt = max(g.get("target_amount", 0) or 1, 1)
            cur = g.get("current_amount", 0) or 0
            readiness.append(_clamp((cur / tgt) * 100))
        goal_score = round(sum(readiness) / len(readiness), 0)
    else:
        goal_score = 40.0

    if holdings:
        cats = {h.get("category") for h in holdings if h.get("category")}
        diversification_score = _clamp((len(cats) / 5.0) * 100)
    else:
        diversification_score = 35.0

    categories = {
        "Savings": round(savings_score),
        "Debt Management": round(debt_score),
        "Emergency Fund": round(emergency_score),
        "Investment Discipline": round(discipline_score),
        "Goal Readiness": round(goal_score),
        "Diversification": round(diversification_score),
    }
    overall = round(
        0.22 * savings_score
        + 0.18 * debt_score
        + 0.18 * emergency_score
        + 0.16 * discipline_score
        + 0.14 * goal_score
        + 0.12 * diversification_score
    )

    suggestions = []
    if emergency_score < 70:
        suggestions.append(
            "Your emergency fund is below the recommended target. Build a 3-6 month "
            "emergency reserve before increasing high-risk investments."
        )
    if debt_score < 65:
        suggestions.append(
            "A significant portion of your income services debt/EMIs. Prioritise reducing "
            "high-interest debt to improve financial resilience."
        )
    if savings_score < 60:
        suggestions.append(
            "Your monthly savings ratio is low. Aim to save at least 20-30% of your income."
        )
    if diversification_score < 60:
        suggestions.append(
            "Your investments are concentrated. Diversifying across asset classes reduces risk."
        )
    if discipline_score < 60:
        suggestions.append(
            "Consider setting up a systematic monthly investment (SIP) to build consistency."
        )
    if goal_score < 60 and goals:
        suggestions.append(
            "Some goals are behind schedule. Review your monthly contributions to stay on track."
        )
    if not suggestions:
        suggestions.append("Your financial health is strong. Maintain your disciplined approach.")

    return {
        "overall_score": int(overall),
        "categories": categories,
        "suggestions": suggestions,
        "metrics": {
            "savings_ratio": round(savings_ratio * 100, 1),
            "debt_to_income": round(dti * 100, 1),
            "emergency_months": round(emergency_months, 1),
        },
    }


# ---------------------------------------------------------------------------
# Goal planning
# ---------------------------------------------------------------------------
def _sip_future_value(monthly: float, annual_rate: float, years: float) -> float:
    n = years * 12
    i = annual_rate / 12
    if i == 0:
        return monthly * n
    return monthly * (((1 + i) ** n - 1) / i) * (1 + i)


def _required_monthly(target: float, current: float, annual_rate: float, years: float) -> float:
    n = years * 12
    i = annual_rate / 12
    fv_current = current * ((1 + i) ** n) if i else current
    remaining = max(target - fv_current, 0)
    if remaining <= 0:
        return 0.0
    if i == 0:
        return remaining / n
    factor = (((1 + i) ** n - 1) / i) * (1 + i)
    return remaining / factor if factor else 0.0


def compute_goal_metrics(goal: dict) -> dict:
    target = goal.get("target_amount", 0) or 0
    current = goal.get("current_amount", 0) or 0
    monthly_contribution = goal.get("monthly_contribution", 0) or 0
    years = max(goal.get("years_remaining", 0) or 0, 0.01)

    remaining = max(target - current, 0)
    scenarios = {}
    for name, rate in SCENARIO_RETURNS.items():
        required = _required_monthly(target, current, rate, years)
        projected = current * ((1 + rate / 12) ** (years * 12)) + _sip_future_value(
            monthly_contribution, rate, years
        )
        scenarios[name] = {
            "annual_return": round(rate * 100, 1),
            "required_monthly": round(required),
            "projected_value": round(projected),
            "on_track": projected >= target,
        }

    moderate = scenarios["moderate"]
    progress_pct = round((current / target) * 100, 1) if target else 0
    if moderate["on_track"]:
        status = "On Track"
    elif scenarios["optimistic"]["on_track"]:
        status = "At Risk"
    else:
        status = "Off Track"

    return {
        "target_amount": target,
        "current_amount": current,
        "remaining_amount": remaining,
        "years_remaining": round(years, 1),
        "progress_pct": progress_pct,
        "required_monthly": moderate["required_monthly"],
        "estimated_future_value": moderate["projected_value"],
        "status": status,
        "scenarios": scenarios,
    }


# ---------------------------------------------------------------------------
# Portfolio generation
# ---------------------------------------------------------------------------
def generate_portfolio(risk: dict, personal: dict, financial: dict, goal_horizon: float) -> dict:
    category = risk.get("risk_category", "Moderate")
    max_equity = risk.get("max_equity_exposure", 55)
    age = personal.get("age", 35) or 35

    # Age-based equity ceiling (classic 100-age heuristic) combined with risk cap
    age_equity = _clamp(110 - age, 10, 90)
    equity_pct = min(max_equity, age_equity)

    # Short horizon reduces equity further
    if goal_horizon and goal_horizon < 3:
        equity_pct = min(equity_pct, 25)
    elif goal_horizon and goal_horizon < 5:
        equity_pct = min(equity_pct, 45)

    base = {
        "Conservative": {"Equity": 10, "Mutual Funds": 15, "Bonds": 30, "Fixed Deposits": 25, "Gold": 10, "Cash/Emergency Reserve": 10},
        "Moderately Conservative": {"Equity": 20, "Mutual Funds": 20, "Bonds": 25, "Fixed Deposits": 15, "Gold": 12, "Cash/Emergency Reserve": 8},
        "Moderate": {"Equity": 30, "Mutual Funds": 25, "Bonds": 18, "Fixed Deposits": 10, "Gold": 10, "Cash/Emergency Reserve": 7},
        "Moderately Aggressive": {"Equity": 42, "Mutual Funds": 26, "Bonds": 14, "Fixed Deposits": 5, "Gold": 8, "Cash/Emergency Reserve": 5},
        "Aggressive": {"Equity": 52, "Mutual Funds": 28, "Bonds": 8, "Fixed Deposits": 2, "Gold": 6, "Cash/Emergency Reserve": 4},
    }[category]

    alloc = dict(base)
    # Scale equity to the computed ceiling
    total_equity = alloc["Equity"] + alloc["Mutual Funds"]
    if total_equity > equity_pct:
        scale = equity_pct / total_equity
        moved = 0
        for k in ("Equity", "Mutual Funds"):
            new_v = round(alloc[k] * scale)
            moved += alloc[k] - new_v
            alloc[k] = new_v
        alloc["Bonds"] += moved  # move to safer bucket

    # Normalise to 100
    total = sum(alloc.values())
    alloc = {k: round(v / total * 100) for k, v in alloc.items()}
    diff = 100 - sum(alloc.values())
    if diff != 0:
        largest = max(alloc, key=alloc.get)
        alloc[largest] += diff

    # Expected return / risk based on category assumptions
    cat_return = {
        "Conservative": 6.5,
        "Moderately Conservative": 7.8,
        "Moderate": 9.2,
        "Moderately Aggressive": 10.8,
        "Aggressive": 12.2,
    }[category]
    cat_risk = {
        "Conservative": 5.0,
        "Moderately Conservative": 7.5,
        "Moderate": 10.5,
        "Moderately Aggressive": 14.0,
        "Aggressive": 17.5,
    }[category]

    allocations = [{"asset_class": k, "percentage": v} for k, v in alloc.items()]
    return {
        "allocations": allocations,
        "expected_return": cat_return,
        "expected_risk": cat_risk,
        "risk_profile": category,
        "equity_ceiling": round(equity_pct),
    }


# ---------------------------------------------------------------------------
# Investment suitability scoring (hybrid recommendation)
# ---------------------------------------------------------------------------
def build_reco_feature_vector(user_ctx, inv):
    return [
        TARGET_RISK_LEVEL.get(user_ctx.get("risk_category", "Moderate"), 3),
        user_ctx.get("horizon_years", 5),
        user_ctx.get("max_equity_exposure", 55),
        user_ctx.get("financial_health", 60),
        user_ctx.get("risk_capacity", 60),
        inv.get("risk_level", 3),
        inv.get("expected_return", 8),
        inv.get("volatility", 10),
        inv.get("liquidity", 3),
        CATEGORY_CODES.get(inv.get("category"), 0),
    ]


def score_investment(inv: dict, user_ctx: dict) -> dict:
    category = user_ctx.get("risk_category", "Moderate")
    target_level = TARGET_RISK_LEVEL.get(category, 3)
    horizon = user_ctx.get("horizon_years", 5) or 5
    goal_type = user_ctx.get("goal_type")
    holdings_cats = user_ctx.get("holdings_categories", [])

    # Risk match
    risk_match = _clamp(100 - abs(inv.get("risk_level", 3) - target_level) * 22)

    # Goal match
    goal_suit = inv.get("goal_suitability", []) or []
    if goal_type and goal_type in goal_suit:
        goal_match = 100
    elif goal_suit:
        goal_match = 62
    else:
        goal_match = 55

    # Horizon match
    hmin = inv.get("horizon_min_years", 0) or 0
    hmax = inv.get("horizon_max_years", 30) or 30
    if hmin <= horizon <= hmax:
        horizon_match = 100
    else:
        dist = (hmin - horizon) if horizon < hmin else (horizon - hmax)
        horizon_match = _clamp(100 - abs(dist) * 15)

    # Return potential (normalise 4%-15%)
    return_potential = _clamp((inv.get("expected_return", 8) - 4) / 11 * 100)

    # Liquidity
    liquidity = _clamp(inv.get("liquidity", 3) / 5 * 100)

    # Diversification benefit
    diversification = 90 if inv.get("category") not in holdings_cats else 50

    weights = {
        "risk_match": 0.28,
        "goal_match": 0.20,
        "horizon_match": 0.18,
        "return_potential": 0.12,
        "liquidity": 0.10,
        "diversification_benefit": 0.12,
    }
    subscores = {
        "risk_match": round(risk_match),
        "goal_match": round(goal_match),
        "horizon_match": round(horizon_match),
        "return_potential": round(return_potential),
        "liquidity": round(liquidity),
        "diversification_benefit": round(diversification),
    }
    rule_score = sum(subscores[k] * w for k, w in weights.items())
    return {"subscores": subscores, "rule_score": round(rule_score, 1)}


def explain_recommendation(inv, user_ctx, subscores):
    category = user_ctx.get("risk_category", "Moderate")
    horizon = user_ctx.get("horizon_years", 5)
    reasons = []
    if subscores["risk_match"] >= 75:
        reasons.append(
            f"Its risk level aligns well with your {category} risk profile."
        )
    if subscores["horizon_match"] >= 75:
        reasons.append(
            f"It suits your {horizon}-year investment horizon."
        )
    if subscores["goal_match"] >= 80 and user_ctx.get("goal_type"):
        reasons.append(
            f"It is well suited for your '{user_ctx['goal_type']}' goal."
        )
    if subscores["diversification_benefit"] >= 80:
        reasons.append(
            f"Your current portfolio has low exposure to {inv.get('category')}, so adding it improves diversification."
        )
    if subscores["return_potential"] >= 70:
        reasons.append(
            f"It offers competitive long-term return potential (~{inv.get('expected_return')}% p.a.)."
        )
    if not reasons:
        reasons.append("It offers a balanced fit across risk, horizon and return factors for your profile.")

    cautions = []
    if inv.get("volatility", 0) >= 15:
        cautions.append(
            "This investment has higher volatility and may not be appropriate if you need the money in the short term."
        )
    if subscores["horizon_match"] < 60:
        cautions.append(
            "Your investment horizon does not fully match the recommended holding period for this asset."
        )
    if subscores["risk_match"] < 55:
        cautions.append(
            "Its risk level differs from your risk profile; keep its allocation limited."
        )
    if inv.get("liquidity", 3) <= 2:
        cautions.append("Liquidity is limited, so exiting early may be difficult or costly.")
    if not cautions:
        cautions.append("Returns are market-linked and not guaranteed; review periodically.")

    return reasons, cautions


def rank_recommendations(investments, user_ctx, ml_predict=None, top_n=8):
    scored = []
    for inv in investments:
        s = score_investment(inv, user_ctx)
        final = s["rule_score"]
        ml_val = None
        if ml_predict is not None:
            try:
                ml_val = ml_predict(build_reco_feature_vector(user_ctx, inv))
            except Exception:
                ml_val = None
        if ml_val is not None:
            final = 0.7 * s["rule_score"] + 0.3 * _clamp(ml_val)
        reasons, cautions = explain_recommendation(inv, user_ctx, s["subscores"])
        scored.append(
            {
                "investment": inv,
                "suitability_score": round(final),
                "subscores": s["subscores"],
                "rule_score": s["rule_score"],
                "ml_score": round(ml_val, 1) if ml_val is not None else None,
                "reasons": reasons,
                "cautions": cautions,
            }
        )
    scored.sort(key=lambda x: x["suitability_score"], reverse=True)

    # Diversification filter: avoid over-concentration in one category in the top list
    filtered = []
    cat_count = {}
    for item in scored:
        cat = item["investment"].get("category")
        if cat_count.get(cat, 0) >= 2 and len(filtered) < top_n:
            continue
        cat_count[cat] = cat_count.get(cat, 0) + 1
        filtered.append(item)
        if len(filtered) >= top_n:
            break
    return filtered


# ---------------------------------------------------------------------------
# Wealth simulation
# ---------------------------------------------------------------------------
def simulate(initial: float, monthly: float, years: float, annual_return: float) -> dict:
    i = annual_return / 12
    series = []
    total_months = int(round(years * 12))
    balance = initial
    invested = initial
    for m in range(1, total_months + 1):
        balance = balance * (1 + i) + monthly
        invested += monthly
        if m % 12 == 0 or m == total_months:
            series.append(
                {
                    "year": round(m / 12, 1),
                    "invested": round(invested),
                    "value": round(balance),
                }
            )
    return {
        "total_invested": round(invested),
        "estimated_value": round(balance),
        "estimated_growth": round(balance - invested),
        "annual_return": round(annual_return * 100, 1),
        "series": series,
    }


def simulate_scenarios(initial: float, monthly: float, years: float) -> dict:
    return {name: simulate(initial, monthly, years, rate) for name, rate in SCENARIO_RETURNS.items()}


# ---------------------------------------------------------------------------
# Existing portfolio analysis
# ---------------------------------------------------------------------------
def analyze_portfolio(holdings: list, risk: dict) -> dict:
    total = sum(h.get("amount", 0) or 0 for h in holdings)
    if total <= 0:
        return {"total_value": 0, "allocation": [], "issues": [], "suggestions": ["Add your existing holdings to analyse your portfolio."]}

    by_cat = {}
    for h in holdings:
        cat = h.get("category", "Other")
        by_cat[cat] = by_cat.get(cat, 0) + (h.get("amount", 0) or 0)
    allocation = [
        {"category": c, "amount": v, "percentage": round(v / total * 100, 1)}
        for c, v in sorted(by_cat.items(), key=lambda x: -x[1])
    ]

    issues, suggestions = [], []
    category = risk.get("risk_category", "Moderate")
    max_equity = risk.get("max_equity_exposure", 55)
    equity_pct = sum(a["percentage"] for a in allocation if a["category"] in ("Equity", "Mutual Funds", "ETFs"))

    top = allocation[0]
    if top["percentage"] > 60:
        issues.append(f"{top['percentage']}% of your portfolio is concentrated in {top['category']}.")
        suggestions.append(f"Reduce concentration in {top['category']} and diversify across asset classes.")
    if equity_pct > max_equity + 10:
        issues.append(
            f"Equity exposure ({round(equity_pct)}%) exceeds the level recommended for your {category} risk profile ({max_equity}%)."
        )
        suggestions.append("Rebalance towards debt/bonds to align with your risk profile.")
    if len(by_cat) < 3:
        issues.append("Your portfolio spans only a few asset classes.")
        suggestions.append("Add exposure to bonds, gold or fixed income to improve diversification.")
    if not issues:
        issues.append("No major concentration or risk-mismatch issues detected.")
        suggestions.append("Maintain periodic rebalancing to keep your allocation on target.")

    return {
        "total_value": round(total),
        "allocation": allocation,
        "equity_exposure": round(equity_pct, 1),
        "issues": issues,
        "suggestions": suggestions,
    }
