/* Maps a risk level to its badge style key (shared by the dashboard modules). */
export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export const riskBadgeKey: Record<RiskLevel, "b-low" | "b-mod" | "b-high" | "b-crit"> = {
  Low: "b-low",
  Moderate: "b-mod",
  High: "b-high",
  Critical: "b-crit",
};
