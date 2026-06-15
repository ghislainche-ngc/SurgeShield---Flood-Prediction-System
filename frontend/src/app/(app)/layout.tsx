import Sidebar from "@/components/layout/Sidebar";
import styles from "@/components/layout/appShell.module.css";

/*
 * Shell for the protected app: sidebar + main content area. Every page under
 * app/(app)/ (dashboard, predict, map, analytics, history, admin) renders here.
 * Route protection is handled upstream by src/proxy.ts.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.app}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
