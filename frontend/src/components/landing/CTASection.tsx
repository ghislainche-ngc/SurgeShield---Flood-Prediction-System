import Link from "next/link";
import styles from "./landing.module.css";

export default function CTASection() {
  return (
    <section className={styles.cta} id="contact">
      <div className={styles.container}>
        <div className={styles["cta-inner"]}>
          <h2>Ready to protect any community, anywhere?</h2>
          <p>Start predicting flood risk for free with SurgeShield.</p>
          <div className={styles["cta-buttons"]}>
            <Link
              href="/sign-up"
              className={`${styles.btn} ${styles["btn-white"]}`}
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className={`${styles.btn} ${styles["btn-ghost-light"]}`}
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
