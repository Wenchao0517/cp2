"""Load calibrated model artifacts and run diabetes risk prediction."""
import json
import joblib
import numpy as np
from pathlib import Path

_DIR = Path(__file__).resolve().parent

_model     = joblib.load(_DIR / "model.pkl")          # CalibratedClassifierCV(RandomForest)
_scaler    = joblib.load(_DIR / "scaler.pkl")
_explainer = joblib.load(_DIR / "shap_explainer.pkl") # TreeExplainer on raw RF
_features  = json.load(open(_DIR / "feature_names.json"))

MODEL_VERSION = "v2-rf-calibrated"


def predict_risk(feature_dict: dict) -> dict:
    """feature_dict keys must match feature_names.json (8 features)."""
    x = np.array([[feature_dict[f] for f in _features]], dtype=float)
    x_scaled = _scaler.transform(x)

    probability = float(_model.predict_proba(x_scaled)[0][1])

    # SHAP top factors (explainer works on scaled input)
    shap_vals = _explainer.shap_values(x_scaled)
    # RandomForest TreeExplainer returns list [class0, class1] or array
    if isinstance(shap_vals, list):
        vals = shap_vals[1][0]
    else:
        vals = shap_vals[0]
        if vals.ndim == 2:  # (n_features, n_classes)
            vals = vals[:, 1]

    order = np.argsort(np.abs(vals))[::-1]
    top_factors = []
    for i in order[:5]:
        top_factors.append({
            "feature":   _features[i],
            "impact":    round(float(vals[i]), 4),
            "direction": "increase" if vals[i] > 0 else "decrease",
        })

    return {
        "probability":   probability,
        "top_factors":   top_factors,
        "model_version": MODEL_VERSION,
    }
