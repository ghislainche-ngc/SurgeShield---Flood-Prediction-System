import styles from "./landing.module.css";

/*
 * The "Principles" / values section from designs/01-landing.html. It wasn't in
 * the named component list, but the design includes it, so it's reproduced here
 * as its own landing component.
 */
export default function ValuesSection() {
  return (
    <section className={styles.values}>
      <div className={styles.container}>
        <div className={styles["section-head"]}>
          <span className={styles["section-eyebrow"]}>Principles</span>
          <h2>Grounded in clearer standards</h2>
        </div>
        <div className={styles["values-grid"]}>
          <div className={styles["value-card"]}>
            <span className={styles["value-icon"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <ellipse cx="12" cy="6" rx="7" ry="3" />
                <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
              </svg>
            </span>
            <h3>Open Data</h3>
            <p>Built on publicly available environmental datasets.</p>
          </div>
          <div className={styles["value-card"]}>
            <span className={styles["value-icon"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1.3 1.5 1.5 2.5h5c.2-1 .7-1.8 1.5-2.5A6 6 0 0 0 12 3z" />
              </svg>
            </span>
            <h3>Transparent AI</h3>
            <p>Every prediction explains which factors drove the result.</p>
          </div>
          <div className={styles["value-card"]}>
            <span className={styles["value-icon"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
              </svg>
            </span>
            <h3>Global Transferability</h3>
            <p>Model trained on universal physics — works across geographies.</p>
          </div>
          <div className={styles["value-card"]}>
            <span className={styles["value-icon"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="6" rx="2" />
                <rect x="3" y="14" width="18" height="6" rx="2" />
                <circle cx="7" cy="7" r="0.5" fill="currentColor" />
                <circle cx="7" cy="17" r="0.5" fill="currentColor" />
              </svg>
            </span>
            <h3>Production Deployed</h3>
            <p>HTTPS, VPS, Nginx — not just a research prototype.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
