"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./settings.module.css";
import ProfileSection from "./ProfileSection";
import NotificationsSection from "./NotificationsSection";
import UnitsSection from "./UnitsSection";
import SecuritySection from "./SecuritySection";

/** Shared shape of the user's preferences (mirrors convex/settings.ts). */
export type Prefs = {
  notifyHighRisk: boolean;
  notifyWeekly: boolean;
  notifyProduct: boolean;
  units: "metric" | "imperial";
  tempUnit: "C" | "F";
  mapStyle: "dark" | "light";
  landingPage: string;
};

export default function SettingsView() {
  const settings = useQuery(api.settings.getMySettings);
  const updateSettings = useMutation(api.settings.updateMySettings);

  // Persist a single changed preference; the live query reflects it back.
  const update = (patch: Partial<Prefs>) => {
    void updateSettings(patch);
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>Settings</h1>
          <p>Manage your account, preferences, and data.</p>
        </div>
        <button className={styles.bell} aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 9a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
            <path d="M10.3 20a2 2 0 0 0 3.4 0" />
          </svg>
        </button>
      </div>

      <div className={styles.settings}>
        <div className={styles.panels}>
          <ProfileSection />
          <NotificationsSection settings={settings} onChange={update} />
          <UnitsSection settings={settings} onChange={update} />
          <SecuritySection />
        </div>
      </div>
    </>
  );
}
