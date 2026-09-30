"""
Nettoyage et adaptation au modèle Sellio du jeu « H&M Personalized Fashion Recommendations » (Kaggle, 2022).

Source  : https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations
Contenu : 31,8 M d’achats (sept. 2018 → sept. 2020), 105 542 articles, 1,37 M clients.
Fichiers attendus dans datasets/raw/hm/ : transactions_train, articles, customers (.parquet ou .csv).

  python python/data_prep/clean_hm.py [--sample 16]
    → datasets/clean/hm_transactions_clean.csv.gz   achats en ligne, clients échantillonnés
    → datasets/clean/hm_products_sellio.csv.gz      articles traduits en fiches produit Sellio (fiche vêtement)
    → datasets/clean/hm_customers_clean.csv.gz      âge et statut des clients
    → datasets/clean/hm_cleaning_report.json        chaque étape + couverture des champs Sellio
"""

from __future__ import annotations

import argparse
import json
import os
import re

import numpy as np
import pandas as pd
import pyarrow.compute as pc
import pyarrow.parquet as pq

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(BASE, "datasets", "raw", "hm")
CLEAN = os.path.join(BASE, "datasets", "clean")
REPORT = os.path.join(CLEAN, "hm_cleaning_report.json")

# Prix H&M anonymisés (≈ 0,03) : mis à l’échelle pour qu’un article médian coûte ~50 TND (hypothèse documentée).
TARGET_MEDIAN_PRICE_TND = 50.0

GENRE = {"Ladieswear": "Femme", "Menswear": "Homme", "Baby/Children": "Enfant", "Divided": "Femme", "Sport": "Unisexe"}
COLOURS = {  # colour_group_name → couleurs de base Sellio (data/catalogOptions.js)
    "Black": "Noir", "White": "Blanc", "Off White": "Écru", "Beige": "Beige", "Light Beige": "Beige", "Dark Beige": "Camel",
    "Grey": "Gris", "Light Grey": "Gris clair", "Dark Grey": "Anthracite", "Greyish Beige": "Beige", "Dark Blue": "Bleu marine",
    "Blue": "Bleu", "Light Blue": "Bleu ciel", "Turquoise": "Turquoise", "Dark Turquoise": "Turquoise", "Red": "Rouge",
    "Dark Red": "Bordeaux", "Light Red": "Rouge", "Pink": "Rose", "Light Pink": "Rose poudré", "Dark Pink": "Fuchsia",
    "Green": "Vert", "Dark Green": "Vert", "Light Green": "Vert", "Khaki green": "Kaki", "Greenish Khaki": "Vert olive",
    "Yellow": "Jaune", "Light Yellow": "Jaune", "Dark Yellow": "Moutarde", "Yellowish Brown": "Camel", "Orange": "Orange",
    "Light Orange": "Orange", "Dark Orange": "Orange", "Brown": "Marron", "Yellowish Green": "Vert", "Purple": "Violet",
    "Light Purple": "Lilas", "Dark Purple": "Violet", "Gold": "Doré", "Silver": "Argenté", "Bronze/Copper": "Doré",
}
FABRICS = [  # mot anglais dans detail_desc → tissu Sellio
    ("cashmere", "Cachemire"), ("merino", "Laine mérinos"), ("wool", "Laine"), ("linen", "Lin"), ("silk", "Soie"),
    ("denim", "Denim"), ("corduroy", "Velours côtelé"), ("velvet", "Velours"), ("satin", "Satin"), ("chiffon", "Mousseline"),
    ("lace", "Dentelle"), ("fleece", "Polaire"), ("teddy", "Sherpa"), ("faux fur", "Fausse fourrure"), ("imitation leather", "Simili cuir"),
    ("leather", "Cuir"), ("suede", "Daim"), ("viscose", "Viscose"), ("lyocell", "Lyocell (Tencel)"), ("modal", "Modal"),
    ("polyester", "Polyester"), ("nylon", "Polyamide (Nylon)"), ("sweatshirt fabric", "Molleton"), ("jersey", "Jersey"),
    ("rib-knit", "Tricot côtelé"), ("knit", "Maille"), ("poplin", "Popeline"), ("twill", "Sergé"), ("canvas", "Canvas"),
    ("crêpe", "Crêpe"), ("crepe", "Crêpe"), ("mesh", "Tulle"), ("tulle", "Tulle"), ("cotton", "Coton"),
]
FITS = [("oversized", "Oversize"), ("relaxed", "Relaxed"), ("slim", "Slim"), ("skinny", "Skinny"), ("wide", "Wide leg"),
        ("straight", "Droite"), ("regular", "Regular"), ("fitted", "Ajustée"), ("loose", "Ample"), ("cropped", "Crop"), ("flared", "Évasée")]
