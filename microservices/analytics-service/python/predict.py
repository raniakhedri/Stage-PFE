"""
NaturEssence — churn inference.

Usage:
  python predict.py '<json_object>'
  python predict.py '<json_array>'

Stdout: one probability, or a JSON array of probabilities.
"""

from __future__ import annotations

import json
import os
import sys

import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "churn_model.pkl")

_ARTIFACT = None


def load_artifact():
    global _ARTIFACT
    if _ARTIFACT is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at '{MODEL_PATH}'. Run python/train.py first."
            )
        _ARTIFACT = joblib.load(MODEL_PATH)
    return _ARTIFACT


def row_from_payload(payload: dict) -> dict:
    return {
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
        "days_since_last_order": payload.get("daysSinceLastOrder", payload.get("tenureDays", 0)),
        "days_since_last_login": payload.get("daysSinceLastLogin", payload.get("daysSinceLastOrder", 0)),
        "review_count": payload.get("reviewCount", 0),
        "avg_rating": payload.get("avgRating", 0.0),
        "coupon_usage_count": payload.get("couponUsageCount", 0),
        "discount_user_ratio": payload.get("discountUserRatio", 0.0),
    }


def predict_rows(payloads: list[dict]) -> list[float]:
    artifact = load_artifact()
    pipeline = artifact["pipeline"]
    features = artifact["metadata"]["all_features"]
    frame = pd.DataFrame([row_from_payload(p) for p in payloads])[features]
    probs = pipeline.predict_proba(frame)[:, 1]
    return [float(p) for p in probs]


def load_payload():
    if len(sys.argv) >= 3 and sys.argv[1] in ("--file", "-f"):
        with open(sys.argv[2], encoding="utf-8") as handle:
            return json.load(handle), True
    if len(sys.argv) >= 2:
        return json.loads(sys.argv[1]), False
    return None, False


if __name__ == "__main__":
    try:
        payload, from_file = load_payload()
        if payload is None:
            print(0.5, flush=True)
            sys.exit(0)
        items = payload if isinstance(payload, list) else [payload]
        probs = predict_rows(items)
        if from_file or isinstance(payload, list):
            print(json.dumps(probs), flush=True)
        else:
            print(probs[0], flush=True)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)
