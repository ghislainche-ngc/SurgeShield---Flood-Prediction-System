"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { geocodePlaces, type GeoResult } from "@/lib/geocode";
import styles from "./predict.module.css";

type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

type Inputs = {
  rainfall: number;
  temperature: number;
  humidity: number;
  riverDischarge: number;
  waterLevel: number;
  elevation: number;
  landCover: string;
  soilType: string;
  populationDensity: number;
  infrastructure: number;
  historicalFloods: number;
};

type PredictResult = {
  id: string;
  flood: boolean;
  probability: number;
  risk_level: RiskLevel;
  top_factors: { feature: string; contribution: number }[];
  model?: string;
};

const LAND_COVER = ["Agricultural", "Desert", "Forest", "Urban", "Water Body"];
const SOIL_TYPE = ["Clay", "Loam", "Peat", "Sandy", "Silt"];

const DEFAULTS: Inputs = {
  rainfall: 250,
  temperature: 32,
  humidity: 78,
  riverDischarge: 4500,
  waterLevel: 8.2,
  elevation: 120,
  landCover: "Agricultural",
  soilType: "Clay",
  populationDensity: 5200,
  infrastructure: 1,
  historicalFloods: 1,
};

const RISK_COLOR: Record<RiskLevel, string> = {
  Low: "#16a34a",
  Moderate: "#d97706",
  High: "#dc2626",
  Critical: "#7f1d1d",
};

function Info({ text }: { text: string }) {
  return (
    <i className={styles.info} title={text}>
      i
    </i>
  );
}

