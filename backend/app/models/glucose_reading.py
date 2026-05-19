from datetime import datetime, timezone
from ..extensions import db


class GlucoseReading(db.Model):
    __tablename__ = "glucose_readings"

    id           = db.Column(db.Integer, primary_key=True)
    patient_id   = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False, index=True)
    glucose_mmol = db.Column(db.Float, nullable=False)
    meal_context = db.Column(db.String(20), nullable=False)
    measured_at  = db.Column(db.DateTime, nullable=False, index=True)
    notes        = db.Column(db.String(500), nullable=True)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    patient = db.relationship("Patient", back_populates="readings")

    GLUCOSE_MIN = 2.5
    GLUCOSE_MAX = 30.0

    @staticmethod
    def validate_glucose(value):
        return GlucoseReading.GLUCOSE_MIN <= value <= GlucoseReading.GLUCOSE_MAX

    def to_dict(self):
        return {
            "id":           self.id,
            "patient_id":   self.patient_id,
            "glucose_mmol": self.glucose_mmol,
            "meal_context": self.meal_context,
            "measured_at":  self.measured_at.isoformat() if self.measured_at else None,
            "notes":        self.notes,
            "created_at":   self.created_at.isoformat() if self.created_at else None,
        }
