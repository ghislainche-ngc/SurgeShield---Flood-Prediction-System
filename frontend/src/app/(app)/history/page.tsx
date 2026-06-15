import HistoryView from "@/components/history/HistoryView";

// HistoryView renders its own page header (per designs/08-history.html), so
// this route doesn't use the dashboard-style <TopBar>.
export default function HistoryPage() {
  return <HistoryView />;
}
