"""
ML layer: loads trained scikit-learn models for risk classification and investment
suitability. Falls back gracefully to the rule-based engine if the model files are
not present, so the application always functions (academic robustness requirement).
"""
import os
from pathlib import Path

import joblib

ML_DIR = Path(__file__).parent / "ml"
RISK_MODEL_PATH = ML_DIR / "risk_model.pkl"
RECO_MODEL_PATH = ML_DIR / "recommendation_model.pkl"

_risk_model = None
_reco_model = None
_loaded = False


def load_models():
    global _risk_model, _reco_model, _loaded
    if _loaded:
        return
    try:
        if RISK_MODEL_PATH.exists():
            _risk_model = joblib.load(RISK_MODEL_PATH)
    except Exception:
        _risk_model = None
    try:
        if RECO_MODEL_PATH.exists():
            _reco_model = joblib.load(RECO_MODEL_PATH)
    except Exception:
        _reco_model = None
    _loaded = True


def predict_risk_category(feature_vector):
    load_models()
    if _risk_model is None:
        return None
    try:
        import numpy as np

        pred = _risk_model.predict(np.array(feature_vector).reshape(1, -1))[0]
        return int(pred)
    except Exception:
        return None


def predict_suitability(feature_vector):
    load_models()
    if _reco_model is None:
        return None
    try:
        import numpy as np

        pred = _reco_model.predict(np.array(feature_vector).reshape(1, -1))[0]
        return float(pred)
    except Exception:
        return None


def models_status():
    load_models()
    return {
        "risk_model_loaded": _risk_model is not None,
        "recommendation_model_loaded": _reco_model is not None,
    }
