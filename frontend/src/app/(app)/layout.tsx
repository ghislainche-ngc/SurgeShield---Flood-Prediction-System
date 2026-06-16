import AppShell from "@/components/layout/AppShell";
import AuthGate from "@/components/layout/AuthGate";

/*
 * Shell for the protected app: sidebar + main content area. Every page under
 * app/(app)/ (dashboard, predict, map, analytics, history, admin, settings)
 * renders here. AppShell (client) owns the responsive drawer + viewport lock;
 * route protection is handled upstream by src/proxy.ts, and AuthGate holds page
 * content until the Convex auth token is attached so authed queries don't fire
 * (and throw) before the client is authenticated.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <AuthGate>{children}</AuthGate>
    </AppShell>
  );
}
