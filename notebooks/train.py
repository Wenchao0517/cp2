import json, os, sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from imblearn.over_sampling import SMOTE
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score, confusion_matrix
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import StandardScaler

DATA_PATH  = Path("data/diabetes_binary_health_indicators_BRFSS2015.csv")
OUTPUT_DIR = Path("../cp2/backend/ml")
RANDOM_STATE = 42
RISK_THRESHOLDS = {"low": 0.30, "moderate": 0.50, "high": 0.70}

print("=" * 60)
print("Diabetes Risk Prediction — Training Pipeline")
print("=" * 60)

# 1. Load data
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df):,} rows, {df.shape[1]} columns")
print(df["Diabetes_binary"].value_counts(normalize=True))

# 2. Split X/y
y = df["Diabetes_binary"].astype(int)
X = df.drop(columns=["Diabetes_binary"])
feature_names = X.columns.tolist()
print(f"Features ({len(feature_names)}): {feature_names}")

# 3. Train/val/test split
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=RANDOM_STATE)
X_val, X_test, y_val, y_test     = train_test_split(X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=RANDOM_STATE)
print(f"Train: {len(X_train):,}  Val: {len(X_val):,}  Test: {len(X_test):,}")

# 4. Scale
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s   = scaler.transform(X_val)
X_test_s  = scaler.transform(X_test)

# 5. SMOTE
print(f"Pre-SMOTE: {np.bincount(y_train)}")
smote = SMOTE(random_state=RANDOM_STATE, sampling_strategy=0.5)
X_train_b, y_train_b = smote.fit_resample(X_train_s, y_train)
print(f"Post-SMOTE: {np.bincount(y_train_b)}")

# 6. Train XGBoost
model = xgb.XGBClassifier(
    n_estimators=400, max_depth=6, learning_rate=0.05,
    subsample=0.9, colsample_bytree=0.8,
    reg_alpha=0.1, reg_lambda=1.0, min_child_weight=3,
    objective="binary:logistic", eval_metric="auc",
    random_state=RANDOM_STATE, n_jobs=-1, tree_method="hist",
    early_stopping_rounds=20,
)
print("Training XGBoost...")
model.fit(X_train_b, y_train_b, eval_set=[(X_val_s, y_val)], verbose=50)

# 7. Evaluate
proba = model.predict_proba(X_test_s)[:, 1]
pred  = (proba >= 0.5).astype(int)
metrics = {
    "accuracy":         float(accuracy_score(y_test, pred)),
    "precision":        float(precision_score(y_test, pred)),
    "recall":           float(recall_score(y_test, pred)),
    "f1":               float(f1_score(y_test, pred)),
    "roc_auc":          float(roc_auc_score(y_test, proba)),
    "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
    "test_size":        int(len(y_test)),
}
print("\nTest metrics:")
for k, v in metrics.items():
    if k not in ("confusion_matrix", "test_size"):
        print(f"  {k:12s} {v:.4f}")

# 8. SHAP
print("Building SHAP explainer...")
explainer = shap.TreeExplainer(model)
sv = explainer.shap_values(X_test_s[:5])
print(f"SHAP values shape: {np.array(sv).shape}")

# 9. Save
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
joblib.dump(model,     OUTPUT_DIR / "model.pkl")
joblib.dump(scaler,    OUTPUT_DIR / "scaler.pkl")
joblib.dump(explainer, OUTPUT_DIR / "shap_explainer.pkl")
with open(OUTPUT_DIR / "feature_names.json", "w") as f:
    json.dump(feature_names, f, indent=2)
with open(OUTPUT_DIR / "metrics.json", "w") as f:
    json.dump({
        "test_metrics":    metrics,
        "risk_thresholds": RISK_THRESHOLDS,
        "feature_names":   feature_names,
        "model_version":   "1.0.0",
        "model_type":      "XGBoost",
    }, f, indent=2)

print(f"\nArtifacts saved to {OUTPUT_DIR.resolve()}")
print(f"  Test ROC-AUC:  {metrics['roc_auc']:.4f}")
print(f"  Test accuracy: {metrics['accuracy']:.4f}")
print(f"  Test F1:       {metrics['f1']:.4f}")
print("Training complete!")
