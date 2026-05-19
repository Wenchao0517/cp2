from datetime import datetime, timezone
from ..extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id                  = db.Column(db.Integer, primary_key=True)
    email               = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash       = db.Column(db.String(255), nullable=False)
    role                = db.Column(db.String(20), nullable=False)
    full_name           = db.Column(db.String(100), nullable=False)
    is_active           = db.Column(db.Boolean, default=True, nullable=False)
    consent_accepted    = db.Column(db.Boolean, default=False, nullable=False)
    consent_accepted_at = db.Column(db.DateTime, nullable=True)
    created_at          = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at          = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                                    onupdate=lambda: datetime.now(timezone.utc))

    patient_profile = db.relationship(
        "Patient",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="Patient.user_id"
    )
    audit_logs = db.relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id":               self.id,
            "email":            self.email,
            "role":             self.role,
            "full_name":        self.full_name,
            "consent_accepted": self.consent_accepted,
            "created_at":       self.created_at.isoformat() if self.created_at else None,
        }
