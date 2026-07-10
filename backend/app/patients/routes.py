from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from ..extensions import db
from ..models.patient import Patient
from ..models.glucose_reading import GlucoseReading
from ..models.risk_assessment import RiskAssessment
from ..utils.decorators import patient_required
from ..utils.audit import log_action
from datetime import datetime

patients_bp = Blueprint("patients", __name__)


@patients_bp.route("/profile", methods=["GET"])
@patient_required
def get_profile():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    return jsonify({"patient": patient.to_dict()}), 200


@patients_bp.route("/profile", methods=["PUT"])
@patient_required
def update_profile():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    data = request.get_json()
    fields = ["height_cm", "weight_kg", "gender", "has_hypertension",
              "has_high_chol", "smoker", "family_history", "physical_activity"]
    for field in fields:
        if field in data:
            setattr(patient, field, data[field])
    if "date_of_birth" in data and data["date_of_birth"]:
        patient.date_of_birth = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
    db.session.commit()
    log_action(user_id, "patient.profile_update")
    return jsonify({"patient": patient.to_dict()}), 200


@patients_bp.route("/glucose", methods=["POST"])
@patient_required
def add_glucose():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    data = request.get_json()
    glucose_val = data.get("glucose_mmol")
    if glucose_val is None:
        return jsonify({"error": "glucose_mmol is required"}), 400
    if not GlucoseReading.validate_glucose(float(glucose_val)):
        return jsonify({"error": f"glucose_mmol must be between {GlucoseReading.GLUCOSE_MIN} and {GlucoseReading.GLUCOSE_MAX}"}), 400
    meal_context = data.get("meal_context", "random")
    if meal_context not in ("fasting", "pre_meal", "post_meal", "random"):
        return jsonify({"error": "Invalid meal_context"}), 400
    measured_at = datetime.fromisoformat(data["measured_at"]) if data.get("measured_at") else datetime.utcnow()
    reading = GlucoseReading(
        patient_id   = patient.id,
        glucose_mmol = float(glucose_val),
        meal_context = meal_context,
        measured_at  = measured_at,
        notes        = data.get("notes", ""),
    )
    db.session.add(reading)
    db.session.commit()
    log_action(user_id, "glucose.create", f"reading/{reading.id}")
    return jsonify({"reading": reading.to_dict()}), 201


@patients_bp.route("/glucose", methods=["GET"])
@patient_required
def get_glucose_history():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    limit = min(int(request.args.get("limit", 30)), 100)
    readings = GlucoseReading.query.filter_by(patient_id=patient.id)\
               .order_by(GlucoseReading.measured_at.desc()).limit(limit).all()
    return jsonify({"readings": [r.to_dict() for r in readings]}), 200


@patients_bp.route("/assessments", methods=["GET"])
@patient_required
def get_assessments():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    assessments = RiskAssessment.query.filter_by(patient_id=patient.id)\
                  .order_by(RiskAssessment.created_at.desc()).limit(10).all()
    return jsonify({"assessments": [a.to_dict() for a in assessments]}), 200

@patients_bp.route('/glucose/<int:reading_id>', methods=['DELETE'])
@patient_required
def delete_glucose(reading_id):
    user_id = get_jwt_identity()
    from ..models.user import User
    user = User.query.get(user_id)
    reading = GlucoseReading.query.filter_by(id=reading_id, patient_id=user.patient_profile.id).first()
    if not reading:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(reading)
    db.session.commit()
    log_action(user_id, 'glucose.delete', f'reading/{reading_id}')
    return jsonify({'message': 'Deleted'}), 200



@patients_bp.route("/notes", methods=["GET"])
@patient_required
def get_my_notes():
    from ..models.doctor_note import DoctorNote
    from ..models.user import User
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    notes = DoctorNote.query.filter_by(patient_id=user.patient_profile.id)\
            .order_by(DoctorNote.created_at.desc()).limit(10).all()
    return jsonify({"notes": [n.to_dict() for n in notes]}), 200
