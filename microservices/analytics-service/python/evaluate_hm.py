"""
Évaluation « boutique de vêtements » — Kaggle H&M Personalized Fashion Recommendations (nettoyé, adapté Sellio).

1. Recommandation : « quels NOUVEAUX articles ce client achètera-t-il dans les 14 jours ? »
   validation : historique < 2020-08-25 (6 mois), cible 25/08 → 07/09  → choix de λ, α et du nombre de facteurs
   test       : historique < 2020-09-08 (6 mois), cible 08/09 → 22/09  → chiffres rapportés
2. Churn vêtements : mêmes 6 variables que pour Online Retail II + l’âge (présent dans Sellio).
   T1 = 2019-12-24 (entraînement), T2 = 2020-03-24 (sélection), T3 = 2020-06-24 (test), horizon 90 jours.
   Le modèle « Online Retail II » (commerce de cadeaux) est aussi testé tel quel sur ces clients mode.

  python python/data_prep/clean_hm.py
  python python/evaluate_hm.py   → models/hm_metrics.json + models/churn_model_clothes.pkl
"""

from __future__ import annotations

import json
import math
import os
import sys
from collections import defaultdict

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recommender import model as rec  # noqa: E402
import train_churn_real as churn  # noqa: E402

BASE = os.path.dirname(os.path.abspath(__file__))
CLEAN = os.path.join(BASE, "datasets", "clean")
OUT = os.path.join(BASE, "models", "hm_metrics.json")
CLOTHES_MODEL = os.path.join(BASE, "models", "churn_model_clothes.pkl")
K = 10
HISTORY_DAYS = 180
WINDOW_DAYS = 14
MAX_CASES = 2000


# ── Recommandation ─────────────────────────────────────────────────────────────
def setup(tx: pd.DataFrame, products: pd.DataFrame, t: pd.Timestamp) -> dict:
    past = tx[(tx["date"] < t) & (tx["date"] >= t - pd.Timedelta(days=HISTORY_DAYS))]
    future = tx[(tx["date"] >= t) & (tx["date"] < t + pd.Timedelta(days=WINDOW_DAYS))]
    buyers = past.groupby("article_id")["customer"].nunique()
    catalog = set(buyers[buyers >= 10].sort_values(ascending=False).index[:5000])
    past = past[past["article_id"].isin(catalog)]
    meta = products.set_index("id").loc[sorted(catalog)]
    items = [{"id": int(i), "name": r.nom, "category": r.categorie, "subCategory": r.sous_categorie, "couleur": r.couleur,
              "genre": r.genre, "tissu": r.tissu, "coupe": r.coupe, "description": r.description} for i, r in meta.iterrows()]
    interactions = [{"subject": str(c), "productId": int(a), "type": "PURCHASE", "ts": d.isoformat()}
                    for c, a, d in past[["customer", "article_id", "date"]].itertuples(index=False)]
    history = past.groupby("customer")["article_id"].agg(lambda s: s.value_counts().to_dict())
    targets = {}
    for c, arts in future[future["article_id"].isin(catalog)].groupby("customer")["article_id"]:
        if c in history.index:
            new = set(arts) - set(history[c])
            if new:
                targets[c] = new
    targets = dict(list(targets.items())[:MAX_CASES])
    ids = [it["id"] for it in items]
    index = {pid: i for i, pid in enumerate(ids)}
    matrix, _ = rec.interaction_matrix(interactions, index, t.to_pydatetime().replace(tzinfo=rec.timezone.utc), rec.Params())
    return {"ids": ids, "items": items, "history": history, "targets": targets, "matrix": matrix,
            "support": np.asarray((matrix > 0).sum(axis=0)).ravel().astype(float),
            "popularity": np.asarray(matrix.sum(axis=0)).ravel(), "content": rec.content_similarity(items),
            "interactions": len(interactions)}


