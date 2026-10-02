"""Visitor segmentation (K-Means on behaviour features)."""
from datetime import datetime, timedelta, timezone

from segmentation import model

NOW = datetime(2026, 9, 1, tzinfo=timezone.utc)


def _visitor(subject, kind, n, days_ago):
    ts = NOW - timedelta(days=days_ago)
    return [{"subject": subject, "type": kind, "ts": (ts + timedelta(minutes=i)).isoformat()} for i in range(n)]


def test_too_few_visitors():
    events = [e for v in range(5) for e in _visitor(f"v{v}", "VIEW_PRODUCT", 3, 1)]
    result = model.train(events, now=NOW)
    assert result["profiles"] == []
    assert result["metrics"]["subjects"] == 5


def test_finds_distinct_behaviours():
    events = []
    for v in range(20):  # browsers: many views, recent
        events += _visitor(f"b{v}", "VIEW_PRODUCT", 15, 1)
    for v in range(20):  # buyers: add to cart then purchase
        events += _visitor(f"p{v}", "VIEW_PRODUCT", 2, 2) + _visitor(f"p{v}", "ADD_TO_CART", 2, 2) + _visitor(f"p{v}", "PURCHASE", 1, 2)
    for v in range(20):  # dormant: one old visit
        events += _visitor(f"d{v}", "VIEW_PRODUCT", 1, 80)
    result = model.train(events, now=NOW)
    assert 3 <= len(result["profiles"]) <= 6
    assert sum(p["size"] for p in result["profiles"]) == 60
    assert all(p["label"] and p["description"] for p in result["profiles"])
