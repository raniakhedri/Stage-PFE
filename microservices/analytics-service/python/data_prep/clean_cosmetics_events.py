"""
Nettoyage du jeu « eCommerce Events History in Cosmetics Shop » (Kaggle).

Source  : https://www.kaggle.com/datasets/mkechinov/ecommerce-events-history-in-cosmetics-shop
Auteur  : Michael Kechinov, données ouvertes du projet REES46 (https://rees46.com)
Contenu : ~20 millions d’événements d’une boutique de cosmétiques en ligne, oct. 2019 → fév. 2020
          (un fichier CSV par mois : 2019-Oct.csv, 2019-Nov.csv, 2019-Dec.csv, 2020-Jan.csv, 2020-Feb.csv).
Colonnes : event_time, event_type (view, cart, remove_from_cart, purchase), product_id, category_id,
          category_code, brand, price, user_id, user_session

Déposer un ou plusieurs de ces CSV dans datasets/raw/cosmetics/ puis :
  python python/data_prep/clean_cosmetics_events.py [--max-users 20000]
    → datasets/clean/cosmetics_events_clean.csv.gz
    → datasets/clean/cosmetics_cleaning_report.json
"""

from __future__ import annotations

import argparse
import glob
import json
import os

import numpy as np
import pandas as pd

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE, "datasets", "raw", "cosmetics")
CLEAN_DIR = os.path.join(BASE, "datasets", "clean")
OUT = os.path.join(CLEAN_DIR, "cosmetics_events_clean.csv.gz")
REPORT = os.path.join(CLEAN_DIR, "cosmetics_cleaning_report.json")

TYPE_MAP = {"view": "VIEW_PRODUCT", "cart": "ADD_TO_CART", "remove_from_cart": "REMOVE_FROM_CART", "purchase": "PURCHASE"}
# Au-delà, ce n’est plus un humain : robots, scrapers, tests de charge.
BOT_EVENTS_PER_DAY = 500
BOT_EVENTS_PER_MINUTE = 60


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-users", type=int, default=20000, help="échantillon d’utilisateurs (0 = tous)")
    args = parser.parse_args()

    files = sorted(glob.glob(os.path.join(RAW_DIR, "*.csv")))
    if not files:
        raise SystemExit(f"Aucun CSV dans {RAW_DIR}. Téléchargez le jeu Kaggle (voir l’en-tête de ce script).")
    df = pd.concat((pd.read_csv(f, dtype={"category_code": str, "brand": str, "user_session": str}) for f in files), ignore_index=True)
    steps = []

    def step(name, why, before, frame):
        steps.append({"etape": name, "raison": why, "lignes_avant": int(before), "lignes_apres": int(len(frame)), "supprimees": int(before - len(frame))})
        print(f"{name:<48} {before:>11,} → {len(frame):>11,}  (−{before - len(frame):,})")
        return frame

    profile = {
        "fichiers": [os.path.basename(f) for f in files],
        "lignes_brutes": int(len(df)),
        "valeurs_manquantes": {c: int(v) for c, v in df.isna().sum().items() if v},
        "types": df["event_type"].value_counts().to_dict(),
        "prix_negatifs_ou_nuls": int((df["price"] <= 0).sum()),
        "doublons_exacts": int(df.duplicated().sum()),
        "utilisateurs": int(df["user_id"].nunique()),
    }
    print(json.dumps(profile, ensure_ascii=False, indent=1))

    df["event_time"] = pd.to_datetime(df["event_time"].str.replace(" UTC", "", regex=False), errors="coerce", utc=True)
    n = len(df); df = step("1. Date illisible", "horodatage corrompu", n, df.dropna(subset=["event_time"]))
    n = len(df); df = step("2. Doublons exacts", "même événement enregistré plusieurs fois (double clic, rejeu du tracker)", n, df.drop_duplicates())
    n = len(df); df = step("3. Type d’événement inconnu", "hors view/cart/remove_from_cart/purchase", n, df[df["event_type"].isin(TYPE_MAP)])
    n = len(df); df = step("4. Prix ≤ 0", "articles cadeaux, erreurs de catalogue", n, df[df["price"] > 0])
    n = len(df); df = step("5. Session manquante", "impossible de reconstituer la visite", n, df.dropna(subset=["user_session"]))

    # 6. Robots : trop d’événements par jour, ou rafales à la minute.
    per_day = df.groupby([df["user_id"], df["event_time"].dt.date]).size()
    per_min = df.groupby([df["user_id"], df["event_time"].dt.floor("min")]).size()
    bots = set(per_day[per_day > BOT_EVENTS_PER_DAY].index.get_level_values(0)) | set(per_min[per_min > BOT_EVENTS_PER_MINUTE].index.get_level_values(0))
    n = len(df); df = step("6. Robots", f"> {BOT_EVENTS_PER_DAY} événements/jour ou > {BOT_EVENTS_PER_MINUTE}/minute ({len(bots)} comptes)", n, df[~df["user_id"].isin(bots)])

    # 7. Prix aberrants par produit (erreurs de saisie ponctuelles) : écart > 5× la médiane du produit.
    median = df.groupby("product_id")["price"].transform("median")
    n = len(df); df = step("7. Prix aberrant pour le produit", "prix > 5× ou < 1/5 de la médiane du même produit", n, df[(df["price"] <= 5 * median) & (df["price"] >= median / 5)])

    # 8. Marque / catégorie : normalisation, valeurs manquantes explicites (pas de suppression).
    df["brand"] = df["brand"].fillna("inconnue").str.strip().str.lower()
    df["category_code"] = df["category_code"].fillna("").str.strip().str.lower()

    if args.max_users and df["user_id"].nunique() > args.max_users:
        rng = np.random.default_rng(42)
        keep = rng.choice(df["user_id"].unique(), size=args.max_users, replace=False)
        n = len(df); df = step("9. Échantillon d’utilisateurs", f"{args.max_users:,} utilisateurs tirés au hasard (graine 42) pour tenir en mémoire", n, df[df["user_id"].isin(keep)])

    df["type"] = df["event_type"].map(TYPE_MAP)
    df = df.sort_values("event_time")[["event_time", "type", "product_id", "category_id", "category_code", "brand", "price", "user_id", "user_session"]]
    os.makedirs(CLEAN_DIR, exist_ok=True)
    df.to_csv(OUT, index=False, compression="gzip")
    summary = {
        "source": "Kaggle — eCommerce Events History in Cosmetics Shop (mkechinov / REES46)",
        "url": "https://www.kaggle.com/datasets/mkechinov/ecommerce-events-history-in-cosmetics-shop",
        "profil_brut": profile,
        "etapes": steps,
        "resultat": {
            "evenements": int(len(df)), "utilisateurs": int(df["user_id"].nunique()), "sessions": int(df["user_session"].nunique()),
            "produits": int(df["product_id"].nunique()), "types": df["type"].value_counts().to_dict(),
            "periode": [str(df["event_time"].min()), str(df["event_time"].max())],
        },
    }
    with open(REPORT, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=2, default=str)
    print("Résultat :", summary["resultat"])


if __name__ == "__main__":
    main()
