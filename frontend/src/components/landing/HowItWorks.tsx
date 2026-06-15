import styles from "./landing.module.css";

export default function HowItWorks() {
  return (
    <section className={styles.how} id="how">
      <div className={styles.container}>
        <div className={styles["section-head"]}>
          <span className={styles["section-eyebrow"]}>The Process</span>
          <h2>How SurgeShield Works</h2>
          <p>Three simple steps from data to protection</p>
        </div>
        <div className={styles["steps-grid"]}>
          <div className={styles["step-card"]}>
            <div className={styles["step-top"]}>
              <span className={styles["step-num"]}>01</span>
              <span className={styles["step-icon"]}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <path d="M9 3.5V2h6v1.5M9 9h6M9 13h6M9 17h4" />
                </svg>
              </span>
            </div>
            <h3>Input Environmental Data</h3>
            <p>
              Enter rainfall, temperature, river discharge, elevation, soil type
              and other parameters for your location.
            </p>
          </div>
          <div className={styles["step-card"]}>
            <div className={styles["step-top"]}>
              <span className={styles["step-num"]}>02</span>
              <span className={styles["step-icon"]}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 4a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 6 11a3.5 3.5 0 0 0 .5 6.9A3 3 0 0 0 12 20a3 3 0 0 0 5.5-2.1A3.5 3.5 0 0 0 18 11a3.5 3.5 0 0 0-3-3.5V7a3 3 0 0 0-3-3z" />
                  <path
                    d="M12 4v16M8.5 9.5h-2M17.5 9.5h-2M8.5 15h-2M17.5 15h-2"
                    strokeWidth="1.4"
                  />
                </svg>
              </span>
            </div>
            <h3>AI Analyzes &amp; Predicts</h3>
            <p>
              Our XGBoost model processes your data against 10,000 training
              observations to classify flood risk.
            </p>
          </div>
          <div className={styles["step-card"]}>
            <div className={styles["step-top"]}>
              <span className={styles["step-num"]}>03</span>
              <span className={styles["step-icon"]}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
            </div>
            <h3>Get Actionable Results</h3>
            <p>
              Receive flood probability, risk level, and the top contributing
              factors driving the prediction.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
