import Link from "next/link";
import Footer from "@/components/layout/Footer";
import ContactForm from "./ContactForm";
import styles from "./contact.module.css";

/*
 * Public contact page, ported from designs/11-contact.html. The form is a
 * client component (ContactForm) that persists to Convex. The design's FAQ
 * claimed "XGBoost model reaches 93.2% accuracy" — model-performance numbers
 * are never hard-coded (project rule), so the figure is the "—" placeholder
 * until the ML API's real metrics.json is wired (matches the About page).
 */
const ACCURACY = "—";

export const metadata = {
  title: "Contact — SurgeShield",
  description:
    "Questions about predictions, partnerships, or deploying SurgeShield for your community? Get in touch.",
};

const ShieldLogo = () => (
  <span className={styles["logo-mark"]}>
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
      <path d="M8 11.5c1-.8 2-.8 3 0s2 .8 3 0 1.5-.6 2-.3" strokeWidth="1.6" />
    </svg>
  </span>
);

export default function ContactPage() {
  return (
    <>
      {/* ============ NAV ============ */}
      <div className={styles["nav-wrap"]}>
        <div className={styles.container}>
          <nav className={styles.nav}>
            <Link href="/" className={styles.logo}>
              <ShieldLogo />
              SurgeShield
            </Link>
            <ul className={styles["nav-links"]}>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/about#features">Features</Link>
              </li>
              <li>
                <Link href="/contact" className={styles.active}>
                  Contact
                </Link>
              </li>
            </ul>
            <div className={styles["nav-right"]}>
              <Link href="/sign-in" className={`${styles.btn} ${styles["btn-primary"]}`}>
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <header className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6h16v12H4z" />
              <path d="M4 7l8 6 8-6" />
            </svg>
            Get In Touch
          </span>
          <h1>Let&apos;s talk flood resilience</h1>
          <p>
            Questions about predictions, partnerships, or deploying SurgeShield for
            your community? We&apos;d love to hear from you.
          </p>
        </div>
      </header>

      {/* ============ CONTACT ============ */}
      <section className={styles.section}>
        <div className={`${styles.container} ${styles["contact-grid"]}`}>
          <ContactForm />

          {/* INFO SIDE */}
          <div className={styles["info-stack"]}>
            <div className={styles["info-card"]}>
              <span className={styles["info-ic"]}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="M3.5 7l8.5 6 8.5-6" />
                </svg>
              </span>
              <div>
                <h3>Email Us</h3>
                <p>
                  <a href="mailto:hello@surgeshield.app">hello@surgeshield.app</a>
                  <br />
                  For support:{" "}
                  <a href="mailto:support@surgeshield.app">support@surgeshield.app</a>
                </p>
              </div>
            </div>

            <div className={styles["info-card"]}>
              <span className={styles["info-ic"]}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <div>
                <h3>Visit Us</h3>
                <p>
                  ICT University, Faculty of ICT
                  <br />
                  Yaoundé, Cameroon
                </p>
              </div>
            </div>

            <div className={styles["info-card"]}>
              <span className={styles["info-ic"]}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3.5 2" />
                </svg>
              </span>
              <div>
                <h3>Office Hours</h3>
                <p>
                  Monday – Friday, 8:00 AM – 5:00 PM (WAT)
                  <br />
                  The prediction API runs 24/7.
                </p>
              </div>
            </div>

            <div className={`${styles["info-card"]} ${styles["info-feature"]}`}>
              <span className={styles["response-badge"]}>
                <span className={styles.pd} /> Typically replies in &lt; 24 hours
              </span>
              <h3>Built for collaboration</h3>
              <p>
                Researchers, disaster-response agencies, and local governments —
                reach out to discuss deploying SurgeShield in your region.
              </p>
              <div className={styles.socials}>
                <a href="#" className={styles["social-btn"]} aria-label="GitHub">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.94c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .3.2.67.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
                  </svg>
                </a>
                <a href="#" className={styles["social-btn"]} aria-label="X / Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-7-6.1 7H1.6l8.2-9.3L1 2h7l4.8 6.4L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" />
                  </svg>
                </a>
                <a href="#" className={styles["social-btn"]} aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className={`${styles.section} ${styles.faq}`}>
        <div className={styles.container}>
          <div className={styles["section-head-center"]}>
            <span className={styles["section-eyebrow"]}>FAQ</span>
            <h2>Frequently asked questions</h2>
          </div>
          <div className={styles["faq-grid"]}>
            <div className={styles["faq-item"]}>
              <h3>
                <span className={styles.q}>Q.</span> Is SurgeShield free to use?
              </h3>
              <p>
                Yes — citizen monitoring and the prediction engine are free. Custom
                deployments and agency integrations are arranged on request.
              </p>
            </div>
            <div className={styles["faq-item"]}>
              <h3>
                <span className={styles.q}>Q.</span> How accurate are the predictions?
              </h3>
              {/* placeholder — real accuracy comes from metrics.json */}
              <p>
                We report transparent, cross-validated metrics rather than inflated
                figures. The live model&apos;s real accuracy ({ACCURACY}), F1, and
                ROC-AUC are shown on the Analytics page once the ML API is connected.
              </p>
            </div>
            <div className={styles["faq-item"]}>
              <h3>
                <span className={styles.q}>Q.</span> Does it work outside India?
              </h3>
              <p>
                Yes. The model learns from universal environmental physics — rainfall,
                elevation, discharge — so it transfers across geographies.
              </p>
            </div>
            <div className={styles["faq-item"]}>
              <h3>
                <span className={styles.q}>Q.</span> Can I integrate the API?
              </h3>
              <p>
                Absolutely. The Flask REST API exposes a simple <code>/predict</code>{" "}
                endpoint. Contact us for documentation and access keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
