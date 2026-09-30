"""
Churn model trained on real customers — UCI « Online Retail II » (après nettoyage).

Tâche     : un client ayant déjà acheté ne passera-t-il AUCUNE commande dans les 90 jours ?
Variables : uniquement celles que le service Java calcule aussi pour les clients Sellio
            (FeatureExtractionService), pour que le modèle serve tel quel en production.
Protocole : validation TEMPORELLE (jamais de mélange passé/futur)
            T1 = 2011-03-01 → entraînement des candidats
            T2 = 2011-06-01 → choix du modèle et des hyper-paramètres
            T3 = 2011-09-10 → test final (le modèle retenu est ré-entraîné sur T1+T2)
            T3 + 90 j = 2011-12-09 = fin des données.

  python python/data_prep/clean_online_retail.py   (une fois)
  python python/train_churn_real.py
    → models/churn_model.pkl, models/metrics.json, datasets/clean/churn_snapshots.csv
"""

from __future__ import annotations

import json
import os
import shutil

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, average_precision_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler

BASE = os.path.dirname(os.path.abspath(__file__))
CLEAN = os.path.join(BASE, "datasets", "clean", "online_retail_clean.csv.gz")
SNAPSHOTS_OUT = os.path.join(BASE, "datasets", "clean", "churn_snapshots.csv")
MODEL_DIR = os.path.join(BASE, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "churn_model.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

HORIZON = 90
GBP_TO_TND = 3.9  # taux approximatif : les montants sont exprimés dans la devise des boutiques Sellio
SNAPSHOTS = {"T1": "2011-03-01", "T2": "2011-06-01", "T3": "2011-09-10"}
FEATURES = ["tenure_days", "total_orders", "total_spent", "avg_order_value", "order_frequency", "days_since_last_order"]


def build_snapshot(orders: pd.DataFrame, t: pd.Timestamp, currency_factor: float = GBP_TO_TND) -> pd.DataFrame:
    """Variables calculées avec l’historique STRICTEMENT antérieur à t ; label = aucun achat dans ]t, t+90j]."""
    past = orders[orders["date"] < t]
    future = orders[(orders["date"] >= t) & (orders["date"] < t + pd.Timedelta(days=HORIZON))]
    g = past.groupby("CustomerID")
    snap = pd.DataFrame({
        "first": g["date"].min(),
        "last": g["date"].max(),
        "total_orders": g["Invoice"].nunique(),
        "total_spent": g["amount"].sum() * currency_factor,
    })
    snap["tenure_days"] = (t - snap["first"]).dt.days
    snap["avg_order_value"] = snap["total_spent"] / snap["total_orders"]
    # Même définition que le service Java : commandes par mois d’ancienneté (au moins 1 mois).
    snap["order_frequency"] = snap["total_orders"] / np.maximum(snap["tenure_days"] / 30.0, 1.0)
    snap["days_since_last_order"] = (t - snap["last"]).dt.days
    snap["churn"] = (~snap.index.isin(future["CustomerID"].unique())).astype(int)
    snap["snapshot"] = t.date().isoformat()
    return snap.reset_index()[["CustomerID", "snapshot", *FEATURES, "churn"]]


def scores(y, prob, threshold=0.5) -> dict:
    pred = (prob >= threshold).astype(int)
    return {
        "roc_auc": round(float(roc_auc_score(y, prob)), 4),
        "pr_auc": round(float(average_precision_score(y, prob)), 4),
        "accuracy": round(float(accuracy_score(y, pred)), 4),
        "precision_churn": round(float(precision_score(y, pred, zero_division=0)), 4),
        "recall_churn": round(float(recall_score(y, pred, zero_division=0)), 4),
        "f1_churn": round(float(f1_score(y, pred, zero_division=0)), 4),
    }


def candidates() -> dict:
    pre_linear = ColumnTransformer([("num", Pipeline([("log", FunctionTransformer(np.log1p)), ("scale", StandardScaler())]), FEATURES)])
    passthrough = ColumnTransformer([("num", "passthrough", FEATURES)])
    models = {
        "regression_logistique": Pipeline([("pre", pre_linear), ("model", LogisticRegression(max_iter=1000, class_weight="balanced"))]),
    }
    for depth in (6, 10, 16):
        for leaf in (5, 20):
            models[f"random_forest(d={depth},leaf={leaf})"] = Pipeline([("preprocessor", passthrough), ("model", RandomForestClassifier(
                n_estimators=300, max_depth=depth, min_samples_leaf=leaf, class_weight="balanced", n_jobs=-1, random_state=42))])
    for lr in (0.05, 0.1):
        models[f"gradient_boosting(lr={lr})"] = Pipeline([("preprocessor", passthrough), ("model", HistGradientBoostingClassifier(
            learning_rate=lr, max_iter=300, max_leaf_nodes=15, l2_regularization=1.0, class_weight="balanced", random_state=42))])
    return models


def main() -> None:
    lines = pd.read_csv(CLEAN, parse_dates=["InvoiceDate"])
    orders = (lines.groupby(["Invoice", "CustomerID"], as_index=False)
              .agg(date=("InvoiceDate", "min"), amount=("LineTotal", "sum")))
    snaps = {name: build_snapshot(orders, pd.Timestamp(day)) for name, day in SNAPSHOTS.items()}
    pd.concat(snaps.values()).to_csv(SNAPSHOTS_OUT, index=False)
    for name, s in snaps.items():
        print(f"{name} {SNAPSHOTS[name]} : {len(s):,} clients, churn {s['churn'].mean():.1%}")

    train, valid, test = snaps["T1"], snaps["T2"], snaps["T3"]

    # Sélection sur T2 uniquement.
    selection = {}
    for name, model in candidates().items():
        model.fit(train[FEATURES], train["churn"])
        selection[name] = scores(valid["churn"], model.predict_proba(valid[FEATURES])[:, 1])
        print(f"  validation {name:<34} AUC {selection[name]['roc_auc']:.4f}  PR-AUC {selection[name]['pr_auc']:.4f}")
    best_name = max(selection, key=lambda k: selection[k]["roc_auc"])
    print("Modèle retenu :", best_name)

    # Test final : le modèle retenu est ré-entraîné sur T1+T2 et évalué une seule fois sur T3.
    train_full = pd.concat([train, valid])
    final = candidates()[best_name].fit(train_full[FEATURES], train_full["churn"])
    prob = final.predict_proba(test[FEATURES])[:, 1]
    baseline = (test["days_since_last_order"] / (test["days_since_last_order"].max() + 1)).to_numpy()
    logit = candidates()["regression_logistique"].fit(train_full[FEATURES], train_full["churn"])
    results = {
        "baseline_recence": scores(test["churn"], baseline),
        "regression_logistique": scores(test["churn"], logit.predict_proba(test[FEATURES])[:, 1]),
        "modele_retenu": {"nom": best_name, **scores(test["churn"], prob)},
    }
    for k, v in results.items():
        print(f"TEST {k:<24} {v}")

    # Importance par permutation (plus fiable que l’impureté pour des variables corrélées comme ici).
    from sklearn.inspection import permutation_importance
    imp = permutation_importance(final, test[FEATURES], test["churn"], scoring="roc_auc", n_repeats=10, random_state=42)
    importances = {f: round(float(m), 4) for f, m in sorted(zip(FEATURES, imp.importances_mean), key=lambda x: -x[1])}

    # Bandes de risque utilisées par le backoffice : quantiles des probabilités prédites sur T3.
    high_cut = float(np.quantile(prob, 0.70))
    medium_cut = float(np.quantile(prob, 0.40))

    os.makedirs(MODEL_DIR, exist_ok=True)
    if os.path.exists(MODEL_PATH):
        legacy = os.path.join(MODEL_DIR, "legacy_synthetic")
        os.makedirs(legacy, exist_ok=True)
        for f in (MODEL_PATH, METRICS_PATH):
            if os.path.exists(f) and not os.path.exists(os.path.join(legacy, os.path.basename(f))):
                shutil.copy(f, legacy)
    joblib.dump({
        "pipeline": final,
        "metadata": {"categorical_features": [], "numerical_features": FEATURES, "all_features": FEATURES,
                     "horizon_days": HORIZON, "thresholds": {"high": round(high_cut, 4), "medium": round(medium_cut, 4)},
                     "trained_on": "UCI Online Retail II (nettoyé), snapshots 2011-03-01 + 2011-06-01"},
    }, MODEL_PATH)

    metrics = {
        "source": "UCI Online Retail II — https://archive.ics.uci.edu/dataset/502/online+retail+ii (CC BY 4.0)",
        "horizon_days": HORIZON,
        "label": "aucune commande dans les 90 jours suivant la date d'observation (clients ayant déjà acheté)",
        "protocol": "temporel : entraînement T1, sélection T2, test T3 (modèle final ré-entraîné sur T1+T2)",
        "snapshots": {k: {"date": SNAPSHOTS[k], "clients": int(len(v)), "churn_rate": round(float(v["churn"].mean()), 4)} for k, v in snaps.items()},
        "features": FEATURES,
        "gbp_to_tnd": GBP_TO_TND,
        "validation_T2": selection,
        "test_T3": results,
        "permutation_importance_auc": importances,
        "thresholds": {"high": round(high_cut, 4), "medium": round(medium_cut, 4)},
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, ensure_ascii=False, indent=2)
    print("Importances :", importances)
    print("Seuils risque :", metrics["thresholds"])


if __name__ == "__main__":
    main()
