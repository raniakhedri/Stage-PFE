"""
Évaluation sur des parcours de navigation réels — Kaggle « eCommerce Events History in Cosmetics Shop » (nettoyé).

1. Segmentation comportementale (K-Means) : pas de vérité terrain sur des données réelles, donc
   on mesure la qualité interne (silhouette, Davies-Bouldin) et la STABILITÉ : on ré-entraîne sur
   5 sous-échantillons de 80 % des visiteurs et on compare les partitions (ARI moyen).
2. Recommandation : les 14 derniers jours sont cachés ; pour chaque visiteur actif avant ET après,
   le modèle doit retrouver les produits ajoutés au panier ou achetés pendant ces 14 jours.

  python python/data_prep/clean_cosmetics_events.py
  python python/evaluate_cosmetics.py   → models/cosmetics_metrics.json
"""

from __future__ import annotations

import json
import math
import os
import sys
from collections import defaultdict

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score, davies_bouldin_score

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recommender import model as rec  # noqa: E402
from segmentation import model as seg  # noqa: E402

BASE = os.path.dirname(os.path.abspath(__file__))
CLEAN = os.path.join(BASE, "datasets", "clean", "cosmetics_events_clean.csv.gz")
OUT = os.path.join(BASE, "models", "cosmetics_metrics.json")
TEST_DAYS = 14
K = 10


def segmentation_eval(events: pd.DataFrame) -> dict:
    now = events["event_time"].max().to_pydatetime()
    rows = [{"subject": str(u), "type": t, "ts": ts.isoformat()} for u, t, ts in events[["user_id", "type", "event_time"]].itertuples(index=False)]
    result = seg.train(rows, now=now)
    subjects, x = seg.build_features(rows, now)
    z = np.clip((seg._transform(x) - seg._transform(x).mean(0)) / (seg._transform(x).std(0) + 1e-9), -3, 3)
    k = result["metrics"]["k"]
    labels = KMeans(n_clusters=k, n_init=10, random_state=42).fit_predict(z)
    rng = np.random.default_rng(42)
    aris = []
    for _ in range(5):
        idx = rng.choice(len(z), size=int(0.8 * len(z)), replace=False)
        sub = KMeans(n_clusters=k, n_init=10, random_state=int(rng.integers(1_000))).fit(z[idx])
        aris.append(adjusted_rand_score(labels[idx], sub.labels_))
    return {
        "visiteurs": len(subjects),
        "k": k,
        "silhouette": result["metrics"]["silhouette"],
        "silhouette_by_k": result["metrics"]["silhouette_by_k"],
        "davies_bouldin": round(float(davies_bouldin_score(z, labels)), 4),
        "stabilite_ari_moyen": round(float(np.mean(aris)), 4),
        "stabilite_ari_min": round(float(np.min(aris)), 4),
        "segments": [{k2: p[k2] for k2 in ("label", "size", "centroid")} for p in result["profiles"]],
    }


def _setup(events: pd.DataFrame, cutoff: pd.Timestamp, horizon_days: int):
    past = events[events["event_time"] < cutoff]
    future = events[(events["event_time"] >= cutoff) & (events["event_time"] < cutoff + pd.Timedelta(days=horizon_days))]
    counts = past.groupby("product_id")["user_id"].nunique()
    # Produits vus par au moins 5 visiteurs, 5 000 au plus (matrices de similarité denses en mémoire).
    catalog = set(counts[counts >= 5].sort_values(ascending=False).index[:5000])
    past = past[past["product_id"].isin(catalog)]
    meta = past.groupby("product_id").agg(brand=("brand", "first"), category=("category_id", "first"), code=("category_code", "first"))
    # Le jeu n’a pas de libellé produit : le contenu = marque + catégorie (+ code catégorie quand il existe).
    products = [{"id": int(pid), "name": f"{r.brand}", "category": f"cat{r.category}", "subCategory": str(r.code).replace(".", " ")} for pid, r in meta.iterrows()]
    interactions = [{"subject": str(u), "productId": int(p), "type": t, "ts": ts.isoformat()} for u, p, t, ts in past[["user_id", "product_id", "type", "event_time"]].itertuples(index=False)]
    strong_future = future[future["type"].isin(["ADD_TO_CART", "PURCHASE"]) & future["product_id"].isin(catalog)]
    history = defaultdict(lambda: defaultdict(float))
    for u, p, t in past[["user_id", "product_id", "type"]].itertuples(index=False):
        history[u][int(p)] += rec.EVENT_WEIGHTS.get(t, 0)
    targets = {u: set(map(int, g)) - set(history[u]) for u, g in strong_future.groupby("user_id")["product_id"] if u in history}
    targets = dict(list({u: t for u, t in targets.items() if t}.items())[:2000])
    model = rec.train(products, interactions, [], now=cutoff.to_pydatetime())
    ids = model["_ids"]
    index = {pid: i for i, pid in enumerate(ids)}
    matrix, _ = rec.interaction_matrix(interactions, index, cutoff.to_pydatetime(), rec.Params())
    cf, _ = rec.cf_similarity(matrix, len(ids), rec.Params())
    return {
        "ids": ids, "history": history, "targets": targets, "model": model, "cf": cf,
        "content": rec.content_similarity(products), "popularity": np.asarray(matrix.sum(axis=0)).ravel(),
    }


