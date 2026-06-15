import Link from "next/link";
import styles from "./landing.module.css";

/*
 * Model-performance numbers must never be hard-coded — they render from the
 * ML API's real metrics.json (PROJECT_STRUCTURE.md rule #2). Until the API is
 * wired, show a neutral placeholder. The design's "93.2%" lived here.
 * TODO: fetch from /model-info and replace ACCURACY.
 */
const ACCURACY = "—";

export default function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles.container}>
        <nav className={styles.nav}>
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
          <ul className={styles["nav-links"]}>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <a href="#how">How It Works</a>
            </li>
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ul>
          <Link
            href="/sign-up"
            className={`${styles.btn} ${styles["btn-primary"]}`}
          >
            Get Started
          </Link>
        </nav>
      </div>

      <div className={`${styles.container} ${styles["hero-body"]}`}>
        <span className={styles["hero-badge"]}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          AI-Powered Flood Intelligence
        </span>
        <h1>
          Predict Floods <em>Before</em> They Strike
        </h1>
        <p className={styles["hero-sub"]}>
          SurgeShield uses machine learning to analyze environmental data —
          rainfall, river levels, elevation, soil type — and predicts flood risk
          in real-time. Protecting communities, saving lives.
        </p>
        <div className={styles["hero-ctas"]}>
          <Link
            href="/sign-up"
            className={`${styles.btn} ${styles["btn-primary"]}`}
          >
            Start Predicting
            <svg
              className={styles.icon}
              style={{ width: 17, height: 17 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <a
            href="#how"
            className={`${styles.btn} ${styles["btn-ghost-light"]}`}
          >
            Learn More
          </a>
        </div>
        <div className={styles["hero-proof"]}>
          <span>
            <strong>10,000+</strong> Data Points Analyzed
          </span>
          <span className={styles.dot} aria-hidden="true" />
          <span>
            {/* placeholder — real accuracy comes from metrics.json */}
            <strong>{ACCURACY}</strong> Prediction Accuracy
          </span>
          <span className={styles.dot} aria-hidden="true" />
          <span>
            <strong>5</strong> ML Models Compared
          </span>
        </div>
      </div>
    </header>
  );
}
