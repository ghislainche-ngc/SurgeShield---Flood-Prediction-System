"use client";

import styles from "./settings.module.css";
import type { Prefs } from "./SettingsView";

const LANDING_OPTIONS = [
  { value: "/dashboard", label: "Dashboard" },
  { value: "/predict", label: "Predict" },
  { value: "/map", label: "Map View" },
  { value: "/history", label: "History" },
];

/** A two-option pill segment bound to one preference key. */
function Segment<T extends string>({
  value,
  options,
  disabled,
  onSelect,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  disabled: boolean;
  onSelect: (v: T) => void;
  label: string;
}) {
  return (
    <div className={styles.segment} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.value}
          className={value === o.value ? styles.on : ""}
          onClick={() => onSelect(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function UnitsSection({
  settings,
  onChange,
}: {
  settings: Prefs | null | undefined;
  onChange: (patch: Partial<Prefs>) => void;
}) {
  const loading = settings === undefined;
  const s: Prefs = settings ?? {
    notifyHighRisk: true,
    notifyWeekly: true,
    notifyProduct: false,
    units: "metric",
    tempUnit: "C",
    mapStyle: "dark",
    landingPage: "/dashboard",
  };

  return (
    <section className={styles.card} id="units">
      <div className={styles["card-head"]}>
        <h2>Units &amp; Display</h2>
        <p>How measurements and the app are presented to you.</p>
      </div>
      <div
        className={styles["card-body"]}
        style={{ paddingTop: 8, paddingBottom: 12 }}
      >
        <div className={styles["seg-row"]}>
          <div>
            <p className={styles["t-title"]}>Measurement units</p>
            <p className={styles["t-sub"]}>
              Affects rainfall, river discharge, elevation and water level.
            </p>
          </div>
          <Segment
            label="Measurement units"
            value={s.units}
            disabled={loading}
            options={[
              { value: "metric", label: "Metric" },
              { value: "imperial", label: "Imperial" },
            ]}
            onSelect={(v) => onChange({ units: v })}
          />
        </div>

        <div className={styles["seg-row"]}>
          <div>
            <p className={styles["t-title"]}>Temperature</p>
            <p className={styles["t-sub"]}>Unit used on prediction inputs and results.</p>
          </div>
          <Segment
            label="Temperature unit"
            value={s.tempUnit}
            disabled={loading}
            options={[
              { value: "C", label: "°C" },
              { value: "F", label: "°F" },
            ]}
            onSelect={(v) => onChange({ tempUnit: v })}
          />
        </div>

        <div className={styles["seg-row"]}>
          <div>
            <p className={styles["t-title"]}>Default map style</p>
            <p className={styles["t-sub"]}>
              Basemap used on the Map View and dashboard mini-map.
            </p>
          </div>
          <Segment
            label="Map style"
            value={s.mapStyle}
            disabled={loading}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
            onSelect={(v) => onChange({ mapStyle: v })}
          />
        </div>

        <div className={styles["seg-row"]}>
          <div>
            <p className={styles["t-title"]}>Default landing page</p>
            <p className={styles["t-sub"]}>Where you land right after signing in.</p>
          </div>
          <select
            className={styles.select}
            aria-label="Default landing page"
            value={s.landingPage}
            disabled={loading}
            onChange={(e) => onChange({ landingPage: e.target.value })}
          >
            {LANDING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
