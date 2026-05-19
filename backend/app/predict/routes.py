from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from ..extensions import db
from ..models.patient import Patient
from ..models.risk_assessment import RiskAssessment
from ..utils.decorators import patient_required
from ..utils.audit import log_action
import os, json
from pathlib import Path

predict_bp = Blueprint("predict", __name__)

ML_DIR = Path(__file__).parent.parent.parent / "ml"


def _load_model():
    model_path = ML_DIR / "model.pkl"
    if not model_path.exists():
        return None, None, None, None
    import joblib
    model     = joblib.load(ML_DIR / "model.pkl")
    scaler    = joblib.load(ML_DIR / "scaler.pkl")
    explainer = joblib.load(ML_DIR / "shap_explainer.pkl")
    features  = json.loads((ML_DIR / "feature_names.json").read_text())
    return model, scaler, explainer, features


def _build_features(patient, feature_names):
    from ..models.glucose_reading import GlucoseReading
    readings = GlucoseReading.query.filter_by(patient_id=patient.id)\
               .order_by(GlucoseReading.measured_at.desc()).limit(7).all()
    avg_glucose = sum(r.glucose_mmol for r in readings) / len(readings) if readings else 7.0
    bmi = patient.bmi or 25.0
    raw = {
        "HighBP":              int(patient.has_hypertension),
        "HighChol":            int(patient.has_high_chol),
        "CholCheck":           1,
        "BMI":                 bmi,
        "Smoker":              int(patient.smoker),
        "Stroke":              0,
        "HeartDiseaseorAttack":0,
        "PhysActivity":        int(patient.physical_activity),
        "Fruits":              1,
        "Veggies":             1,
        "HvyAlcoholConsump":   0,
        "AnyHealthcare":       1,
        "NoDocbcCost":         0,
        "GenHlth":             3,
        "MentHlth":            0,
        "PhysHlth":            int(min(avg_glucose * 1.5, 30)),
        "DiffWalk":            0,
        "Sex":                 1 if patient.gender == "male" else 0,
        "Age":                 7,
        "Education":           5,
        "Income":              5,
    }
    return [raw[f] for f in feature_names]


def _predict(patient):
    import numpy as np
    model, scaler, explainer, feature_names = _load_model()
    if model is None:
        return None
    x_raw    = np.array([_build_features(patient, feature_names)], dtype=float)
    x_scaled = scaler.transform(x_raw)
    proba    = float(model.predict_proba(x_scaled)[0, 1])
    sv = explainer.shap_values(x_scaled)
    if hasattr(sv, '__len__') and len(sv) == 2:
        sv = sv[1]
    sv = np.array(sv).flatten()
    top_idx = np.argsort(np.abs(sv))[::-1][:5]
    top_factors = [
        {
            "feature":   feature_names[i],
            "value":     float(x_raw[0, i]),
            "impact":    float(sv[i]),
            "direction": "increase" if sv[i] > 0 else "decrease",
        }
        for i in top_idx
    ]
    metrics = json.loads((ML_DIR / "metrics.json").read_text())
    thresholds = metrics["risk_thresholds"]
    if proba < thresholds["low"]:         risk_level = "low"
    elif proba < thresholds["moderate"]:  risk_level = "moderate"
    elif proba < thresholds["high"]:      risk_level = "high"
    else:                                 risk_level = "very_high"
    return {"probability": proba, "risk_level": risk_level, "top_factors": top_factors, "model_version": "1.0.0"}


def _get_recommendation(risk_level, top_factors):
    api_key = os.getenv("GEMINI_API_KEY", "")
    factor_text = ", ".join(
        f"{f['feature']} ({'high' if f['direction']=='increase' else 'low'})"
        for f in top_factors[:3]
    )
    if api_key and api_key != "your-gemini-api-key-here":
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = (
                f"A patient has a {risk_level.replace('_',' ')} diabetes risk. "
                f"Top contributing factors: {factor_text}. "
                "Give 3 specific, practical lifestyle recommendations in plain English. "
                "Keep it under 100 words. Do NOT give medical diagnosis. "
                "End with: Please consult a healthcare professional for medical advice."
            )
            response = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
    rules = {
        "low":      "Your risk is currently low. Maintain a balanced diet, stay physically active at least 30 minutes a day, and monitor your blood glucose regularly.",
        "moderate": "Your risk is moderate. Consider reducing sugar and processed food intake, increasing physical activity, and scheduling a check-up with your doctor.",
        "high":     "Your risk is high. It is strongly recommended to consult a healthcare professional. Reduce refined carbohydrates, increase exercise, and monitor your weight.",
        "very_high":"Your risk is very high. Please consult a healthcare professional as soon as possible. Immediate lifestyle changes are critical.",
    }
    return rules.get(risk_level, rules["moderate"]) + " Please consult a healthcare professional for medical advice."


@predict_bp.route("/assess", methods=["POST"])
@patient_required
def run_assessment():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    result  = _predict(patient)
    if result is None:
        return jsonify({"error": "ML model not available. Run notebooks/train.py first."}), 503
    recommendation = _get_recommendation(result["risk_level"], result["top_factors"])
    assessment = RiskAssessment(
        patient_id     = patient.id,
        probability    = result["probability"],
        risk_level     = result["risk_level"],
        top_factors    = result["top_factors"],
        recommendation = recommendation,
        model_version  = result["model_version"],
    )
    db.session.add(assessment)
    db.session.commit()
    log_action(int(user_id), "predict.assessment", f"assessment/{assessment.id}")
    return jsonify({"assessment": assessment.to_dict()}), 201


@predict_bp.route("/latest", methods=["GET"])
@patient_required
def get_latest():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    assessment = RiskAssessment.query.filter_by(patient_id=patient.id)\
                 .order_by(RiskAssessment.created_at.desc()).first()
    if not assessment:
        return jsonify({"assessment": None}), 200
    return jsonify({"assessment": assessment.to_dict()}), 200

