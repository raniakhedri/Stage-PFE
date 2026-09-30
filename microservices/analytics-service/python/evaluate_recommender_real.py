"""
Évaluation du moteur de recommandation sur des achats réels — UCI « Online Retail II » (nettoyé).

Question posée au modèle : « à partir de tout ce qu’un client a acheté avant la date T, quels
NOUVEAUX produits achètera-t-il dans les 90 jours suivants ? » (les produits déjà achetés ne comptent
pas : on mesure la découverte, pas le réachat).

Protocole temporel :
  validation : historique < 2011-06-01, cible = nouveaux achats du 01/06 au 30/08  → choix des hyper-paramètres
  test       : historique < 2011-09-10, cible = nouveaux achats du 10/09 au 09/12  → chiffres rapportés
Les produits vus moins de 10 fois avant T sont exclus du catalogue évalué (trop rares pour être recommandés).

« Souvent achetés ensemble » : règles apprises sur les factures < T, testées sur les factures ≥ T.

  python python/evaluate_recommender_real.py   → models/recommender_real_metrics.json
"""

from __future__ import annotations

import json
import math
import os
import sys
from collections import defaultdict

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recommender import model as rec  # noqa: E402

BASE = os.path.dirname(os.path.abspath(__file__))
CLEAN = os.path.join(BASE, "datasets", "clean", "online_retail_clean.csv.gz")
OUT = os.path.join(BASE, "models", "recommender_real_metrics.json")
HORIZON = pd.Timedelta(days=90)
MIN_ITEM_BUYERS = 10
MAX_CASES = 1500
K = 10


def prepare(lines: pd.DataFrame, t: pd.Timestamp):
    past = lines[lines["InvoiceDate"] < t]
    future = lines[(lines["InvoiceDate"] >= t) & (lines["InvoiceDate"] < t + HORIZON)]
    buyers = past.groupby("StockCode")["CustomerID"].nunique()
    catalog = sorted(buyers[buyers >= MIN_ITEM_BUYERS].index)
    in_catalog = set(catalog)
    past = past[past["StockCode"].isin(in_catalog)]
    products = (past.groupby("StockCode")["Description"].agg(lambda s: s.value_counts().index[0])
                .reindex(catalog).reset_index().rename(columns={"StockCode": "id", "Description": "name"}))
    # Le jeu n’a pas de catégorie : le dernier mot du libellé (HOLDER, BAG, CANDLE…) en tient lieu.
    products["category"] = products["name"].str.split().str[-1]
    interactions = [{"subject": str(c), "productId": p, "type": "PURCHASE", "ts": ts.isoformat()}
                    for c, p, ts in past[["CustomerID", "StockCode", "InvoiceDate"]].itertuples(index=False)]
    history = past.groupby("CustomerID")["StockCode"].agg(lambda s: s.value_counts().to_dict())
    bought_before = past.groupby("CustomerID")["StockCode"].agg(set)
    targets = {}
    for cust, items in future[future["StockCode"].isin(in_catalog)].groupby("CustomerID")["StockCode"]:
        new_items = set(items) - bought_before.get(cust, set())
        if cust in history.index and new_items:
            targets[cust] = new_items
    return products.to_dict("records"), interactions, history, targets


def evaluate(sim, ids, history, targets, popularity_order=None, popularity=None, alpha=0.0):
    hits = prec = recall = ndcg = 0.0
    recommended = set()
    cases = list(targets.items())[:MAX_CASES]
    for cust, truth in cases:
        seen = set(history[cust])
        if popularity_order is not None:
            ranked = [p for p in popularity_order if p not in seen][:K]
        else:
            weights = [(p, rec.EVENT_WEIGHTS["PURCHASE"] * math.log1p(n)) for p, n in history[cust].items()]
            ranked = rec.recommend_for_history(sim, ids, weights, k=K, exclude=seen, popularity=popularity, alpha=alpha)
        recommended.update(ranked)
        found = [i for i, p in enumerate(ranked) if p in truth]
        hits += bool(found)
        prec += len(found) / K
        recall += len(found) / len(truth)
        dcg = sum(1 / math.log2(i + 2) for i in found)
        idcg = sum(1 / math.log2(i + 2) for i in range(min(K, len(truth))))
        ndcg += dcg / idcg if idcg else 0
    n = max(1, len(cases))
    return {"hit_rate@10": round(hits / n, 4), "precision@10": round(prec / n, 4), "recall@10": round(recall / n, 4),
            "ndcg@10": round(ndcg / n, 4), "coverage": round(len(recommended) / len(ids), 4), "cases": len(cases)}


def fit_components(products, interactions, t, n_factors):
    ids = [p["id"] for p in products]
    index = {pid: i for i, pid in enumerate(ids)}
    params = rec.Params(n_factors=n_factors)
    matrix, _ = rec.interaction_matrix(interactions, index, t.to_pydatetime().replace(tzinfo=rec.timezone.utc), params)
    support = np.asarray((matrix > 0).sum(axis=0)).ravel().astype(float)
    popularity = np.asarray(matrix.sum(axis=0)).ravel()
    return ids, matrix, support, popularity


