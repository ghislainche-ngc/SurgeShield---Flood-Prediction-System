import PredictView from "@/components/predict/PredictView";

// PredictView renders its own breadcrumb + page header (per designs/04-predict
// and 05-results) and switches between the form and the result, so this route
// doesn't use the dashboard-style <TopBar>.
export default function PredictPage() {
  return <PredictView />;
}
