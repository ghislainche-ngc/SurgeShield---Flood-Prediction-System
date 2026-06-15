import Link from "next/link";
import styles from "./dashboard.module.css";

export default function QuickPredict() {
  return (
    <div className={styles.quick}>
      <span className={styles["quick-icon"]}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17.5 13a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.6 1.5A4.2 4.2 0 0 0 7.5 13h10z" />
          <path d="M8 16.5l-1 2.5M12.5 16.5l-1 2.5M17 16.5l-1 2.5" />
        </svg>
      </span>
      <h2>Run a new flood prediction</h2>
      <p>Enter environmental data to assess flood risk for any location in the world.</p>
      <Link href="/predict" className={styles["btn-quick"]}>
        Start Prediction
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
