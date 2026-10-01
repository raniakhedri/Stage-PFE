# Rapport PFE — Rania Khedhri (Sellio)

LaTeX report built on the same structure as Yosr's report (`Rapport_PFE_Yosr`): the same packages, chapter header, and per-sprint layout (backlog → use-case diagram → web services → textual description → system sequence diagram → object sequence diagram → implementation).

## Compiling

LaTeX is not installed on this PC, so the report has **not been compiled yet**. The simplest path is to zip this folder and import it into **Overleaf** (compiler: pdfLaTeX, main file: `main.tex`). Locally, run `pdflatex main` → `bibtex main` → `pdflatex main` twice.

Every missing image shows up as a framed placeholder carrying its filename (the `\img` macro), so the report compiles even before you add the screenshots.

## Structure

| File | Content |
|---|---|
| `main.tex` | Packages, front matter, Introduction Générale |
| `PageDeGarde.tex` / `Resume.tex` | Provisional cover page and back cover. They are replaced automatically if you add `firstpage.pdf`, `secondpage.pdf` or `lastpage.pdf` (the official ESPRIT templates). |
| `chapter1.tex` | Cadre général: Antigone, problem statement, existing solutions (Shopify / WooCommerce / Wix), Scrum |
| `chapter2.tex` | Requirements, actors, non-functional requirements (ISO 25010), microservices architecture and PostgreSQL choice, product backlog, 11-sprint plan (187 pts) |
| `chapter3.tex` | Release 1: Sprint 1 (microservices, JWT, roles) and Sprint 2 (multi-shop, KYC, Sellio console) |
| `chapter4.tex` | Release 2: Sprint 3 (catalog, attributes) and Sprint 4 (Minimal / Bold / Luxury templates, theme editor) |
| `chapter5.tex` | Release 3: Sprint 5 (cart, checkout, Stripe) and Sprint 6 (orders, returns, VAT and shipping, reviews) |
| `chapter6.tex` | Release 4: Sprint 7 (promotions, banners, Brevo) and Sprint 8 (loyalty) |
| `chapter7.tex` | Release 5: Sprint 9, the Decart virtual try-on (architecture, comparison of solutions, configuration) |
| `chapter8.tex` | Release 6: Sprints 10–11, ML (datasets, cleaning, protocol, recommendation, K-Means, churn, results) |
| `Conclusion et perspective.tex`, `Remerciments.tex`, `Dedicace.tex`, `References.bib` | Closing chapter, acknowledgements, dedication, bibliography |
| `uml/*.puml` | PlantUML sources of every diagram |

## Placeholders to fill in

- Academic supervisor: `[Nom de l'encadrant(e) ESPRIT]` appears in `PageDeGarde.tex` and `Remerciments.tex`.
- Scrum Master: `[Nom du Scrum Master]` in `chapter1.tex`.
- Hardware (model, CPU, RAM, storage) in `chapter2.tex`.
- Dedication: the text in `Dedicace.tex` is a suggestion; personalise it.

## Images

**Already generated or copied (50):** all the use-case, sequence, class and architecture diagrams (from `uml/`), the Antigone logo, the Scrum figure, and the ESPRIT, React, Spring Boot, PostgreSQL, Java and VS Code logos.

To regenerate the diagrams after editing a `.puml` file:
```
cd uml
java -jar ../../docs/uml/plantuml.jar -charset UTF-8 -tpng -o ../Image *.puml
```

**Still to add in `Image/`:**

- **Logos (PNG):** `decart.png`, `github.png`, `javascript.png`, `maven.png`, `plantuml.png`, `python.png`, `scikitlearn.png`, `springcloud.png`, `sql.png`, `stripe.png`, `tailwind.png`
- **Screenshots of the app**, in dark theme where it applies. Use real test data and never show a real card or ID document:
  - Sprint 1: `ui_login.png`, `ui_roles.png`, `ui_clients.png`
  - Sprint 2: `ui_sellio_home.png`, `ui_nouvelle_boutique.png`, `ui_kyc_carte_identite.png`, `ui_console_sellio.png`, `ui_revue_dossier.png`
  - Sprint 3: `ui_produits.png`, `ui_attributs.png`, `ui_categories.png`
  - Sprint 4: `ui_vitrine_minimal.png`, `ui_vitrine_bold.png`, `ui_vitrine_luxury.png` (same shop, `?preview=minimal|bold|luxury`), `ui_editeur_theme.png`, `ui_fiche_produit.png`
  - Sprint 5: `ui_panier.png`, `ui_checkout.png`, `ui_paiement_stripe.png` (test card 4242…)
  - Sprint 6: `ui_commandes.png`, `ui_dashboard.png`, `ui_retours.png`, `ui_tva_livraison.png`, `ui_avis.png`
  - Sprint 7: `ui_promotions.png`, `ui_bannieres.png`, `ui_email_marketing.png`
  - Sprint 8: `ui_fidelite_config.png`, `ui_fidelite_niveaux.png`, `ui_fidelite_client.png`
  - Sprint 9: `ui_tryon_bouton.png`, `ui_tryon_session.png`
  - Sprints 10–11: `ui_reco_fiche.png`, `ui_reco_panier.png`, `ui_comportement.png`, `ui_churn.png`

## Numbers cited in chapter 8

Every figure comes from `microservices/analytics-service/python/models/*.json` and from the reports in `python/datasets/clean/*_report.json`. If you retrain the models, update the tables `tab:resultats-reco`, `tab:segments` and `tab:resultats-churn`.
