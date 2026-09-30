"""
Sellio — behavioural segmentation of shoppers.

Each visitor (logged-in customer or anonymous visitor id) is described by how they
interact with the shop; K-Means groups similar behaviours and every cluster gets a
readable name from its centroid.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

SESSION_GAP_MINUTES = 30

FEATURES = [
    "sessions",             # number of visits (30 min inactivity = new visit)
    "events_per_session",   # depth of each visit
    "product_views",        # products looked at
    "search_ratio",         # share of actions that are searches
    "cart_rate",            # add-to-cart per product view
    "purchase_rate",        # purchases per add-to-cart
    "wishlist_rate",        # wishlist adds per product view
    "recency_days",         # days since last activity
    "active_days",          # distinct days with activity
]
# Counts are heavy-tailed: log1p keeps a few power users from dominating the clusters.
LOG_FEATURES = {"sessions", "events_per_session", "product_views", "recency_days", "active_days"}


def _ts(value) -> datetime:
    ts = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)


def build_features(events: list[dict], now: datetime | None = None) -> tuple[list[str], np.ndarray]:
    now = now or datetime.now(timezone.utc)
    by_subject = defaultdict(list)
    for e in events:
        by_subject[e["subject"]].append((_ts(e["ts"]), e["type"]))

    subjects, rows = [], []
    for subject, items in by_subject.items():
        items.sort()
        sessions, last = 0, None
        for ts, _ in items:
            if last is None or (ts - last).total_seconds() > SESSION_GAP_MINUTES * 60:
                sessions += 1
            last = ts
        counts = defaultdict(int)
        for _, kind in items:
            counts[kind] += 1
        views = counts["VIEW_PRODUCT"] + counts["CLICK_PRODUCT"]
        carts = counts["ADD_TO_CART"]
        total = len(items)
        rows.append([
            sessions,
            total / sessions,
            views,
            (counts["SEARCH"] + counts["SEARCH_CLICK"]) / total,
            carts / views if views else float(carts > 0),
            counts["PURCHASE"] / carts if carts else float(counts["PURCHASE"] > 0),
            counts["WISHLIST_ADD"] / views if views else 0.0,
            (now - items[-1][0]).total_seconds() / 86400,
            len({ts.date() for ts, _ in items}),
        ])
        subjects.append(subject)
    return subjects, np.array(rows, dtype=float)


def _transform(x: np.ndarray) -> np.ndarray:
    out = x.copy()
    for j, name in enumerate(FEATURES):
        if name in LOG_FEATURES:
            out[:, j] = np.log1p(out[:, j])
    return out


def label_cluster(z: dict) -> tuple[str, str]:
    """Readable persona from a centroid expressed in standard deviations from the average visitor."""
    if z["purchase_rate"] > 0.5 and z["sessions"] > 0:
        return "Clients fidèles", "Reviennent souvent et achètent : à récompenser (fidélité, avant-premières)."
    if z["purchase_rate"] > 0.5:
        return "Acheteurs décidés", "Peu de navigation, achat rapide : mettre en avant les nouveautés et le réassort."
    if z["cart_rate"] > 0.5 and z["purchase_rate"] < 0:
        return "Abandonnistes de panier", "Ajoutent au panier sans finaliser : relance panier, code livraison offerte."
    if z["search_ratio"] > 0.5:
        return "Chercheurs ciblés", "Arrivent avec une idée précise : soigner la recherche et les filtres."
    if z["recency_days"] > 0.5 and z["sessions"] < 0:
        return "Visiteurs dormants", "Inactifs depuis longtemps : campagne de réactivation."
    if z["product_views"] > 0.3 or z["events_per_session"] > 0.3:
        return "Explorateurs", "Regardent beaucoup, ajoutent peu : recommandations et contenus inspirants."
    return "Visiteurs occasionnels", "Passages courts : capter l’e-mail (newsletter, première commande)."


# At least 3 segments: two groups (usually "dormant" vs "everyone else") are too coarse to act on.
def train(events: list[dict], k_range=range(3, 7), now: datetime | None = None) -> dict:
    subjects, x = build_features(events, now)
    if len(subjects) < 8:
        return {"subjects": [], "profiles": [], "metrics": {"subjects": len(subjects), "reason": "pas assez de visiteurs"}}

    scaler = StandardScaler()
    # Winsorize at ±3σ: K-Means otherwise spends a whole cluster on a single extreme visitor.
    z = np.clip(scaler.fit_transform(_transform(x)), -3.0, 3.0)

    # K chosen by silhouette: the partition whose clusters are most compact and best separated.
    scores = {}
    for k in k_range:
        if k >= len(subjects):
            break
        km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(z)
        if len(set(km.labels_)) < 2:
            continue
        sample = min(len(subjects), 5000)
        scores[k] = float(silhouette_score(z, km.labels_, sample_size=sample, random_state=42))
    best_k = max(scores, key=scores.get) if scores else min(3, len(subjects) - 1)
    km = KMeans(n_clusters=best_k, n_init=10, random_state=42).fit(z)

    profiles, used = [], defaultdict(int)
    raw_means = {c: x[km.labels_ == c].mean(axis=0) for c in range(best_k)}
    for c in range(best_k):
        centroid = dict(zip(FEATURES, km.cluster_centers_[c]))
        label, description = label_cluster(centroid)
        used[label] += 1
        if used[label] > 1:
            label = f"{label} ({used[label]})"
        profiles.append({
            "cluster": c,
            "label": label,
            "description": description,
            "size": int((km.labels_ == c).sum()),
            "centroid": {f: round(float(v), 3) for f, v in zip(FEATURES, raw_means[c])},
            "zscores": {f: round(float(v), 3) for f, v in centroid.items()},
        })

    return {
        "subjects": [[s, int(c)] for s, c in zip(subjects, km.labels_)],
        "profiles": profiles,
        "metrics": {
            "subjects": len(subjects),
            "k": best_k,
            "silhouette": round(scores.get(best_k, 0.0), 4),
            "silhouette_by_k": {str(k): round(v, 4) for k, v in scores.items()},
            "inertia": round(float(km.inertia_), 2),
        },
    }
