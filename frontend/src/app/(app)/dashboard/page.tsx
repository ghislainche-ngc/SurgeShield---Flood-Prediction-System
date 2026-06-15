import TopBar from "@/components/layout/TopBar";
import StatCards from "@/components/dashboard/StatCards";
import RecentPredictions from "@/components/dashboard/RecentPredictions";
import QuickPredict from "@/components/dashboard/QuickPredict";
import SavedLocations from "@/components/dashboard/SavedLocations";
import styles from "@/components/dashboard/dashboard.module.css";

export default function DashboardPage() {
  return (
    <>
      <TopBar title="Dashboard" />
      <StatCards />
      <section className={styles.mid}>
        <RecentPredictions />
        <QuickPredict />
      </section>
      <SavedLocations />
    </>
  );
}
