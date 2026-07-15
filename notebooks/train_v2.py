# -*- coding: utf-8 -*-
"""
DiabetesGuard ML Training v2
- Dataset: Kaggle Diabetes Prediction (100k, includes glucose & HbA1c)
- Model comparison: LogisticRegression vs RandomForest vs XGBoost
- 5-fold cross validation + probability calibration
- Outputs: model.pkl, scaler.pkl, shap_explainer.pkl, feature_names.json, metrics.json
"""
import json, joblib, numpy as np, pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (roc_auc_score, accuracy_score, precision_score,
                             recall_score, f1_score, confusion_matrix)
from xgboost import XGBClassifier
import shap

BASE = Path(__file__).resolve().parent
OUT  = BASE.parent / "backend" / "ml"
OUT.mkdir(parents=True, exist_ok=True)

print("=" * 60)
print("Loading dataset...")
df = pd.read_csv(BASE / "data" / "diabetes_prediction_dataset.csv")
print(f"Rows: {len(df)}, Diabetes prevalence: {df['diabetes'].mean():.1%}")

# ---------- Feature engineering ----------
# gender: Male=1, Female=0 (drop rare 'Other' for cleanliness)
df = df[df["gender"].isin(["Male", "Female"])].copy()
df["gender"] = (df["gender"] == "Male").astype(int)

# smoking_history -> binary ever-smoked (aligns with app's Smoker toggle)
df["smoker"] = df["smoking_history"].isin(["current", "former", "ever", "not current"]).astype(int)
df = df.drop(columns=["smoking_history"])

FEATURES = ["gender", "age", "hypertension", "heart_disease",
            "smoker", "bmi", "HbA1c_level", "blood_glucose_level"]
X = df[FEATURES]
y = df["diabetes"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

scaler = StandardScaler().fit(X_train)
X_train_s = scaler.transform(X_train)
X_test_s  = scaler.transform(X_test)

# ---------- Model comparison (C) ----------
models = {
    "LogisticRegression": LogisticRegression(max_iter=1000, class_weight="balanced"),
    "RandomForest": RandomForestClassifier(n_estimators=200, max_depth=12,
                                           class_weight="balanced", random_state=42, n_jobs=-1),
    "XGBoost": XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.1,
                             scale_pos_weight=(y_train==0).sum()/(y_train==1).sum(),
                             eval_metric="auc", random_state=42),
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
results = {}
print("\n" + "=" * 60)
print("Model comparison (5-fold CV + held-out test):")
print("-" * 60)

for name, model in models.items():
    cv_auc = cross_val_score(model, X_train_s, y_train, cv=cv, scoring="roc_auc", n_jobs=-1)
    model.fit(X_train_s, y_train)
    proba = model.predict_proba(X_test_s)[:, 1]
    pred  = (proba >= 0.5).astype(int)
    m = {
        "cv_auc_mean": round(cv_auc.mean(), 4),
        "cv_auc_std":  round(cv_auc.std(), 4),
        "test_auc":    round(roc_auc_score(y_test, proba), 4),
        "accuracy":    round(accuracy_score(y_test, pred), 4),
        "precision":   round(precision_score(y_test, pred), 4),
        "recall":      round(recall_score(y_test, pred), 4),
        "f1":          round(f1_score(y_test, pred), 4),
        "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
    }
    results[name] = m
    print(f"{name:20s} CV-AUC {m['cv_auc_mean']:.4f}±{m['cv_auc_std']:.4f} | "
          f"Test-AUC {m['test_auc']:.4f} | F1 {m['f1']:.4f} | Recall {m['recall']:.4f}")

# ---------- Pick best by test AUC, then calibrate (D) ----------
best_name = max(results, key=lambda k: results[k]["test_auc"])
print("-" * 60)
print(f"Best model: {best_name}")

best_base = models[best_name]
print("Calibrating probabilities (isotonic, 3-fold)...")
calibrated = CalibratedClassifierCV(best_base, method="isotonic", cv=3)
calibrated.fit(X_train_s, y_train)

cal_proba = calibrated.predict_proba(X_test_s)[:, 1]
cal_auc = roc_auc_score(y_test, cal_proba)
print(f"Calibrated test AUC: {cal_auc:.4f}")

# ---------- SHAP explainer (on the raw best model for tree-based) ----------
print("Building SHAP explainer...")
if best_name == "LogisticRegression":
    explainer = shap.LinearExplainer(best_base, X_train_s)
else:
    explainer = shap.TreeExplainer(best_base)

# ---------- Save artifacts ----------
joblib.dump(calibrated, OUT / "model.pkl")
joblib.dump(scaler,     OUT / "scaler.pkl")
joblib.dump(explainer,  OUT / "shap_explainer.pkl")
json.dump(FEATURES, open(OUT / "feature_names.json", "w"))
json.dump({
    "dataset": "Kaggle Diabetes Prediction (100k)",
    "n_samples": int(len(df)),
    "best_model": best_name,
    "calibrated": True,
    "calibrated_test_auc": round(cal_auc, 4),
    "comparison": results,
}, open(OUT / "metrics.json", "w"), indent=2)

print("=" * 60)
print(f"Artifacts saved to {OUT}")
print("Done!")
