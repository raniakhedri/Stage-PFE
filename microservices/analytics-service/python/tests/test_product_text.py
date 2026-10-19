"""Behaviour that does not need a trained model file."""
from recommender.model import EVENT_WEIGHTS, bought_together, product_text


def test_a_purchase_counts_more_than_a_view():
    assert EVENT_WEIGHTS["PURCHASE"] == 8.0
    assert EVENT_WEIGHTS["PURCHASE"] > EVENT_WEIGHTS["ADD_TO_CART"] > EVENT_WEIGHTS["VIEW_PRODUCT"]


def test_product_text_repeats_the_category_and_drops_accents():
    text = product_text({
        "name": "Huile d'Argan",
        "category": "Été",
        "couleur": "Doré",
        "attributes": {"discipline": "Trail"},
        "description": "Soin",
    })
    assert text.count("ete") == 3
    assert "huile d'argan" in text
    assert "dore" in text
    assert "trail" in text
    assert "é" not in text


def test_bought_together_ranks_pairs_seen_together():
    assert bought_together([[1]], 1, 5) == {}
    rules = bought_together([[1, 2], [1, 2], [3, 4], [3, 4]], min_count=2, k=5)
    assert rules[1][0][0] == 2
    assert rules[1][0][1] == 2.0
    assert 3 not in [row[0] for row in rules[1]]