def run(s: dict, sim=None, alpha=0.0, pop_only=False) -> dict:
    ids, pop = s["ids"], s["popularity"]
    pop_order = [ids[i] for i in np.argsort(-pop)]
    hits = prec = ndcg = 0.0
    seen_all = set()
    for c, truth in s["targets"].items():
        seen = set(s["history"][c])
        if pop_only:
            ranked = [p for p in pop_order if p not in seen][:K]
        else:
            weights = [(p, rec.EVENT_WEIGHTS["PURCHASE"] * math.log1p(n)) for p, n in s["history"][c].items()]
            ranked = rec.recommend_for_history(sim, ids, weights, k=K, exclude=seen, popularity=pop, alpha=alpha)
        seen_all.update(ranked)
        found = [i for i, p in enumerate(ranked) if p in truth]
        hits += bool(found)
        prec += len(found) / K
        ndcg += sum(1 / math.log2(i + 2) for i in found) / sum(1 / math.log2(i + 2) for i in range(min(K, len(truth))))
    n = max(1, len(s["targets"]))
    return {"hit_rate@10": round(hits / n, 4), "precision@10": round(prec / n, 4), "ndcg@10": round(ndcg / n, 4),
            "coverage": round(len(seen_all) / len(ids), 4), "cases": len(s["targets"])}


def recommendation(tx: pd.DataFrame, products: pd.DataFrame) -> dict:
    val = setup(tx, products, pd.Timestamp("2020-08-25"))
    grid = []
    cf_cache = {}
    for nf in (32, 64, 128):
        cf_cache[nf], _ = rec.cf_similarity(val["matrix"], len(val["ids"]), rec.Params(n_factors=nf))
        for lam in rec.SHRINKAGE_GRID:
            sim = rec.hybrid_similarity(cf_cache[nf], val["content"], val["support"], rec.Params(shrinkage=lam))
            for alpha in rec.POPULARITY_GRID:
                r = run(val, sim, alpha=alpha)
                grid.append({"n_factors": nf, "shrinkage": lam, "alpha": alpha, **r})
    best = max(grid, key=lambda g: (g["ndcg@10"], g["hit_rate@10"]))
    print("  validation → retenu :", {k: best[k] for k in ("n_factors", "shrinkage", "alpha", "ndcg@10")})

    test = setup(tx, products, pd.Timestamp("2020-09-08"))
    cf, _ = rec.cf_similarity(test["matrix"], len(test["ids"]), rec.Params(n_factors=best["n_factors"]))
    hybrid = rec.hybrid_similarity(cf, test["content"], test["support"], rec.Params(shrinkage=best["shrinkage"]))
    results = {
        "popularite (baseline)": run(test, pop_only=True),
        "contenu seul (TF-IDF)": run(test, test["content"]),
        "filtrage collaboratif seul (SVD)": run(test, cf),
        "hybride": run(test, hybrid),
        f"hybride + popularite (alpha={best['alpha']}, retenu)": run(test, hybrid, alpha=best["alpha"]),
    }
    for k, v in results.items():
        print(f"  TEST {k:<44} HR {v['hit_rate@10']:.4f}  P@10 {v['precision@10']:.4f}  NDCG {v['ndcg@10']:.4f}  couverture {v['coverage']:.3f}")
    return {"validation_best": {k: best[k] for k in ("n_factors", "shrinkage", "alpha")},
            "validation_grid_top5": sorted(grid, key=lambda g: -g["ndcg@10"])[:5],
            "test": {"articles": len(test["ids"]), "interactions": test["interactions"], "cases": len(test["targets"]),
                     "density": round(float(test["matrix"].nnz / (test["matrix"].shape[0] * test["matrix"].shape[1])), 6),
                     "results": results}}


