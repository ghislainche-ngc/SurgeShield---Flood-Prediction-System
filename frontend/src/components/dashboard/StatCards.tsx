"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./dashboard.module.css";

/*
 * Overview stat cards, live from Convex. Prediction Accuracy stays "—" (never a
 * hard-coded figure — it comes from the ML API's metrics.json once wired,
 * PROJECT_STRUCTURE.md rule #2). "…" shows while a query is loading.
 */
const ACCURACY = "—";

export default function StatCards() {
  const stats = useQuery(api.predictions.getPredictionStats);
  const locations = useQuery(api.locations.getUserLocations);

  const num = (v: number | undefined) => (v === undefined ? "…" : String(v));
  const thisWeek = stats?.thisWeek ?? 0;

  return (
    <section className={styles.stats} aria-label="Overview statistics">
      <div className={styles["stat-card"]}>
        <div className={styles["stat-head"]}>
          <span className={styles["stat-title"]}>Total Predictions</span>
          <span className={`${styles["stat-icon"]} ${styles["ic-teal"]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4.5" />
              <circle cx="12" cy="12" r="0.8" fill="currentColor" />
            </svg>
          </span>
        </div>
        <p className={styles["stat-num"]}>{num(stats?.total)}</p>
        {thisWeek > 0 ? (
          <p className={styles["stat-delta"]}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
            {thisWeek} this week
          </p>
        ) : (
          <p className={`${styles["stat-delta"]} ${styles.neutral}`}>No new this week</p>
        )}
      </div>

      <div className={styles["stat-card"]}>
        <div className={styles["stat-head"]}>
          <span className={styles["stat-title"]}>Locations Monitored</span>
          <span className={`${styles["stat-icon"]} ${styles["ic-blue"]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </span>
        </div>
        <p className={styles["stat-num"]}>{num(locations?.length)}</p>
        <p className={`${styles["stat-delta"]} ${styles.neutral}`}>Saved for monitoring</p>
      </div>

      <div className={styles["stat-card"]}>
        <div className={styles["stat-head"]}>
          <span className={styles["stat-title"]}>High Risk Alerts</span>
          <span className={`${styles["stat-icon"]} ${styles["ic-amber"]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.3 3.8L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v5M12 17.5v.2" />
            </svg>
          </span>
        </div>
        <p className={styles["stat-num"]}>{num(stats?.highRisk)}</p>
        <p className={`${styles["stat-delta"]} ${styles.neutral}`}>High or critical</p>
      </div>

      <div className={styles["stat-card"]}>
        <div className={styles["stat-head"]}>
          <span className={styles["stat-title"]}>Prediction Accuracy</span>
          <span className={`${styles["stat-icon"]} ${styles["ic-green"]}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
        </div>
        {/* placeholder — real accuracy comes from metrics.json */}
        <p className={styles["stat-num"]}>{ACCURACY}</p>
        <p className={`${styles["stat-delta"]} ${styles.neutral}`}>Logistic Regression</p>
      </div>
    </section>
  );
}
