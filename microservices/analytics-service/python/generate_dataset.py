"""
NaturEssence — customer-level churn table.

Observation protocol (standard CRM / survival-style labeling)
-------------------------------------------------------------
Snapshot date T is 90 days before the end of the observation period.

For every customer with at least one order on or before T:
  features  = information known at T only
  label     = 1 if the customer places zero orders in (T, T + 90 days]
            = 0 otherwise

The target is therefore *future* purchase inactivity. Covariates never
include events after T, so there is no label leakage.

Run from analytics-service root:
  python python/generate_dataset.py
"""

from __future__ import annotations

import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
np.random.seed(42)
random.seed(42)
RNG = np.random.default_rng(42)

N_TARGET = 12_000
HORIZON_DAYS = 90
END = datetime(2026, 8, 1, 12, 0, 0)
SNAPSHOT_T = END - timedelta(days=HORIZON_DAYS)

LOCATIONS = [
    ("Tunis", "Tunis"),
    ("Ariana", "Ariana"),
    ("Sfax", "Sfax"),
    ("Sousse", "Sousse"),
    ("Bizerte", "Bizerte"),
    ("Gabès", "Gabès"),
    ("Nabeul", "Nabeul"),
    ("Monastir", "Monastir"),
]


def _clip(dt, lo, hi):
    return min(max(dt, lo), hi)


def simulate_one():
    city, gouvernorat = LOCATIONS[int(RNG.integers(0, len(LOCATIONS)))]
    gender = random.choice(["Male", "Female", "Female", "Male", "Other"])
    age = int(np.clip(RNG.normal(34, 11), 18, 72))

    created = SNAPSHOT_T - timedelta(days=int(RNG.integers(60, 980)))
    tenure_at_t = max(1, (SNAPSHOT_T - created).days)

    # Heterogeneous buying intensity (orders / month)
    rate = float(np.clip(RNG.lognormal(mean=-0.55, sigma=0.55), 0.08, 2.2))

    # Some customers stop buying (true future inactivity after T)
    will_lapse = RNG.random() < 0.34
    if will_lapse:
        stop = created + timedelta(days=int(RNG.integers(20, tenure_at_t + 25)))
        stop = _clip(stop, created + timedelta(days=7), END)
    else:
        stop = END

    span_days = max(7, (stop - created).days)
    n_orders = max(1, int(RNG.poisson(rate * span_days / 30.0)))
    offsets = np.sort(RNG.integers(0, span_days + 1, size=n_orders))
    order_times = [created + timedelta(days=int(o)) for o in offsets]
    order_times = [t for t in order_times if t <= stop]

    before = [t for t in order_times if t <= SNAPSHOT_T]
    after = [t for t in order_times if SNAPSHOT_T < t <= END]
    if len(before) < 1:
        return None

    tickets = RNG.uniform(45, 420, size=len(before))
    total_orders = len(before)
    total_spent = float(np.round(tickets.sum(), 2))
    avg_order_value = round(total_spent / total_orders, 2)
    tenure_months = max(tenure_at_t / 30.0, 1.0)
    order_frequency = total_orders / tenure_months

    last_order = max(before)
    days_since_last_order = (SNAPSHOT_T - last_order).days

    # Login is correlated with purchase activity, with noise
    last_login = last_order + timedelta(days=int(RNG.integers(0, 12)))
    if last_login > SNAPSHOT_T:
        last_login = SNAPSHOT_T - timedelta(hours=int(RNG.integers(1, 48)))
    days_since_last_login = max(0, (SNAPSHOT_T - last_login).days)

    review_count = int(RNG.integers(0, min(total_orders, 8) + 1))
    avg_rating = round(float(np.clip(RNG.normal(4.1, 0.7), 1.5, 5.0)), 1) if review_count else 0.0

    coupon_usage_count = int(RNG.binomial(total_orders, 0.22))
    discount_user_ratio = coupon_usage_count / total_orders

    loyalty_points = max(0, int(total_spent * RNG.uniform(0.6, 1.4) + RNG.normal(0, 80)))
    segment_id = 1
    if total_orders >= 8 and total_spent >= 900:
        segment_id = 4
    elif total_orders >= 4:
        segment_id = 3
    elif days_since_last_order > 60:
        segment_id = 2

    churn = 1 if len(after) == 0 else 0

    return {
        "user_id": None,
        "age": age,
        "gender": gender,
        "city": city,
        "gouvernorat": gouvernorat,
        "tenure_days": tenure_at_t,
        "segment_id": segment_id,
        "loyalty_points": loyalty_points,
        "total_orders": total_orders,
        "total_spent": total_spent,
        "avg_order_value": avg_order_value,
        "order_frequency": round(order_frequency, 4),
        "days_since_last_order": days_since_last_order,
        "days_since_last_login": days_since_last_login,
        "review_count": review_count,
        "avg_rating": avg_rating,
        "coupon_usage_count": coupon_usage_count,
        "discount_user_ratio": round(discount_user_ratio, 4),
        "churn": churn,
    }


rows = []
attempts = 0
while len(rows) < N_TARGET and attempts < N_TARGET * 8:
    attempts += 1
    row = simulate_one()
    if row is None:
        continue
    row["user_id"] = f"U{100_000 + len(rows)}"
    rows.append(row)

df = pd.DataFrame(rows)
out = os.path.join(BASE_DIR, "datasets", "naturessence_churn_dataset.csv")
os.makedirs(os.path.dirname(out), exist_ok=True)
df.to_csv(out, index=False)

print(f"Snapshot T      : {SNAPSHOT_T.date()}  |  horizon : {HORIZON_DAYS} days")
print(f"Eligible buyers : {len(df):,}")
print(f"Churn rate      : {df['churn'].mean():.2%}  (no order in (T, T+{HORIZON_DAYS}])")
print(f"Saved -> {out}")
