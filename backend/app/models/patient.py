from datetime import datetime, timezone
from ..extensions import db


class Patient(db.Model):
    __tablename__ = "patients"

    id                = db.Column(db.Integer, primary_key=True)
    user_id           = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    doctor_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    date_of_birth     = db.Column(db.Date, nullable=True)
    gender            = db.Column(db.String(10), nullable=True)
    height_cm         = db.Column(db.Float, nullable=True)
    weight_kg         = db.Column(db.Float, nullable=True)
    has_hypertension  = db.Column(db.Boolean, default=False)
    has_high_chol     = db.Column(db.Boolean, default=False)
    smoker            = db.Column(db.Boolean, default=False)
    family_history    = db.Column(db.Boolean, default=False)
    physical_activity = db.Column(db.Boolean, default=True)
    created_at        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                                  onupdate=lambda: datetime.now(timezone.utc))

    user     = db.relationship("User", foreign_keys=[user_id], back_populates="patient_profile")
    doctor   = db.relationship("User", foreign_keys=[doctor_id])
    readings = db.relationship("GlucoseReading", back_populates="patient",
                               cascade="all, delete-orphan",
                               order_by="GlucoseReading.measured_at.desc()")
    assessments = db.relationship("RiskAssessment", back_populates="patient",
                                  cascade="all, delete-orphan",
                                  order_by="RiskAssessment.created_at.desc()")

    @property
    def bmi(self):
        if self.height_cm and self.weight_kg and self.height_cm > 0:
            return round(self.weight_kg / ((self.height_cm / 100) ** 2), 1)
        return None

    def to_dict(self):
        return {
            "id":               self.id,
            "user_id":          self.user_id,
            "doctor_id":        self.doctor_id,
            "date_of_birth":    self.date_of_birth.isoformat() if self.date_of_birth else None,
            "gender":           self.gender,
            "height_cm":        self.height_cm,
            "weight_kg":        self.weight_kg,
            "bmi":              self.bmi,
            "has_hypertension": self.has_hypertension,
            "has_high_chol":    self.has_high_chol,
            "smoker":           self.smoker,
            "family_history":   self.family_history,
            "physical_activity":self.physical_activity,
        }
