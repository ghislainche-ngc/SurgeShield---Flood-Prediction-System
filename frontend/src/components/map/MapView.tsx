"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { RiskLevel } from "../dashboard/risk";
import { geocodePlaces, type GeoResult } from "@/lib/geocode";
import styles from "./map.module.css";

/*
 * Map View — re-created on MapLibre GL with a keyless CARTO dark basemap (not
 * the design's Leaflet). Plots the signed-in user's real predictions (those
 * with coordinates, risk-coloured) and saved locations (teal pins). The
 * design's "10,000 training points" layer is a mockup; we show honest live
 * counts instead. Rendered client-only (no SSR) since it touches WebGL/window.
 */

const CARTO_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Keyless basemap modes. CARTO GL styles + an Esri World Imagery raster style
// for satellite — all free, no API key. setStyle() swaps the basemap; the DOM
// markers we add are overlays (not style layers), so they persist across swaps.
type BasemapId = "dark" | "light" | "streets" | "satellite";
const BASEMAPS: Record<BasemapId, string | maplibregl.StyleSpecification> = {
  dark: CARTO_STYLE,
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  streets: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  satellite: {
    version: 8,
    sources: {
      "esri-imagery": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      },
    },
    layers: [{ id: "esri-imagery", type: "raster", source: "esri-imagery" }],
  } as maplibregl.StyleSpecification,
};
const BASEMAP_LABELS: { id: BasemapId; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "streets", label: "Streets" },
  { id: "satellite", label: "Satellite" },
];

// Build the /predict link for a chosen place (prefills name + coordinates).
function predictHref(name: string, lat: number, lon: number): string {
  const p = new URLSearchParams({
    name,
    lat: String(lat),
    lon: String(lon),
  });
  return `/predict?${p.toString()}`;
}

const SAVED_HEX = "#14b8a6"; // neutral teal for a bookmarked place with no risk yet

const RISK_HEX: Record<RiskLevel, string> = {
  Low: "#16a34a",
  Moderate: "#d97706",
  High: "#dc2626",
  Critical: "#7f1d1d",
};
const RISK_LIGHT: Record<RiskLevel, string> = {
  Low: "#4ade80",
  Moderate: "#fbbf24",
  High: "#f87171",
  Critical: "#fca5a5",
};
const RISK_BG: Record<RiskLevel, string> = {
  Low: "rgba(22,163,74,0.12)",
  Moderate: "rgba(217,119,6,0.12)",
  High: "rgba(220,38,38,0.12)",
  Critical: "rgba(127,29,29,0.12)",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function circleEl(risk: RiskLevel): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `width:12px;height:12px;border-radius:50%;background:${RISK_HEX[risk]};border:1.5px solid rgba(255,255,255,0.7);box-shadow:0 0 0 2px rgba(0,0,0,0.25);cursor:pointer;`;
  return el;
}

function pinEl(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#0d9488,#14b8a6);border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.45);display:grid;place-items:center;cursor:pointer;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" style="transform:rotate(45deg)"><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/></svg></div>`;
  return wrap.firstElementChild as HTMLElement;
}

// Distinct (indigo) pin for a geocoded search result — visually separate from
// teal saved-location pins and risk-coloured prediction dots.
function searchPinEl(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#6366f1,#3b82f6);border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.5);display:grid;place-items:center;cursor:pointer;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" style="transform:rotate(45deg)"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg></div>`;
  return wrap.firstElementChild as HTMLElement;
}

const ARROW_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

