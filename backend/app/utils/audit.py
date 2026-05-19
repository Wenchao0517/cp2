from flask import request
from ..extensions import db
from ..models.audit_log import AuditLog


def log_action(user_id, action, resource=None):
    try:
        entry = AuditLog(
            user_id    = user_id,
            action     = action,
            resource   = resource,
            ip_address = request.remote_addr,
        )
        db.session.add(entry)
        db.session.commit()
    except Exception:
        db.session.rollback()
