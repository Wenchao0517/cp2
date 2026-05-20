from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from ..extensions import db
from ..models.patient import Patient
from ..models.risk_assessment import RiskAssessment
from ..utils.decorators import patient_required
from ..utils.audit import log_action
import os, json

predict_bp = Blueprint("predict", __name__)


def _build_features(patient) -> dict:
    """Map patient profile to the 21 BRFSS feature names."""
    from ..models.glucose_reading import GlucoseReading
    readings = GlucoseReading.query.filter_by(patient_id=patient.id)\
               .order_by(GlucoseReading.measured_at.desc()).limit(7).all()
    avg_glucose = sum(r.glucose_mmol for r in readings) / len(readings) if readings else 5.5

    bmi = patient.bmi or 25.0

    # Age mapping: use date_of_birth if available
    age_code = 7  # default ~45-49
    if patient.date_of_birth:
        from datetime import date
        age = (date.today() - patient.date_of_birth).days // 365
        if age < 25:   age_code = 2
        elif age < 30: age_code = 3
        elif age < 35: age_code = 4
        elif age < 40: age_code = 5
        elif age < 45: age_code = 6
        elif age < 50: age_code = 7
        elif age < 55: age_code = 8
        elif age < 60: age_code = 9
        elif age < 65: age_code = 10
        elif age < 70: age_code = 11
        elif age < 75: age_code = 12
        else:          age_code = 13

    # GenHlth: derive from glucose level
    # Normal <7.8, Elevated 7.8-11.1, High >11.1
    if avg_glucose < 7.8:
        gen_hlth = 2    # Good
        phys_hlth = 0
    elif avg_glucose < 11.1:
        gen_hlth = 3    # Fair
        phys_hlth = 10
    elif avg_glucose < 16.0:
        gen_hlth = 4    # Poor
        phys_hlth = 20
    else:
        gen_hlth = 5    # Very poor
        phys_hlth = 30

    return {
        "HighBP":               int(patient.has_hypertension),
        "HighChol":             int(patient.has_high_chol),
        "CholCheck":            1,
        "BMI":                  bmi,
        "Smoker":               int(patient.smoker),
        "Stroke":               0,
        "HeartDiseaseorAttack": 0,
        "PhysActivity":         int(patient.physical_activity),
        "Fruits":               1,
        "Veggies":              1,
        "HvyAlcoholConsump":    0,
        "AnyHealthcare":        1,
        "NoDocbcCost":          0,
        "GenHlth":              gen_hlth,
        "MentHlth":             0,
        "PhysHlth":             phys_hlth,
        "DiffWalk":             int(avg_glucose > 13.0),
        "Sex":                  1 if patient.gender == "male" else 0,
        "Age":                  age_code,
        "Education":            5,
        "Income":               5,
    }, avg_glucose


def _glucose_adjustment(avg_glucose: float, base_prob: float) -> float:
    """
    Adjust base ML probability using average glucose reading.
    Clinical thresholds (mmol/L):
      Normal fasting:    < 5.6
      Pre-diabetic:      5.6 – 6.9
      Diabetic range:    >= 7.0
      High post-meal:    >= 11.1
    """
    if avg_glucose < 5.6:
        # Normal — slight reduction
        adjustment = -0.05
    elif avg_glucose < 7.0:
        # Pre-diabetic range
        adjustment = 0.05
    elif avg_glucose < 11.1:
        # Diabetic range
        adjustment = 0.15
    elif avg_glucose < 16.0:
        # High
        adjustment = 0.25
    else:
        # Very high
        adjustment = 0.40

    adjusted = base_prob + adjustment
    return max(0.01, min(0.99, adjusted))


def _get_recommendation(risk_level: str, top_factors: list, avg_glucose: float) -> str:
    """Generate recommendation via Groq API, fall back to rule-based if unavailable."""
    groq_key = os.getenv("GROQ_API_KEY", "")
    factor_text = ", ".join(
        f"{f['feature']} ({'risk factor' if f['direction']=='increase' else 'protective'})"
        for f in top_factors[:3]
    )

    glucose_note = ""
    if avg_glucose >= 11.1:
        glucose_note = f"Their average glucose reading is {avg_glucose:.1f} mmol/L which is significantly elevated. "
    elif avg_glucose >= 7.0:
        glucose_note = f"Their average glucose reading is {avg_glucose:.1f} mmol/L which is in the diabetic range. "
    elif avg_glucose >= 5.6:
        glucose_note = f"Their average glucose reading is {avg_glucose:.1f} mmol/L which is in the pre-diabetic range. "

    if groq_key and groq_key.startswith("gsk_"):
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            prompt = (
                f"A patient has a {risk_level.replace('_', ' ')} diabetes risk. "
                f"{glucose_note}"
                f"Their top contributing factors are: {factor_text}. "
                "Give exactly 3 numbered lifestyle recommendations in plain English. "
                "Keep each recommendation to 1-2 sentences. "
                "Do NOT give any medical diagnosis. "
                "End with: 'Please consult a qualified healthcare professional before making any health decisions.'"
            )
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            current_app.logger.warning(f"Groq API error: {e}")

    # Smart SHAP-driven fallback
    _FACTOR_ADVICE = {
        "HighBP":    "Monitor your blood pressure regularly and reduce sodium intake.",
        "BMI":       "Maintain a healthy weight through balanced diet and regular exercise.",
        "Age":       "Schedule regular health screenings as age is a key risk factor.",
        "GenHlth":   "Focus on improving your general health through lifestyle changes.",
        "PhysHlth":  "Address any physical health issues with your doctor.",
        "PhysActivity": "Aim for at least 150 minutes of moderate exercise per week.",
        "Smoker":    "If you smoke, seek support to quit — this significantly reduces risk.",
        "HighChol":  "Reduce saturated fat intake and increase fiber to manage cholesterol.",
    }

    recommendations = []
    for f in top_factors[:3]:
        feat = f["feature"]
        advice = _FACTOR_ADVICE.get(feat, f"Address {feat} as a contributing factor.")
        recommendations.append(advice)

    if avg_glucose >= 7.0:
        recommendations.insert(0, f"Your average glucose of {avg_glucose:.1f} mmol/L is elevated — consider dietary changes and consult a doctor.")
        recommendations = recommendations[:3]

    numbered = "\n".join(f"{i+1}. {r}" for i, r in enumerate(recommendations))
    return (
        f"Here are three lifestyle recommendations for the patient:\n\n"
        f"{numbered}\n\n"
        "Please consult a qualified healthcare professional before making any health decisions."
    )


@predict_bp.route("/assess", methods=["POST"])
@patient_required
def run_assessment():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()

    try:
        from ml.predict import predict_risk
    except ImportError:
        return jsonify({"error": "ML model not available. Run notebooks/train.py first."}), 503

    features, avg_glucose = _build_features(patient)
    result = predict_risk(features)

    # Apply glucose adjustment to base ML probability
    adjusted_prob = _glucose_adjustment(avg_glucose, result["probability"])
    result["probability"] = adjusted_prob

    # Re-derive risk level from adjusted probability
    if adjusted_prob < 0.30:
        result["risk_level"] = "low"
    elif adjusted_prob < 0.50:
        result["risk_level"] = "moderate"
    elif adjusted_prob < 0.70:
        result["risk_level"] = "high"
    else:
        result["risk_level"] = "very_high"

    recommendation = _get_recommendation(result["risk_level"], result["top_factors"], avg_glucose)

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
    log_action(user_id, "predict.assessment", f"assessment/{assessment.id}")

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
