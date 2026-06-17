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
