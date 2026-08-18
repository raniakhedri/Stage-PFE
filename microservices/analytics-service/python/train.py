"""
NaturEssence — churn model training

Models compared on the same stratified hold-out:
  1. Recency rule          (baseline): score = days_since_last_order
  2. Logistic Regression   (linear, interpretable)
  3. Random Forest         (production model)

The production artifact is a sklearn Pipeline (preprocessing + Random Forest)
saved to python/models/churn_model.pkl.

Run from analytics-service root:
  python python/train.py
"""

from __future__ import annotations

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    precision_recall_curve,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "datasets", "naturessence_churn_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "churn_model.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")
os.makedirs(MODEL_DIR, exist_ok=True)

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
    "days_since_last_order",
    "days_since_last_login",
    "review_count",
    "avg_rating",
    "coupon_usage_count",
    "discount_user_ratio",
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

df = pd.read_csv(DATASET_PATH)
X = df[ALL_FEATURES]
y = df["churn"].astype(int)
print(f"Loaded {len(df):,} customers  |  churn rate: {y.mean():.2%}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)


def eval_scores(name, y_true, y_prob, y_pred=None):
    if y_pred is None:
        y_pred = (y_prob >= 0.5).astype(int)
    auc = roc_auc_score(y_true, y_prob)
    acc = accuracy_score(y_true, y_pred)
    print(f"\n=== {name} ===")
    print(classification_report(y_true, y_pred, target_names=["Active", "Churned"]))
    print(f"ROC-AUC  : {auc:.4f}")
    print(f"Accuracy : {acc:.4f}")
    return {"accuracy": round(float(acc), 4), "roc_auc": round(float(auc), 4)}


# ── 1. Recency baseline (higher recency ⇒ higher churn risk) ──────────────────
recency_prob = (X_test["days_since_last_order"] / (X_test["days_since_last_order"].max() + 1)).clip(0, 1)
recency_metrics = eval_scores("Recency rule (baseline)", y_test, recency_prob.to_numpy())

# ── 2. Logistic regression ────────────────────────────────────────────────────
logit_pre = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ("num", StandardScaler(), NUMERICAL_FEATURES),
    ]
)
logit = Pipeline(
    steps=[
        ("pre", logit_pre),
        (
            "model",
            LogisticRegression(max_iter=400, class_weight="balanced", solver="lbfgs"),
        ),
    ]
)
logit.fit(X_train, y_train)
logit_prob = logit.predict_proba(X_test)[:, 1]
logit_metrics = eval_scores("Logistic Regression", y_test, logit_prob)

# ── 3. Random Forest (production) ─────────────────────────────────────────────
rf_pre = ColumnTransformer(
    transformers=[
        (
            "cat",
            OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1),
            CATEGORICAL_FEATURES,
        ),
        ("num", "passthrough", NUMERICAL_FEATURES),
    ]
)
rf = Pipeline(
    steps=[
        ("preprocessor", rf_pre),
        (
            "model",
            RandomForestClassifier(
                n_estimators=300,
                min_samples_split=8,
                min_samples_leaf=4,
                max_depth=16,
                class_weight="balanced",
                n_jobs=-1,
                random_state=42,
            ),
        ),
    ]
)
rf.fit(X_train, y_train)
rf_prob = rf.predict_proba(X_test)[:, 1]
rf_pred = rf.predict(X_test)
rf_metrics = eval_scores("Random Forest (production)", y_test, rf_prob, rf_pred)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_auc = cross_val_score(rf, X, y, cv=cv, scoring="roc_auc", n_jobs=-1)
print(f"\n5-fold CV ROC-AUC (RF): {cv_auc.mean():.4f} +/- {cv_auc.std():.4f}")

importances = dict(zip(ALL_FEATURES, rf.named_steps["model"].feature_importances_))
top10 = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:10]
print("\n=== Top 10 feature importances (RF) ===")
for feat, imp in top10:
    print(f"  {feat:<30} {imp:.4f}")

# Thresholds: fixed probability bands for operations (easy to audit).
# Quantiles of predicted risk are stored for ranking-style campaigns.
high_cut = 0.70
medium_cut = 0.40
high_q = float(np.quantile(rf_prob, 0.80))
medium_q = float(np.quantile(rf_prob, 0.55))
prec, rec, thr = precision_recall_curve(y_test, rf_prob)
f1 = np.divide(2 * prec * rec, prec + rec, out=np.zeros_like(prec), where=(prec + rec) > 0)
best_i = int(np.argmax(f1[:-1])) if len(thr) else 0
best_thr = float(thr[best_i]) if len(thr) else 0.5

artifact = {
    "pipeline": rf,
    "metadata": {
        "categorical_features": CATEGORICAL_FEATURES,
        "numerical_features": NUMERICAL_FEATURES,
        "all_features": ALL_FEATURES,
        "horizon_days": 90,
        "thresholds": {"high": round(high_cut, 4), "medium": round(medium_cut, 4)},
    },
}
joblib.dump(artifact, MODEL_PATH)
print(f"\nModel saved -> {MODEL_PATH}")

metrics = {
    "horizon_days": 90,
    "label": "no_order_in_next_90_days_given_prior_purchase",
    "n_customers": int(len(df)),
    "churn_rate": round(float(y.mean()), 4),
    "train_size": int(len(y_train)),
    "test_size": int(len(y_test)),
    "baseline_recency": recency_metrics,
    "logistic_regression": logit_metrics,
    "random_forest": {
        **rf_metrics,
        "cv_roc_auc_mean": round(float(cv_auc.mean()), 4),
        "cv_roc_auc_std": round(float(cv_auc.std()), 4),
        "n_estimators": 300,
    },
    "thresholds": {
        "high": round(high_cut, 4),
        "medium": round(medium_cut, 4),
        "high_quantile": round(high_q, 4),
        "medium_quantile": round(medium_q, 4),
        "f1_optimal": round(best_thr, 4),
    },
    "top_features": {k: round(float(v), 4) for k, v in top10},
}
with open(METRICS_PATH, "w", encoding="utf-8") as f:
    json.dump(metrics, f, indent=2)
print(f"Metrics saved -> {METRICS_PATH}")
