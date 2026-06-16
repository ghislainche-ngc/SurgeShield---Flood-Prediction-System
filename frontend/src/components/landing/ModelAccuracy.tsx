"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

/*
 * Real model accuracy for the public marketing pages (landing `/`, about
 * `/about`), fetched from the ML API (Convex action getAnalytics → Flask
 * /analytics → metrics.json). Never a hard-coded figure (PROJECT_STRUCTURE.md
 * rule #2): shows the honest "—" placeholder until/unless the API resolves.
 * getAnalytics needs no auth, so it works for anonymous visitors.
 *
 * mode="percent" → "50.3%" (inline proof stat); mode="number" → "50.3" (paired
 * with a sibling "%" in the markup).
 */
export default function ModelAccuracy({
  mode = "percent",
}: {
  mode?: "percent" | "number";
}) {
  const getAnalytics = useAction(api.actions.getAnalytics);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    getAnalytics({})
      .then((d) => {
        if (!ignore) setAccuracy(d.metrics.metrics.accuracy);
      })
      .catch(() => {
        // ML API unreachable — keep the honest "—" placeholder.
      });
    return () => {
      ignore = true;
    };
  }, [getAnalytics]);

  if (accuracy === null) return <>—</>;
  const value = (accuracy * 100).toFixed(1);
  return <>{mode === "percent" ? `${value}%` : value}</>;
}
