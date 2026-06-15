"use client";

import dynamic from "next/dynamic";

// MapView touches WebGL/window, so it must not server-render. Load it client
// only; the placeholder fills the full-bleed stage while the bundle loads.
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        margin: "-30px -36px -40px",
        display: "grid",
        placeItems: "center",
        background: "#0e1814",
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
      }}
    >
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  return <MapView />;
}
