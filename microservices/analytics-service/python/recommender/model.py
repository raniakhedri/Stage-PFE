"""
Sellio — hybrid product recommender.

Collaborative filtering (latent factors from truncated SVD on implicit feedback)
blended with content similarity (TF-IDF on product text), plus association rules
for "frequently bought together". Per shop, trained offline, served from Postgres.

Every public function works on plain Python structures so the module can be used
both by the Java service (via train.py) and by the offline benchmark.
"""

from __future__ import annotations

import json
import math
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from itertools import combinations

import numpy as np
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

# Implicit feedback: how strongly each event signals interest.
EVENT_WEIGHTS = {
    "VIEW_PRODUCT": 1.0,
    "CLICK_PRODUCT": 1.0,
    "SEARCH_CLICK": 1.5,
    "WISHLIST_ADD": 3.0,
    "ADD_TO_CART": 4.0,
    "BEGIN_CHECKOUT": 4.0,
    "PURCHASE": 8.0,
}
HALF_LIFE_DAYS = 30.0      # interest decays: an interaction 30 days old counts half
SHRINKAGE = 10.0           # items with few interactions lean on content similarity
TOP_K = 20                 # neighbours stored per product


@dataclass
class Params:
    n_factors: int = 64          # 64–128 did best on real purchases (evaluate_recommender_real.py); capped for small shops
    shrinkage: float = SHRINKAGE
    half_life_days: float = HALF_LIFE_DAYS
    top_k: int = TOP_K
    min_pair_count: int = 2
    extra: dict = field(default_factory=dict)


def _strip_accents(text: str) -> str:
    text = unicodedata.normalize("NFD", text or "")
    return "".join(c for c in text if unicodedata.category(c) != "Mn").lower()


def product_text(p: dict) -> str:
    """Text used for content similarity. Category words are repeated to weigh more than free text."""
    category = " ".join(filter(None, [p.get("category"), p.get("subCategory")]))
    attributes = " ".join(
        str(p.get(k) or "") for k in ("tissu", "couleur", "coupe", "genre", "saison", "latin", "origine")
    )
    # Sector characteristics (sport, high-tech, maison…) arrive as a JSON object.
    raw = p.get("attributes")
    if raw:
        try:
            extra = json.loads(raw) if isinstance(raw, str) else raw
            if isinstance(extra, dict):
                attributes += " " + " ".join(str(v) for v in extra.values())
        except ValueError:
            pass
    return _strip_accents(" ".join([
        p.get("name") or "",
        (category + " ") * 3,
        attributes * 2,
        (p.get("description") or "")[:600],
    ]))


def _parse_ts(value) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value).replace("Z", "+00:00")
    try:
        ts = datetime.fromisoformat(text)
    except ValueError:
        ts = datetime.fromisoformat(text[:19])
    return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)


def interaction_matrix(interactions: list[dict], item_index: dict, now: datetime, params: Params):
    """subject × item matrix of decayed, log-damped implicit feedback."""
    subjects: dict[str, int] = {}
    cells: dict[tuple[int, int], float] = defaultdict(float)
    for it in interactions:
        col = item_index.get(it["productId"])
        weight = EVENT_WEIGHTS.get(it["type"])
        if col is None or weight is None:
            continue
        row = subjects.setdefault(it["subject"], len(subjects))
        age_days = max(0.0, (now - _parse_ts(it["ts"])).total_seconds() / 86400)
        cells[(row, col)] += weight * 0.5 ** (age_days / params.half_life_days)
    if not cells:
        return None, subjects
    rows, cols, vals = zip(*((r, c, math.log1p(v)) for (r, c), v in cells.items()))
    matrix = csr_matrix((vals, (rows, cols)), shape=(len(subjects), len(item_index)))
    return matrix, subjects


def _idf_weight(matrix: csr_matrix) -> csr_matrix:
    """Down-weights items everybody touches (like IDF in text search) so CF is not just popularity."""
    df = np.bincount(matrix.indices, minlength=matrix.shape[1]).astype(float)
    idf = np.log((1 + matrix.shape[0]) / (1 + df)) + 1.0
    return csr_matrix(matrix.multiply(idf.reshape(1, -1)))


def content_similarity(products: list[dict]) -> np.ndarray:
    texts = [product_text(p) for p in products]
    if len(texts) < 2 or not any(t.strip() for t in texts):
        return np.zeros((len(texts), len(texts)))
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
    tfidf = vectorizer.fit_transform(texts)
    sim = (tfidf @ tfidf.T).toarray()
    np.fill_diagonal(sim, 0.0)
    return sim