# ── Churn vêtements ───────────────────────────────────────────────────────────
def churn_clothes(tx: pd.DataFrame, customers: pd.DataFrame) -> dict:
    orders = (tx.assign(amount=tx["price_tnd"] * tx["quantity"])
              .groupby(["customer", "date"], as_index=False)["amount"].sum()
              .rename(columns={"customer": "CustomerID"}))
    orders["Invoice"] = orders["CustomerID"].astype(str) + "-" + orders["date"].dt.strftime("%Y%m%d")
    dates = {"T1": "2019-12-24", "T2": "2020-03-24", "T3": "2020-06-24"}
    ages = customers.set_index("customer")["age"]
    snaps = {}
    for name, d in dates.items():
        snap = churn.build_snapshot(orders, pd.Timestamp(d), currency_factor=1.0)
        snap["age"] = snap["CustomerID"].map(ages).fillna(ages.median())
        snaps[name] = snap
        print(f"  {name} {d} : {len(snap):,} clients, churn {snap['churn'].mean():.1%}")
    features = churn.FEATURES + ["age"]
    train, valid, test = snaps["T1"], snaps["T2"], snaps["T3"]

    def fit_candidates(feats):
        chosen = {}
        for name, model in churn.candidates().items():
            model.steps[0] = (model.steps[0][0], model.steps[0][1].set_params(transformers=[(t[0], t[1], feats) for t in model.steps[0][1].transformers]))
            model.fit(train[feats], train["churn"])
            chosen[name] = churn.scores(valid["churn"], model.predict_proba(valid[feats])[:, 1])
        return chosen

    selection = fit_candidates(features)
    best_name = max(selection, key=lambda k: selection[k]["roc_auc"])
    print("  churn : modèle retenu", best_name)

    def final_model(feats, name):
        model = churn.candidates()[name]
        model.steps[0] = (model.steps[0][0], model.steps[0][1].set_params(transformers=[(t[0], t[1], feats) for t in model.steps[0][1].transformers]))
        full = pd.concat([train, valid])
        return model.fit(full[feats], full["churn"])

    final = final_model(features, best_name)
    without_age = final_model(churn.FEATURES, best_name)
    prob = final.predict_proba(test[features])[:, 1]
    baseline = (test["days_since_last_order"] / (test["days_since_last_order"].max() + 1)).to_numpy()
    retail_model = joblib.load(os.path.join(BASE, "models", "churn_model.pkl"))["pipeline"]
    results = {
        "baseline_recence": churn.scores(test["churn"], baseline),
        "modele_online_retail_applique_tel_quel": churn.scores(test["churn"], retail_model.predict_proba(test[churn.FEATURES])[:, 1]),
        "modele_vetements_sans_age": churn.scores(test["churn"], without_age.predict_proba(test[churn.FEATURES])[:, 1]),
        "modele_vetements_retenu": {"nom": best_name, **churn.scores(test["churn"], prob)},
    }
    for k, v in results.items():
        print(f"  TEST churn {k:<40} AUC {v['roc_auc']:.4f}  rappel {v['recall_churn']:.3f}  précision {v['precision_churn']:.3f}")
    from sklearn.inspection import permutation_importance
    imp = permutation_importance(final, test[features], test["churn"], scoring="roc_auc", n_repeats=5, random_state=42)
    joblib.dump({"pipeline": final, "metadata": {
        "categorical_features": [], "numerical_features": features, "all_features": features, "horizon_days": 90,
        "thresholds": {"high": round(float(np.quantile(prob, 0.70)), 4), "medium": round(float(np.quantile(prob, 0.40)), 4)},
        "trained_on": "Kaggle H&M (nettoyé, canal en ligne), snapshots 2019-12-24 + 2020-03-24"}}, CLOTHES_MODEL)
    return {"snapshots": {k: {"date": dates[k], "clients": int(len(v)), "churn_rate": round(float(v["churn"].mean()), 4)} for k, v in snaps.items()},
            "features": features, "validation_T2": selection, "test_T3": results,
            "permutation_importance_auc": {f: round(float(m), 4) for f, m in sorted(zip(features, imp.importances_mean), key=lambda x: -x[1])},
            "thresholds": {"high": round(float(np.quantile(prob, 0.70)), 4), "medium": round(float(np.quantile(prob, 0.40)), 4)}}


def main():
    tx = pd.read_csv(os.path.join(CLEAN, "hm_transactions_clean.csv.gz"), parse_dates=["date"])
    products = pd.read_csv(os.path.join(CLEAN, "hm_products_sellio.csv.gz")).fillna("")
    customers = pd.read_csv(os.path.join(CLEAN, "hm_customers_clean.csv.gz"))
    print(f"{len(tx):,} achats, {tx['customer'].nunique():,} clients")
    print("Recommandation")
    reco = recommendation(tx, products)
    print("Churn vêtements")
    ch = churn_clothes(tx, customers)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump({"source": "Kaggle — H&M Personalized Fashion Recommendations (nettoyé, adapté Sellio)",
                   "recommendation": reco, "churn": ch}, fh, ensure_ascii=False, indent=2, default=str)


if __name__ == "__main__":
    main()
