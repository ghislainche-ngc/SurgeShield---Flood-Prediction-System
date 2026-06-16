import styles from "./landing.module.css";
import LandingAccuracy from "./LandingAccuracy";

/*
 * The first two cards are cited global flood facts (WHO / World Bank) and are
 * shown as-is. The third card is SurgeShield's own model accuracy — a
 * model-performance stat — rendered live from the real metrics.json via the ML
 * API (LandingAccuracy), never hard-coded. The design's value here was "93.2%".
 */
export default function StatsSection() {
  return (
    <section className={styles.stats} id="about">
      <div className={styles.container}>
        <div className={styles["stats-grid"]}>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-number"]}>
              2.3 <span>Billion</span>
            </div>
            <p className={styles["stat-label"]}>
              People affected by floods globally between 1998 and 2017 — more
              than any other natural disaster.
            </p>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-number"]}>
              $82 <span>Billion</span>
            </div>
            <p className={styles["stat-label"]}>
              Annual global flood damage to homes, infrastructure, and
              livelihoods.
            </p>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-number"]}>
              <LandingAccuracy mode="number" />
              <span>%</span>
            </div>
            <p className={styles["stat-label"]}>
              SurgeShield&apos;s prediction accuracy, validated on 2,000
              held-out flood observations.
            </p>
          </div>
        </div>
        <p className={styles["stats-source"]}>
          Data: WHO &nbsp;·&nbsp; World Bank &nbsp;·&nbsp; SurgeShield ML Pipeline
        </p>
      </div>
    </section>
  );
}