def cf_similarity(matrix: csr_matrix | None, n_items: int, params: Params) -> tuple[np.ndarray, int]:
    """Item-item cosine similarity in the SVD latent space."""
    if matrix is None or matrix.nnz < 5 or min(matrix.shape) < 3:
        return np.zeros((n_items, n_items)), 0
    weighted = _idf_weight(matrix)
    k = max(2, min(params.n_factors, min(weighted.shape) - 1))
    svd = TruncatedSVD(n_components=k, random_state=42)
    svd.fit(weighted)
    item_factors = normalize(svd.components_.T * svd.singular_values_)
    sim = item_factors @ item_factors.T
    np.fill_diagonal(sim, 0.0)
    return np.clip(sim, 0.0, 1.0), k


def hybrid_similarity(cf: np.ndarray, content: np.ndarray, support: np.ndarray, params: Params) -> np.ndarray:
    """
    beta = n / (n + shrinkage) per item pair, n = the smaller interaction count of the two.
    Items with lots of data are recommended from behaviour, new items from their description.
    """
    pair_support = np.minimum.outer(support, support)
    beta = pair_support / (pair_support + params.shrinkage)
    return beta * cf + (1.0 - beta) * content


def top_neighbours(sim: np.ndarray, ids: list, k: int, popularity: np.ndarray) -> dict:
    """Top-k neighbours per item; popularity breaks ties between equally similar items."""
    result = {}
    tiebreak = 1e-6 * (popularity / (popularity.max() or 1.0))
    for i, pid in enumerate(ids):
        scores = sim[i] + tiebreak
        scores[i] = -1
        order = np.argsort(-scores)[:k]
        result[pid] = [[ids[j], round(float(sim[i, j]), 5)] for j in order if sim[i, j] > 0.01]
    return result


def bought_together(baskets: list[list], min_count: int, k: int) -> dict:
    """Association rules A → B ranked by lift (P(B|A) / P(B)), keeping pairs seen at least min_count times."""
    baskets = [sorted(set(b)) for b in baskets if len(set(b)) >= 2]
    if not baskets:
        return {}
    n = len(baskets)
    item_count = Counter(i for b in baskets for i in b)
    pair_count = Counter(pair for b in baskets for pair in combinations(b, 2))
    rules = defaultdict(list)
    for (a, b), count in pair_count.items():
        if count < min_count:
            continue
        for x, y in ((a, b), (b, a)):
            confidence = count / item_count[x]
            lift = confidence / (item_count[y] / n)
            if lift > 1.0:
                rules[x].append([y, round(lift, 4), round(confidence, 4), count])
    return {x: sorted(v, key=lambda r: (-r[1], -r[3]))[:k] for x, v in rules.items()}


SHRINKAGE_GRID = (10.0, 30.0, 100.0, 300.0, 1000.0)
POPULARITY_GRID = (0.0, 0.2, 0.4, 0.6, 0.8)
DEFAULT_ALPHA = 0.4  # without enough history to tune it: equal-ish weight to taste and best-sellers
MIN_TUNING_CASES = 30


def _holdout(interactions: list[dict]):
    """Leave-last-out split: each subject's last strongly-signalled product is hidden with everything after it."""
    by_subject = defaultdict(list)
    for it in interactions:
        by_subject[it["subject"]].append(it)
    train_part, cases = [], []
    for subject, items in by_subject.items():
        items.sort(key=lambda it: str(it["ts"]))
        strong = [it for it in items if EVENT_WEIGHTS.get(it["type"], 0) >= 4]
        if len({it["productId"] for it in strong}) < 2:
            train_part.extend(items)
            continue
        target = strong[-1]["productId"]
        cutoff = min(str(it["ts"]) for it in items if it["productId"] == target)
        kept = [it for it in items if str(it["ts"]) < cutoff]
        train_part.extend(kept)
        if kept:
            cases.append((target, kept))
    return train_part, cases


