"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import styles from "./settings.module.css";

/** Structural view of a Clerk SessionWithActivities row (avoids a type import). */
type SessionInfo = {
  id: string;
  lastActiveAt: Date;
  latestActivity: {
    browserName?: string;
    deviceType?: string;
    city?: string;
    country?: string;
    isMobile?: boolean;
  };
  revoke: () => Promise<unknown>;
};

const PROVIDERS = [
  {
    id: "google" as const,
    strategy: "oauth_google" as const,
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1z" />
        <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
        <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" />
        <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1z" />
      </svg>
    ),
  },
  {
    id: "github" as const,
    strategy: "oauth_github" as const,
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" fill="#1c1c1c" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
      </svg>
    ),
  },
];

function fmtDate(d: Date) {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SecuritySection() {
  const { user, isLoaded } = useUser();
  const { session: currentSession } = useSession();
  const predictions = useQuery(api.predictions.getUserPredictions);
  const deleteMyAccount = useMutation(api.settings.deleteMyAccount);

  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // provider/session being acted on
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    try {
      const list = (await user.getSessions()) as unknown as SessionInfo[];
      setSessions(list);
    } catch {
      setSessions([]);
    }
  }, [user]);

  useEffect(() => {
    // Async fetch of Clerk sessions; setState runs after the await, not
    // synchronously, so the cascading-render concern doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSessions();
  }, [loadSessions]);

  if (!isLoaded || !user) {
    return (
      <section className={styles.card}>
        <div className={styles.state}>Loading…</div>
      </section>
    );
  }

  async function connect(strategy: "oauth_google" | "oauth_github", id: string) {
    if (!user) return;
    setBusy(id);
    setError(null);
    try {
      const ext = await user.createExternalAccount({
        strategy,
        redirectUrl: "/sso-callback",
      });
      const url = ext.verification?.externalVerificationRedirectURL;
      if (url) {
        window.location.assign(url.toString());
        return;
      }
      setError("Couldn't start the connection. Please try again.");
      setBusy(null);
    } catch {
      setError("Couldn't connect that account.");
      setBusy(null);
    }
  }

  async function disconnect(id: string) {
    if (!user) return;
    if (!window.confirm("Disconnect this account?")) return;
    setBusy(id);
    setError(null);
    try {
      const ea = user.externalAccounts.find((a) => a.provider === id);
      if (ea) {
        await ea.destroy();
        await user.reload();
      }
    } catch {
      setError("Couldn't disconnect that account.");
    } finally {
      setBusy(null);
    }
  }

  async function revoke(s: SessionInfo) {
    setBusy(s.id);
    setError(null);
    try {
      await s.revoke();
      await loadSessions();
    } catch {
      setError("Couldn't sign out that session.");
    } finally {
      setBusy(null);
    }
  }

  function exportCsv() {
    const rows = predictions ?? [];
    const header = ["Date", "Location", "Risk Level", "Probability", "Key Factor"];
    const lines = rows.map((p) =>
      [
        fmtDate(new Date(p.createdAt)),
        p.locationName ?? "",
        p.riskLevel,
        `${(p.probability * 100).toFixed(1)}%`,
        p.topFactors[0]?.feature ?? "",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "surgeshield-predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onDelete() {
    if (!user) return;
    const ok = window.confirm(
      "Delete your account permanently? This removes your predictions, saved locations, and sign-in. This cannot be undone.",
    );
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteMyAccount(); // wipe SurgeShield data while still authenticated
      await user.delete(); // then remove the Clerk identity (signs out)
      window.location.assign("/");
    } catch {
      setError("Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  }

  const predictionCount = predictions?.length ?? 0;

  return (
    <section className={styles.card} id="security">
      <div className={styles["card-head"]}>
        <h2>Security &amp; Data</h2>
        <p>Connected accounts, sessions, and your data.</p>
      </div>
      <div className={styles["card-body"]} style={{ paddingBottom: 24 }}>
        {/* connected accounts */}
        <p className={styles.subhead} style={{ marginTop: 4 }}>
          Connected accounts
        </p>
        {PROVIDERS.map((prov, i) => {
          const ea = user.externalAccounts.find((a) => a.provider === prov.id);
          const last = i === PROVIDERS.length - 1;
          return (
            <div
              key={prov.id}
              className={`${styles["list-row"]} ${last ? styles.last : ""}`}
            >
              <span className={styles["list-ic"]}>{prov.icon}</span>
              <div className={styles["list-meta"]}>
                <p className={styles["l-title"]}>{prov.label}</p>
                <p className={styles["l-sub"]}>
                  {ea ? ea.emailAddress || "Connected" : "Not connected"}
                </p>
              </div>
              {ea ? (
                <button
                  type="button"
                  className={styles["link-btn"]}
                  disabled={busy === prov.id}
                  onClick={() => disconnect(prov.id)}
                >
                  {busy === prov.id ? "…" : "Disconnect"}
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.btn} ${styles["btn-ghost"]} ${styles["btn-sm"]}`}
                  disabled={busy === prov.id}
                  onClick={() => connect(prov.strategy, prov.id)}
                >
                  {busy === prov.id ? "…" : "Connect"}
                </button>
              )}
            </div>
          );
        })}

        {/* active sessions */}
        <p className={styles.subhead}>Active sessions</p>
        {sessions === null ? (
          <p className={styles.empty}>Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className={styles.empty}>No active sessions.</p>
        ) : (
          sessions.map((s, i) => {
            const a = s.latestActivity ?? {};
            const isCurrent = s.id === currentSession?.id;
            const device = [a.browserName, a.deviceType]
              .filter(Boolean)
              .join(" on ");
            const place = [a.city, a.country].filter(Boolean).join(", ");
            return (
              <div
                key={s.id}
                className={`${styles["list-row"]} ${i === sessions.length - 1 ? styles.last : ""}`}
              >
                <span className={styles["list-ic"]}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="12" rx="2" />
                    <path d="M8 20h8M12 16v4" />
                  </svg>
                </span>
                <div className={styles["list-meta"]}>
                  <p className={styles["l-title"]}>
                    {isCurrent ? "This device" : "Other device"}
                    {device ? ` — ${device}` : ""}
                  </p>
                  <p className={styles["l-sub"]}>
                    {[place, isCurrent ? "Active now" : fmtDate(s.lastActiveAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {isCurrent ? (
                  <span className={styles["tag-ok"]}>Current</span>
                ) : (
                  <button
                    type="button"
                    className={styles["link-btn"]}
                    disabled={busy === s.id}
                    onClick={() => revoke(s)}
                  >
                    {busy === s.id ? "…" : "Sign out"}
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* data */}
        <p className={styles.subhead}>Your data</p>
        <div className={`${styles["list-row"]} ${styles.last}`}>
          <span className={styles["list-ic"]}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12M8 11l4 4 4-4" />
              <path d="M4 21h16" />
            </svg>
          </span>
          <div className={styles["list-meta"]}>
            <p className={styles["l-title"]}>Export my predictions</p>
            <p className={styles["l-sub"]}>
              Download all {predictionCount} of your predictions as a CSV file.
            </p>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles["btn-ghost"]} ${styles["btn-sm"]}`}
            disabled={predictions === undefined || predictionCount === 0}
            onClick={exportCsv}
          >
            Export CSV
          </button>
        </div>

        {/* danger zone */}
        <div className={styles.danger}>
          <div>
            <p className={styles["d-title"]}>Delete account</p>
            <p className={styles["d-sub"]}>
              Permanently remove your account, saved locations, and prediction
              history. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles["btn-danger"]}`}
            disabled={deleting}
            onClick={onDelete}
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>

        {error && <p className={styles.err}>{error}</p>}
      </div>
    </section>
  );
}
