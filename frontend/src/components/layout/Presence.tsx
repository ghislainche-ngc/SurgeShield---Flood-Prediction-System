"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/*
 * Presence heartbeat: pings recordPresence on mount, every minute, and when the
 * tab becomes visible again, so the user directory + lastActiveAt stay current
 * (drives the admin "online" status and the registered-users list). Renders
 * nothing. Mounted inside AuthGate's <Authenticated> so the Convex token is set.
 */
export default function Presence() {
  const record = useMutation(api.presence.recordPresence);

  useEffect(() => {
    const ping = () => {
      record({}).catch(() => {
        // best-effort; ignore transient failures
      });
    };
    ping();
    const id = setInterval(ping, 60000);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [record]);

  return null;
}
