"""
SurgeShield — Explore stage (OSEMN: E)
======================================

Headless exploratory data analysis. Reads the cleaned dataset and saves every
figure as a PNG into `3_eda/figures/` for reference in the project report.

Figures produced:
  target_balance.png         class balance of the target
  feature_distributions.png  histogram + KDE for each numeric feature
  boxplots_numeric.png       box plots (spread + outliers) per numeric feature
  correlation_heatmap.png    annotated correlation matrix (numerics + target)
  categorical_counts.png     count plots for Land Cover and Soil Type
  flood_rate_by_category.png mean flood rate per category
  grouped_by_outcome.png     key numeric features overlaid by flood outcome
  scatter_relationships.png  scatter pairs coloured by flood outcome

Note: the dataset is CROSS-SECTIONAL — there is no time/date column, so no
time-series plots are produced.

Runs headlessly (matplotlib 'Agg' backend) — no display required.

Reads:  ../1_data/processed/flood_clean.csv
Run from anywhere:
    python 3_eda/eda.py
"""

from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # headless backend — MUST be set before pyplot import

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #
HERE = Path(__file__).resolve().parent          # .../ml-api/3_eda
ML_API = HERE.parent                             # .../ml-api
DATA_PATH = ML_API / "1_data" / "processed" / "flood_clean.csv"
FIG_DIR = HERE / "figures"

TARGET = "Flood Occurred"
NUMERIC_FEATURES = [
    "Rainfall", "Temperature", "Humidity", "River Discharge",
    "Water Level", "Elevation", "Population Density",
]
BINARY_FEATURES = ["Infrastructure", "Historical Floods"]
CATEGORICAL_FEATURES = ["Land Cover", "Soil Type"]

# Brand palette. Class colors: no-flood (teal) vs flood (red).
CLASS_PALETTE = {0: "#0d9488", 1: "#ef4444"}
CLASS_LABELS = {0: "No Flood", 1: "Flood"}
FOREST = "#1a3a2a"
TEAL = "#0d9488"

sns.set_theme(style="whitegrid")


def load_data() -> pd.DataFrame:
    """Load the cleaned dataset. Fails loudly with a hint if it is missing."""
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Cleaned data not found at {DATA_PATH}.\n"
            "Run `python 2_data_cleaning/clean.py` first."
        )
    df = pd.read_csv(DATA_PATH, encoding="utf-8")
    print(f"[load] {DATA_PATH.name}: {df.shape[0]:,} rows x {df.shape[1]} cols")
    return df


def _save(fig: plt.Figure, name: str) -> None:
    """Save a figure to figures/ at print resolution and close it."""
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    path = FIG_DIR / name
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"[save] {path.relative_to(ML_API)}")


def _grid_axes(n: int, ncols: int = 3):
    """Create a flattened grid of axes sized for n panels."""
    nrows = int(np.ceil(n / ncols))
    fig, axes = plt.subplots(nrows, ncols, figsize=(5 * ncols, 3.6 * nrows))
    axes = np.atleast_1d(axes).flatten()
    return fig, axes


# --------------------------------------------------------------------------- #
# Target balance
# --------------------------------------------------------------------------- #
def plot_target_balance(df: pd.DataFrame) -> None:
    counts = df[TARGET].value_counts().sort_index()
    pct = (counts / counts.sum() * 100).round(1)

    fig, ax = plt.subplots(figsize=(6, 5))
    bars = ax.bar(
        [CLASS_LABELS[i] for i in counts.index], counts.values,
        color=[CLASS_PALETTE[i] for i in counts.index], edgecolor="white",
    )
    for bar, c, p in zip(bars, counts.values, pct.values):
        ax.text(bar.get_x() + bar.get_width() / 2, c, f"{c:,}\n({p}%)",
                ha="center", va="bottom", fontweight="bold")
    ax.set_title("Target Balance — Flood Occurred", fontweight="bold")
    ax.set_ylabel("Number of records")
    ax.set_ylim(0, counts.max() * 1.15)
    _save(fig, "target_balance.png")


