"use client";

import { useUser } from "@clerk/nextjs";
import styles from "./appShell.module.css";

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstNameOf(full: string): string {
  return full.trim().split(/\s+/)[0] || "there";
}

/** Page header for the protected app shell. Each page passes its own title. */
export default function TopBar({ title }: { title: string }) {
  const { user } = useUser();
  const fullName =
    (user?.unsafeMetadata?.fullName as string | undefined) ??
    user?.fullName ??
    user?.firstName ??
    "";

  return (
    <div className={styles.topbar}>
      <h1>{title}</h1>
      <div className={styles["topbar-right"]}>
        <p className={styles.greeting}>
          {timeGreeting()},{" "}
          <strong>{firstNameOf(fullName)}</strong>
        </p>
        <button className={styles.bell} aria-label="Notifications, 1 unread">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 9a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
            <path d="M10.3 20a2 2 0 0 0 3.4 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
