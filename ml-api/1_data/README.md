# Data — Obtain stage (OSEMN: O)

> **SurgeShield ML microservice.** This folder holds the project's data and the
> acquisition notebook. It documents *where the data came from, what it
> contains, and its known limitations* — the data card for the dissertation.

```
1_data/
├── raw/
│   └── flood_risk_dataset.csv   # original dataset — IMMUTABLE, never modified
├── processed/
│   └── flood_clean.csv          # output of 2_data_cleaning/clean.py
├── 01_data_acquisition.ipynb    # load raw, inspect shape/types, document provenance
└── README.md                    # (this file)
```

> **`raw/` is immutable.** The cleaning stage reads from `raw/` and writes to
> `processed/`. Nothing in the pipeline ever modifies the raw file.

---

## Dataset

| Property | Value |
|----------|-------|
| File | `raw/flood_risk_dataset.csv` |
| Records | 10,000 |
| Columns | 14 (`Latitude`, `Longitude`, 11 features, target `Flood Occurred`) |
| Format | CSV, UTF-8 (column names carry unit symbols, e.g. `°C`, `m³/s`) |
| Missing values | 0 |
| Duplicate rows | 0 |
| Geographic extent | Latitude 8.0–37.0°N, Longitude 68.0–97.0°E (Indian subcontinent region) |

### Target

`Flood Occurred` — binary (0 = no flood, 1 = flood). Balance: **5,057 flood /
4,943 no-flood** (≈ 50.6 % / 49.4 %).

---

## Features

`Latitude` and `Longitude` are **excluded from the model** (retained only for map
visualization in the frontend). The 11 modeling features are:

### Numeric (7)

| Feature | Unit | Min | Max | Mean |
|---------|------|-----|-----|------|
| Rainfall | mm | 0.01 | 299.97 | 150.0 |
| Temperature | °C | 15.0 | 45.0 | 30.0 |
| Humidity | % | 20.0 | 100.0 | 59.8 |
| River Discharge | m³/s | 0.04 | 4999.7 | 2515.7 |
| Water Level | m | 0.0 | 10.0 | 5.0 |
| Elevation | m | 1.2 | 8846.9 | 4417.1 |
| Population Density | people/km² | 2.3 | 9999.2 | 5021.5 |

### Binary (2)

| Feature | Values | Balance |
|---------|--------|---------|
| Infrastructure | 0 / 1 | 4,980 / 5,020 |
| Historical Floods | 0 / 1 | 5,013 / 4,987 |

### Categorical (2)

| Feature | Categories (count) |
|---------|--------------------|
| Land Cover | Water Body (2,046), Desert (2,033), Forest (2,005), Agricultural (1,978), Urban (1,938) |
| Soil Type | Peat (2,052), Silt (2,044), Clay (1,978), Loam (1,972), Sandy (1,954) |

---

## Provenance

A public flood-risk classification dataset (Kaggle-style tabular dataset) chosen
for its realistic flood-relevant variables — meteorology (rainfall, temperature,
humidity), hydrology (river discharge, water level), terrain (elevation), and
human factors (land cover, soil type, population density, infrastructure,
historical floods). See `01_data_acquisition.ipynb` for the load-and-inspect
record.

> Update this section with the exact dataset URL, author, and license before
> submission so the citation is complete and verifiable.

---

## Known limitations (read alongside the honesty narrative)

This is the most important part of the data card. During validation
(`2_data_cleaning/validate_dataset.py`) the dataset was found to carry **no
learnable signal**: feature/target correlations are near zero, permutation
importance is negligible, and a shuffled-label control scores the same as the
real labels (≈ 0.50 ROC-AUC for all three models).

The summary statistics above are consistent with that finding:

- Every numeric feature's **mean sits at the midpoint of its range** and the
  values span the full range uniformly — the hallmark of independently sampled
  (effectively random / synthetic) variables.
- Categorical and binary features are split **almost perfectly evenly**, with no
  category shifting the flood rate away from ~50 % (see
  `3_eda/figures/flood_rate_by_category.png`).
- The target itself is a near coin-flip, uncorrelated with any feature.

**Implication:** no model trained on this data can exceed chance performance.
SurgeShield reports this transparently rather than fabricating metrics, and
treats the validation procedure as a methodological contribution. The system is
engineered to consume any properly-signalled dataset (e.g. DEM-derived terrain,
river-gauge time series, historical flood extents) and retrain without code
changes. See `2_data_cleaning/cleaning_report.md` and `4_modeling/modeling_report.md`.

---

## Reproducing the processed file

```bash
python 2_data_cleaning/clean.py   # raw/flood_risk_dataset.csv -> processed/flood_clean.csv
```

Cleaning drops `Latitude`/`Longitude`, tidies column names (strips units),
de-duplicates, coerces types, and handles nulls. Result: 10,000 rows × 12 columns
(11 features + target).
