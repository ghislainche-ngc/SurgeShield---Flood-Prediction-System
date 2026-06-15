import Link from "next/link";
import styles from "./auth.module.css";

/*
 * Model-performance numbers must never be hard-coded (PROJECT_STRUCTURE.md
 * rule #2) — they render from the ML API's real metrics.json. Until that's
 * wired, show a neutral placeholder. The design's "93.2% Accuracy" lived here.
 * "Powered by XGBoost" and "10,000+ Training Observations" are kept verbatim.
 * TODO: fetch from /model-info and replace ACCURACY.
 */
const ACCURACY = "—";

/** Left split-screen panel shared by the sign-in and sign-up pages. */
export default function AuthVisualPanel() {
  return (
    <aside className={styles.visual}>
      <Link href="/" className={styles.logo} aria-label="SurgeShield home">
        <span className={styles["logo-mark"]}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
            <path
              d="M8 11.5c1-.8 2-.8 3 0s2 .8 3 0 1.5-.6 2-.3"
              strokeWidth="1.6"
            />
          </svg>
        </span>
        SurgeShield
      </Link>

      <div className={styles["visual-quote"]}>
        <blockquote>
          &ldquo;Every prediction is a chance to <span>protect a life</span>.&rdquo;
        </blockquote>
        <div className={styles["visual-meta"]}>
          <span>Powered by XGBoost</span>
          <span className={styles.dot} aria-hidden="true" />
          {/* placeholder — real accuracy comes from metrics.json */}
          <span>{ACCURACY} Accuracy</span>
          <span className={styles.dot} aria-hidden="true" />
          <span>10,000+ Training Observations</span>
        </div>
      </div>

      <p className={styles["visual-foot"]}>
        © 2026 SurgeShield · Global Flood Intelligence
      </p>

      <svg
        className={styles.contours}
        viewBox="0 0 560 560"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="#14b8a6" strokeOpacity="0.35" strokeWidth="1.3">
          <path d="M280 120c100 0 190 62 190 160s-90 160-190 160S90 378 90 280s90-160 190-160z" />
          <path d="M280 160c80 0 150 49 150 120s-70 120-150 120-150-49-150-120 70-120 150-120z" />
          <path d="M280 200c58 0 110 35 110 80s-52 80-110 80-110-35-110-80 52-80 110-80z" />
          <path d="M280 240c36 0 70 18 70 40s-34 40-70 40-70-18-70-40 34-40 70-40z" />
          <path d="M40 460c70-36 160-44 250-6s180 42 270-4" />
          <path d="M40 500c70-36 160-44 250-6s180 42 270-4" />
          <path d="M40 60c70-36 160-44 250-6s180 42 270-4" />
        </g>
      </svg>
    </aside>
  );
}
