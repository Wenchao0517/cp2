from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, get_jwt_identity, verify_jwt_in_request
)
from ..extensions import db
from ..models.user import User
from ..models.patient import Patient
from ..utils.audit import log_action

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    required = ["email", "password", "full_name", "role"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400
    if data["role"] not in ("patient", "doctor"):
        return jsonify({"error": "Role must be 'patient' or 'doctor'"}), 400
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "Email already registered"}), 409
    if len(data["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    user = User(
        email     = data["email"].lower().strip(),
        role      = data["role"],
        full_name = data["full_name"].strip(),
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()
    if data["role"] == "patient":
        profile = Patient(user_id=user.id)
        db.session.add(profile)
    db.session.commit()
    return jsonify({"message": "Account created", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = data.get("email", "").lower().strip()
    password = data.get("password", "")
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401
    if not user.is_active:
        return jsonify({"error": "Account deactivated"}), 403
    token = create_access_token(identity=str(user.id))
    log_action(user.id, "auth.login")
    return jsonify({
        "message":          "Login successful",
        "access_token":     token,
        "user":             user.to_dict(),
        "consent_required": not user.consent_accepted,
    }), 200


@auth_bp.route("/consent", methods=["POST"])
def accept_consent():
    verify_jwt_in_request(locations=["headers"])
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.consent_accepted    = True
    user.consent_accepted_at = datetime.now(timezone.utc)
    db.session.commit()
    log_action(user.id, "auth.consent_accepted")
    return jsonify({"message": "Consent recorded"}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    verify_jwt_in_request(locations=["headers"])
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
