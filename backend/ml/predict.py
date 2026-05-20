import joblib, json, numpy as np
from pathlib import Path

ML_DIR = Path(__file__).parent

model = joblib.load(ML_DIR / 'model.pkl')
scaler = joblib.load(ML_DIR / 'scaler.pkl')
explainer = joblib.load(ML_DIR / 'shap_explainer.pkl')
with open(ML_DIR / 'feature_names.json') as f:
    feature_names = json.load(f)

def predict_risk(features: dict) -> dict:
    X = np.array([[features[k] for k in feature_names]], dtype=float)
    X_scaled = scaler.transform(X)
    prob = float(model.predict_proba(X_scaled)[0][1])
    if prob < 0.30:   risk = 'low'
    elif prob < 0.50: risk = 'moderate'
    elif prob < 0.70: risk = 'high'
    else:             risk = 'very_high'
    shap_vals = explainer.shap_values(X_scaled)
    if isinstance(shap_vals, list): sv = shap_vals[1][0]
    else: sv = shap_vals[0]
    factors = sorted(
        [{'feature': feature_names[i], 'shap': float(sv[i]),
          'direction': 'increase' if sv[i] > 0 else 'decrease'}
         for i in range(len(feature_names))],
        key=lambda x: abs(x['shap']), reverse=True
    )[:5]
    return {'probability': prob, 'risk_level': risk,
            'top_factors': factors, 'model_version': 'xgb_brfss_v1'}
