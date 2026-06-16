import Link from "next/link";
import Footer from "@/components/layout/Footer";
import styles from "./about.module.css";

/*
 * Model-performance numbers are never hard-coded — they render from the ML
 * API's real metrics.json (PROJECT_STRUCTURE.md rule #2). The design showed
 * "XGBoost at 93.2% accuracy"; the number is a placeholder until the API is
 * wired. TODO: replace ACCURACY with the value from /model-info.
 */
const ACCURACY = "—";

export const metadata = {
  title: "How It Works — SurgeShield",
  description:
    "From raw environmental data to life-saving predictions — SurgeShield's methodology, technology stack, and mission.",
};

const ShieldLogo = ({ stroke = "#fff" }: { stroke?: string }) => (
  <span className={styles["logo-mark"]}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
      <path d="M8 11.5c1-.8 2-.8 3 0s2 .8 3 0 1.5-.6 2-.3" strokeWidth="1.6" />
    </svg>
  </span>
);

const techStack = [
  {
    name: "Python",
    desc: "ML pipeline core",
    icon: (
      <path d="M12 3c-3 0-3 2-3 3v2h6M12 3c3 0 3 2 3 3M9 8H6c-1 0-3 0-3 4s2 4 3 4h2M12 21c3 0 3-2 3-3v-2H9M15 16h3c1 0 3 0 3-4s-2-4-3-4h-2" />
    ),
  },
  {
    name: "Flask",
    desc: "REST ML API",
    icon: <path d="M4 4h16v5H4zM4 13h10v7H4z" />,
  },
  {
    name: "scikit-learn",
    desc: "Model training",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" strokeWidth="1.3" />
      </>
    ),
  },
  {
    name: "XGBoost",
    desc: "Best classifier",
    icon: <path d="M3 21h18M7 21V9M12 21V4M17 21v-8" />,
  },
  {
    name: "Next.js",
    desc: "Web frontend",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M5 8l7 12 7-12" />
      </>
    ),
  },
  {
    name: "React",
    desc: "UI components",
    icon: (
      <>
        <circle cx="12" cy="12" r="2.2" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </>
    ),
  },
  {
    name: "Convex",
    desc: "Database",
    icon: <path d="M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7" />,
  },
  {
    name: "Clerk",
    desc: "Authentication",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  },
  {
    name: "Leaflet.js",
    desc: "Interactive maps",
    icon: (
      <>
        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  {
    name: "Recharts",
    desc: "Data viz",
    icon: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-5 3 3 5-7" />
      </>
    ),
  },
  {
    name: "Nginx",
    desc: "Reverse proxy",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="6" rx="1.5" />
        <rect x="3" y="14" width="18" height="6" rx="1.5" />
        <circle cx="7" cy="7" r="0.5" fill="currentColor" />
        <circle cx="7" cy="17" r="0.5" fill="currentColor" />
      </>
    ),
  },
  {
    name: "Let's Encrypt",
    desc: "HTTPS / SSL",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        <path d="M12 15v2" />
      </>
    ),
  },
];

const Arrow = () => (
  <div className={styles["pipe-arrow"]}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  </div>
);

