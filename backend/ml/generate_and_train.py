"""
ML training pipeline (academic reproducible artifact).

Generates a realistic SYNTHETIC dataset, trains:
  1. Risk-profile classifier  (RandomForest)  -> risk_model.pkl
  2. Investment suitability regressor (GradientBoosting) -> recommendation_model.pkl

Labels are derived from the deterministic rule-based engine in finance_engine
(single source of truth) with added noise, so the ML models learn to approximate
the domain logic and can later be replaced with data-driven models.

Run:  cd /app/backend && python ml/generate_and_train.py
"""
import json
import random
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    r2_score,
    mean_absolute_error,
)

import sys

sys.path.append(str(Path(__file__).resolve().parent.parent))
import finance_engine as fe  # noqa: E402
from seed import INVESTMENTS  # noqa: E402

ML_DIR = Path(__file__).resolve().parent
random.seed(42)
np.random.seed(42)

EMPLOYMENTS = list(fe.EMPLOYMENT_STABILITY.keys())
GOALS = ["Emergency Fund", "Higher Education", "Marriage", "House Purchase", "Vehicle Purchase", "Retirement", "Wealth Creation"]


def random_user():
    age = random.randint(21, 65)
    income = random.choice([25000, 40000, 60000, 90000, 150000, 250000]) * random.uniform(0.7, 1.4)
    expenses = income * random.uniform(0.35, 0.85)
    savings = max(income - expenses, 0) * random.uniform(0.4, 1.0)
    personal = {
        "age": age,
        "dependents": random.randint(0, 4),
        "employment_status": random.choice(EMPLOYMENTS),
    }
    financial = {
        "monthly_income": round(income),
        "monthly_expenses": round(expenses),
        "monthly_savings": round(savings),
        "total_debt": round(income * random.uniform(0, 20)),
        "monthly_emi": round(income * random.uniform(0, 0.4)),
        "emergency_fund": round(expenses * random.uniform(0, 9)),
        "investment_capacity": round(savings * random.uniform(0.3, 0.9)),
    }
    questionnaire = {
        "market_decline_reaction": random.randint(1, 5),
        "experience_level": random.randint(1, 5),
        "investment_horizon_years": random.randint(1, 25),
        "loss_tolerance_pct": random.randint(2, 40),
        "equity_exposure_willingness_pct": random.randint(5, 100),
    }
    return personal, financial, questionnaire


def build_risk_dataset(n=4000):
    X, y = [], []
    for _ in range(n):
        p, f, q = random_user()
        vec = fe.build_risk_feature_vector(p, f, q)
        result = fe.classify_risk(p, f, q)
        label = fe.RISK_CATEGORIES.index(result["risk_category"])
        # inject small label noise on borderline samples
        if random.random() < 0.05:
            label = min(4, max(0, label + random.choice([-1, 1])))
        X.append(vec)
        y.append(label)
    return np.array(X), np.array(y)


def build_reco_dataset(n=6000):
    X, y = [], []
    for _ in range(n):
        p, f, q = random_user()
        risk = fe.classify_risk(p, f, q)
        goal = random.choice(GOALS)
        user_ctx = {
            "risk_category": risk["risk_category"],
            "horizon_years": q["investment_horizon_years"],
            "max_equity_exposure": risk["max_equity_exposure"],
            "financial_health": random.randint(30, 95),
            "risk_capacity": risk["risk_capacity"],
            "goal_type": goal,
            "holdings_categories": random.sample(list(fe.CATEGORY_CODES.keys()), random.randint(0, 3)),
        }
        inv = random.choice(INVESTMENTS)
        vec = fe.build_reco_feature_vector(user_ctx, inv)
        score = fe.score_investment(inv, user_ctx)["rule_score"]
        score += np.random.normal(0, 3)  # noise
        X.append(vec)
        y.append(max(0, min(100, score)))
    return np.array(X), np.array(y)


def train_risk():
    X, y = build_risk_dataset()
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    clf.fit(X_tr, y_tr)
    pred = clf.predict(X_te)
    metrics = {
        "accuracy": round(float(accuracy_score(y_te, pred)), 4),
        "precision_macro": round(float(precision_score(y_te, pred, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y_te, pred, average="macro", zero_division=0)), 4),
        "f1_macro": round(float(f1_score(y_te, pred, average="macro", zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_te, pred).tolist(),
        "classes": fe.RISK_CATEGORIES,
        "n_samples": int(len(X)),
        "n_features": int(X.shape[1]),
    }
    joblib.dump(clf, ML_DIR / "risk_model.pkl")
    return metrics


def train_reco():
    X, y = build_reco_dataset()
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
    reg = GradientBoostingRegressor(n_estimators=250, max_depth=4, learning_rate=0.05, random_state=42)
    reg.fit(X_tr, y_tr)
    pred = reg.predict(X_te)
    metrics = {
        "r2_score": round(float(r2_score(y_te, pred)), 4),
        "mae": round(float(mean_absolute_error(y_te, pred)), 4),
        "n_samples": int(len(X)),
        "n_features": int(X.shape[1]),
    }
    joblib.dump(reg, ML_DIR / "recommendation_model.pkl")
    return metrics


def main():
    print("Training risk-profile classifier...")
    risk_metrics = train_risk()
    print("Risk model metrics:", json.dumps(risk_metrics, indent=2))
    print("\nTraining recommendation suitability regressor...")
    reco_metrics = train_reco()
    print("Recommendation model metrics:", json.dumps(reco_metrics, indent=2))

    all_metrics = {"risk_model": risk_metrics, "recommendation_model": reco_metrics}
    with open(ML_DIR / "metrics.json", "w") as fp:
        json.dump(all_metrics, fp, indent=2)
    print("\nSaved models + metrics to", ML_DIR)


if __name__ == "__main__":
    main()