def tune_shrinkage(products, interactions, content, now, params: Params) -> tuple[float, dict]:
    """
    The best balance between behaviour and content depends on the shop's size (λ≈10 on a few thousand
    events, λ≈1000 on 800 000 real purchases). Each shop picks its own λ on a hold-out of its own history;
    too little history → the default is kept.
    """
    train_part, cases = _holdout(interactions)
    if len(cases) < MIN_TUNING_CASES:
        return params.shrinkage, {"tuned": False, "cases": len(cases), "alpha": DEFAULT_ALPHA}
    ids = [p["id"] for p in products]
    index = {pid: i for i, pid in enumerate(ids)}
    matrix, _ = interaction_matrix(train_part, index, now, params)
    if matrix is None:
        return params.shrinkage, {"tuned": False, "cases": len(cases), "alpha": DEFAULT_ALPHA}
    support = np.asarray((matrix > 0).sum(axis=0)).ravel().astype(float)
    cf, _ = cf_similarity(matrix, len(ids), params)
    popularity = np.asarray(matrix.sum(axis=0)).ravel()
    histories = []
    for target, history in cases[:500]:
        weights = defaultdict(float)
        for it in history:
            weights[it["productId"]] += EVENT_WEIGHTS.get(it["type"], 0)
        histories.append((target, weights))

    def ndcg_of(sim, alpha):
        total = 0.0
        for target, weights in histories:
            ranked = recommend_for_history(sim, ids, list(weights.items()), k=10, exclude=set(weights), popularity=popularity, alpha=alpha)
            if target in ranked:
                total += 1 / math.log2(ranked.index(target) + 2)
        return total / len(histories)

    by_lambda = {lam: ndcg_of(hybrid_similarity(cf, content, support, Params(shrinkage=lam)), 0.0) for lam in SHRINKAGE_GRID}
    best = max(by_lambda, key=by_lambda.get)
    best_sim = hybrid_similarity(cf, content, support, Params(shrinkage=best))
    by_alpha = {a: ndcg_of(best_sim, a) for a in POPULARITY_GRID}
    alpha = max(by_alpha, key=by_alpha.get)
    return best, {"tuned": True, "cases": len(histories), "alpha": alpha,
                  "ndcg@10_by_lambda": {str(k): round(v, 4) for k, v in by_lambda.items()},
                  "ndcg@10_by_alpha": {str(k): round(v, 4) for k, v in by_alpha.items()}}


def train(products: list[dict], interactions: list[dict], baskets: list[list], params: Params | None = None,
          now: datetime | None = None, tune: bool = True) -> dict:
    params = params or Params()
    now = now or datetime.now(timezone.utc)
    ids = [p["id"] for p in products]
    index = {pid: i for i, pid in enumerate(ids)}

    matrix, subjects = interaction_matrix(interactions, index, now, params)
    support = np.zeros(len(ids)) if matrix is None else np.asarray((matrix > 0).sum(axis=0)).ravel().astype(float)
    popularity = np.zeros(len(ids)) if matrix is None else np.asarray(matrix.sum(axis=0)).ravel()

    content = content_similarity(products)
    tuning = {"tuned": False, "alpha": DEFAULT_ALPHA}
    if tune and matrix is not None:
        shrinkage, tuning = tune_shrinkage(products, interactions, content, now, params)
        params = Params(n_factors=params.n_factors, shrinkage=shrinkage, half_life_days=params.half_life_days,
                        top_k=params.top_k, min_pair_count=params.min_pair_count)
    cf, n_factors = cf_similarity(matrix, len(ids), params)
    sim = hybrid_similarity(cf, content, support, params)

    return {
        "similar": {str(k): v for k, v in top_neighbours(sim, ids, params.top_k, popularity).items()},
        "boughtTogether": {str(k): v for k, v in bought_together(baskets, params.min_pair_count, params.top_k).items()},
        "popular": [ids[i] for i in np.argsort(-popularity)[:50] if popularity[i] > 0],
        # Popularity of every product in [0, 1], blended at serving time with weight alpha.
        "popularity": {str(ids[i]): round(float(popularity[i] / (popularity.max() or 1.0)), 5) for i in range(len(ids)) if popularity[i] > 0},
        "stats": {
            "products": len(ids),
            "subjects": len(subjects),
            "interactions": int(matrix.nnz) if matrix is not None else 0,
            "density": round(float(matrix.nnz) / (matrix.shape[0] * matrix.shape[1]), 5) if matrix is not None else 0.0,
            "baskets": len([b for b in baskets if len(set(b)) >= 2]),
            "latent_factors": n_factors,
            "shrinkage": params.shrinkage,
            "alpha": tuning.get("alpha", DEFAULT_ALPHA),
            "tuning": tuning,
        },
        "_sim": sim,
        "_ids": ids,
    }


def recommend_for_history(sim: np.ndarray, ids: list, history: list[tuple], k: int = 10, exclude: set | None = None,
                          popularity: np.ndarray | None = None, alpha: float = 0.0) -> list:
    """
    Item-based scoring used at serving time: sum of similarities to what the visitor interacted with,
    optionally blended with popularity: (1 − α)·personal + α·popularity, both scaled to [0, 1].
    On real data the best-sellers carry a lot of signal (seasonal peaks, consumables), so α is tuned per shop.
    """
    index = {pid: i for i, pid in enumerate(ids)}
    scores = np.zeros(len(ids))
    for pid, weight in history:
        i = index.get(pid)
        if i is not None:
            scores += weight * sim[i]
    if alpha > 0 and popularity is not None:
        top = scores.max()
        personal = scores / top if top > 0 else scores
        scores = (1 - alpha) * personal + alpha * (popularity / (popularity.max() or 1.0))
    exclude = exclude or set()
    for pid in exclude:
        if pid in index:
            scores[index[pid]] = -np.inf
    order = np.argsort(-scores)
    return [ids[i] for i in order[:k] if np.isfinite(scores[i]) and scores[i] > 0]