export default function AboutPage() {
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
                <Link href="/about" className={styles.active}>
                  About
                </Link>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
            <div className={styles["nav-right"]}>
              <Link
                href="/sign-in"
                className={`${styles.btn} ${styles["btn-primary"]}`}
              >
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <header className={styles.hero}>
        <div className={styles.container}>
          <h1>How SurgeShield Works</h1>
          <p>
            From raw environmental data to life-saving predictions — powered by
            machine learning.
          </p>
        </div>
      </header>

      {/* ============ THE PROBLEM ============ */}
      <section className={styles.section}>
        <div className={`${styles.container} ${styles.split}`}>
          <div>
            <span className={styles["section-eyebrow"]}>The Problem</span>
            <h2>Flooding affects 250 million people every year</h2>
            <p>
              From Bangkok to Houston, Jakarta to Lagos — communities worldwide
              face recurrent flooding with minimal early warning. Traditional
              hydrological models require expensive infrastructure, specialized
              expertise, and dense sensor networks that most regions simply
              cannot afford. SurgeShield changes that, turning a handful of
              measurable environmental signals into an instant, interpretable
              flood-risk assessment that runs anywhere.
            </p>
          </div>
          <div
            className={styles["split-img"]}
            role="img"
            aria-label="A flooded village street"
          />
        </div>
      </section>

      {/* ============ METHODOLOGY ============ */}
      <section className={`${styles.section} ${styles.methodology}`}>
        <div className={styles.container}>
          <div className={styles["section-head-center"]}>
            <span className={styles["section-eyebrow"]}>Our Methodology</span>
            <h2>Three stages from data to deployment</h2>
          </div>
          <div className={styles.pipeline}>
            <div className={styles["pipe-card"]}>
              <div className={styles["pipe-icon"]}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <ellipse cx="12" cy="6" rx="8" ry="3" />
                  <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
                </svg>
              </div>
              <p className={styles["pipe-step"]}>STEP 01</p>
              <h3>Data Collection</h3>
              <p>
                10,000 real-world flood observations, each with 11 environmental
                features — rainfall, river discharge, elevation, soil type and
                more.
              </p>
            </div>
            <Arrow />
            <div className={styles["pipe-card"]}>
              <div className={styles["pipe-icon"]}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 4a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 6 11a3.5 3.5 0 0 0 .5 6.9A3 3 0 0 0 12 20a3 3 0 0 0 5.5-2.1A3.5 3.5 0 0 0 18 11a3.5 3.5 0 0 0-3-3.5V7a3 3 0 0 0-3-3z" />
                  <path d="M12 4v16" strokeWidth="1.4" />
                </svg>
              </div>
              <p className={styles["pipe-step"]}>STEP 02</p>
              <h3>Model Training</h3>
              <p>
                Three ML algorithms compared head-to-head: Logistic Regression,
                Random Forest and XGBoost.
              </p>
            </div>
            <Arrow />
            <div className={styles["pipe-card"]}>
              <div className={styles["pipe-icon"]}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 13l-2 6 6-2M14.5 4.5C16 3 19 2 21 2s1 3-.5 6.5c-1.2 2.8-4 5.5-7.5 8L9 13c2.5-3.5 4-6.3 5.5-8.5z" />
                  <circle cx="15" cy="9" r="1.4" />
                </svg>
              </div>
              <p className={styles["pipe-step"]}>STEP 03</p>
              <h3>Deployment</h3>
              <p>
                {/* placeholder — real accuracy comes from metrics.json */}
                The best model — XGBoost at {ACCURACY}% accuracy — is served
                through a production REST API on a live VPS, behind HTTPS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TECH STACK ============ */}
      <section className={styles.section} id="features">
        <div className={styles.container}>
          <div className={styles["section-head-center"]}>
            <span className={styles["section-eyebrow"]}>
              The Technology Stack
            </span>
            <h2>Built on proven, production-grade tools</h2>
          </div>
          <div className={styles["tech-grid"]}>
            {techStack.map((tech) => (
              <div className={styles["tech-card"]} key={tech.name}>
                <span className={styles["tech-logo"]}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {tech.icon}
                  </svg>
                </span>
                <div>
                  <p className={styles.tn}>{tech.name}</p>
                  <p className={styles.td}>{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY IT MATTERS ============ */}
      <section className={`${styles.section} ${styles.matters}`}>
        <div className={styles.container}>
          <div className={styles["section-head-center"]}>
            <span className={styles["section-eyebrow"]}>Why It Matters</span>
            <h2>Aligned with Global Goals</h2>
          </div>
          <div className={styles["sdg-grid"]}>
            <div className={styles["sdg-card"]}>
              <div className={`${styles["sdg-num"]} ${styles["sdg-11"]}`}>
                <div>
                  <div className={styles.n}>11</div>
                  <div className={styles.s}>SDG</div>
                </div>
              </div>
              <div>
                <h3>Sustainable Cities &amp; Communities</h3>
                <p>
                  Building resilience to natural disasters and reducing the human
                  and economic toll of flooding on urban populations.
                </p>
              </div>
            </div>
            <div className={styles["sdg-card"]}>
              <div className={`${styles["sdg-num"]} ${styles["sdg-13"]}`}>
                <div>
                  <div className={styles.n}>13</div>
                  <div className={styles.s}>SDG</div>
                </div>
              </div>
              <div>
                <h3>Climate Action</h3>
                <p>
                  Strengthening adaptive capacity to climate-related hazards and
                  natural disasters across vulnerable regions.
                </p>
              </div>
            </div>
          </div>
          <p className={styles["matters-text"]}>
            SurgeShield demonstrates that AI-powered disaster prediction can be
            made accessible, interpretable, and deployable anywhere in the world
            — from developed nations to underserved communities.
          </p>
        </div>
      </section>

      {/* ============ TEAM ============ */}
      <section className={`${styles.section} ${styles.team}`} id="contact">
        <div className={styles.container}>
          <div className={styles["team-card"]}>
            <div className={styles["team-seal"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3l9 5-9 5-9-5 9-5z" />
                <path d="M7 10.5V15c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5M21 8v5" />
              </svg>
            </div>
            <h2>Built as a Final Year Defense Project</h2>
            <p>
              <span className={styles.accent}>ICT University, Cameroon</span>
            </p>
            <p>Faculty of Information and Communication Technology</p>
            <p>Department of Software Engineering · Class of 2026</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
