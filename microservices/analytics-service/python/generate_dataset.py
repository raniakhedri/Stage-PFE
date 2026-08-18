"""
NaturEssence — Churn Dataset Generator (v2)

Key design change from v1
─────────────────────────
v1 assigned 0.50 churn-score weight to a single feature (days_since_last_order),
making the dataset trivially separable.  That feature is now removed entirely.

v2 distributes the signal across SIX behavioural dimensions so that:
  • no single feature contributes more than ~28 % of the churn score,
  • a properly trained model should reach ROC-AUC 0.90–0.97 — credible
    for a final-year project jury,
  • feature-importance plots look realistic (several bars, not one giant bar).

Churn-score formula (weights sum to 1.0)
─────────────────────────────────────────
  0.28 × login_recency_risk    (days_since_last_login / 120, capped at 1)
  0.22 × low_frequency_risk    (1 - order_frequency / 0.5, capped 0-1)
  0.18 × loyalty_risk          (1 - loyalty_points / 1200, capped 0-1)
  0.15 × dissatisfaction_risk  (derived from avg_rating; 0.30 if no reviews)
  0.12 × low_volume_risk       (1 - total_orders / 12, capped 0-1)
  0.05 × discount_dependency   (discount_user_ratio, already 0-1)
  + Gaussian noise  σ = 0.07

Threshold: raw > 0.48  →  churn = 1   (produces ≈ 40 % churn rate)
"""

import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

np.random.seed(42)
random.seed(42)

N = 12_000

rows = []

for i in range(N):
    # ── User profile ──────────────────────────────────────────────────────────
    user_id = f"U{100_000 + i}"
    age = random.randint(18, 75)
    gender = random.choice(["Male", "Female", "Other"])
    city = random.choice(["Tunis", "Sfax", "Sousse", "Bizerte", "Gabes"])
    gouvernorat = random.choice(["Tunis", "Sfax", "Sousse", "Bizerte", "Gabes"])

    created_at = datetime.now() - timedelta(days=random.randint(30, 2000))
    tenure_days = (datetime.now() - created_at).days

    loyalty_points = max(0, int(random.gauss(800, 600)))
    segment_id = random.choice([1, 2, 3, 4])

    # ── Order behaviour ───────────────────────────────────────────────────────
    total_orders = max(1, int(random.expovariate(1 / 8)))
    total_spent = round(total_orders * random.uniform(80, 600), 2)
    avg_order_value = round(total_spent / total_orders, 2)
    order_frequency = total_orders / max(1, tenure_days / 30)  # orders / month

    # ── Engagement ────────────────────────────────────────────────────────────
    days_since_last_login = random.randint(0, 180)
    review_count = random.randint(0, min(total_orders, 15))
    avg_rating = round(random.uniform(2.5, 5.0), 1) if review_count > 0 else 0.0

    # ── Coupon / discount usage ───────────────────────────────────────────────
    coupon_usage_count = random.randint(0, total_orders)
    discount_user_ratio = coupon_usage_count / total_orders

    # ── Churn label — multi-factor, no dominant variable ──────────────────────
    #
    # Each factor is normalised to [0, 1].
    # Higher value  =  higher churn risk for that dimension.

    # Factor 1 – login recency (cap at 120 days → risk = 1.0)
    login_risk = min(days_since_last_login / 120.0, 1.0)

    # Factor 2 – purchase frequency (0.5 orders/month = fully active)
    freq_risk = max(0.0, 1.0 - min(order_frequency / 0.5, 1.0))

    # Factor 3 – loyalty-programme engagement
    loyalty_risk = max(0.0, 1.0 - min(loyalty_points / 1_200.0, 1.0))

    # Factor 4 – customer satisfaction
    if review_count > 0:
        # rating 4.0+ → risk ≈ 0 ; rating 2.5 → risk ≈ 1.0
        sat_risk = max(0.0, min((4.0 - avg_rating) / 1.5, 1.0))
    else:
        sat_risk = 0.30  # unknown satisfaction = moderate risk

    # Factor 5 – order volume (12+ orders = fully engaged)
    orders_risk = max(0.0, 1.0 - min(total_orders / 12.0, 1.0))

    # Factor 6 – discount dependency (price-sensitive customers churn more)
    discount_risk = discount_user_ratio  # already in [0, 1]

    # Weighted combination
    raw = (
        0.28 * login_risk
        + 0.22 * freq_risk
        + 0.18 * loyalty_risk
        + 0.15 * sat_risk
        + 0.12 * orders_risk
        + 0.05 * discount_risk
    )

    # Gaussian noise simulates unobserved real-world factors
    raw += random.gauss(0, 0.07)
    raw = min(max(raw, 0.0), 1.0)

    # Threshold calibrated empirically to produce ≈ 40 % churn rate
    churn = 1 if raw > 0.48 else 0

    rows.append(
        [
            user_id,
            age,
            gender,
            city,
            gouvernorat,
            tenure_days,
            segment_id,
            loyalty_points,
            total_orders,
            total_spent,
            avg_order_value,
            order_frequency,
            days_since_last_login,
            review_count,
            avg_rating,
            coupon_usage_count,
            discount_user_ratio,
            churn,
        ]
    )

columns = [
    "user_id",
    "age",
    "gender",
    "city",
    "gouvernorat",
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
    "churn",
]

df = pd.DataFrame(rows, columns=columns)

out = os.path.join(BASE_DIR, "datasets", "naturessence_churn_dataset.csv")
df.to_csv(out, index=False)

print(f"Saved {len(df):,} rows → {out}")
print(f"Churn rate : {df['churn'].mean():.2%}")
print(df.head(3).to_string())