def _run(setup, sim=None, pop_only=False, alpha=0.0):
    ids, history, targets, popularity = setup["ids"], setup["history"], setup["targets"], setup["popularity"]
    pop_order = [ids[i] for i in np.argsort(-popularity)]
    hits = ndcg = 0.0
    seen_all = set()
    for u, truth in targets.items():
        seen = set(history[u])
        if pop_only:
            ranked = [p for p in pop_order if p not in seen][:K]
        else:
            ranked = rec.recommend_for_history(sim, ids, list(history[u].items()), k=K, exclude=seen, popularity=popularity, alpha=alpha)
        seen_all.update(ranked)
        found = [i for i, p in enumerate(ranked) if p in truth]
        hits += bool(found)
        ndcg += sum(1 / math.log2(i + 2) for i in found) / sum(1 / math.log2(i + 2) for i in range(min(K, len(truth))))
    n = max(1, len(targets))
    return {"hit_rate@10": round(hits / n, 4), "ndcg@10": round(ndcg / n, 4), "coverage": round(len(seen_all) / len(ids), 4), "cases": len(targets)}


def recommender_eval(events: pd.DataFrame) -> dict:
    end = events["event_time"].max()
    # Validation : historique jusqu’au 10 décembre, cible = 7 jours suivants → choix de α.
    val = _setup(events, end - pd.Timedelta(days=21), 7)
    alphas = {str(a): _run(val, val["model"]["_sim"], alpha=a) for a in rec.POPULARITY_GRID}
    best_alpha = float(max(alphas, key=lambda a: alphas[a]["ndcg@10"]))
    print("  validation α :", {a: v["ndcg@10"] for a, v in alphas.items()}, "→", best_alpha)
    # Test : historique jusqu’au 17 décembre, cible = 14 derniers jours.
    test = _setup(events, end - pd.Timedelta(days=TEST_DAYS), TEST_DAYS)
    model = test["model"]
    return {
        "produits": len(test["ids"]), "visiteurs": model["stats"]["subjects"], "interactions": model["stats"]["interactions"],
        "densite": model["stats"]["density"], "lambda_choisi": model["stats"]["shrinkage"], "reglage_lambda": model["stats"]["tuning"],
        "validation_alpha": alphas, "alpha_choisi": best_alpha,
        "results": {
            "popularite (baseline)": _run(test, pop_only=True),
            "contenu seul": _run(test, test["content"]),
            "filtrage collaboratif seul": _run(test, test["cf"]),
            "hybride": _run(test, model["_sim"]),
            f"hybride + popularite (alpha={best_alpha}, retenu)": _run(test, model["_sim"], alpha=best_alpha),
        },
    }


def main():
    events = pd.read_csv(CLEAN, parse_dates=["event_time"])
    print(f"{len(events):,} événements, {events['user_id'].nunique():,} visiteurs")
    segmentation = segmentation_eval(events)
    print("Segmentation :", {k: segmentation[k] for k in ("k", "silhouette", "davies_bouldin", "stabilite_ari_moyen")})
    recommendation = recommender_eval(events)
    for k, v in recommendation["results"].items():
        print(f"  {k:<30} {v}")
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump({"source": "Kaggle — eCommerce Events History in Cosmetics Shop (REES46), nettoyé",
                   "segmentation": segmentation, "recommendation": recommendation}, fh, ensure_ascii=False, indent=2, default=str)


if __name__ == "__main__":
    main()