# --------------------------------------------------------------------------- #
# Distribution plots — histogram + KDE per numeric feature
# --------------------------------------------------------------------------- #
def plot_feature_distributions(df: pd.DataFrame) -> None:
    fig, axes = _grid_axes(len(NUMERIC_FEATURES))
    for ax, feat in zip(axes, NUMERIC_FEATURES):
        sns.histplot(df[feat], kde=True, ax=ax, color=TEAL, bins=40,
                     edgecolor="white", alpha=0.7)
        ax.set_title(feat, fontsize=11)
        ax.set_xlabel("")
    for ax in axes[len(NUMERIC_FEATURES):]:
        ax.set_visible(False)
    fig.suptitle("Numeric Feature Distributions (histogram + KDE)",
                 fontweight="bold", y=1.01)
    fig.tight_layout()
    _save(fig, "feature_distributions.png")


# --------------------------------------------------------------------------- #
# Box plots — spread + outliers per numeric feature
# --------------------------------------------------------------------------- #
def plot_boxplots_numeric(df: pd.DataFrame) -> None:
    # Each feature on its own axis: scales differ by orders of magnitude.
    fig, axes = _grid_axes(len(NUMERIC_FEATURES))
    for ax, feat in zip(axes, NUMERIC_FEATURES):
        sns.boxplot(y=df[feat], ax=ax, color=TEAL, width=0.4)
        ax.set_title(feat, fontsize=11)
        ax.set_ylabel("")
    for ax in axes[len(NUMERIC_FEATURES):]:
        ax.set_visible(False)
    fig.suptitle("Numeric Feature Box Plots — spread & outliers",
                 fontweight="bold", y=1.01)
    fig.tight_layout()
    _save(fig, "boxplots_numeric.png")


# --------------------------------------------------------------------------- #
# Correlation heatmap — numeric + binary features + target
# --------------------------------------------------------------------------- #
def plot_correlation_heatmap(df: pd.DataFrame) -> None:
    cols = NUMERIC_FEATURES + BINARY_FEATURES + [TARGET]
    corr = df[cols].corr(numeric_only=True)

    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(corr, ax=ax, cmap="coolwarm", center=0, vmin=-1, vmax=1,
                annot=True, fmt="+.2f", annot_kws={"size": 8},
                square=True, linewidths=0.5, cbar_kws={"shrink": 0.8})
    ax.set_title(
        f"Correlation Matrix — every correlation with '{TARGET}' is near zero",
        fontweight="bold", pad=12)
    fig.tight_layout()
    _save(fig, "correlation_heatmap.png")


# --------------------------------------------------------------------------- #
# Categorical count plots
# --------------------------------------------------------------------------- #
def plot_categorical_counts(df: pd.DataFrame) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    for ax, cat in zip(axes, CATEGORICAL_FEATURES):
        order = df[cat].value_counts().index
        sns.countplot(data=df, x=cat, order=order, ax=ax, color=TEAL,
                      edgecolor="white")
        for container in ax.containers:
            ax.bar_label(container, fmt="%d", padding=2, fontsize=9,
                         fontweight="bold")
        ax.set_title(f"Record Count by {cat}", fontweight="bold")
        ax.set_xlabel("")
        ax.tick_params(axis="x", rotation=20)
    fig.suptitle("Categorical Composition", fontweight="bold", y=1.02)
    fig.tight_layout()
    _save(fig, "categorical_counts.png")


