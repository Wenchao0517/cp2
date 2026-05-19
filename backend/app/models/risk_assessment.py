from datetime import datetime, timezone
from ..extensions import db


class RiskAssessment(db.Model):
    __tablename__ = "risk_assessments"

    id             = db.Column(db.Integer, primary_key=True)
    patient_id     = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False, index=True)
    probability    = db.Column(db.Float, nullable=False)
    risk_level     = db.Column(db.String(20), nullable=False)
    top_factors    = db.Column(db.JSON, nullable=True)
    recommendation = db.Column(db.Text, nullable=True)
    model_version  = db.Column(db.String(20), default="1.0.0")
    created_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    patient = db.relationship("Patient", back_populates="assessments")

    def to_dict(self):
        return {
            "id":             self.id,
            "patient_id":     self.patient_id,
            "probability":    round(self.probability, 4),
            "risk_level":     self.risk_level,
            "top_factors":    self.top_factors,
            "recommendation": self.recommendation,
            "model_version":  self.model_version,
            "created_at":     self.created_at.isoformat() if self.created_at else None,
        }
