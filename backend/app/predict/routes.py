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
    if not (ML_DIR / "model.pkl").exists():
        return None, None, None, None
    import joblib
    return (
        joblib.load(ML_DIR / "model.pkl"),
        joblib.load(ML_DIR / "scaler.pkl"),
        joblib.load(ML_DIR / "shap_explainer.pkl"),
        json.loads((ML_DIR / "feature_names.json").read_text()),
    )


def _build_features(patient, feature_names):
    from ..models.glucose_reading import GlucoseReading
    readings = GlucoseReading.query.filter_by(patient_id=patient.id)\
               .order_by(GlucoseReading.measured_at.desc()).limit(7).all()
    avg_glucose = sum(r.glucose_mmol for r in readings) / len(readings) if readings else 7.0
    raw = {
        "HighBP": int(patient.has_hypertension), "HighChol": int(patient.has_high_chol),
        "CholCheck": 1, "BMI": patient.bmi or 25.0, "Smoker": int(patient.smoker),
        "Stroke": 0, "HeartDiseaseorAttack": 0, "PhysActivity": int(patient.physical_activity),
        "Fruits": 1, "Veggies": 1, "HvyAlcoholConsump": 0, "AnyHealthcare": 1,
        "NoDocbcCost": 0, "GenHlth": 3, "MentHlth": 0,
        "PhysHlth": int(min(avg_glucose * 1.5, 30)), "DiffWalk": 0,
        "Sex": 1 if patient.gender == "male" else 0, "Age": 7, "Education": 5, "Income": 5,
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
        {"feature": feature_names[i], "value": float(x_raw[0, i]),
         "impact": float(sv[i]), "direction": "increase" if sv[i] > 0 else "decrease"}
        for i in top_idx
    ]
    metrics    = json.loads((ML_DIR / "metrics.json").read_text())
    thresholds = metrics["risk_thresholds"]
    if proba < thresholds["low"]:        risk_level = "low"
    elif proba < thresholds["moderate"]: risk_level = "moderate"
    elif proba < thresholds["high"]:     risk_level = "high"
    else:                                risk_level = "very_high"
    return {"probability": proba, "risk_level": risk_level,
            "top_factors": top_factors, "model_version": "1.0.0"}


_FACTOR_ADVICE = {
    "HighBP":              {"increase": "Your blood pressure is a key risk driver. Reduce sodium intake, avoid processed foods, and monitor your BP weekly.", "decrease": "Your blood pressure is well-controlled. Keep up your current healthy habits."},
    "BMI":                 {"increase": "Your BMI is contributing to elevated risk. Even a 5-10% weight reduction can significantly lower diabetes risk. Focus on portion control and reducing sugary drinks.", "decrease": "Your weight is in a healthy range, which is protecting your metabolic health."},
    "Age":                 {"increase": "Age is a non-modifiable factor, but its impact can be offset by staying physically active and getting regular blood glucose screenings.", "decrease": "Your age is currently in your favour metabolically. Build healthy habits now to maintain this advantage."},
    "GenHlth":             {"increase": "Your general health is flagging some concerns. A full check-up with your GP including fasting glucose and HbA1c would provide clearer insight.", "decrease": "Your self-reported general health is good — a positive indicator for metabolic resilience."},
    "PhysHlth":            {"increase": "Physical health challenges are increasing your risk. Low-impact activities such as walking or swimming can improve insulin sensitivity.", "decrease": "Your physical health is supporting a lower risk profile."},
    "PhysActivity":        {"increase": "Increasing physical activity is one of the most effective ways to reduce diabetes risk. Aim for 150 minutes of moderate aerobic activity per week.", "decrease": "Your physical activity level is a protective factor. Maintain your exercise routine."},
    "HighChol":            {"increase": "Elevated cholesterol is compounding your diabetes risk. Reduce saturated fat, increase dietary fibre, and discuss cholesterol management with your doctor.", "decrease": "Your cholesterol levels are supporting healthy metabolic function."},
    "Smoker":              {"increase": "Smoking significantly increases insulin resistance. Quitting is one of the highest-impact actions you can take — ask your doctor about cessation support.", "decrease": "Non-smoking status is a meaningful protective factor for your metabolic health."},
    "Fruits":              {"increase": "Increase fruit consumption, particularly low-GI fruits like berries and apples, which provide fibre that supports blood sugar regulation.", "decrease": "Your fruit intake is supporting healthy nutrition."},
    "Veggies":             {"increase": "Aim to fill half your plate with non-starchy vegetables at each meal to improve fibre intake and moderate post-meal glucose spikes.", "decrease": "Your vegetable intake is contributing positively to your dietary health."},
    "HeartDiseaseorAttack":{"increase": "A history of heart disease increases metabolic risk. Cardiac rehabilitation and regular medical follow-up are strongly recommended.", "decrease": "No history of heart disease is a positive protective factor."},
    "Stroke":              {"increase": "A history of stroke requires careful metabolic monitoring. Work closely with your healthcare team to manage all cardiovascular risk factors.", "decrease": "No history of stroke is a protective factor for your overall health."},
}

