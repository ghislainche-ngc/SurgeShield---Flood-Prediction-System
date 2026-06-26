/*
 * Keyless place search via Nominatim (OpenStreetMap). CORS-enabled, no API key.
 * Shared by the Map View and the Predict page so both search the same way.
 */

export type GeoResult = { lat: number; lon: number; label: string };

export async function geocodePlaces(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
  const data = (await res.json()) as {
    lat: string;
    lon: string;
    display_name: string;
  }[];
  return data.map((d) => ({
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
    label: d.display_name,
  }));
}

/**
 * Reverse-geocode coordinates to a short "Place, Country" label (Nominatim).
 * Used after "Use my current location" so the Predict page shows where the user
 * actually is instead of the default. Returns null if nothing sensible resolves.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lon}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
    error?: string;
  };
  if (data.error) return null;
  const a = data.address ?? {};
  const place =
    a.city || a.town || a.village || a.municipality ||
    a.county || a.suburb || a.state;
  if (place && a.country) return `${place}, ${a.country}`;
  return data.display_name ?? null;
}
