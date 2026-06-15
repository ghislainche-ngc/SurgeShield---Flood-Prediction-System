import AnalyticsView from "@/components/analytics/AnalyticsView";

// Model analytics. AnalyticsView is a client component that pulls real metrics
// from the ML API via the getAnalytics Convex action and renders its own
// header per designs/07-analytics.html. Route-protected by src/proxy.ts.
export default function AnalyticsPage() {
  return <AnalyticsView />;
}
