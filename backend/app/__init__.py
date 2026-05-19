from flask import Flask
from flask_cors import CORS
from .extensions import db, jwt, bcrypt, migrate
from .config import config_by_name
import os


def create_app(config_name=None):
    app = Flask(__name__)

    env = config_name or os.getenv("FLASK_ENV", "development")
    app.config.from_object(config_by_name[env])

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

    from .auth.routes import auth_bp
    from .patients.routes import patients_bp
    from .predict.routes import predict_bp
    from .clinician.routes import clinician_bp

    app.register_blueprint(auth_bp,      url_prefix="/api/auth")
    app.register_blueprint(patients_bp,  url_prefix="/api/patients")
    app.register_blueprint(predict_bp,   url_prefix="/api/predict")
    app.register_blueprint(clinician_bp, url_prefix="/api/clinician")

    with app.app_context():
        db.create_all()

    return app
