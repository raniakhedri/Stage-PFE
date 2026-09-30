> **Mise à jour :** le modèle de churn en production est désormais entraîné sur des données réelles
> (UCI Online Retail II, `train_churn_real.py`). La version décrite ci-dessous (données simulées,
> `train.py`) est archivée dans `models/legacy_synthetic/`. Documentation à jour : [`README_ML.md`](../../../README_ML.md).

# NaturEssence — Churn Prediction ML Module

> **Analytics Service** · Port 8085 · `microservices/analytics-service`

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Dataset](#2-dataset)
3. [Features](#3-features)
4. [Model Choice & Rationale](#4-model-choice--rationale)
5. [Preprocessing Pipeline](#5-preprocessing-pipeline)
6. [Performance Results](#6-performance-results)
7. [Feature Importance Analysis](#7-feature-importance-analysis)
8. [Architecture & Integration](#8-architecture--integration)
9. [API Reference](#9-api-reference)
10. [How to Run](#10-how-to-run)
11. [Design Decisions & Lessons Learned](#11-design-decisions--lessons-learned)

---

## 1. Problem Statement

**Customer churn** is the event where an existing buyer stops purchasing.

NaturEssence retains customers at a much lower cost than acquiring new ones.
The analytics module estimates, for each buyer, the probability that they will
place **no order in the next 90 days**, so marketing can target at-risk profiles
(loyalty bonus, reactivation coupon, personal follow-up).

**Task:** binary classification  
**Positive class:** churn within a 90-day horizon  
**Eligible population:** customers with at least one completed purchase at the
observation date *T* (prospects without a first order are out of scope).

---

## 2. Dataset & labelling protocol

| Property | Value |
|---|---|
| File | `datasets/naturessence_churn_dataset.csv` |
| Unit of analysis | One row = one customer at snapshot *T* |
| Horizon | 90 days after *T* |
| Label | 1 if zero orders in *(T, T+90]* ; 0 otherwise |

### Why this label is valid

Features are computed **only from information known at T**. The label is
**future** inactivity after T. That temporal split is the standard way to
avoid leakage in CRM models (the model cannot “see” the orders it is asked
to predict).

Customers with no purchase before T are excluded: they are not churners,
they have never been activated.

---

## 3. Features

The model uses **17 input features** (3 categorical + 14 numerical), all
measured at the observation date *T*.

### Demographic
| Feature | Type | Description |
|---|---|---|
| `age` | int | Customer age in years |
| `gender` | cat | `Male` / `Female` / `Other` |
| `city` | cat | City of residence |
| `gouvernorat` | cat | Tunisian governorate |

### Account lifecycle
| Feature | Type | Description |
|---|---|---|
| `tenure_days` | int | Days since account creation |
| `segment_id` | int | Loyalty tier (1=Nouveau, 2=Fidèle, 3=VIP, 4=Inactif) |
| `loyalty_points` | int | Accumulated loyalty points |

### Order behaviour
| Feature | Type | Description |
|---|---|---|
| `total_orders` | int | Total number of confirmed orders |
| `total_spent` | float | Total amount spent (TND) |
| `avg_order_value` | float | Average order value (TND) |
| `order_frequency` | float | Orders per calendar month over account lifetime |
| `days_since_last_order` | int | Recency: days since the last eligible purchase at *T* |

### Engagement
| Feature | Type | Description |
|---|---|---|
| `days_since_last_login` | int | Days elapsed since last platform login |
| `review_count` | int | Number of product reviews written |
| `avg_rating` | float | Average rating given (0.0 if no reviews) |

### Coupon / discount usage
| Feature | Type | Description |
|---|---|---|
| `coupon_usage_count` | int | Number of orders that used a coupon code |
| `discount_user_ratio` | float | `coupon_usage_count / total_orders` |

---

## 4. Model Choice & Rationale

### Chosen model: Random Forest Classifier

```
sklearn.ensemble.RandomForestClassifier
  n_estimators      = 300
  max_depth         = 16
  min_samples_split = 8
  min_samples_leaf  = 4
  class_weight      = "balanced"
  random_state      = 42
```

### Why Random Forest?

| Criterion | Random Forest | Logistic Regression | XGBoost |
|---|---|---|---|
| Handles mixed features (cat + num) | ✅ natively | ⚠️ needs dummies | ✅ natively |
| Captures non-linear interactions | ✅ | ❌ | ✅ |
| Robust to outliers | ✅ | ❌ | ✅ |
| Built-in feature importance | ✅ Gini impurity | ❌ coefficients only | ✅ gain-based |
| No feature scaling needed | ✅ | ❌ | ✅ |
| No external C++ build dependency | ✅ | ✅ | ❌ requires build |
| Variance via cross-validation | ✅ stable | ✅ stable | ✅ |
| Interpretable for a project jury | ✅ | ✅ | ⚠️ harder to explain |

**Random Forest wins** on the criteria that matter most here:

1. **No scaling required** — the dataset mixes raw counts (`total_orders`),
   monetary values (`total_spent`), days, and ratios. RF handles all of these
   in a single pipeline without normalisation.

2. **Non-linear churn patterns** — a customer with 500 loyalty points AND
   low login frequency is much more at risk than someone with just one of
   those conditions. Random Forest captures these interactions through
   tree splits; Logistic Regression cannot without manual feature engineering.

3. **Stable performance** — 5-fold cross-validation shows a standard
   deviation of about **±0.003 AUC**, confirming the model does not overfit.

4. **Feature importance** — the Gini-impurity based importance scores give
   the marketing team actionable insight: *which behaviours predict churn most
   strongly?*

### Alternatives discarded

| Model | Reason discarded |
|---|---|
| **Logistic Regression** | README recommends it as a baseline only; too linear for this feature space |
| **XGBoost / LightGBM** | Better raw performance but adds C++ build dependency and harder to explain; overkill for 12 k rows |
| **Neural Network** | Requires ~10× more data to outperform RF; not justified here |
| **Decision Tree (single)** | High variance, easily overfits; RF aggregates 300 trees to fix this |
| **SVM** | Slow to train on this size; no native probability output |

---

## 5. Preprocessing Pipeline

The full pipeline is a scikit-learn `Pipeline` object:

```
ColumnTransformer
  ├── OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
  │     applies to: gender, city, gouvernorat
  └── passthrough
        applies to: all 14 numerical features

RandomForestClassifier(n_estimators=300, class_weight="balanced", ...)
```

Key choices:

- **OrdinalEncoder** instead of OneHotEncoder: RF does not require orthogonal
  encodings; ordinal encoding is faster and produces fewer columns.
- **`handle_unknown="use_encoded_value", unknown_value=-1`**: a production
  user could live in a city not present in the training data (e.g. "Kairouan").
  The encoder maps unknown categories to `-1` so the model degrades gracefully
  instead of raising an exception.
- **`class_weight="balanced"`**: the 90-day inactivity rate is close to 47 %.
  Balanced weighting keeps both classes equally important during training.
- The entire pipeline (preprocessor + model) is serialised as a single
  `churn_model.pkl` file, so `predict.py` loads one object and inference
  is a single `pipeline.predict_proba(row)` call — no risk of preprocessing
  mismatch between training and inference.

---

## 6. Performance Results

Trained on **9 600 customers** (80 %), evaluated on **2 400 held-out customers**
(20 %), with a **stratified split** so that the 90-day churn rate is preserved
in both sets. All three approaches are scored on the same test customers.

| Model | ROC-AUC | Accuracy | Role |
|---|---|---|---|
| Recency rule (baseline) | 0.80 | 0.59 | CRM heuristic: longer time since last order, higher risk |
| Logistic Regression | 0.82 | 0.76 | Linear, interpretable coefficients |
| **Random Forest (production)** | **0.83** | **0.76** | Non-linear interactions; deployed model |

A recency-only rule already reaches AUC ~0.80 because recency is a real CRM
signal. The forest is the production model because it **improves on that
baseline** by combining recency with frequency, spend, loyalty and logins.

### Cross-validation (5-fold, stratified)

| Metric | Value |
|---|---|
| CV ROC-AUC mean | **0.84** |
| CV ROC-AUC std | **± 0.003** |

Hold-out AUC (0.83) and CV AUC (0.84) are aligned, which is the expected
signature of a model that generalises rather than memorizes.

### ROC-AUC interpretation

```
0.50  -- random ranking
0.70  -- usable for targeting
0.80  -- good (the recency rule already sits here)
0.83  -- our Random Forest
0.90+ -- unusually high for behavioural churn; treat as a leakage warning
```

---

## 7. Feature Importance Analysis

Feature importances are computed from the mean decrease in Gini impurity
across all 300 trees.

| Rank | Feature | Importance | Interpretation |
|---|---|---|---|
| 1 | `days_since_last_login` | 23 % | Session inactivity precedes purchase inactivity |
| 2 | `days_since_last_order` | 20 % | RFM recency: time since last eligible purchase |
| 3 | `order_frequency` | 10 % | RFM frequency: orders per month of tenure |
| 4 | `total_spent` | 7 % | RFM monetary value |
| 5 | `loyalty_points` | 6 % | Participation in the rewards programme |
| 6 | `tenure_days` | 5 % | Account age at snapshot T |
| 7 | `avg_order_value` | 5 % | Typical basket size |
| 8 | `total_orders` | 4 % | Lifetime purchase count at T |
| 9 | `age` | 4 % | Weak demographic covariate |
| 10 | `avg_rating` | 3 % | Satisfaction proxy when reviews exist |

**Key insight:** recency of login and recency of purchase dominate, as expected
in CRM, but they do not collapse the model into a single threshold. Frequency,
spend and loyalty still move the score, which is why the forest beats the
recency-only rule.

### Business recommendations derived from this analysis

| Signal | Recommended action |
|---|---|
| `days_since_last_login > 45` | Send a re-engagement email with personalised product picks |
| `order_frequency < 0.2` | Trigger a loyalty bonus or time-limited discount |
| `loyalty_points < 300` | Show points-to-next-tier progress bar on next login |
| `avg_rating < 3.0` | Assign customer to support queue for proactive follow-up |
| `total_orders == 1` | Send a "second purchase" incentive coupon after 14 days |

---

## 8. Architecture & Integration

```
┌─────────────────────────────────────────────────────────────┐
│                   Spring Boot  (port 8085)                  │
│                                                             │
│  ChurnController                                            │
│       │                                                     │
│       ▼                                                     │
│  FeatureExtractionService  ──► PostgreSQL (users / orders / │
│       │                         reviews tables)             │
│       ▼                                                     │
│  ChurnPredictionService                                     │
│       │  one Python process, JSON feature file              │
│       ▼                                                     │
│  predict.py  --file  →  churn_model.pkl  →  P(churn)        │
└─────────────────────────────────────────────────────────────┘
```

**Java → Python bridge:**  
`ChurnPredictionService` serialises the `UserFeaturesDTO` to JSON and
invokes `predict.py` as a subprocess via `ProcessBuilder`.
The script prints a single float to stdout; the service reads it back.

**Data flow for a single prediction:**
1. `GET /api/v1/analytics/churn/{userId}`
2. `FeatureExtractionService.extract(userId)` queries the DB and builds a `UserFeaturesDTO`
3. `ChurnPredictionService.predict(dto)` serialises to JSON, spawns Python
4. `predict.py` loads `churn_model.pkl`, builds a `pd.DataFrame`, calls `pipeline.predict_proba`
5. Returns probability → risk label (`LOW / MEDIUM / HIGH`) → JSON response

---

## 9. API Reference

Base URL: `http://localhost:8085/api/v1/analytics`

### Single prediction

```
GET /churn/{userId}
```

Response:
```json
{
  "userId": 42,
  "churnProbability": 0.7823,
  "risk": "HIGH"
}
```

Risk thresholds:
- `HIGH`   → probability > 0.70
- `MEDIUM` → probability 0.40 – 0.70
- `LOW`    → probability < 0.40

---

### Feature vector inspection (debug)

```
GET /churn/{userId}/features
```

Response: the full `UserFeaturesDTO` JSON extracted from the DB for that user.
Useful to verify that feature extraction is working correctly.

---

### Batch prediction

```
GET /churn/batch?role=CLIENT&minRisk=HIGH
```

| Parameter | Default | Description |
|---|---|---|
| `role` | `CLIENT` | Filter users by role name |
| `minRisk` | *(none)* | Only return users at or above this risk level |

Response:
```json
{
  "totalProcessed": 350,
  "totalReturned": 87,
  "errors": [],
  "predictions": [
    {
      "userId": 42,
      "email": "client@example.com",
      "fullName": "Rania Khedhri",
      "churnProbability": 0.9412,
      "risk": "HIGH"
    }
  ]
}
```

Results are sorted by descending `churnProbability`.

---

## 10. How to Run

### Step 1 — Install Python dependencies

```bash
cd microservices/analytics-service
pip install -r python/requirements.txt
```

### Step 2 — (Optional) Rebuild the labelled customer table

Only needed if the historical snapshot or the 90-day horizon changes.

```bash
python python/generate_dataset.py
```

### Step 3 — Train the model

Must be run at least once before the Spring Boot service can make predictions:

```bash
python python/train.py
```

Output files written to `python/models/`:
- `churn_model.pkl` — serialised sklearn Pipeline
- `metrics.json` — accuracy, ROC-AUC, feature importances

### Step 4 — Test inference manually

```bash
python python/predict.py '{"gender":"Female","city":"Tunis","gouvernorat":"Tunis","age":32,"tenureDays":500,"segmentId":2,"loyaltyPoints":900,"totalOrders":8,"totalSpent":1800.0,"avgOrderValue":225.0,"orderFrequency":0.48,"daysSinceLastOrder":8,"daysSinceLastLogin":3,"reviewCount":4,"avgRating":4.1,"couponUsageCount":2,"discountUserRatio":0.25}'

python python/predict.py '{"gender":"Male","city":"Sfax","gouvernorat":"Sfax","age":44,"tenureDays":600,"segmentId":1,"loyaltyPoints":80,"totalOrders":1,"totalSpent":120.0,"avgOrderValue":120.0,"orderFrequency":0.05,"daysSinceLastOrder":140,"daysSinceLastLogin":120,"reviewCount":0,"avgRating":0.0,"couponUsageCount":0,"discountUserRatio":0.0}'
```

### Step 5 — Start the Spring Boot service

```bash
cd microservices/analytics-service
../../mvnw spring-boot:run
```

---

## 11. Design Decisions & Lessons Learned

### Decision 1 — Keep recency, but never let it be the only model

`days_since_last_order` is a legitimate RFM feature: a buyer who has not
purchased for a long time is, by definition, closer to inactivity. Removing it
would throw away the strongest CRM signal.

The safeguard is methodological, not cosmetic:

- the **label** is future inactivity after T, not “recency is high”;
- a **recency-only baseline** is reported next to the forest;
- the production model is retained only if it **beats that baseline**.

That is how we show the jury that the forest is doing more than a 90-day if-then
rule.

### Decision 2 — Strict temporal protocol, live scoring from PostgreSQL

Training uses a labelled customer table built with a historical snapshot T
(features known at T; label = no order in the following 90 days).
Inference uses the same 17 columns, extracted **today** from the live
`users`, `orders` and `reviews` tables by `FeatureExtractionService`.

Accounts with zero completed purchases are not scored
(`INSUFFICIENT_HISTORY`): they are not churners, they have never been
activated. Retraining on a newer labelled export does not require changing
the REST API.

### Decision 3 — Single `Pipeline` object

Saving the entire sklearn Pipeline (preprocessor + model) as one `.pkl`
file guarantees that the same transformations applied during training
are applied identically at inference time.
This eliminates the most common production ML bug:
*"training used StandardScaler but inference did not"*.

### Decision 4 — `ProcessBuilder` bridge (Java → Python)

Rather than embedding a Python interpreter in the JVM (Jython, GraalPy),
the service spawns `predict.py` as an OS subprocess.
This keeps the Java and Python environments completely independent,
avoids library conflicts, and allows the model to be retrained and redeployed
without touching the Spring Boot service.

The trade-off is subprocess startup latency (~200–400 ms per call).
For a high-throughput production environment, this should be replaced
by a dedicated **FastAPI microservice** exposing `/predict` as an HTTP
endpoint, which the Spring Boot service calls via `RestTemplate` or `WebClient`.
