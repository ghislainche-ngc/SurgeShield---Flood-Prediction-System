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

type MetricSet = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
};

export type AnalyticsResponse = {
  metrics: {
    best_model: string;
    metrics: MetricSet;
    n_test: number;
    feature_count: number;
    feature_count_encoded?: number;
    dataset: string;
    generated_at: string;
    interpretation: string;
  };
  model_comparison: {
    best_model: string;
    models: Record<
      string,
      { cv: Record<string, { mean: number; std: number }>; test: MetricSet }
    >;
    class_balance_train: Record<string, number>;
    n_train: number;
    n_test: number;
    encoded_feature_names?: string[];
    protocol?: string;
  };
  confusion_matrix: {
    matrix: number[][];
    tn: number;
    fp: number;
    fn: number;
    tp: number;
    labels: string[];
    model: string;
  };
  feature_importances: {
    importances: { feature: string; importance: number; signed: number }[];
    type: string;
    model: string;
  };
  roc_data: {
    chance_auc: number;
    models: Record<string, { auc: number; fpr: number[]; tpr: number[] }>;
  };
};

/**
 * Real model analytics for the /analytics page — proxies Flask /analytics
 * (which reads ml-api/5_interpretation/*.json). No auth required: it returns
 * model metadata only (no user data), and the page is route-protected. These
 * are honest chance-level numbers (ROC-AUC ≈ 0.50), never hard-coded in the UI.
 */
export const getAnalytics = action({
  args: {},
  handler: async (): Promise<AnalyticsResponse> => {
    const res = await fetch(`${apiBase()}/analytics`);
    if (!res.ok) {
      throw new Error(`Analytics fetch failed (${res.status}): ${await res.text()}`);
    }
    return (await res.json()) as AnalyticsResponse;
  },
});

export type MlStatus = {
  online: boolean;
  modelLoaded: boolean;
  latencyMs: number | null;
  bestModel: string | null;
  accuracy: number | null;
};

/**
 * Live health of the Flask ML API for the admin dashboard: pings /health
 * (timing the round-trip server-side for a real latency reading) and, when the
 * model is loaded, reads best model + accuracy from /model-info. Returns an
 * all-offline shape instead of throwing so the dashboard degrades gracefully.
 * No auth: it exposes only service metadata, and the /admin route is gated.
 */
export const getMlStatus = action({
  args: {},
  handler: async (): Promise<MlStatus> => {
    const offline: MlStatus = {
      online: false,
      modelLoaded: false,
      latencyMs: null,
      bestModel: null,
      accuracy: null,
    };
    let base: string;
    try {
      base = apiBase();
    } catch {
      return offline;
    }
    const start = Date.now();
    try {
      const res = await fetch(`${base}/health`);
      const latencyMs = Date.now() - start;
      if (!res.ok) return { ...offline, latencyMs };
      const h = (await res.json()) as { status?: string; model_loaded?: boolean };
      let bestModel: string | null = null;
      let accuracy: number | null = null;
      if (h.model_loaded) {
        try {
          const mi = await fetch(`${base}/model-info`);
          if (mi.ok) {
            const m = (await mi.json()) as {
              best_model?: string;
              metrics?: { accuracy?: number };
            };
            bestModel = m.best_model ?? null;
            accuracy = m.metrics?.accuracy ?? null;
          }
        } catch {
          // model-info optional — keep status/latency
        }
      }
      return {
        online: h.status === "ok",
        modelLoaded: Boolean(h.model_loaded),
        latencyMs,
        bestModel,
        accuracy,
      };
    } catch {
      return offline;
    }
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
