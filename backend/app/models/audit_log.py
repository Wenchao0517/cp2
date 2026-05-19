from datetime import datetime, timezone
from ..extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    action     = db.Column(db.String(50), nullable=False)
    resource   = db.Column(db.String(100), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = db.relationship("User", back_populates="audit_logs")

    def to_dict(self):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "action":     self.action,
            "resource":   self.resource,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat(),
        }
