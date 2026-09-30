"""
Nettoyage du jeu « Online Retail II » (UCI Machine Learning Repository).

Source   : https://archive.ics.uci.edu/dataset/502/online+retail+ii
Auteur   : Daqing Chen (2019), London South Bank University — licence CC BY 4.0
Contenu  : toutes les transactions d’un e-commerçant britannique, 01/12/2009 → 09/12/2011
           (≈ 1,07 million de lignes de factures, 2 feuilles Excel).

  python python/data_prep/clean_online_retail.py
    → datasets/clean/online_retail_clean.csv.gz   (lignes de vente propres)
    → datasets/clean/online_retail_cleaning_report.json   (chaque étape, avant/après)
"""

from __future__ import annotations

import json
import os

import pandas as pd

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_XLSX = os.path.join(BASE, "datasets", "raw", "online_retail_II.xlsx")
RAW_CACHE = os.path.join(BASE, "datasets", "raw", "online_retail_II_raw.csv.gz")
CLEAN_DIR = os.path.join(BASE, "datasets", "clean")
OUT = os.path.join(CLEAN_DIR, "online_retail_clean.csv.gz")
REPORT = os.path.join(CLEAN_DIR, "online_retail_cleaning_report.json")

# Codes article qui ne sont pas des produits : frais de port, remises, ajustements comptables, tests…
NON_PRODUCT_CODES = {
    "POST", "DOT", "D", "M", "m", "C2", "CRUK", "PADS", "BANK CHARGES", "AMAZONFEE", "S", "B",
    "ADJUST", "ADJUST2", "TEST001", "TEST002", "GIFT",
}


def load_raw() -> pd.DataFrame:
    """Lit les deux feuilles Excel une fois (lent) puis réutilise un cache CSV."""
    if os.path.exists(RAW_CACHE):
        return pd.read_csv(RAW_CACHE, dtype={"Invoice": str, "StockCode": str, "Description": str}, parse_dates=["InvoiceDate"])
    sheets = pd.read_excel(RAW_XLSX, sheet_name=None, dtype={"Invoice": str, "StockCode": str, "Description": str})
    df = pd.concat(sheets.values(), ignore_index=True)
    df.to_csv(RAW_CACHE, index=False, compression="gzip")
    return df