def run_period(lines, t, grid=None, best=None):
    products, interactions, history, targets = prepare(lines, t)
    content = rec.content_similarity(products)
    result = {"date": t.date().isoformat(), "products": len(products), "customers_with_history": int(len(history)),
              "cases": min(len(targets), MAX_CASES), "interactions": len(interactions)}
    cf_cache = {}
    if grid:
        rows = []
        for n_factors in grid["n_factors"]:
            ids, matrix, support, _ = fit_components(products, interactions, t, n_factors)
            cf_cache[n_factors], _ = rec.cf_similarity(matrix, len(ids), rec.Params(n_factors=n_factors))
            for shrinkage in grid["shrinkage"]:
                sim = rec.hybrid_similarity(cf_cache[n_factors], content, support, rec.Params(shrinkage=shrinkage))
                rows.append({"n_factors": n_factors, "shrinkage": shrinkage, **evaluate(sim, ids, history, targets)})
                print(f"  validation factors={n_factors:<3} λ={shrinkage:<4} NDCG {rows[-1]['ndcg@10']:.4f}  HR {rows[-1]['hit_rate@10']:.4f}")
        result["grid"] = rows
        best = max(rows, key=lambda r: (r["ndcg@10"], r["hit_rate@10"]))
        ids, _, support, popularity = fit_components(products, interactions, t, best["n_factors"])
        sim = rec.hybrid_similarity(cf_cache[best["n_factors"]], content, support, rec.Params(shrinkage=best["shrinkage"]))
        alphas = {a: evaluate(sim, ids, history, targets, popularity=popularity, alpha=a) for a in rec.POPULARITY_GRID}
        best["alpha"] = max(alphas, key=lambda a: alphas[a]["ndcg@10"])
        result["alpha_grid"] = {str(a): v for a, v in alphas.items()}
        print("  validation α :", {a: v["ndcg@10"] for a, v in alphas.items()})
        return result, best
    ids, matrix, support, popularity = fit_components(products, interactions, t, best["n_factors"])
    matrix_density = matrix.nnz / (matrix.shape[0] * matrix.shape[1])
    cf, _ = rec.cf_similarity(matrix, len(ids), rec.Params(n_factors=best["n_factors"]))
    hybrid = rec.hybrid_similarity(cf, content, support, rec.Params(shrinkage=best["shrinkage"]))
    pop_order = [ids[i] for i in np.argsort(-popularity)]
    result["density"] = round(float(matrix_density), 5)
    result["results"] = {
        "popularite (baseline)": evaluate(None, ids, history, targets, popularity_order=pop_order),
        "contenu seul (TF-IDF)": evaluate(content, ids, history, targets),
        "filtrage collaboratif seul (SVD)": evaluate(cf, ids, history, targets),
        "hybride": evaluate(hybrid, ids, history, targets),
        f"hybride + popularite (alpha={best['alpha']}, retenu)": evaluate(hybrid, ids, history, targets, popularity=popularity, alpha=best["alpha"]),
    }
    for k, v in result["results"].items():
        print(f"  TEST {k:<34} HR {v['hit_rate@10']:.4f}  P@10 {v['precision@10']:.4f}  NDCG {v['ndcg@10']:.4f}  couverture {v['coverage']:.3f}")
    return result, None


def bought_together_eval(lines, t):
    invoices = lines.groupby("Invoice").agg(date=("InvoiceDate", "min"), items=("StockCode", lambda s: sorted(set(s))))
    train = [b for b, d in zip(invoices["items"], invoices["date"]) if d < t]
    test = [b for b, d in zip(invoices["items"], invoices["date"]) if t <= d < t + HORIZON]
    rules = rec.bought_together(train, min_count=5, k=5)
    freq = defaultdict(int)
    for b in train:
        for i in b:
            freq[i] += 1
    top = [i for i, _ in sorted(freq.items(), key=lambda x: -x[1])[:6]]
    hits = pop_hits = total = covered = 0
    for basket in test:
        if len(basket) < 2:
            continue
        for a in basket:
            others = set(basket) - {a}
            total += 1
            suggestions = [r[0] for r in rules.get(a, [])[:5]]
            covered += bool(suggestions)
            hits += bool(others & set(suggestions))
            pop_hits += bool(others & set([p for p in top if p != a][:5]))
    return {
        "train_invoices": len(train), "test_invoices": len(test), "rules_for_products": len(rules),
        "association_rules_hit@5": round(hits / max(1, total), 4),
        "popularity_hit@5": round(pop_hits / max(1, total), 4),
        "share_of_items_with_rules": round(covered / max(1, total), 4),
    }


def main():
    lines = pd.read_csv(CLEAN, parse_dates=["InvoiceDate"], dtype={"StockCode": str})
    print("Validation (T = 2011-06-01)")
    validation, best = run_period(lines, pd.Timestamp("2011-06-01"), grid={"n_factors": [32, 64, 128], "shrinkage": [30, 100, 300, 1000, 3000]})
    print("Retenu :", {k: best[k] for k in ("n_factors", "shrinkage", "alpha")})
    print("Test (T = 2011-09-10)")
    test, _ = run_period(lines, pd.Timestamp("2011-09-10"), best=best)
    together = bought_together_eval(lines, pd.Timestamp("2011-09-10"))
    print("Achetés ensemble :", together)
    out = {
        "source": "UCI Online Retail II (nettoyé) — https://archive.ics.uci.edu/dataset/502/online+retail+ii",
        "task": "prédire les NOUVEAUX produits achetés dans les 90 jours (top 10)",
        "validation": validation,
        "best_params": {"n_factors": best["n_factors"], "shrinkage": best["shrinkage"], "alpha": best["alpha"]},
        "test": test,
        "bought_together": together,
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
