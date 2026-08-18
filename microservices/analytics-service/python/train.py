"""
NaturEssence — Churn Prediction Training Script
Model  : Random Forest Classifier (sklearn Pipeline)
Dataset: naturessence_churn_dataset.csv  (12 000 rows, 17 features)

Why Random Forest?
  - Handles mixed feature types (categorical + numerical) without scaling
  - Robust to outliers and missing values
  - Built-in feature importance for business explainability
  - Strong out-of-the-box AUC on tabular e-commerce data
  - No external C++ dependency (unlike XGBoost/LightGBM)

Run: python python/train.py
     (from the analytics-service root)
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "datasets", "naturessence_churn_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "churn_model.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

os.makedirs(MODEL_DIR, exist_ok=True)

# ── Load dataset ───────────────────────────────────────────────────────────────
df = pd.read_csv(DATASET_PATH)
print(f"Loaded {len(df):,} rows  |  churn rate: {df['churn'].mean():.2%}")

# ── Feature definitions ────────────────────────────────────────────────────────
CATEGORICAL_FEATURES = ["gender", "city", "gouvernorat"]
NUMERICAL_FEATURES = [
    "age",
    "tenure_days",
    "segment_id",
    "loyalty_points",
    "total_orders",
    "total_spent",
    "avg_order_value",
    "order_frequency",
    "days_since_last_login",
    "review_count",
    "avg_rating",
    "coupon_usage_count",
    "discount_user_ratio",
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

X = df[ALL_FEATURES]
y = df["churn"]

# ── Preprocessing ──────────────────────────────────────────────────────────────
# OrdinalEncoder with unknown_value=-1 gracefully handles cities / genders
# not seen during training when the model runs on real production data.
preprocessor = ColumnTransformer(
    transformers=[
        (
            "cat",
            OrdinalEncoder(
                handle_unknown="use_encoded_value",
                unknown_value=-1,
            ),
            CATEGORICAL_FEATURES,
        ),
        ("num", "passthrough", NUMERICAL_FEATURES),
    ]
)

# ── Full Pipeline ──────────────────────────────────────────────────────────────
pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "model",
            RandomForestClassifier(
                n_estimators=300,
                max_depth=None,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight="balanced",  # handles class imbalance automatically
                n_jobs=-1,
                random_state=42,
            ),
        ),
    ]
)

# ── Train / Test split (stratified) ───────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

pipeline.fit(X_train, y_train)

# ── Test-set metrics ───────────────────────────────────────────────────────────
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_prob)
acc = accuracy_score(y_test, y_pred)

print("\n=== Test-set Evaluation ===")
print(classification_report(y_test, y_pred, target_names=["No Churn", "Churn"]))
print(f"ROC-AUC  : {auc:.4f}")
print(f"Accuracy : {acc:.4f}")

# ── 5-fold cross-validation ────────────────────────────────────────────────────
cv_auc = cross_val_score(pipeline, X, y, cv=5, scoring="roc_auc", n_jobs=-1)
print(f"\n5-fold CV ROC-AUC: {cv_auc.mean():.4f} ± {cv_auc.std():.4f}")

# ── Feature importance ─────────────────────────────────────────────────────────
rf_model = pipeline.named_steps["model"]
importances = dict(zip(ALL_FEATURES, rf_model.feature_importances_))
top10 = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:10]

print("\n=== Top 10 Feature Importances ===")
for feat, imp in top10:
    print(f"  {feat:<30} {imp:.4f}")

# ── Save model + metadata ──────────────────────────────────────────────────────
artifact = {
    "pipeline": pipeline,
    "metadata": {
        "categorical_features": CATEGORICAL_FEATURES,
        "numerical_features": NUMERICAL_FEATURES,
        "all_features": ALL_FEATURES,
    },
}
joblib.dump(artifact, MODEL_PATH)
print(f"\nModel saved → {MODEL_PATH}")

# ── Save metrics JSON ──────────────────────────────────────────────────────────
metrics = {
    "model": "RandomForestClassifier",
    "n_estimators": 300,
    "accuracy": round(acc, 4),
    "roc_auc": round(auc, 4),
    "cv_roc_auc_mean": round(float(cv_auc.mean()), 4),
    "cv_roc_auc_std": round(float(cv_auc.std()), 4),
    "train_size": len(y_train),
    "test_size": len(y_test),
    "churn_rate": round(float(np.mean(y)), 4),
    "top_features": dict(top10),
}
with open(METRICS_PATH, "w") as f:
    json.dump(metrics, f, indent=2)
print(f"Metrics saved → {METRICS_PATH}")
