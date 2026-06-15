import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { predictionInputs, weatherSource } from "./schema";

/*
 * Actions call the external Flask ML API (actions can use fetch; queries and
 * mutations can't). The API base lives in the Convex env var ML_API_URL — set
 * it to the publicly reachable Flask URL:
 *   npx convex env set ML_API_URL https://<your-tunnel-or-host>
 * (Convex runs actions in its cloud, so localhost is not reachable.)
 */

function apiBase(): string {
  const base = process.env.ML_API_URL;
  if (!base) throw new Error("ML_API_URL is not set (npx convex env set ML_API_URL <url>).");
  return base.replace(/\/$/, "");
}

type PredictResponse = {
  flood: boolean;
  probability: number;
  risk_level: "Low" | "Moderate" | "High" | "Critical";
  top_factors: { feature: string; contribution: number; direction?: string }[];
  model?: string;
};

/**
 * Run a flood prediction: POST the 11 features to Flask /predict, persist the
 * result for the user, and return it. Input keys are mapped from our camelCase
 * schema to the ML pipeline's tidy column names.
 */
export const predict = action({
  args: {
    inputs: predictionInputs,
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    locationName: v.optional(v.string()),
    weatherSource,
  },
  // Explicit return type: the action references `api` (which includes itself
  // via runMutation), so without this TS hits circular inference.
  handler: async (
    ctx,
    args,
  ): Promise<PredictResponse & { id: Id<"predictions"> }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const i = args.inputs;
    const body = {
      Rainfall: i.rainfall,
      Temperature: i.temperature,
      Humidity: i.humidity,
      "River Discharge": i.riverDischarge,
      "Water Level": i.waterLevel,
      Elevation: i.elevation,
      "Land Cover": i.landCover,
      "Soil Type": i.soilType,
      "Population Density": i.populationDensity,
      Infrastructure: i.infrastructure,
      "Historical Floods": i.historicalFloods,
    };

    const res = await fetch(`${apiBase()}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Prediction failed (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as PredictResponse;

    const id = await ctx.runMutation(api.predictions.savePrediction, {
      inputs: args.inputs,
      result: data.flood,
      probability: data.probability,
      riskLevel: data.risk_level,
      topFactors: data.top_factors.map((f) => ({
        feature: f.feature,
        contribution: f.contribution,
      })),
      latitude: args.latitude,
      longitude: args.longitude,
      locationName: args.locationName,
      weatherSource: args.weatherSource,
    });

    return { id, ...data };
  },
});

/** Live weather for a location (Flask /weather → Open-Meteo): rainfall/temp/humidity. */
export const weather = action({
  args: { latitude: v.number(), longitude: v.number() },
  handler: async (ctx, { latitude, longitude }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const res = await fetch(
      `${apiBase()}/weather?lat=${latitude}&lon=${longitude}`,
    );
    if (!res.ok) {
      throw new Error(`Weather fetch failed (${res.status}): ${await res.text()}`);
    }
    return (await res.json()) as {
      latitude: number;
      longitude: number;
      rainfall: number | null;
      temperature: number | null;
      humidity: number | null;
      source: string;
      fetched_at: string | null;
    };
  },
});
