"use client";

import { ReactNode } from "react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Presence from "./Presence";
import styles from "./appShell.module.css";

/*
 * Gates protected page content on Convex's auth state. ConvexProviderWithClerk
 * attaches the Clerk token to the Convex client asynchronously; without this
 * gate, a page's useQuery fires before the token is set, the server rejects it
 * with "Not authenticated", and the thrown error trips the route error boundary
 * permanently. Rendering authed content only inside <Authenticated> (and a
 * loader while the token is resolving) is the idiomatic Convex+Clerk fix.
 *
 * Unauthenticated also shows the loader: protected routes are guarded server-
 * side by proxy.ts, so this is only ever a brief transitional state.
 */
function Loader() {
  return (
    <div className={styles["gate-loading"]} role="status" aria-live="polite">
      <span className={styles["gate-spinner"]} aria-hidden="true" />
      Loading…
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <Loader />
      </AuthLoading>
      <Unauthenticated>
        <Loader />
      </Unauthenticated>
      <Authenticated>
        <Presence />
        {children}
      </Authenticated>
    </>
  );
}
