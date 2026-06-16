import Sidebar from "@/components/layout/Sidebar";
import AuthGate from "@/components/layout/AuthGate";
import styles from "@/components/layout/appShell.module.css";

/*
 * Shell for the protected app: sidebar + main content area. Every page under
 * app/(app)/ (dashboard, predict, map, analytics, history, admin) renders here.
 * Route protection is handled upstream by src/proxy.ts; AuthGate additionally
 * holds page content until the Convex auth token is attached, so authed
 * queries don't fire (and throw) before the client is authenticated.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.app}>
      <Sidebar />
      <main className={styles.main}>
        <AuthGate>{children}</AuthGate>
      </main>
    </div>
  );
}
