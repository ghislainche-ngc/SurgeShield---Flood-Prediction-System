"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./dashboard.module.css";
import { riskBadgeKey } from "./risk";

function MapPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

const fmtCoords = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;

export default function SavedLocations() {
  const locations = useQuery(api.locations.getUserLocations);

  return (
    <section className={styles.card} aria-label="Saved locations">
      <div className={styles["card-head"]}>
        <h2>Saved Locations</h2>
        <Link href="/map" className={styles["card-link"]}>
          Open Map View →
        </Link>
      </div>
      <div className={styles["saved-grid"]}>
        {/* Live map (mapcn / MapLibre GL) is deferred to the Map View page. */}
        <div
          className={styles["map-placeholder"]}
          role="img"
          aria-label="Map of saved locations — available on the Map View page"
        >
          <div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
              <path d="M9 4v14M15 6v14" />
            </svg>
            <p>Interactive map</p>
            <p className={styles.hint}>Open Map View to explore</p>
          </div>
        </div>
        <div className={styles["saved-list"]}>
          {locations === undefined ? (
            <p className={styles.empty}>Loading…</p>
          ) : locations.length === 0 ? (
            <p className={styles.empty}>No saved locations yet.</p>
          ) : (
            locations.map((loc) => (
              <div key={loc._id} className={styles["saved-row"]}>
                <span className={styles["pred-pin"]}>
                  <MapPin />
                </span>
                <div className={styles["saved-meta"]}>
                  <p className={styles.place}>{loc.name}</p>
                  <p className={styles.coords}>{fmtCoords(loc.latitude, loc.longitude)}</p>
                </div>
                <span className={`${styles.badge} ${styles[riskBadgeKey[loc.lastRiskLevel]]}`}>
                  {loc.lastRiskLevel}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