def main() -> None:
    os.makedirs(CLEAN_DIR, exist_ok=True)
    df = load_raw()
    steps = []

    def step(name: str, why: str, before: int, frame: pd.DataFrame) -> pd.DataFrame:
        steps.append({"etape": name, "raison": why, "lignes_avant": before, "lignes_apres": len(frame), "supprimees": before - len(frame)})
        print(f"{name:<45} {before:>9,} → {len(frame):>9,}  (−{before - len(frame):,})")
        return frame

    profile = {
        "lignes_brutes": int(len(df)),
        "colonnes": list(df.columns),
        "valeurs_manquantes": {c: int(v) for c, v in df.isna().sum().items() if v},
        "periode": [str(df["InvoiceDate"].min()), str(df["InvoiceDate"].max())],
        "factures_annulees_C": int(df["Invoice"].astype(str).str.startswith("C").sum()),
        "quantites_negatives": int((df["Quantity"] <= 0).sum()),
        "prix_negatifs_ou_nuls": int((df["Price"] <= 0).sum()),
        "doublons_exacts": int(df.duplicated().sum()),
    }
    print("Profil brut :", json.dumps(profile, ensure_ascii=False, default=str, indent=1))

    # 1. Les deux feuilles se recouvrent (décembre 2010) et certaines lignes sont saisies deux fois.
    n = len(df); df = step("1. Doublons exacts", "recouvrement des 2 feuilles Excel + double saisie", n, df.drop_duplicates())

    # 2. Factures d’annulation (préfixe C) et régularisations comptables (préfixe A).
    n = len(df)
    inv = df["Invoice"].astype(str)
    df = step("2. Annulations (C) et ajustements (A)", "pas des ventes ; les annulations sont aussi utilisées pour le taux de retour", n,
              df[~inv.str.startswith(("C", "A"))])

    # 3. Quantités ≤ 0 restantes et prix ≤ 0 (échantillons gratuits, casse, erreurs de saisie).
    n = len(df); df = step("3. Quantité ≤ 0 ou prix ≤ 0", "retours non préfixés, dons, erreurs de saisie", n, df[(df["Quantity"] > 0) & (df["Price"] > 0)])

    # 4. Lignes qui ne sont pas des produits.
    n = len(df)
    code = df["StockCode"].astype(str).str.strip()
    is_product = ~code.isin(NON_PRODUCT_CODES) & ~code.str.upper().str.startswith(("TEST", "GIFT_", "BANK", "AMAZON")) & code.str.match(r"^\d{4,5}[A-Za-z]{0,2}\d?$")
    df = step("4. Codes non-produits", "frais de port (POST), remises (D), manuels (M), frais bancaires, tests", n, df[is_product])

    # 5. Client inconnu : inutilisable pour le churn et la personnalisation.
    n = len(df); df = step("5. Client inconnu (Customer ID vide)", "achats anonymes : aucun historique à rattacher", n, df.dropna(subset=["Customer ID"]))

    # 6. Descriptions : espaces, casse, et description vide → description la plus fréquente du même code.
    df["StockCode"] = df["StockCode"].astype(str).str.strip().str.upper()
    df["Description"] = df["Description"].astype(str).str.strip().str.upper().str.replace(r"\s+", " ", regex=True)
    df.loc[df["Description"].isin(["", "NAN", "?", "??"]) | df["Description"].str.contains(r"^\?|DAMAGED|WET|LOST|MISSING|FOUND|CHECK", regex=True), "Description"] = pd.NA
    canonical = df.dropna(subset=["Description"]).groupby("StockCode")["Description"].agg(lambda s: s.value_counts().index[0])
    df["Description"] = df["StockCode"].map(canonical)
    n = len(df); df = step("6. Description manquante / annotation interne", "« damaged », « wet », « ? »… remplacées par le libellé du code, sinon supprimées", n, df.dropna(subset=["Description"]))

    # 7. Valeurs aberrantes : quantités ou prix extrêmes (ex. 80 995 unités saisies puis annulées).
    n = len(df)
    q_cap = df["Quantity"].quantile(0.999)
    p_cap = df["Price"].quantile(0.999)
    df = step("7. Valeurs aberrantes (> 99,9e centile)", f"quantité > {q_cap:.0f} ou prix > {p_cap:.2f} £", n, df[(df["Quantity"] <= q_cap) & (df["Price"] <= p_cap)])

    df["Customer ID"] = df["Customer ID"].astype(int)
    df["LineTotal"] = (df["Quantity"] * df["Price"]).round(2)
    df = df.rename(columns={"Customer ID": "CustomerID"})[
        ["Invoice", "InvoiceDate", "CustomerID", "Country", "StockCode", "Description", "Quantity", "Price", "LineTotal"]
    ].sort_values("InvoiceDate")
    df.to_csv(OUT, index=False, compression="gzip")

    summary = {
        "source": "UCI Machine Learning Repository — Online Retail II (id 502), CC BY 4.0",
        "url": "https://archive.ics.uci.edu/dataset/502/online+retail+ii",
        "profil_brut": profile,
        "etapes": steps,
        "resultat": {
            "lignes": int(len(df)),
            "factures": int(df["Invoice"].nunique()),
            "clients": int(df["CustomerID"].nunique()),
            "produits": int(df["StockCode"].nunique()),
            "pays": int(df["Country"].nunique()),
            "periode": [str(df["InvoiceDate"].min()), str(df["InvoiceDate"].max())],
            "part_conservee": round(len(df) / profile["lignes_brutes"], 4),
        },
    }
    with open(REPORT, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=2, default=str)
    print("Résultat :", summary["resultat"])


if __name__ == "__main__":
    main()
