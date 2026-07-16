from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from ..extensions import db
from ..models.user import User
from ..models.patient import Patient
from ..models.glucose_reading import GlucoseReading
from ..models.risk_assessment import RiskAssessment
from ..utils.decorators import doctor_required
from ..utils.audit import log_action

clinician_bp = Blueprint("clinician", __name__)


@clinician_bp.route("/patients", methods=["GET"])
@doctor_required
def get_patients():
    user_id     = int(get_jwt_identity())
    risk_filter = request.args.get("risk")
    patients    = Patient.query.filter_by(doctor_id=user_id).all()
    result = []
    for p in patients:
        latest = RiskAssessment.query.filter_by(patient_id=p.id)\
                 .order_by(RiskAssessment.created_at.desc()).first()
        if risk_filter and (not latest or latest.risk_level != risk_filter):
            continue
        user = User.query.get(p.user_id)
        result.append({
            "patient":     p.to_dict(),
            "user":        user.to_dict() if user else None,
            "latest_risk": latest.to_dict() if latest else None,
        })
    log_action(user_id, "clinician.view_panel")
    return jsonify({"patients": result, "total": len(result)}), 200


@clinician_bp.route("/patients/<int:patient_id>", methods=["GET"])
@doctor_required
def get_patient_detail(patient_id):
    user_id     = int(get_jwt_identity())
    patient     = Patient.query.filter_by(id=patient_id, doctor_id=user_id).first_or_404()
    readings    = GlucoseReading.query.filter_by(patient_id=patient.id)\
                  .order_by(GlucoseReading.measured_at.desc()).limit(30).all()
    assessments = RiskAssessment.query.filter_by(patient_id=patient.id)\
                  .order_by(RiskAssessment.created_at.desc()).limit(5).all()
    user        = User.query.get(patient.user_id)
    log_action(user_id, "clinician.view_patient", f"patient/{patient_id}")
    return jsonify({
        "patient":     patient.to_dict(),
        "user":        user.to_dict() if user else None,
        "readings":    [r.to_dict() for r in readings],
        "assessments": [a.to_dict() for a in assessments],
    }), 200


@clinician_bp.route("/assign/<int:patient_id>", methods=["POST"])
@doctor_required
def assign_patient(patient_id):
    user_id        = int(get_jwt_identity())
    patient        = Patient.query.get_or_404(patient_id)
    patient.doctor_id = user_id
    db.session.commit()
    return jsonify({"message": "Patient assigned"}), 200


@clinician_bp.route("/stats", methods=["GET"])
@doctor_required
def get_stats():
    user_id  = int(get_jwt_identity())
    patients = Patient.query.filter_by(doctor_id=user_id).all()
    counts   = {"low": 0, "moderate": 0, "high": 0, "very_high": 0, "unassessed": 0}
    for p in patients:
        latest = RiskAssessment.query.filter_by(patient_id=p.id)\
                 .order_by(RiskAssessment.created_at.desc()).first()
        if latest:
            counts[latest.risk_level] = counts.get(latest.risk_level, 0) + 1
        else:
            counts["unassessed"] += 1
    return jsonify({"total_patients": len(patients), "risk_distribution": counts}), 200


@clinician_bp.route("/patients/<int:patient_id>/notes", methods=["POST"])
@doctor_required
def add_note(patient_id):
    from ..models.doctor_note import DoctorNote
    user_id = int(get_jwt_identity())
    data = request.get_json()
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Note content is required"}), 400
    note = DoctorNote(patient_id=patient_id, doctor_id=user_id, content=content)
    db.session.add(note)
    db.session.commit()
    log_action(user_id, "note.create", f"patient/{patient_id}/note/{note.id}")
    return jsonify({"note": note.to_dict()}), 201


@clinician_bp.route("/patients/<int:patient_id>/notes", methods=["GET"])
@doctor_required
def get_notes(patient_id):
    from ..models.doctor_note import DoctorNote
    notes = DoctorNote.query.filter_by(patient_id=patient_id)\
            .order_by(DoctorNote.created_at.desc()).all()
    return jsonify({"notes": [n.to_dict() for n in notes]}), 200