function Slider({
  label,
  info,
  value,
  unit,
  min,
  max,
  step = 1,
  reverse,
  onChange,
}: {
  label: string;
  info: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  reverse?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.field}>
      <div className={styles["field-head"]}>
        <span className={styles["field-label"]}>
          {label}
          <Info text={info} />
        </span>
        <span className={styles["field-value"]}>
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        className={`${styles.slider} ${reverse ? styles.reverse : ""}`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div className={styles["range-ends"]}>
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function PredictView() {
  const runPredict = useAction(api.actions.predict);
  const saveLocation = useMutation(api.locations.saveLocation);

  // A location chosen on the map arrives as ?name=&lat=&lon= — prefill from it.
  // useSearchParams reads the same value on server + client (no hydration
  // mismatch, no effect setState); the page wraps this in <Suspense>.
  const params = useSearchParams();
  const paramName = params.get("name");
  const paramLat = params.get("lat");
  const paramLon = params.get("lon");
  const paramCoords =
    paramLat && paramLon && !Number.isNaN(+paramLat) && !Number.isNaN(+paramLon)
      ? { lat: +paramLat, lon: +paramLon }
      : null;

  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [locationName, setLocationName] = useState(
    paramName ?? "Bangkok, Thailand",
  );
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    paramCoords ?? { lat: 13.7563, lon: 100.5018 },
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [resultInputs, setResultInputs] = useState<Inputs>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  // Location search (geocode) to choose a place directly on this page.
  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState<GeoResult[]>([]);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    const q = locQuery.trim();
    let ignore = false;
    const t = setTimeout(async () => {
      if (q.length < 3) {
        setLocResults([]);
        setLocStatus("idle");
        return;
      }
      setLocStatus("loading");
      try {
        const results = await geocodePlaces(q);
        if (ignore) return;
        setLocResults(results);
        setLocStatus("done");
      } catch {
        if (ignore) return;
        setLocResults([]);
        setLocStatus("error");
      }
    }, 400);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [locQuery]);

  function selectLocation(r: GeoResult) {
    setLocationName(r.label.split(",")[0]);
    setCoords({ lat: r.lat, lon: r.lon });
    setLocQuery("");
    setLocResults([]);
    setLocStatus("idle");
  }

  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [k]: v }));

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError("Couldn't get your location."),
    );
  }

  async function analyze() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await runPredict({
        inputs,
        latitude: coords?.lat,
        longitude: coords?.lon,
        locationName: locationName.trim() || undefined,
        weatherSource: "manual",
      });
      setResultInputs(inputs);
      setResult(res as PredictResult);
      setSaved(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(
        e instanceof Error && /ML_API_URL/.test(e.message)
          ? "The ML API isn't connected yet (set ML_API_URL). Try again once the model service is reachable."
          : "Prediction failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onSaveLocation() {
    if (!result || !coords || saved) return;
    await saveLocation({
      name: locationName.trim() || "Saved location",
      latitude: coords.lat,
      longitude: coords.lon,
      lastRiskLevel: result.risk_level,
    });
    setSaved(true);
  }

  if (result) {
    return (
      <ResultView
        result={result}
        inputs={resultInputs}
        locationName={locationName}
        coords={coords}
        saved={saved}
        canSave={!!coords}
        onSave={onSaveLocation}
        onNew={() => {
          setResult(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <>
      <p className={styles.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span className={styles["sep-c"]}>›</span>
        <span className={styles.here}>Predict</span>
      </p>
      <div className={styles["page-head"]}>
        <h1>Flood Prediction Engine</h1>
        <p>
          Enter environmental parameters below. Our model analyzes the data and
          predicts flood risk for your location.
        </p>
      </div>

      <div className={styles["form-grid"]}>
        {/* LEFT: environmental parameters */}
        <section className={styles.card}>
          <h2>Environmental Parameters</h2>
          <p className={styles["card-sub"]}>Weather, hydrology and terrain conditions</p>

          <p className={styles["group-label"]}>Weather &amp; Hydrology</p>
          <Slider label="Rainfall (mm)" info="Total precipitation over the last 24 hours. Typical range 0–500 mm." value={inputs.rainfall} unit="mm" min={0} max={500} onChange={(v) => set("rainfall", v)} />
          <Slider label="Temperature (°C)" info="Current air temperature. Typical range 0–50 °C." value={inputs.temperature} unit="°C" min={0} max={50} onChange={(v) => set("temperature", v)} />
          <Slider label="Humidity (%)" info="Atmospheric humidity. Typical range 20–100%." value={inputs.humidity} unit="%" min={20} max={100} onChange={(v) => set("humidity", v)} />

          <div className={styles.field}>
            <div className={styles["field-head"]}>
              <span className={styles["field-label"]}>River Discharge (m³/s)<Info text="Water flow rate in nearby rivers. Typical range 0–10,000 m³/s." /></span>
            </div>
            <input type="number" className={styles["text-input"]} value={inputs.riverDischarge} min={0} onChange={(e) => set("riverDischarge", Number(e.target.value))} />
          </div>

          <Slider label="Water Level (m)" info="Current water level relative to normal. Typical range 0–15 m." value={inputs.waterLevel} unit="m" min={0} max={15} step={0.1} onChange={(v) => set("waterLevel", v)} />

          <p className={styles["group-label"]}>Terrain &amp; Geography</p>
          <Slider label="Elevation (m)" info="Terrain height above sea level. Range 0–9,000 m." value={inputs.elevation} unit="m" min={0} max={9000} reverse onChange={(v) => set("elevation", v)} />

          <div className={styles.field}>
            <div className={styles["field-head"]}>
              <span className={styles["field-label"]}>Land Cover<Info text="Dominant land use around the location." /></span>
            </div>
            <select className={styles.select} value={inputs.landCover} onChange={(e) => set("landCover", e.target.value)}>
              {LAND_COVER.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className={styles.field} style={{ marginBottom: 4 }}>
            <div className={styles["field-head"]}>
              <span className={styles["field-label"]}>Soil Type<Info text="Dominant soil composition — affects water absorption." /></span>
            </div>
            <select className={styles.select} value={inputs.soilType} onChange={(e) => set("soilType", e.target.value)}>
              {SOIL_TYPE.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </section>

        {/* RIGHT: demographics & history */}
        <section className={styles.card}>
          <h2>Demographics &amp; History</h2>
          <p className={styles["card-sub"]}>Population, infrastructure and flood history</p>

          <p className={styles["group-label"]}>Population &amp; Infrastructure</p>
          <div className={styles.field}>
            <div className={styles["field-head"]}>
              <span className={styles["field-label"]}>Population Density (per km²)<Info text="People per square kilometre in the surrounding area." /></span>
            </div>
            <input type="number" className={styles["text-input"]} value={inputs.populationDensity} min={0} onChange={(e) => set("populationDensity", Number(e.target.value))} />
          </div>

          <button type="button" className={styles["toggle-row"]} onClick={() => set("infrastructure", inputs.infrastructure ? 0 : 1)} aria-pressed={!!inputs.infrastructure}>
            <span className={styles["toggle-meta"]}>
              <div>
                <p className={styles["t-name"]}>Infrastructure Present</p>
                <p className={styles["t-state"]}>Drainage, levees or flood defenses exist</p>
              </div>
            </span>
            <span className={`${styles.switch} ${inputs.infrastructure ? styles["on-green"] : ""}`} />
          </button>

          <button type="button" className={styles["toggle-row"]} onClick={() => set("historicalFloods", inputs.historicalFloods ? 0 : 1)} aria-pressed={!!inputs.historicalFloods}>
            <span className={styles["toggle-meta"]}>
              <div>
                <p className={styles["t-name"]}>Historical Floods</p>
                <p className={styles["t-state"]}>This area has flooded before</p>
              </div>
            </span>
            <span className={`${styles.switch} ${inputs.historicalFloods ? styles["on-amber"] : ""}`} />
          </button>

          <p className={styles["group-label"]}>
            Location <span className={styles["group-note"]}>(optional)</span>
          </p>
          <div className={styles.field}>
            <div className={styles["field-head"]}>
              <span className={styles["field-label"]}>Search a Location</span>
            </div>
            <div className={styles["loc-search-wrap"]}>
              <input
                type="text"
                className={styles["text-input"]}
                value={locQuery}
                placeholder="Search a place to set its coordinates…"
                onChange={(e) => setLocQuery(e.target.value)}
              />
              {locQuery.trim().length >= 3 && (
                <div className={styles["loc-results"]}>
                  {locStatus === "error" ? (
                    <div className={styles["loc-msg"]}>Couldn’t search right now.</div>
                  ) : locResults.length > 0 ? (
                    locResults.map((r, i) => (
                      <button
                        key={`${r.lat}-${r.lon}-${i}`}
                        type="button"
                        className={styles["loc-item"]}
                        onClick={() => selectLocation(r)}
                      >
                        {r.label}
                      </button>
                    ))
                  ) : locStatus === "done" ? (
                    <div className={styles["loc-msg"]}>No places found.</div>
                  ) : (
                    <div className={styles["loc-msg"]}>Searching…</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={styles.field}>
            <div className={styles["field-head"]}>
              <span className={styles["field-label"]}>Location Name</span>
            </div>
            <input type="text" className={styles["text-input"]} value={locationName} placeholder="e.g. Bangkok, Thailand" onChange={(e) => setLocationName(e.target.value)} />
          </div>
          <p className={styles.coords}>
            {coords
              ? `Coordinates: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
              : "No coordinates set (used for the map only)."}
          </p>
          <button type="button" className={styles["geo-link"]} onClick={useMyLocation}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            Use my current location
          </button>
        </section>
      </div>

      <div className={styles["analyze-bar"]}>
        <button type="button" className={styles["btn-analyze"]} onClick={analyze} disabled={submitting}>
          {submitting ? (
            <><span className={styles.spinner} aria-hidden="true" /> Analyzing…</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></svg>
              Analyze Flood Risk
            </>
          )}
        </button>
        {error ? (
          <p className={styles["form-error"]} role="alert">{error}</p>
        ) : (
          <p className={styles["analyze-note"]}>Runs against the deployed model · 11 parameters analyzed</p>
        )}
      </div>
    </>
  );
}

// --------------------------------------------------------------------------- //
// Result view
// --------------------------------------------------------------------------- //
function ResultView({
  result,
  inputs,
  locationName,
  coords,
  saved,
  canSave,
  onSave,
  onNew,
}: {
  result: PredictResult;
  inputs: Inputs;
  locationName: string;
  coords: { lat: number; lon: number } | null;
  saved: boolean;
  canSave: boolean;
  onSave: () => void;
  onNew: () => void;
}) {
  const pct = Math.round(result.probability * 100);
  const color = RISK_COLOR[result.risk_level];
  const sumC = result.top_factors.reduce((s, f) => s + Math.abs(f.contribution), 0) || 1;
  const maxC = Math.max(...result.top_factors.map((f) => Math.abs(f.contribution)), 1);
  const place = locationName.trim() || "this location";

  const summary: { label: string; value: string }[] = [
    { label: "Rainfall", value: `${inputs.rainfall} mm` },
    { label: "Temperature", value: `${inputs.temperature} °C` },
    { label: "Humidity", value: `${inputs.humidity}%` },
    { label: "River Discharge", value: `${inputs.riverDischarge.toLocaleString()} m³/s` },
    { label: "Water Level", value: `${inputs.waterLevel} m` },
    { label: "Elevation", value: `${inputs.elevation.toLocaleString()} m` },
    { label: "Land Cover", value: inputs.landCover },
    { label: "Soil Type", value: inputs.soilType },
    { label: "Pop. Density", value: `${inputs.populationDensity.toLocaleString()} /km²` },
    { label: "Infrastructure", value: inputs.infrastructure ? "Present" : "Absent" },
    { label: "Hist. Floods", value: inputs.historicalFloods ? "Yes" : "No" },
    { label: "Location", value: coords ? `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}` : "—" },
  ];

  return (
    <>
      <p className={styles.crumbs}>
        <Link href="/dashboard">Dashboard</Link>
        <span className={styles["sep-c"]}>›</span>
        <button type="button" className={styles["geo-link"]} onClick={onNew} style={{ fontWeight: 400, color: "var(--muted)" }}>Predict</button>
        <span className={styles["sep-c"]}>›</span>
        <span className={styles.here}>Result</span>
      </p>
      <div className={styles["head-row"]}>
        <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 30, fontWeight: 700, color: "var(--forest)", letterSpacing: "-0.01em" }}>
          Prediction Result
        </h1>
        <span className={styles["pred-id"]}>Prediction ID: #{result.id.slice(-6)}</span>
      </div>

      <div className={styles.layout}>
        <div>
          <section className={`${styles.card} ${styles["result-card"]}`} style={{ borderTopColor: color }}>
            <div className={styles["gauge-wrap"]}>
              <svg viewBox="0 0 290 250" aria-hidden="true">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="100%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
                <path d="M 60.79 229.21 A 119 119 0 1 1 229.21 229.21" fill="none" stroke="#f0ece1" strokeWidth="21" strokeLinecap="round" />
                <path d="M 60.79 229.21 A 119 119 0 1 1 229.21 229.21" fill="none" stroke="url(#gaugeGrad)" strokeWidth="21" strokeLinecap="round" pathLength={100} strokeDasharray={`${pct} 100`} />
              </svg>
              <div className={styles["gauge-center"]}>
                <p className={styles.pct}>{pct}%</p>
                <p className={styles["pct-label"]}>Flood Probability</p>
              </div>
              <div className={styles["gauge-ends"]} aria-hidden="true"><span>0%</span><span>100%</span></div>
            </div>

            <span className={styles["risk-pill"]} style={{ background: color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.3 3.8L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" /><path d="M12 9v5M12 17.5v.2" /></svg>
              {result.risk_level.toUpperCase()} RISK
            </span>
            <p className={styles["result-sub"]}>
              Based on the parameters provided, the model predicts a{" "}
              <strong>{result.risk_level} flood risk</strong> for {place}
              {result.flood ? " — flooding is likely" : " — flooding is unlikely"}.
            </p>
          </section>

          <section className={`${styles.card} ${styles.factors}`}>
            <div className={styles["factors-head"]}>
              <span className={styles.bulb}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1.3 1.5 1.5 2.5h5c.2-1 .7-1.8 1.5-2.5A6 6 0 0 0 12 3z" /></svg>
              </span>
              <h2>Why this prediction?</h2>
            </div>
            <p className={styles["factors-sub"]}>Top contributing factors driving this result</p>
            {result.top_factors.length === 0 ? (
              <p className={styles["factors-note"]}>No factor breakdown available.</p>
            ) : (
              result.top_factors.map((f) => (
                <div key={f.feature} className={styles["bar-row"]}>
                  <span className={styles["b-name"]}>{f.feature}</span>
                  <div className={styles["bar-track"]}>
                    <div className={styles["bar-fill"]} style={{ width: `${(Math.abs(f.contribution) / maxC) * 100}%` }} />
                  </div>
                  <span className={styles["b-val"]}>{Math.round((Math.abs(f.contribution) / sumC) * 100)}%</span>
                </div>
              ))
            )}
            <p className={styles["factors-note"]}>Local feature contributions from the model — higher means greater influence on this prediction.</p>
          </section>

          <div className={styles.actions}>
            <button type="button" className={`${styles["btn-action"]} ${styles.primary}`} onClick={onSave} disabled={!canSave || saved}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              {saved ? "Saved ✓" : "Save This Location"}
            </button>
            <button type="button" className={styles["btn-action"]} onClick={onNew}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5" /></svg>
              New Prediction
            </button>
            <Link href="/history" className={styles["btn-action"]}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>
              View in History
            </Link>
          </div>
        </div>

        <aside className={`${styles.card} ${styles.details}`}>
          <h2>Prediction Details</h2>
          <p className={styles["d-label"]}>Input Summary</p>
          <div className={styles["d-grid"]}>
            {summary.map((s) => (
              <div key={s.label} className={styles["d-item"]}>
                {s.label} <strong>{s.value}</strong>
              </div>
            ))}
          </div>
          <p className={styles["d-label"]}>Model</p>
          <div className={styles["d-meta"]}>
            <div className={styles["d-meta-row"]}><span className={styles.k}>Classifier</span><span className={`${styles.v} ${styles.teal}`}>{result.model ?? "—"}</span></div>
            <div className={styles["d-meta-row"]}><span className={styles.k}>Confidence</span><span className={styles.v}>{(result.probability * 100).toFixed(1)}%</span></div>
            <div className={styles["conf-bar"]} aria-hidden="true"><div className={styles["conf-fill"]} style={{ width: `${pct}%` }} /></div>
            <div className={styles["d-meta-row"]}><span className={styles.k}>Timestamp</span><span className={styles.v}>{new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <div className={styles["d-meta-row"]}><span className={styles.k}>Prediction ID</span><span className={styles.v}>#{result.id.slice(-6)}</span></div>
          </div>
        </aside>
      </div>
    </>
  );
}
