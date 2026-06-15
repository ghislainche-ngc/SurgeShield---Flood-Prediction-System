"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./dashboard.module.css";
import { riskBadgeKey } from "./risk";

function MapPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function RecentPredictions() {
  const rows = useQuery(api.predictions.getRecentPredictions, { limit: 5 });

  return (
    <div className={styles.card}>
      <div className={styles["card-head"]}>
        <h2>Recent Predictions</h2>
        <Link href="/history" className={styles["card-link"]}>
          View All History →
        </Link>
      </div>
      <div className={styles["pred-list"]}>
        {rows === undefined ? (
          <p className={styles.empty}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.empty}>No predictions yet — run your first one.</p>
        ) : (
          rows.map((p) => (
            <div key={p._id} className={styles["pred-row"]}>
              <div className={styles["pred-loc"]}>
                <span className={styles["pred-pin"]}>
                  <MapPin />
                </span>
                <span>{p.locationName ?? "Unnamed location"}</span>
              </div>
              <span className={styles["pred-date"]}>{fmtDate(p.createdAt)}</span>
              <span className={`${styles.badge} ${styles[riskBadgeKey[p.riskLevel]]}`}>
                {p.riskLevel}
              </span>
              <span className={styles["pred-prob"]}>{Math.round(p.probability * 100)}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
