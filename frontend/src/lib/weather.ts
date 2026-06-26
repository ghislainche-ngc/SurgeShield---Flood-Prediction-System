/*
 * Keyless live weather via Open-Meteo, called DIRECTLY from the browser.
 *
 * Why client-side (not via the Flask /weather proxy on Render): Render's free
 * tier shares an egress IP that Open-Meteo rate-limits (HTTP 429). The user's
 * own browser IP is not throttled, so calling Open-Meteo from the client is both
 * more reliable and one hop shorter. Open-Meteo is CORS-enabled and needs no API
 * key — this mirrors the client-side Nominatim pattern in geocode.ts.
 *
 * Open-Meteo can supply 4 of the model's 11 features: rainfall, temperature,
 * humidity, and elevation. The other 7 have no weather source and keep their
 * current (manual/default) values.
 */

export type LiveWeather = {
  rainfall: number | null; // mm (current precipitation; see note in PredictView)
  temperature: number | null; // °C
  humidity: number | null; // %
  elevation: number | null; // m above sea level
};

export async function fetchCurrentWeather(
  lat: number,
  lon: number,
): Promise<LiveWeather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,rain,precipitation`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Weather failed (${res.status})`);
  const data = (await res.json()) as {
    elevation?: number;
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      rain?: number;
      precipitation?: number;
    };
  };
  const cur = data.current ?? {};
  return {
    rainfall: cur.rain ?? cur.precipitation ?? null,
    temperature: cur.temperature_2m ?? null,
    humidity: cur.relative_humidity_2m ?? null,
    elevation: data.elevation ?? null,
  };
}
