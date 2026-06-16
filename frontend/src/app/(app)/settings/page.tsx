import SettingsView from "@/components/settings/SettingsView";

// SettingsView renders its own page header (per designs/12-settings.html), so
// this route doesn't use the dashboard-style <TopBar>.
export default function SettingsPage() {
  return <SettingsView />;
}
