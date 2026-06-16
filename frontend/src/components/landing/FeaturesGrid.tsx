import styles from "./landing.module.css";

export default function FeaturesGrid() {
  return (
    <section className={styles.features} id="features">
      <div className={styles.container}>
        <div className={styles["section-head"]}>
          <span className={styles["section-eyebrow"]}>Platform</span>
          <h2>Designed to live across the modern disaster response world</h2>
          <p>Every capability built for clarity, speed, and trust.</p>
        </div>
        <div className={styles["feature-grid"]}>
          <div className={styles["feature-card"]}>
            <span className={styles["feature-icon"]}>
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
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            </span>
            <h3>Prediction Engine</h3>
            <p>
              12-parameter input form with intelligent defaults and real-time ML
              prediction served by a production API.
            </p>
          </div>
          <div className={styles["feature-card"]}>
            <span className={styles["feature-icon"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
                <path d="M9 4v14M15 6v14" />
              </svg>
            </span>
            <h3>Interactive Risk Map</h3>
            <p>
              Visualize flood-prone zones with color-coded markers across 10,000
              observations on a dark-themed Leaflet map.
            </p>
          </div>
          <div className={styles["feature-card"]}>
            <span className={styles["feature-icon"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 21h18M7 21V11M12 21V7M17 21v-8" />
              </svg>
            </span>
            <h3>Analytics Dashboard</h3>
            <p>
              Compare 3 ML models, view confusion matrices, ROC curves, and
              feature importance — all in one place.
            </p>
          </div>
          <div className={styles["feature-card"]}>
            <span className={styles["feature-icon"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5s4.8 1.5 5.5 4.5" />
                <path d="M16.5 4.5a3.5 3.5 0 0 1 0 7M18 14.7c1.6.6 2.6 1.9 3 4.3" />
              </svg>
            </span>
            <h3>Role-Based Access</h3>
            <p>
              Citizen monitoring and administrator oversight, secured with Clerk
              authentication.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
