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
    """Map patient profile + glucose readings to the 8 model features."""
    from ..models.glucose_reading import GlucoseReading
    readings = GlucoseReading.query.filter_by(patient_id=patient.id)\
               .order_by(GlucoseReading.measured_at.desc()).limit(7).all()
    avg_glucose_mmol = sum(r.glucose_mmol for r in readings) / len(readings) if readings else 5.5

    # Convert mmol/L -> mg/dL (dataset unit)
    glucose_mgdl = avg_glucose_mmol * 18.0

    # Estimate HbA1c from average glucose (ADA formula, same as frontend)
    hba1c = (avg_glucose_mmol + 2.59) / 1.59

    # Age from date_of_birth
    age = 45
    if patient.date_of_birth:
        from datetime import date
        age = (date.today() - patient.date_of_birth).days // 365

    return {
        "gender":               1 if patient.gender == "male" else 0,
        "age":                  age,
        "hypertension":         int(patient.has_hypertension),
        "heart_disease":        0,
        "smoker":               int(patient.smoker),
        "bmi":                  patient.bmi or 25.0,
        "HbA1c_level":          round(hba1c, 1),
        "blood_glucose_level":  round(glucose_mgdl, 0),
    }, avg_glucose_mmol


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
                "Then add a section headed 'Diet Suggestions:' containing exactly 3 numbered, "
                "specific dietary suggestions appropriate for a Malaysian diet. Name real everyday "
                "foods and practical swaps (for example choosing brown rice over white rice, or "
                "teh tarik kosong instead of sweetened drinks). Keep each to 1-2 sentences. "
                "Do NOT give any medical diagnosis. "
                "End with: 'Please consult a qualified healthcare professional before making any health decisions.'"
            )
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=550,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            current_app.logger.warning(f"Groq API error: {e}")

    # Smart SHAP-driven fallback
    _FACTOR_ADVICE = {
        "blood_glucose_level": "Your recent glucose readings are a key driver of your risk. Focus on reducing sugar and refined carbohydrates, and monitor regularly.",
        "HbA1c_level":         "Your estimated HbA1c suggests sustained elevated glucose. Consistent dietary control over the next 3 months can improve it.",
        "bmi":                 "Maintain a healthy weight through balanced diet and regular exercise.",
        "age":                 "Schedule regular health screenings as age is a key risk factor.",
        "hypertension":        "Monitor your blood pressure regularly and reduce sodium intake.",
        "heart_disease":       "Manage cardiovascular health with your doctor, as it compounds diabetes risk.",
        "smoker":              "If you smoke, seek support to quit - this significantly reduces risk.",
        "gender":              "Discuss gender-specific diabetes risk factors with your healthcare provider.",
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

    # Glucose-banded dietary guidance (Malaysian context)
    if avg_glucose >= 7.0:
        diet = [
            "Replace white rice and white bread with brown rice, wholemeal bread or oats to slow glucose absorption.",
            "Avoid sweetened drinks such as regular teh tarik, sirap bandung and packaged juices; choose kosong versions or plain water.",
            "Fill half your plate with non-starchy vegetables (sawi, kangkung, long beans) at every main meal.",
        ]
    elif avg_glucose >= 5.6:
        diet = [
            "Reduce added sugar in drinks and kuih; ask for kurang manis when eating out.",
            "Pair carbohydrates with protein and vegetables so meals release glucose more slowly.",
            "Choose grilled, steamed or soup-based dishes over deep-fried options such as goreng pisang or fried chicken.",
        ]
    else:
        diet = [
            "Keep a balanced plate: one quarter carbohydrates, one quarter protein, half vegetables.",
            "Limit sugary drinks and desserts to occasional treats rather than daily items.",
            "Choose wholegrain options such as brown rice or wholemeal bread where available.",
        ]
    diet_numbered = "\n".join(f"{i+1}. {d}" for i, d in enumerate(diet))

    return (
        f"Here are three lifestyle recommendations for the patient:\n\n"
        f"{numbered}\n\n"
        f"Diet Suggestions:\n\n"
        f"{diet_numbered}\n\n"
        "Please consult a qualified healthcare professional before making any health decisions."
    )


@predict_bp.route("/assess", methods=["POST"])
@patient_required
def run_assessment():
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()

    try:
        from ml.predict import predict_risk
    except ImportError:
        return jsonify({"error": "ML model not available. Run notebooks/train_v2.py first."}), 503

    features, avg_glucose = _build_features(patient)
    result = predict_risk(features)

    # v2 model uses glucose directly as a feature - no manual adjustment needed
    adjusted_prob = result["probability"]

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
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    assessment = RiskAssessment.query.filter_by(patient_id=patient.id)\
                 .order_by(RiskAssessment.created_at.desc()).first()
    if not assessment:
        return jsonify({"assessment": None}), 200
    return jsonify({"assessment": assessment.to_dict()}), 200
