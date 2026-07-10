from datetime import datetime, timezone
from ..extensions import db


class DoctorNote(db.Model):
    """Notes written by clinicians for their patients."""

    __tablename__ = "doctor_notes"

    id         = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content    = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    patient = db.relationship("Patient", backref="doctor_notes")
    doctor  = db.relationship("User")

    def to_dict(self) -> dict:
        return {
            "id":          self.id,
            "patient_id":  self.patient_id,
            "doctor_id":   self.doctor_id,
            "doctor_name": self.doctor.full_name if self.doctor else None,
            "content":     self.content,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
        }
