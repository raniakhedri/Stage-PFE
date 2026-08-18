"""
NaturEssence — Churn Prediction Inference Script
Called by Spring Boot ChurnPredictionService via ProcessBuilder.

Usage:
  python predict.py '<json_payload>'

Output: a single float (churn probability 0.0–1.0) printed to stdout.

The JSON payload uses camelCase keys matching UserFeaturesDTO fields.
"""

import json
import os
import sys

import joblib
import pandas as pd

# ── Model path ─────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "churn_model.pkl")


def load_artifact():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at '{MODEL_PATH}'. "
            "Run python/train.py first to train and save the model."
        )
    return joblib.load(MODEL_PATH)


def predict(payload: dict) -> float:
    """Return churn probability for a single user feature vector."""
    artifact = load_artifact()
    pipeline = artifact["pipeline"]
    all_features = artifact["metadata"]["all_features"]

    # Map camelCase keys (from Java DTO) → snake_case dataset column names.
    # Safe defaults mirror the dataset's value distributions so the model
    # degrades gracefully when a field is unavailable in production.
    row_dict = {
        "gender": payload.get("gender", "Other"),
        "city": payload.get("city", "Tunis"),
        "gouvernorat": payload.get("gouvernorat", "Tunis"),
        "age": payload.get("age", 30),
        "tenure_days": payload.get("tenureDays", 0),
        "segment_id": payload.get("segmentId", 1),
        "loyalty_points": payload.get("loyaltyPoints", 0),
        "total_orders": payload.get("totalOrders", 0),
        "total_spent": payload.get("totalSpent", 0.0),
        "avg_order_value": payload.get("avgOrderValue", 0.0),
        "order_frequency": payload.get("orderFrequency", 0.0),
        "days_since_last_login": payload.get("daysSinceLastLogin", 999),
        "review_count": payload.get("reviewCount", 0),
        "avg_rating": payload.get("avgRating", 0.0),
        "coupon_usage_count": payload.get("couponUsageCount", 0),
        "discount_user_ratio": payload.get("discountUserRatio", 0.0),
    }

    row = pd.DataFrame([{k: row_dict[k] for k in all_features}])
    prob = pipeline.predict_proba(row)[0][1]
    return float(prob)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # No input — return neutral probability
        print(0.5, flush=True)
        sys.exit(0)

    try:
        payload = json.loads(sys.argv[1])
        result = predict(payload)
        print(result, flush=True)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)