export default function MapView() {
  const predictions = useQuery(api.predictions.getUserPredictions);
  const locations = useQuery(api.locations.getUserLocations);
  const saveLocation = useMutation(api.locations.saveLocation);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null);
  const fittedRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [showPred, setShowPred] = useState(true);
  const [showSaved, setShowSaved] = useState(true);
  const [search, setSearch] = useState("");
  const [basemap, setBasemap] = useState<BasemapId>("dark");
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [selectedPlace, setSelectedPlace] = useState<GeoResult | null>(null);
  const [savingPlace, setSavingPlace] = useState(false);
  const [savedPlace, setSavedPlace] = useState(false);

  // Only predictions that carry coordinates can be mapped.
  const predPoints = useMemo(
    () =>
      (predictions ?? []).filter(
        (p): p is typeof p & { latitude: number; longitude: number } =>
          typeof p.latitude === "number" && typeof p.longitude === "number",
      ),
    [predictions],
  );
  const savedList = useMemo(() => locations ?? [], [locations]);

  const filteredSaved = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedList;
    return savedList.filter((l) => l.name.toLowerCase().includes(q));
  }, [savedList, search]);

  // ---- init map once ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_STYLE,
      center: [20, 15],
      zoom: 1.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.on("load", () => setReady(true));
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---- sync markers when data / toggles change ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (showPred) {
      for (const p of predPoints) {
        const risk = p.riskLevel as RiskLevel;
        const name = p.locationName?.trim() || "Unnamed location";
        const pct = Math.round(p.probability * 100);
        const date = new Date(p.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const html = `<div class="ss-pop"><div class="pop-top"><h3>${escapeHtml(name)}</h3><span class="pop-badge" style="background:${RISK_BG[risk]};color:${RISK_HEX[risk]}">${risk.toUpperCase()}</span></div><p class="pop-prob">Last prediction: <strong>${pct}% probability</strong></p><div class="pop-grid"><span>Rainfall<br><strong>${p.inputs.rainfall} mm</strong></span><span>River<br><strong>${p.inputs.riverDischarge.toLocaleString()} m³/s</strong></span></div><p class="pop-date">Predicted: ${date}</p><a href="/history" class="pop-btn">View Full Details ${ARROW_SVG}</a></div>`;
        const marker = new maplibregl.Marker({ element: circleEl(risk) })
          .setLngLat([p.longitude, p.latitude])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(html))
          .addTo(map);
        markersRef.current.push(marker);
      }
    }

    if (showSaved) {
      for (const l of savedList) {
        const risk = l.lastRiskLevel as RiskLevel | undefined;
        const badge = risk
          ? `<span class="pop-badge" style="background:${RISK_BG[risk]};color:${RISK_HEX[risk]}">${risk.toUpperCase()}</span>`
          : `<span class="pop-badge" style="background:rgba(255,255,255,0.12);color:#d6d3ca">UNCHECKED</span>`;
        const href = predictHref(l.name, l.latitude, l.longitude);
        const html = `<div class="ss-pop"><div class="pop-top"><h3>${escapeHtml(l.name)}</h3>${badge}</div><p class="pop-prob">Saved location · last checked ${new Date(l.lastChecked).toLocaleDateString()}</p><a href="${href}" class="pop-btn">Predict here ${ARROW_SVG}</a></div>`;
        const marker = new maplibregl.Marker({ element: pinEl(), anchor: "bottom" })
          .setLngLat([l.longitude, l.latitude])
          .setPopup(new maplibregl.Popup({ offset: 24 }).setHTML(html))
          .addTo(map);
        markersRef.current.push(marker);
      }
    }

    // Fit to all points once, the first time we have any.
    if (!fittedRef.current && markersRef.current.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      for (const p of predPoints) bounds.extend([p.longitude, p.latitude]);
      for (const l of savedList) bounds.extend([l.longitude, l.latitude]);
      map.fitBounds(bounds, { padding: 90, maxZoom: 9, duration: 0 });
      fittedRef.current = true;
    }
  }, [ready, predPoints, savedList, showPred, showSaved]);

  // ---- geocode the search box (keyless Nominatim), debounced ----
  // All state updates run inside the deferred timeout (never synchronously in
  // the effect body) so a keystroke doesn't trigger a cascading render.
  useEffect(() => {
    const q = search.trim();
    let ignore = false;
    const t = setTimeout(async () => {
      if (q.length < 3) {
        setGeoResults([]);
        setGeoStatus("idle");
        return;
      }
      setGeoStatus("loading");
      try {
        const results = await geocodePlaces(q);
        if (ignore) return;
        setGeoResults(results);
        setGeoStatus("done");
      } catch {
        if (ignore) return;
        setGeoResults([]);
        setGeoStatus("error");
      }
    }, 400);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [search]);

  function flyTo(lng: number, lat: number) {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 8, duration: 1200 });
  }

  // Fly to a geocoded place, drop/replace a temporary search marker, and surface
  // the Save / Predict-here actions for it in the overlay.
  function selectPlace(r: GeoResult) {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [r.lon, r.lat], zoom: 9, duration: 1200 });
    searchMarkerRef.current?.remove();
    const short = r.label.split(",")[0];
    const marker = new maplibregl.Marker({ element: searchPinEl(), anchor: "bottom" })
      .setLngLat([r.lon, r.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 24 }).setHTML(
          `<div class="ss-pop"><h3>${escapeHtml(short)}</h3><p class="pop-prob">${escapeHtml(r.label)}</p></div>`,
        ),
      )
      .addTo(map);
    searchMarkerRef.current = marker;
    setSelectedPlace(r);
    setSavedPlace(false);
    setGeoResults([]);
    setSearch("");
  }

  // Bookmark the selected place (no prediction yet → no risk level).
  async function saveSelectedPlace() {
    if (!selectedPlace || savingPlace || savedPlace) return;
    setSavingPlace(true);
    try {
      await saveLocation({
        name: selectedPlace.label.split(",")[0],
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lon,
      });
      setSavedPlace(true);
    } finally {
      setSavingPlace(false);
    }
  }

  // Switch the basemap. DOM markers persist across setStyle, so no re-plotting.
  function changeBasemap(id: BasemapId) {
    setBasemap(id);
    if (mapRef.current && ready) mapRef.current.setStyle(BASEMAPS[id]);
  }

  function goToMyLocations() {
    const map = mapRef.current;
    if (!map) return;
    const pts = [
      ...(showSaved ? savedList.map((l) => [l.longitude, l.latitude] as [number, number]) : []),
      ...(showPred ? predPoints.map((p) => [p.longitude, p.latitude] as [number, number]) : []),
    ];
    if (pts.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    pts.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, { padding: 90, maxZoom: 9, duration: 900 });
  }

  const totalPoints = predPoints.length + savedList.length;

  return (
    <div className={styles.stage}>
      <div ref={containerRef} className={styles.map} role="application" aria-label="Interactive flood risk map" />

      {/* floating overlay */}
      <div className={styles.overlay}>
        <div className={styles["overlay-head"]}>
          <h1>Flood Risk Map</h1>
          <div className={styles["search-wrap"]}>
            <div className={styles.search}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.5-4.5" />
              </svg>
              <input
                type="text"
                placeholder="Search places…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search places"
              />
            </div>
            {search.trim().length >= 3 && (
              <div className={styles["geo-results"]}>
                {geoStatus === "error" ? (
                  <div className={styles["geo-msg"]}>Couldn’t search right now.</div>
                ) : geoResults.length > 0 ? (
                  geoResults.map((r, i) => (
                    <button
                      key={`${r.lat}-${r.lon}-${i}`}
                      type="button"
                      className={styles["geo-item"]}
                      onClick={() => selectPlace(r)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      <span>{r.label}</span>
                    </button>
                  ))
                ) : geoStatus === "done" ? (
                  <div className={styles["geo-msg"]}>No places found.</div>
                ) : (
                  <div className={styles["geo-msg"]}>Searching…</div>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedPlace && (
          <>
            <div className={styles["ov-sep"]} />
            <div className={styles["ov-section"]}>
              <p className={styles["ov-title"]}>Selected Place</p>
              <p className={styles["sel-name"]}>{selectedPlace.label}</p>
              <div className={styles["sel-actions"]}>
                <button
                  type="button"
                  className={styles["sel-save"]}
                  onClick={saveSelectedPlace}
                  disabled={savingPlace || savedPlace}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {savedPlace ? "Saved ✓" : savingPlace ? "Saving…" : "Save"}
                </button>
                <Link
                  href={predictHref(
                    selectedPlace.label.split(",")[0],
                    selectedPlace.lat,
                    selectedPlace.lon,
                  )}
                  className={styles["sel-predict"]}
                >
                  Predict here
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          </>
        )}

        <div className={styles["ov-sep"]} />
        <div className={styles["ov-section"]}>
          <p className={styles["ov-title"]}>Layers</p>
          <button type="button" className={styles.layer} onClick={() => setShowPred((v) => !v)} aria-pressed={showPred}>
            <span className={`${styles.chk} ${showPred ? styles.on : ""}`}>
              {showPred && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            My Predictions
            <span className={styles.count}>{predPoints.length}</span>
          </button>
          <button type="button" className={styles.layer} onClick={() => setShowSaved((v) => !v)} aria-pressed={showSaved}>
            <span className={`${styles.chk} ${showSaved ? styles.on : ""}`}>
              {showSaved && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            My Saved Locations
            <span className={styles.count}>{savedList.length}</span>
          </button>
        </div>

        <div className={styles["ov-sep"]} />
        <div className={styles["ov-section"]}>
          <p className={styles["ov-title"]}>Basemap</p>
          <div className={styles["basemap-row"]}>
            {BASEMAP_LABELS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`${styles["basemap-pill"]} ${basemap === b.id ? styles.active : ""}`}
                onClick={() => changeBasemap(b.id)}
                aria-pressed={basemap === b.id}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles["ov-sep"]} />
        <div className={styles["ov-section"]}>
          <p className={styles["ov-title"]}>My Saved Locations</p>
          {locations === undefined ? (
            <p className={styles["ov-empty"]}>Loading…</p>
          ) : filteredSaved.length === 0 ? (
            <p className={styles["ov-empty"]}>
              {savedList.length === 0 ? "No saved locations yet." : "No matches."}
            </p>
          ) : (
            filteredSaved.map((l) => {
              const risk = l.lastRiskLevel as RiskLevel | undefined;
              return (
                <button
                  key={l._id}
                  type="button"
                  className={styles["loc-row"]}
                  onClick={() => flyTo(l.longitude, l.latitude)}
                >
                  <span
                    className={styles["loc-dot"]}
                    style={{ background: risk ? RISK_HEX[risk] : SAVED_HEX }}
                  />
                  <span className={styles.place}>{l.name}</span>
                  <span
                    className={styles.lvl}
                    style={{ color: risk ? RISK_LIGHT[risk] : "rgba(255,255,255,0.5)" }}
                  >
                    {risk ?? "Unchecked"}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className={styles["ov-sep"]} />
        <div className={styles["ov-section"]}>
          <p className={styles["ov-title"]}>Legend</p>
          <div className={styles["legend-row"]}><span className={styles.ld} style={{ background: "#16a34a" }} /> Low risk</div>
          <div className={styles["legend-row"]}><span className={styles.ld} style={{ background: "#d97706" }} /> Moderate risk</div>
          <div className={styles["legend-row"]}><span className={styles.ld} style={{ background: "#dc2626" }} /> High risk</div>
          <div className={styles["legend-row"]}><span className={styles.ld} style={{ background: "#7f1d1d" }} /> Critical risk</div>
          <div className={styles["legend-row"]}><span className={styles.ld} style={{ background: "#14b8a6" }} /> Saved location</div>
        </div>
      </div>

      {/* bottom bar */}
      <div className={styles["bottom-bar"]}>
        <span className={styles["bb-stat"]}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
          </svg>
          {predictions === undefined || locations === undefined
            ? "Loading your map data…"
            : `${predPoints.length} prediction${predPoints.length === 1 ? "" : "s"} · ${savedList.length} saved location${savedList.length === 1 ? "" : "s"}`}
        </span>
        <span className={styles["bb-divide"]} />
        <div className={styles["zoom-group"]}>
          <button type="button" className={styles["zoom-btn"]} aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button type="button" className={styles["zoom-btn"]} aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
        <button type="button" className={styles["btn-goto"]} onClick={goToMyLocations} disabled={totalPoints === 0}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          Go to My Locations
        </button>
      </div>
    </div>
  );
}
