"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { AnalyticsResponse } from "../../../convex/actions";
import styles from "./analytics.module.css";

/*
 * Model Analytics — ported from designs/07-analytics.html but driven entirely
 * by REAL data from the ML API (Flask /analytics via the getAnalytics action).
 * The design's fictional XGBoost/93.2% figures are gone; this shows the honest
 * chance-level reality (Logistic Regression, ~0.50 across the board) — which is
 * the whole integrity point of the project. Charts are hand-rolled SVG.
 */

type MetricKey = "accuracy" | "precision" | "recall" | "f1" | "roc_auc";

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "accuracy", label: "Accuracy", color: "#0d9488" },
  { key: "precision", label: "Precision", color: "#14b8a6" },
  { key: "recall", label: "Recall", color: "#2dd4bf" },
  { key: "f1", label: "F1", color: "#5eead4" },
  { key: "roc_auc", label: "ROC-AUC", color: "#99e6dd" },
];
const ROC_COLORS = ["#14b8a6", "#0d9488", "#65a30d", "#d97706", "#9aa69e"];

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const f3 = (v: number) => v.toFixed(3);

export default function AnalyticsView() {
  const getAnalytics = useAction(api.actions.getAnalytics);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getAnalytics({})
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      ignore = true;
    };
  }, [getAnalytics]);

  if (error) {
    return (
      <>
        <Head />
        <div className={`${styles["state-card"]} ${styles.state}`}>
          <p className={styles["state-err"]}>
            <strong>Couldn&apos;t load model analytics</strong>
            The ML API isn&apos;t reachable. Make sure Flask is running and
            <code> ML_API_URL</code> points to a live tunnel.
          </p>
          <p style={{ marginTop: 8, fontSize: 12 }}>{error}</p>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Head />
        <div className={`${styles["state-card"]} ${styles.state}`}>Loading model analytics…</div>
      </>
    );
  }

  const m = data.metrics.metrics;
  const best = data.metrics.best_model;
  const models = Object.entries(data.model_comparison.models);
  const cm = data.confusion_matrix;
  const cmTotal = cm.tn + cm.fp + cm.fn + cm.tp;
  const cmAcc = cmTotal ? (cm.tn + cm.tp) / cmTotal : 0;

  const imps = data.feature_importances.importances;
  const maxImp = Math.max(...imps.map((i) => i.importance), 1e-9);
  const totalImp = imps.reduce((s, i) => s + i.importance, 0) || 1;
  const top3Share = imps.slice(0, 3).reduce((s, i) => s + i.importance, 0) / totalImp;

  // Dataset composition (train balance + test actuals from the confusion matrix).
  const nTrain = data.model_comparison.n_train;
  const nTest = data.model_comparison.n_test;
  const total = nTrain + nTest;
  const trainNo = data.model_comparison.class_balance_train["0"] ?? 0;
  const trainYes = data.model_comparison.class_balance_train["1"] ?? 0;
  const floodTotal = trainYes + (cm.fn + cm.tp);
  const noFloodTotal = trainNo + (cm.tn + cm.fp);
  const floodFrac = total ? floodTotal / total : 0.5;

  const cvAcc = data.model_comparison.models[best]?.cv?.accuracy;

  return (
    <>
      <Head />

      {/* best model */}
      <section className={styles.best}>
        <span className={styles["best-trophy"]}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 4h12v3a6 6 0 0 1-12 0V4z" />
            <path d="M6 5H3.5v1.5A3 3 0 0 0 6 9M18 5h2.5v1.5A3 3 0 0 1 18 9" />
            <path d="M12 13v4M9 21h6M10 17h4v4h-4z" />
          </svg>
        </span>
        <div className={styles["best-text"]}>
          <p className={styles["be-eyebrow"]}>Best Performing Model</p>
          <h2>{best}</h2>
        </div>
        <div className={styles["best-pills"]}>
          <div className={styles.pill}><div className={styles.pv}>{pct(m.accuracy)}</div><div className={styles.pk}>Accuracy</div></div>
          <div className={styles.pill}><div className={styles.pv}>{f3(m.f1)}</div><div className={styles.pk}>F1 Score</div></div>
          <div className={styles.pill}><div className={styles.pv}>{f3(m.roc_auc)}</div><div className={styles.pk}>ROC-AUC</div></div>
          <div className={styles.pill}><div className={styles.pv}>{pct(m.recall)}</div><div className={styles.pk}>Recall</div></div>
        </div>
      </section>

      {/* honest interpretation */}
      <div className={styles.interpret}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16v.5" />
        </svg>
        <span>{data.metrics.interpretation}</span>
      </div>

      {/* model comparison */}
      <section className={`${styles.card} ${styles["card-pad"]} ${styles.full}`}>
        <h2>Model Performance Comparison</h2>
        <p className={styles.csub}>
          {models.length} algorithm{models.length === 1 ? "" : "s"} evaluated across five metrics on {nTest.toLocaleString()} held-out test observations
        </p>
        <div className={styles["chart-box"]}>
          <ComparisonChart models={models} />
        </div>
        <div className={styles.legend} aria-hidden="true">
          {METRICS.map((mt) => (
            <span key={mt.key}><i style={{ background: mt.color }} />{mt.label}</span>
          ))}
        </div>

        <table className={styles["cmp-table"]}>
          <thead>
            <tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1-Score</th><th>ROC-AUC</th></tr>
          </thead>
          <tbody>
            {models.map(([name, mm]) => (
              <tr key={name} className={name === best ? styles["best-row"] : undefined}>
                <td>
                  {name}
                  {name === best && <span className={styles["tag-best"]}>BEST</span>}
                </td>
                <td>{f3(mm.test.accuracy)}</td>
                <td>{f3(mm.test.precision)}</td>
                <td>{f3(mm.test.recall)}</td>
                <td>{f3(mm.test.f1)}</td>
                <td>{f3(mm.test.roc_auc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* confusion + ROC */}
      <div className={styles["row-2"]}>
        <section className={`${styles.card} ${styles["card-pad"]}`}>
          <h2>Confusion Matrix — {cm.model}</h2>
          <p className={styles.csub}>Evaluated on {cmTotal.toLocaleString()} held-out test observations</p>
          <div className={styles["cm-wrap"]}>
            <div className={styles["cm-ylabel"]}>Actual Class</div>
            <div>
              <div className={styles["cm-grid"]}>
                <div className={`${styles["cm-cell"]} ${styles["cm-tn"]}`}><div className={styles["cm-num"]}>{cm.tn}</div><div className={styles["cm-tag"]}>True Negative</div></div>
                <div className={`${styles["cm-cell"]} ${styles["cm-fp"]}`}><div className={styles["cm-num"]}>{cm.fp}</div><div className={styles["cm-tag"]}>False Positive</div></div>
                <div className={`${styles["cm-cell"]} ${styles["cm-fn"]}`}><div className={styles["cm-num"]}>{cm.fn}</div><div className={styles["cm-tag"]}>False Negative</div></div>
                <div className={`${styles["cm-cell"]} ${styles["cm-tp"]}`}><div className={styles["cm-num"]}>{cm.tp}</div><div className={styles["cm-tag"]}>True Positive</div></div>
              </div>
              <div className={styles["cm-xlabels"]}>
                <span>Predicted: {cm.labels?.[0] ?? "No Flood"}</span>
                <span>Predicted: {cm.labels?.[1] ?? "Flood"}</span>
              </div>
            </div>
          </div>
          <p className={styles["cm-caption"]}>
            {cm.tp} floods correctly detected, {cm.fn} missed — overall accuracy {pct(cmAcc)}, essentially the 50% chance line.
          </p>
        </section>

        <section className={`${styles.card} ${styles["card-pad"]}`}>
          <h2>ROC Curve</h2>
          <p className={styles.csub}>True vs. false positive rate — all curves hug the diagonal (no signal)</p>
          <div className={styles["roc-box"]}>
            <RocChart roc={data.roc_data} />
          </div>
          <div className={styles.legend} aria-hidden="true">
            {Object.entries(data.roc_data.models).map(([name, r], i) => (
              <span key={name}><i style={{ background: ROC_COLORS[i % ROC_COLORS.length] }} />{name} ({f3(r.auc)})</span>
            ))}
            <span><i style={{ background: "#c9c2b2" }} />Chance ({f3(data.roc_data.chance_auc)})</span>
          </div>
        </section>
      </div>

      {/* feature importance + dataset */}
      <div className={styles["row-2"]} style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        <section className={`${styles.card} ${styles["card-pad"]}`}>
          <h2>Feature Importance</h2>
          <p className={styles.csub}>{data.feature_importances.model} — coefficient magnitude per feature ({imps.length} features)</p>
          {imps.map((f, idx) => (
            <div className={styles["fi-row"]} key={f.feature} style={idx === imps.length - 1 ? { marginBottom: 0 } : undefined}>
              <span className={styles["fi-name"]}>{f.feature}</span>
              <div className={styles["fi-track"]}>
                <div className={styles["fi-fill"]} style={{ width: `${Math.max((f.importance / maxImp) * 100, 2)}%` }} />
              </div>
              <span className={styles["fi-val"]}>{f3(f.importance)}</span>
            </div>
          ))}
          <p className={styles["fi-caption"]}>
            The top three features account for {pct(top3Share)} of total coefficient magnitude — but with chance-level AUC, none carries real predictive signal.
          </p>
        </section>

        <section className={`${styles.card} ${styles["card-pad"]}`}>
          <h2>Dataset Overview</h2>
          <p className={styles.csub}>Composition of the flood risk dataset</p>
          <div className={styles["ds-top"]}>
            <div className={styles["ds-donut"]}>
              <Donut floodFrac={floodFrac} />
              <div className={styles.dc}>
                <div className={styles.dn}>{total.toLocaleString()}</div>
                <div className={styles.dl}>samples</div>
              </div>
            </div>
            <div className={styles["ds-legend"]}>
              <div className={styles["ds-leg-row"]}>
                <span className={styles.ld} style={{ background: "#0d9488" }} /> Flood Events
                <span className={styles.lp}><strong>{floodTotal.toLocaleString()}</strong> · {pct(floodFrac)}</span>
              </div>
              <div className={styles["ds-leg-row"]}>
                <span className={styles.ld} style={{ background: "#d6cfbf" }} /> Non-Flood
                <span className={styles.lp}><strong>{noFloodTotal.toLocaleString()}</strong> · {pct(1 - floodFrac)}</span>
              </div>
            </div>
          </div>
          <div className={styles["ds-stats"]}>
            <div className={styles["ds-stat-row"]}><span className={styles.k}>Train / Test</span><span className={styles.v}>{nTrain.toLocaleString()} / {nTest.toLocaleString()} ({Math.round((nTrain / total) * 100)}/{Math.round((nTest / total) * 100)})</span></div>
            <div className={styles["ds-stat-row"]}><span className={styles.k}>Features Used</span><span className={styles.v}>{data.metrics.feature_count} (coords excluded)</span></div>
            {cvAcc && (
              <div className={styles["ds-stat-row"]}><span className={styles.k}>Mean CV Accuracy ({best})</span><span className={styles.v}>{pct(cvAcc.mean)} ± {pct(cvAcc.std)}</span></div>
            )}
          </div>
          <p className={styles["ds-note"]}>
            Classes are balanced — yet every model performs at chance, the documented &ldquo;no learnable signal&rdquo; finding.
          </p>
        </section>
      </div>
    </>
  );
}

function Head() {
  return (
    <div className={styles["page-head"]}>
      <h1>Model Analytics</h1>
      <p>Machine-learning performance metrics from the live ML API — reported honestly.</p>
    </div>
  );
}

/** Grouped bar chart: one group per model, five metric bars each, y-axis 0–1. */
function ComparisonChart({
  models,
}: {
  models: [string, AnalyticsResponse["model_comparison"]["models"][string]][];
}) {
  const W = 800;
  const H = 300;
  const padL = 32;
  const padB = 30;
  const padT = 8;
  const padR = 6;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const groupW = plotW / Math.max(models.length, 1);
  const barW = (groupW * 0.74) / METRICS.length;
  const y = (v: number) => padT + (1 - v) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg className={styles["chart-svg"]} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Model performance comparison">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke={t === 0.5 ? "#e3b66a" : "#f1ece1"} strokeWidth="1" strokeDasharray={t === 0.5 ? "5 4" : undefined} vectorEffect="non-scaling-stroke" />
          <text x={padL - 5} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#9aa69e">{t.toFixed(2)}</text>
        </g>
      ))}
      {models.map(([name, mm], gi) => {
        const gx = padL + gi * groupW + groupW * 0.13;
        return (
          <g key={name}>
            {METRICS.map((mt, mi) => {
              const v = mm.test[mt.key];
              const bx = gx + mi * barW;
              const bh = Math.max(v * plotH, 0);
              return <rect key={mt.key} x={bx} y={padT + plotH - bh} width={barW * 0.86} height={bh} fill={mt.color} rx="1.5" />;
            })}
            <text x={padL + gi * groupW + groupW / 2} y={H - padB + 16} textAnchor="middle" fontSize="11" fill="#5c6b62">{name}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** ROC curves for each model + the chance diagonal. */
function RocChart({ roc }: { roc: AnalyticsResponse["roc_data"] }) {
  const W = 480;
  const H = 360;
  const padL = 38;
  const padB = 30;
  const padT = 8;
  const padR = 10;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const X = (fpr: number) => padL + fpr * plotW;
  const Y = (tpr: number) => padT + (1 - tpr) * plotH;
  const entries = Object.entries(roc.models);

  return (
    <svg className={styles["chart-svg"]} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="ROC curves">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={X(t)} y1={Y(0)} x2={X(t)} y2={Y(1)} stroke="#f1ece1" strokeWidth="1" />
          <line x1={X(0)} y1={Y(t)} x2={X(1)} y2={Y(t)} stroke="#f1ece1" strokeWidth="1" />
        </g>
      ))}
      {/* chance diagonal */}
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="#c9c2b2" strokeWidth="1.5" strokeDasharray="6 5" />
      {entries.map(([name, r], i) => {
        const pts = r.fpr.map((f, idx) => `${X(f)},${Y(r.tpr[idx])}`).join(" ");
        return <polyline key={name} points={pts} fill="none" stroke={ROC_COLORS[i % ROC_COLORS.length]} strokeWidth={i === 0 ? 2.6 : 1.8} />;
      })}
      <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#5c6b62">False Positive Rate</text>
      <text x={12} y={padT + plotH / 2} textAnchor="middle" fontSize="11" fill="#5c6b62" transform={`rotate(-90 12 ${padT + plotH / 2})`}>True Positive Rate</text>
    </svg>
  );
}

/** Donut ring split into flood / non-flood. */
function Donut({ floodFrac }: { floodFrac: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const floodLen = floodFrac * c;
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
      <g transform="rotate(-90 60 60)">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#d6cfbf" strokeWidth="16" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#0d9488" strokeWidth="16" strokeDasharray={`${floodLen} ${c - floodLen}`} />
      </g>
    </svg>
  );
}
