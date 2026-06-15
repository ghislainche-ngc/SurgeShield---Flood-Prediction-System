# Modeling Report

> **SurgeShield — OSEMN Model stage (M)**
> Feeds dissertation **Chapter 4 (Implementation & Findings)**.
> Reproduce with: `python 4_modeling/train.py` (writes `models/`).

---

## 1. Objective

Train and compare classifiers for the binary target `Flood Occurred`, select the
best by a defensible criterion, and persist the artifacts the API serves. Metrics
are reported exactly as measured — never hard-coded or inflated.

---

## 2. Models (three, one per family)

| Model | Family | Rationale | Key hyperparameters |
|-------|--------|-----------|---------------------|
| Logistic Regression | Linear | Interpretable baseline; low variance | `max_iter=1000` |
| Random Forest | Bagging ensemble | Non-linear, robust to scale/outliers | `n_estimators=200` |
| XGBoost | Boosting ensemble | Gradient-boosted trees, high capacity | `n_estimators=200`, `eval_metric="logloss"` |

All three expose `predict_proba`, so the risk gauge always has a calibrated-ish
probability to display. `random_state=42` throughout for full reproducibility.

---

## 3. Protocol

| Step | Choice | Detail |
|------|--------|--------|
| Split | Stratified 80 / 20 | 8,000 train / 2,000 test; class balance preserved in both halves |
| Cross-validation | 5-fold stratified | On the **training set only**, for model selection |
| Preprocessing | Shared `preprocessing.py` | StandardScaler (7 numerics) · passthrough (2 binaries) · OneHotEncoder (`Land Cover`, `Soil Type`) → 11 raw → 19 encoded features |
| Metrics | accuracy, precision, recall, F1, ROC-AUC | Computed for CV (mean ± std) and the held-out test set |
| Selection | **Best by cross-validated F1** | F1 balances precision and recall on a class-balanced target |

### Why F1 as the selector

The target is near-balanced (~50.6 / 49.4), and we care about both false alarms
and missed floods, so a single threshold metric that balances precision and
recall is appropriate. F1 is computed on the CV folds (training data only), so
selection never touches the test set.

---

## 4. Results

### Cross-validation (training folds — basis for selection)

| Model | CV F1 | CV ROC-AUC | CV Accuracy |
|-------|-------|------------|-------------|
| **Logistic Regression** | **0.5540 ± 0.0084** | 0.5186 ± 0.0094 | 0.5139 ± 0.0059 |
| Random Forest | 0.5224 ± 0.0081 | 0.5123 ± 0.0115 | 0.5111 ± 0.0061 |
| XGBoost | 0.5217 ± 0.0083 | 0.5156 ± 0.0140 | 0.5129 ± 0.0112 |

### Held-out test set (2,000 rows, never seen in training or selection)

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|----------|-----------|--------|----|---------|
| **Logistic Regression** (selected) | 0.5025 | 0.5068 | 0.5895 | **0.5450** | 0.4984 |
| Random Forest | 0.5020 | 0.5071 | 0.5292 | 0.5179 | 0.4943 |
| XGBoost | 0.4950 | 0.5005 | 0.5074 | 0.5039 | 0.4913 |

**Selected model: Logistic Regression** — it wins on CV F1 (the selector) and
also leads on test accuracy and test ROC-AUC.

---

## 5. Interpretation

All three models perform at **chance level** (ROC-AUC ≈ 0.49–0.50, accuracy
≈ 0.50). The differences between them are within cross-validation noise (std
bands overlap). This is the expected and correct outcome given the Scrub-stage
finding that the dataset carries **no learnable signal** — there is nothing for
a more powerful algorithm to exploit.

Two observations worth noting for the defense:

- **Why Logistic Regression "wins".** On a no-signal, balanced dataset, precision
  is pinned near 0.50 for every model, so F1 is driven by recall — i.e. whichever
  model predicts the positive class more often. Logistic Regression's higher
  recall (0.59) lifts its F1. This reflects threshold behaviour on random data,
  not superior predictive skill.
- **Why XGBoost ranks last on ROC-AUC (0.4913).** A high-capacity model fits
  noise in the training folds and generalizes marginally worse out-of-sample when
  no real pattern exists. The low-capacity linear model lands closest to 0.50.
  This is textbook behaviour, not a defect.

No honest selection metric (F1, accuracy, or ROC-AUC) selects XGBoost on this
dataset. The ranking was therefore left exactly as measured; the result is
reported transparently rather than reshaped toward an expected winner.

---

## 6. Leakage controls

The chance-level result is genuine, not an artifact of a leaky pipeline. Two
safeguards prevent the most common leakage paths:

1. **Preprocessor fit on training data only.** The split happens first; the
   scaler/encoder are fit on `X_train` and merely *applied* to `X_test`. Test
   statistics never influence the transform.
2. **In-fold refitting during CV.** The preprocessor sits *inside* the Pipeline
   that cross-validation drives, so it is refit on each fold's training portion —
   no validation-fold information bleeds across folds. CV also runs on the
   training 80% only; the test set is excluded entirely.

`train.py` additionally asserts that the API inference path
(`transform_features`) produces an identical matrix to the training-time
ColumnTransformer, so the deployed transform cannot silently drift.

Corroborating evidence: leakage inflates performance, yet every metric sits at
chance, and the shuffled-label control (`2_data_cleaning/validate_dataset.py`)
scores the same as the real labels. Both point away from leakage.

---

## 7. Artifacts (`models/`)

| File | Contents |
|------|----------|
| `best_model.joblib` | The selected classifier (Logistic Regression), fit on the transformed training set |
| `scaler.joblib` | Fitted StandardScaler (numeric features) |
| `encoder.joblib` | Fitted OneHotEncoder (`Land Cover`, `Soil Type`) |
| `all_models_comparison.json` | Full CV (mean ± std) and test metrics for all three models, protocol metadata, feature counts, selected model |

The interpretation stage (`5_interpretation/`) reloads these to produce the
confusion matrix, ROC curves, feature importances, and `metrics.json` — the
single source of truth read by the API and UI.

---

## 8. Recommendation

The pipeline is correct and the result is honest. To obtain a model with real
predictive power, the path forward is **better data, not a better algorithm**:
source a dataset with genuine hydrological/terrain signal (e.g. DEM-derived
elevation gradients, river-gauge time series, historical flood extents). The
system is built to consume such a dataset and retrain with no architectural
change — at which point boosting (XGBoost) would be expected to lead.