SLEEVES = [("sleeveless", "Sans manches"), ("narrow shoulder straps", "Bretelles"), ("shoulder straps", "Bretelles"),
           ("short sleeves", "Manches courtes"), ("3/4-length sleeves", "Manches 3/4"), ("long sleeves", "Manches longues"),
           ("raglan", "Manches raglan"), ("puff sleeves", "Manches bouffantes"), ("balloon sleeves", "Manches ballon")]
NECKS = [("polo-neck", "Col roulé"), ("turtle neck", "Col roulé"), ("stand-up collar", "Col montant"), ("v-neck", "Col V"),
         ("round neck", "Col rond"), ("boat neck", "Col bateau"), ("square neckline", "Col carré"), ("hood", "Capuche"),
         ("polo", "Col polo"), ("collar", "Col chemise")]


def first_match(text: str, table) -> str | None:
    t = (text or "").lower()
    for key, value in table:
        if re.search(r"\b" + re.escape(key) + r"\b", t):
            return value
    return None


def read(name: str, columns=None, filters=None):
    parquet, csv = os.path.join(RAW, f"{name}.parquet"), os.path.join(RAW, f"{name}.csv")
    if os.path.exists(parquet):
        return pq.read_table(parquet, columns=columns, filters=filters)
    import pyarrow.csv as pacsv
    return pacsv.read_csv(csv)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=int, default=16, help="garde 1 client sur N (tirage déterministe sur l’identifiant)")
    args = parser.parse_args()
    os.makedirs(CLEAN, exist_ok=True)
    steps = []

    def step(name, why, before, after):
        steps.append({"etape": name, "raison": why, "lignes_avant": int(before), "lignes_apres": int(after), "supprimees": int(before - after)})
        print(f"{name:<52} {before:>12,} → {after:>12,}  (−{before - after:,})")

    # ── Transactions ────────────────────────────────────────────────────────────
    table = read("transactions_train", columns=["t_dat", "customer_id", "article_id", "price", "sales_channel_id"])
    raw_rows = table.num_rows
    # Échantillon déterministe de clients : dernier caractère hexadécimal de l’identifiant (1 client sur 16).
    keep = pc.equal(pc.utf8_slice_codeunits(table["customer_id"], start=-1), "0") if args.sample == 16 else None
    sampled = table.filter(keep) if keep is not None else table
    tx = sampled.to_pandas()
    step("1. Échantillon de clients", f"1 client sur {args.sample} (identifiant se terminant par 0), pour tenir en mémoire", raw_rows, len(tx))
    profile = {"transactions_brutes": int(raw_rows), "periode": [str(tx["t_dat"].min()), str(tx["t_dat"].max())],
               "canaux": tx["sales_channel_id"].value_counts().to_dict(), "prix_nuls_ou_negatifs": int((tx["price"] <= 0).sum()),
               "lignes_identiques": int(tx.duplicated().sum())}

    n = len(tx); tx = tx[tx["sales_channel_id"] == 2]
    step("2. Achats en magasin retirés", "Sellio est une boutique en ligne : seul le canal web (2) est gardé", n, len(tx))
    n = len(tx); tx = tx[tx["price"] > 0]
    step("3. Prix ≤ 0", "erreurs de caisse", n, len(tx))
    cap = tx["price"].quantile(0.999)
    n = len(tx); tx = tx[tx["price"] <= cap]
    step("4. Prix aberrants (> 99,9e centile)", f"prix > {cap:.4f} (unités H&M)", n, len(tx))
    # Lignes identiques = plusieurs unités du même article le même jour : ce ne sont pas des doublons à supprimer.
    n = len(tx)
    tx = tx.groupby(["t_dat", "customer_id", "article_id", "price"], as_index=False).size().rename(columns={"size": "quantity"})
    step("5. Lignes identiques regroupées en quantité", "même article acheté plusieurs fois le même jour → 1 ligne, quantité > 1", n, len(tx))
    scale = TARGET_MEDIAN_PRICE_TND / tx["price"].median()
    tx["price_tnd"] = (tx["price"] * scale).round(2)
    tx["date"] = pd.to_datetime(tx["t_dat"])

    # ── Clients ─────────────────────────────────────────────────────────────────
    customers = read("customers").to_pandas()
    customers = customers[customers["customer_id"].isin(tx["customer_id"].unique())]
    cprofile = {"clients_echantillon": int(len(customers)), "age_manquant": int(customers["age"].isna().sum()),
                "fashion_news_frequency": customers["fashion_news_frequency"].value_counts(dropna=False).to_dict(),
                "club_member_status": customers["club_member_status"].value_counts(dropna=False).to_dict()}
    customers["fashion_news_frequency"] = customers["fashion_news_frequency"].fillna("NONE").str.upper()  # « None » et « NONE » coexistent
    customers["club_member_status"] = customers["club_member_status"].fillna("INCONNU")
    customers.loc[(customers["age"] < 16) | (customers["age"] > 99), "age"] = np.nan
    customers["age"] = customers["age"].fillna(customers["age"].median())
    customers[["FN", "Active"]] = customers[["FN", "Active"]].fillna(0)

    # Identifiants de 64 caractères → entiers (mémoire ÷ 10).
    codes = {cid: i for i, cid in enumerate(sorted(tx["customer_id"].unique()))}
    tx["customer"] = tx["customer_id"].map(codes)
    customers["customer"] = customers["customer_id"].map(codes)
    tx[["date", "customer", "article_id", "quantity", "price_tnd"]].sort_values("date").to_csv(
        os.path.join(CLEAN, "hm_transactions_clean.csv.gz"), index=False, compression="gzip")
    customers[["customer", "age", "club_member_status", "fashion_news_frequency", "FN", "Active"]].to_csv(
        os.path.join(CLEAN, "hm_customers_clean.csv.gz"), index=False, compression="gzip")

    # ── Articles → fiche produit Sellio ─────────────────────────────────────────
    articles = read("articles").to_pandas()
    articles = articles[articles["article_id"].isin(tx["article_id"].unique())]
    missing_desc = int(articles["detail_desc"].isna().sum())
    desc = articles["detail_desc"].fillna(articles["prod_name"])
    products = pd.DataFrame({
        "id": articles["article_id"],
        "nom": articles["prod_name"].str.strip(),
        "description": desc,
        "categorie": articles["product_group_name"],
        "sous_categorie": articles["product_type_name"],
        "couleur": articles["colour_group_name"].map(COLOURS),
        "genre": articles["index_group_name"].map(GENRE),
        "tissu": desc.map(lambda d: first_match(d, FABRICS)),
        "coupe": desc.map(lambda d: first_match(d, FITS)),
        "manches": desc.map(lambda d: first_match(d, SLEEVES)),
        "col": desc.map(lambda d: first_match(d, NECKS)),
        "saison": None,
        "tailles": None,
    })
    products.to_csv(os.path.join(CLEAN, "hm_products_sellio.csv.gz"), index=False, compression="gzip")
    coverage = {c: round(float(products[c].notna().mean()), 4) for c in ["nom", "description", "categorie", "sous_categorie", "couleur", "genre", "tissu", "coupe", "manches", "col", "saison", "tailles"]}

    summary = {
        "source": "Kaggle — H&M Personalized Fashion Recommendations (2022)",
        "url": "https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations",
        "profil_transactions": profile, "profil_clients": cprofile, "articles_sans_description": missing_desc,
        "etapes": steps,
        "prix": {"facteur_echelle": round(float(scale), 2), "hypothese": f"article médian ≈ {TARGET_MEDIAN_PRICE_TND:.0f} TND"},
        "couverture_fiche_vetement_sellio": coverage,
        "resultat": {"achats": int(len(tx)), "clients": int(tx["customer"].nunique()), "articles": int(len(products)),
                     "periode": [str(tx["date"].min().date()), str(tx["date"].max().date())]},
    }
    with open(REPORT, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=2, default=str)
    print("Couverture des champs Sellio :", coverage)
    print("Résultat :", summary["resultat"])


if __name__ == "__main__":
    main()
