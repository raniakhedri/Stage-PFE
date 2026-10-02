"""Hybrid recommender: collaborative filtering + content, bought-together rules, serving rules."""
from datetime import datetime, timedelta, timezone

import numpy as np

from recommender import model

NOW = datetime(2026, 9, 1, tzinfo=timezone.utc)


def _products():
    return [
        {"id": 1, "name": "Chaussure de trail", "category": "Running", "attributes": '{"discipline": "Trail"}'},
        {"id": 2, "name": "Sac d'hydratation", "category": "Running", "attributes": '{"discipline": "Trail"}'},
        {"id": 3, "name": "Tapis de yoga", "category": "Yoga", "attributes": '{"discipline": "Yoga"}'},
        {"id": 4, "name": "Brique de yoga", "category": "Yoga", "attributes": '{"discipline": "Yoga"}'},
        {"id": 5, "name": "Chaussure de trail Pro", "category": "Running", "attributes": '{"discipline": "Trail"}'},
    ]


def _interactions():
    events = []
    for v in range(30):
        ts = (NOW - timedelta(days=v % 10)).isoformat()
        pair = (1, 2) if v % 2 == 0 else (3, 4)
        for pid in pair:
            events.append({"subject": f"v{v}", "productId": pid, "type": "VIEW_PRODUCT", "ts": ts})
        events.append({"subject": f"v{v}", "productId": pair[1], "type": "PURCHASE", "ts": ts})
    return events


def test_collaborative_signal_links_products_seen_together():
    result = model.train(_products(), _interactions(), [[1, 2]] * 5 + [[3, 4]] * 5, now=NOW, tune=False)
    neighbours_of_1 = [pid for pid, _ in result["similar"]["1"]]
    assert neighbours_of_1[0] in (2, 5)
    assert 2 in neighbours_of_1
    assert all(pid != 3 for pid in neighbours_of_1[:2])


def test_new_product_is_recommended_from_its_sheet():
    # Product 5 has no interaction at all: content similarity (name, category, attributes) places it next to 1.
    result = model.train(_products(), _interactions(), [], now=NOW, tune=False)
    neighbours_of_5 = [pid for pid, _ in result["similar"]["5"]]
    assert neighbours_of_5[0] == 1


def test_bought_together_uses_lift():
    rules = model.bought_together([[1, 2]] * 4 + [[3, 4]] * 4 + [[1, 3]], min_count=2, k=5)
    assert rules[1][0][0] == 2
    assert all(r[1] > 1.0 for r in rules[1])


def test_popularity_and_stats():
    result = model.train(_products(), _interactions(), [], now=NOW, tune=False)
    assert set(result["popular"]) == {1, 2, 3, 4}
    assert result["stats"]["products"] == 5
    assert result["stats"]["subjects"] == 30


def test_history_scoring_excludes_owned_products():
    result = model.train(_products(), _interactions(), [], now=NOW, tune=False)
    recs = model.recommend_for_history(result["_sim"], result["_ids"], [(1, 1.0)], k=3, exclude={1, 2})
    assert 1 not in recs and 2 not in recs
    assert recs and recs[0] == 5


def test_no_interactions_still_returns_content_neighbours():
    result = model.train(_products(), [], [], now=NOW)
    assert result["popular"] == []
    assert result["similar"]["3"][0][0] == 4
    assert np.isfinite(result["_sim"]).all()
