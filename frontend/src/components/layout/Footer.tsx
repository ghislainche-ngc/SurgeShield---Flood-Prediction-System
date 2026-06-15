import Link from "next/link";
import styles from "./Footer.module.css";

const ShieldLogo = () => (
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
);

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles["footer-top"]}>
          <div className={styles["footer-brand"]}>
            <Link href="/" className={styles.logo}>
              <ShieldLogo />
              SurgeShield
            </Link>
            <p>
              AI-powered flood prediction making disaster intelligence
              accessible to every community.
            </p>
          </div>
          <div className={styles["footer-cols"]}>
            <div className={styles["footer-col"]}>
              <h4>Product</h4>
              <ul>
                <li>
                  <a href="#">Prediction Engine</a>
                </li>
                <li>
                  <a href="#">Risk Map</a>
                </li>
                <li>
                  <a href="#">Analytics</a>
                </li>
              </ul>
            </div>
            <div className={styles["footer-col"]}>
              <h4>Company</h4>
              <ul>
                <li>
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/about">Methodology</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
              </ul>
            </div>
            <div className={styles["footer-col"]}>
              <h4>Resources</h4>
              <ul>
                <li>
                  <a href="#">Documentation</a>
                </li>
                <li>
                  <a href="#">API Status</a>
                </li>
                <li>
                  <a href="#">Open Data</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className={styles["footer-bottom"]}>
          <span>© 2026 SurgeShield · Global Flood Intelligence</span>
          <span>Built at ICT University, Cameroon</span>
        </div>
      </div>
    </footer>
  );
}