# --------------------------------------------------------------------------- #
# Flood rate by category
# --------------------------------------------------------------------------- #
def plot_flood_rate_by_category(df: pd.DataFrame) -> None:
    overall = df[TARGET].mean()
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    for ax, cat in zip(axes, CATEGORICAL_FEATURES):
        rate = df.groupby(cat)[TARGET].mean().sort_values(ascending=False)
        bars = ax.bar(rate.index, rate.values, color=FOREST, edgecolor="white")
        for bar, r in zip(bars, rate.values):
            ax.text(bar.get_x() + bar.get_width() / 2, r, f"{r * 100:.1f}%",
                    ha="center", va="bottom", fontsize=9, fontweight="bold")
        ax.axhline(overall, color="#ef4444", linestyle="--", linewidth=1.5,
                   label=f"overall {overall * 100:.1f}%")
        ax.set_title(f"Flood Rate by {cat}", fontweight="bold")
        ax.set_ylabel("Flood rate")
        ax.set_ylim(0, max(0.65, rate.max() * 1.2))
        ax.tick_params(axis="x", rotation=20)
        ax.legend()
    fig.suptitle("Flood Rate by Category — flat at ~50% (no category separates "
                 "the classes)", fontweight="bold", y=1.02)
    fig.tight_layout()
    _save(fig, "flood_rate_by_category.png")


# --------------------------------------------------------------------------- #
# Grouped comparison — key numerics overlaid by flood outcome
# --------------------------------------------------------------------------- #
def plot_grouped_by_outcome(df: pd.DataFrame) -> None:
    key_features = ["Rainfall", "Water Level", "River Discharge", "Elevation"]
    fig, axes = plt.subplots(2, 2, figsize=(13, 9))
    axes = axes.flatten()
    for ax, feat in zip(axes, key_features):
        for cls in (0, 1):
            sns.histplot(df.loc[df[TARGET] == cls, feat], ax=ax, bins=40,
                         color=CLASS_PALETTE[cls], label=CLASS_LABELS[cls],
                         stat="density", element="step", fill=True, alpha=0.35,
                         kde=True)
        ax.set_title(feat, fontsize=12)
        ax.set_xlabel("")
        ax.legend(fontsize=9)
    fig.suptitle("Key Numeric Features by Flood Outcome — distributions overlap "
                 "heavily", fontweight="bold", y=1.01)
    fig.tight_layout()
    _save(fig, "grouped_by_outcome.png")


# --------------------------------------------------------------------------- #
# Scatter plots — exploring whether pairwise relationships exist
# --------------------------------------------------------------------------- #
def plot_scatter_relationships(df: pd.DataFrame) -> None:
    pairs = [("Rainfall", "Water Level"), ("River Discharge", "Elevation")]
    colors = df[TARGET].map(CLASS_PALETTE)

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    for ax, (x, y) in zip(axes, pairs):
        ax.scatter(df[x], df[y], c=colors, s=10, alpha=0.30, linewidths=0)
        ax.set_xlabel(x)
        ax.set_ylabel(y)
        ax.set_title(f"{x} vs {y}", fontweight="bold")

    # Shared legend (proxy handles).
    handles = [plt.Line2D([0], [0], marker="o", linestyle="", color=CLASS_PALETTE[c],
                          label=CLASS_LABELS[c]) for c in (0, 1)]
    fig.legend(handles=handles, loc="upper center", ncol=2,
               bbox_to_anchor=(0.5, 1.02))
    fig.suptitle("Exploring Pairwise Relationships (coloured by flood outcome) — "
                 "no separation visible", fontweight="bold", y=0.97)
    fig.tight_layout()
    _save(fig, "scatter_relationships.png")


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main() -> None:
    print("=" * 70)
    print("SurgeShield — exploratory data analysis (Explore)")
    print("=" * 70)
    df = load_data()

    plot_target_balance(df)
    plot_feature_distributions(df)
    plot_boxplots_numeric(df)
    plot_correlation_heatmap(df)
    plot_categorical_counts(df)
    plot_flood_rate_by_category(df)
    plot_grouped_by_outcome(df)
    plot_scatter_relationships(df)

    print("=" * 70)
    print(f"Done. {len(list(FIG_DIR.glob('*.png')))} figure(s) in "
          f"{FIG_DIR.relative_to(ML_API)}")
    print("=" * 70)


if __name__ == "__main__":
    main()