_RISK_OPENER = {
    "low":      "Your current diabetes risk is low ({prob:.0f}%). While this is reassuring, maintaining healthy habits is key to keeping it this way.",
    "moderate": "Your diabetes risk is moderate ({prob:.0f}%). This is a meaningful signal that lifestyle adjustments could significantly reduce your long-term risk.",
    "high":     "Your diabetes risk is elevated ({prob:.0f}%). It is strongly recommended that you discuss these results with a healthcare professional and consider targeted lifestyle changes.",
    "very_high":"Your diabetes risk is high ({prob:.0f}%). Please consult a healthcare professional as soon as possible. Early intervention is clinically proven to reduce or delay diabetes onset.",
}

def _smart_fallback(risk_level, top_factors, probability):
    opener = _RISK_OPENER[risk_level].format(prob=probability * 100)
    advice_lines = []
    for f in top_factors[:3]:
        name = f["feature"]
        direction = f["direction"]
        if name in _FACTOR_ADVICE:
            advice_lines.append(_FACTOR_ADVICE[name][direction])
    advice = " ".join(advice_lines) if advice_lines else "Focus on a balanced diet, regular physical activity, and routine blood glucose monitoring."
    closing = "This assessment is for informational purposes only and does not constitute medical advice. Please consult a qualified healthcare professional before making any health decisions."
    return f"{opener}\n\n{advice}\n\n{closing}"


def _get_recommendation(risk_level, top_factors, probability):
    api_key = os.getenv("GROQ_API_KEY", "")
    factor_text = ", ".join(
        f"{f['feature']} ({'elevated' if f['direction']=='increase' else 'within normal range'})"
        for f in top_factors[:3]
    )

    if api_key:
        try:
            from groq import Groq
            client = Groq(api_key=api_key)
            prompt = (
                f"A patient has a {risk_level.replace('_',' ')} diabetes risk (probability {probability*100:.1f}%). "
                f"Their top contributing health factors are: {factor_text}. "
                "Write exactly 3 numbered, specific, actionable lifestyle recommendations in plain English. "
                "Keep the total response under 120 words. "
                "Do NOT provide a medical diagnosis or prescribe medication. "
                "End with this sentence exactly: "
                "Please consult a qualified healthcare professional before making any health decisions."
            )
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a helpful health education assistant. You provide clear, practical lifestyle advice based on health risk factors. You never diagnose or prescribe."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[Groq fallback] {type(e).__name__}: {e}")

    return _smart_fallback(risk_level, top_factors, probability)


@predict_bp.route("/assess", methods=["POST"])
@patient_required
def run_assessment():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    result  = _predict(patient)
    if result is None:
        return jsonify({"error": "ML model not available. Run notebooks/train.py first."}), 503
    recommendation = _get_recommendation(result["risk_level"], result["top_factors"], result["probability"])
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
    user_id    = get_jwt_identity()
    patient    = Patient.query.filter_by(user_id=user_id).first_or_404()
    assessment = RiskAssessment.query.filter_by(patient_id=patient.id)\
                 .order_by(RiskAssessment.created_at.desc()).first()
    if not assessment:
        return jsonify({"assessment": None}), 200
    return jsonify({"assessment": assessment.to_dict()}), 200
