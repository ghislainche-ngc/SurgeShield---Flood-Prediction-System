"use client";

import styles from "./settings.module.css";
import type { Prefs } from "./SettingsView";

type Toggle = {
  key: "notifyHighRisk" | "notifyWeekly" | "notifyProduct";
  title: string;
  sub: string;
};

const TOGGLES: Toggle[] = [
  {
    key: "notifyHighRisk",
    title: "High & Critical prediction alerts",
    sub: "Email me the moment a prediction lands in the High or Critical band.",
  },
  {
    key: "notifyWeekly",
    title: "Weekly risk summary",
    sub: "A Monday digest of your saved locations and their latest risk levels.",
  },
  {
    key: "notifyProduct",
    title: "Product & model updates",
    sub: "News about new features and model retraining. No more than once a month.",
  },
];

export default function NotificationsSection({
  settings,
  onChange,
}: {
  settings: Prefs | null | undefined;
  onChange: (patch: Partial<Prefs>) => void;
}) {
  const loading = settings === undefined;

  return (
    <section className={styles.card} id="notifications">
      <div className={styles["card-head"]}>
        <h2>Notifications</h2>
        <p>Choose what SurgeShield emails you about.</p>
      </div>
      <div
        className={styles["card-body"]}
        style={{ paddingTop: 8, paddingBottom: 12 }}
      >
        {TOGGLES.map((t) => {
          const on = settings ? settings[t.key] : false;
          return (
            <div key={t.key} className={styles["toggle-row"]}>
              <div>
                <p className={styles["t-title"]}>{t.title}</p>
                <p className={styles["t-sub"]}>{t.sub}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={t.title}
                disabled={loading}
                className={`${styles.switch} ${on ? styles.on : ""}`}
                onClick={() => onChange({ [t.key]: !on } as Partial<Prefs>)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
