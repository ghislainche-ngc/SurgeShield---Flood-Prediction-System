"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";
import styles from "./appShell.module.css";

/*
 * Client shell for the protected app. Owns the mobile drawer open/close state
 * so the hamburger (in the mobile top bar) and the off-canvas Sidebar stay in
 * sync. On desktop (>=900px) the sidebar is a normal grid column and none of
 * this drawer chrome is visible; below 900px the sidebar slides in over a
 * backdrop. The layout is locked to the viewport (100dvh) with the main area
 * as the only scroll container — see appShell.module.css.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on any route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally sync the drawer closed when the route changes
    setOpen(false);
  }, [pathname]);

  // Close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={styles.app}>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && (
        <div
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className={styles.contentCol}>
        <div className={styles.mobileBar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <Link
            href="/dashboard"
            className={styles.mobileLogo}
            aria-label="SurgeShield home"
          >
            <span className={styles["mobile-logo-mark"]}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
              </svg>
            </span>
            SurgeShield
          </Link>
        </div>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
