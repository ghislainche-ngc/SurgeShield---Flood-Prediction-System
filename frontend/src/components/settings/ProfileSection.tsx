"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import styles from "./settings.module.css";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileSection() {
  const { user, isLoaded } = useUser();

  // Display name is kept in unsafeMetadata.fullName (the Clerk name field isn't
  // enabled in this app) — matches Sidebar/TopBar/SignUpForm.
  const storedName =
    (user?.unsafeMetadata?.fullName as string | undefined) ??
    user?.fullName ??
    "";

  const [name, setName] = useState(storedName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded || !user) {
    return (
      <section className={styles.card}>
        <div className={styles.state}>Loading your profile…</div>
      </section>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "—";
  const role = (user.publicMetadata?.role as string | undefined) ?? "user";
  const isAdmin = role === "admin";
  const dirty = name.trim() !== storedName.trim();

  async function onSave() {
    if (!user || !dirty || !name.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await user.updateMetadata({ unsafeMetadata: { fullName: name.trim() } });
      setSaved(true);
    } catch {
      setError("Couldn't save your name. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.card} id="profile">
      <div className={styles["card-head"]}>
        <h2>Profile &amp; Account</h2>
        <p>Your public identity across SurgeShield.</p>
      </div>
      <div className={styles["card-body"]}>
        <div className={styles["avatar-row"]}>
          <div className={styles["avatar-lg"]} aria-hidden="true">
            {user.hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" />
            ) : (
              initials(storedName || email)
            )}
          </div>
          <div className={styles.info}>
            <p className={styles.place}>{storedName || "Your name"}</p>
            <p className={styles.sub}>Avatar is managed by your sign-in provider.</p>
          </div>
        </div>

        <div className={styles["row-2"]}>
          <div className={styles.field}>
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              className={styles.input}
              type="text"
              value={name}
              maxLength={60}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email address</label>
            <div className={styles["input-lock"]}>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={email}
                readOnly
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <p className={styles.hint}>
              Managed by Clerk — change it from your account provider.
            </p>
          </div>
        </div>

        <div className={styles.field}>
          <label>Role</label>
          <span
            className={`${styles.badge} ${isAdmin ? styles["b-admin"] : styles["b-user"]}`}
          >
            {isAdmin ? "Admin" : "User"}
          </span>
        </div>

        {error && <p className={styles.err}>{error}</p>}
      </div>

      <div className={styles["card-foot"]}>
        {saved && !dirty && (
          <span className={styles["saved-note"]}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Saved
          </span>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles["btn-ghost"]}`}
          disabled={!dirty || saving}
          onClick={() => {
            setName(storedName);
            setSaved(false);
            setError(null);
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles["btn-primary"]}`}
          disabled={!dirty || saving || !name.trim()}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </section>
  );
}
