/*
 * Transparent physical flood-risk heuristic — NOT a machine-learning model.
 *
 * The project's ML models honestly score at chance level (ROC-AUC ≈ 0.50): the
 * dataset carries no learnable signal, so the model's probability barely moves
 * regardless of inputs. This heuristic is a deliberately simple, fully visible
 * domain rule that DOES respond to inputs the way flood physics would expect.
 * It is shown alongside the ML output, clearly labelled, and never conflated
 * with it — separating "what the data can prove" from "what domain knowledge
 * suggests".
 *
 * It is a weighted sum of normalised sub-scores (each 0..1), the weights summing
 * to 1, giving a 0..1 risk reported as a percentage. Temperature is deliberately
 * excluded: it has no clean monotonic link to flooding.
 */

export type HeuristicLevel = "Low" | "Moderate" | "High" | "Critical";

export type HeuristicInputs = {
  rainfall: number;
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

export type HeuristicFactor = {
  label: string;
  weight: number; // share of the total (0..1)
  contribution: number; // weight * subScore (0..weight)
};

export type HeuristicResult = {
  score: number; // 0..1
  percent: number; // 0..100, rounded
  level: HeuristicLevel;
  factors: HeuristicFactor[]; // sorted desc by contribution
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Soil infiltration risk: 0 = drains freely, 1 = waterlogs / sheds fast.
const SOIL_RISK: Record<string, number> = {
  Clay: 0.9,
  Peat: 0.8,
  Silt: 0.6,
  Loam: 0.4,
  Sandy: 0.2,
};

// Land-cover runoff risk: impervious / water-adjacent high, absorbing low.
const LAND_RISK: Record<string, number> = {
  Urban: 0.9,
  "Water Body": 0.8,
  Agricultural: 0.5,
  Desert: 0.2,
  Forest: 0.2,
};

function levelFor(score: number): HeuristicLevel {
  if (score >= 0.75) return "Critical";
  if (score >= 0.5) return "High";
  if (score >= 0.25) return "Moderate";
  return "Low";
}

export function computeHeuristicRisk(i: HeuristicInputs): HeuristicResult {
  // Each entry: a human label, its weight (all sum to 1), and a normalised
  // 0..1 sub-score for the current inputs.
  const subs: { label: string; weight: number; sub: number }[] = [
    { label: "Rainfall", weight: 0.22, sub: clamp01(i.rainfall / 500) },
    { label: "River discharge", weight: 0.18, sub: clamp01(i.riverDischarge / 10000) },
    { label: "Water level", weight: 0.15, sub: clamp01(i.waterLevel / 15) },
    { label: "Low elevation", weight: 0.12, sub: 1 - clamp01(i.elevation / 1500) },
    { label: "Soil type", weight: 0.08, sub: SOIL_RISK[i.soilType] ?? 0.5 },
    { label: "Land cover", weight: 0.08, sub: LAND_RISK[i.landCover] ?? 0.5 },
    { label: "Historical floods", weight: 0.07, sub: i.historicalFloods ? 1 : 0 },
    { label: "Humidity", weight: 0.04, sub: clamp01((i.humidity - 20) / 80) },
    { label: "Population density", weight: 0.03, sub: clamp01(i.populationDensity / 20000) },
    { label: "No flood defenses", weight: 0.03, sub: i.infrastructure ? 0 : 1 },
  ];

  const factors: HeuristicFactor[] = subs
    .map((s) => ({ label: s.label, weight: s.weight, contribution: s.weight * s.sub }))
    .sort((a, b) => b.contribution - a.contribution);

  const score = clamp01(factors.reduce((sum, f) => sum + f.contribution, 0));
  return { score, percent: Math.round(score * 100), level: levelFor(score), factors };
}
