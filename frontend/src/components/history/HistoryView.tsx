"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import styles from "./history.module.css";

type Prediction = Doc<"predictions">;
type RiskLevel = Prediction["riskLevel"];

const PAGE_SIZE = 10;

const badgeClass: Record<RiskLevel, string> = {
  Low: "b-low",
  Moderate: "b-mod",
  High: "b-high",
  Critical: "b-crit",
};

type Filter = "all" | "high" | "Moderate" | "Low";

function fmtDate(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

/** Label/value pairs for the expanded detail row. */
function paramRows(p: Prediction): { label: string; value: string }[] {
  const i = p.inputs;
  const rows = [
    { label: "Rainfall", value: `${i.rainfall.toLocaleString()} mm` },
    { label: "Temperature", value: `${i.temperature} °C` },
    { label: "Humidity", value: `${i.humidity}%` },
    { label: "River Discharge", value: `${i.riverDischarge.toLocaleString()} m³/s` },
    { label: "Water Level", value: `${i.waterLevel} m` },
    { label: "Elevation", value: `${i.elevation.toLocaleString()} m` },
    { label: "Land Cover", value: i.landCover },
    { label: "Soil Type", value: i.soilType },
    { label: "Pop. Density", value: `${i.populationDensity.toLocaleString()} /km²` },
    { label: "Infrastructure", value: i.infrastructure ? "Present" : "Absent" },
    { label: "Hist. Floods", value: i.historicalFloods ? "Yes" : "No" },
  ];
  if (p.latitude != null && p.longitude != null) {
    rows.push({
      label: "Coordinates",
      value: `${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)}`,
    });
  }
  return rows;
}

export default function HistoryView() {
  const predictions = useQuery(api.predictions.getUserPredictions);
  const deletePrediction = useMutation(api.predictions.deletePrediction);

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Id<"predictions"> | null>(null);

  const all = useMemo(() => predictions ?? [], [predictions]);

  const summary = useMemo(() => {
    const total = all.length;
    const highCrit = all.filter(
      (p) => p.riskLevel === "High" || p.riskLevel === "Critical",
    ).length;
    const moderate = all.filter((p) => p.riskLevel === "Moderate").length;
    const low = all.filter((p) => p.riskLevel === "Low").length;
    const avg = total
      ? `${((all.reduce((s, p) => s + p.probability, 0) / total) * 100).toFixed(1)}%`
      : "—";
    return { total, highCrit, moderate, low, avg };
  }, [all]);

  const filtered = useMemo(() => {
    let rows = all;
    if (filter === "high")
      rows = rows.filter((p) => p.riskLevel === "High" || p.riskLevel === "Critical");
    else if (filter !== "all") rows = rows.filter((p) => p.riskLevel === filter);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((p) => (p.locationName ?? "").toLowerCase().includes(q));
    rows = [...rows].sort((a, b) =>
      sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
    );
    return rows;
  }, [all, filter, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function exportCsv() {
    const header = ["Date", "Location", "Risk Level", "Probability", "Key Factor"];
    const lines = filtered.map((p) =>
      [
        fmtDate(p.createdAt),
        p.locationName ?? "",
        p.riskLevel,
        pct(p.probability),
        p.topFactors[0]?.feature ?? "",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "surgeshield-predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onDelete(id: Id<"predictions">) {
    if (!window.confirm("Delete this prediction? This can't be undone.")) return;
    if (expanded === id) setExpanded(null);
    await deletePrediction({ id });
  }

  const pills: { key: Filter; label: string; color?: string }[] = [
    { key: "all", label: "All Predictions" },
    { key: "high", label: "High Risk", color: "var(--risk-high)" },
    { key: "Moderate", label: "Moderate", color: "var(--risk-mod)" },
    { key: "Low", label: "Low Risk", color: "var(--risk-low)" },
  ];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Prediction History</h1>
          <p>Track and review all your past flood predictions.</p>
        </div>
        <div className={styles["head-actions"]}>
          <button
            type="button"
            className={styles["btn-out"]}
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12M7 10l5 5 5-5" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {predictions === undefined ? (
        <div className={styles["table-card"]}>
          <div className={styles.state}>Loading your predictions…</div>
        </div>
      ) : all.length === 0 ? (
        <div className={styles["table-card"]}>
          <div className={styles.state}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <path d="M9 8h6M9 12h6M9 16h4" />
            </svg>
            <h2>No predictions yet</h2>
            <p>Run your first flood prediction and it will show up here.</p>
            <Link href="/predict" className={styles["state-cta"]}>
              Start a prediction
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className={styles.summary}>
            <div className={styles["sum-card"]}><p className={styles.sk}>Total Predictions</p><p className={styles.sv}>{summary.total}</p></div>
            <div className={styles["sum-card"]}><p className={styles.sk}>High / Critical</p><p className={`${styles.sv} ${styles.dot} ${styles.high}`}>{summary.highCrit}</p></div>
            <div className={styles["sum-card"]}><p className={styles.sk}>Moderate</p><p className={`${styles.sv} ${styles.dot} ${styles.mod}`}>{summary.moderate}</p></div>
            <div className={styles["sum-card"]}><p className={styles.sk}>Low Risk</p><p className={`${styles.sv} ${styles.dot} ${styles.low}`}>{summary.low}</p></div>
            <div className={styles["sum-card"]}><p className={styles.sk}>Avg Probability</p><p className={styles.sv}>{summary.avg}</p></div>
          </section>

          <div className={styles["filter-bar"]}>
            {pills.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`${styles.fpill} ${filter === p.key ? styles.active : ""}`}
                onClick={() => {
                  setFilter(p.key);
                  setPage(0);
                }}
              >
                {p.color && <span className={styles.fd} style={{ background: p.color }} />}
                {p.label}
              </button>
            ))}
            <span className={styles["filter-spacer"]} />
            <span className={styles.finput}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.5-4.5" />
              </svg>
              <input
                type="text"
                placeholder="Search by location..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </span>
            <button
              type="button"
              className={styles.fselect}
              onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
            >
              {sort === "newest" ? "Newest first" : "Oldest first"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          <div className={styles["table-card"]}>
            <table className={styles.htable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date &amp; Time</th>
                  <th>Location</th>
                  <th>Risk Level</th>
                  <th>Probability</th>
                  <th>Key Factor</th>
                  <th className={styles.right}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => {
                  const isOpen = expanded === p._id;
                  const maxC = Math.max(...p.topFactors.map((f) => f.contribution), 1);
                  const sumC = p.topFactors.reduce((s, f) => s + f.contribution, 0) || 1;
                  return (
                    <FragmentRow key={p._id}>
                      <tr>
                        <td className={styles["c-id"]}>#{p._id.slice(-4)}</td>
                        <td className={styles["c-date"]}>{fmtDate(p.createdAt)}</td>
                        <td className={styles["c-loc"]}>{p.locationName ?? "—"}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[badgeClass[p.riskLevel]]}`}>
                            {p.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className={styles["c-prob"]}>{pct(p.probability)}</td>
                        <td className={styles["c-factor"]}>{p.topFactors[0]?.feature ?? "—"}</td>
                        <td>
                          <div className={styles["actions-cell"]}>
                            <button
                              type="button"
                              className={styles.act}
                              title={isOpen ? "Hide details" : "View details"}
                              onClick={() => setExpanded(isOpen ? null : p._id)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                {isOpen ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
                              </svg>
                            </button>
                            <button
                              type="button"
                              className={`${styles.act} ${styles.del}`}
                              title="Delete"
                              onClick={() => onDelete(p._id)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className={styles["exp-row"]}>
                          <td colSpan={7}>
                            <div className={styles["exp-inner"]}>
                              <div className={styles["exp-grid-wrap"]}>
                                <div>
                                  <p className={styles["exp-chart-title"]}>Input Parameters</p>
                                  <div className={styles["exp-params"]}>
                                    {paramRows(p).map((r) => (
                                      <div key={r.label} className={styles["exp-param"]}>
                                        {r.label} <strong>{r.value}</strong>
                                      </div>
                                    ))}
                                  </div>
                                  <p className={styles["exp-model"]}>
                                    Confidence: <strong>{pct(p.probability)}</strong>
                                    {" · "}Predicted: <strong>{fmtDate(p.createdAt)}</strong>
                                    {" · "}Source: <strong>{p.weatherSource}</strong>
                                  </p>
                                </div>
                                <div>
                                  <p className={styles["exp-chart-title"]}>Contributing Factors</p>
                                  {p.topFactors.length === 0 ? (
                                    <p className={styles["c-factor"]}>No factor breakdown.</p>
                                  ) : (
                                    [...p.topFactors]
                                      .sort((a, b) => b.contribution - a.contribution)
                                      .map((f) => (
                                        <div key={f.feature} className={styles["efi-row"]}>
                                          <span className={styles.en}>{f.feature}</span>
                                          <div className={styles["efi-track"]}>
                                            <div
                                              className={styles["efi-fill"]}
                                              style={{ width: `${(f.contribution / maxC) * 100}%` }}
                                            />
                                          </div>
                                          <span className={styles.ev}>
                                            {Math.round((f.contribution / sumC) * 100)}%
                                          </span>
                                        </div>
                                      ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  );
                })}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <span className={styles["pg-info"]}>
                Showing {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
                {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
                predictions
              </span>
              <div className={styles["pg-btns"]}>
                <button
                  type="button"
                  className={styles["pg-btn"]}
                  aria-label="Previous"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles["pg-btn"]} ${i === safePage ? styles.active : ""}`}
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles["pg-btn"]}
                  aria-label="Next"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage(safePage + 1)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/** Groups the main row and its expandable detail row without extra DOM. */
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
