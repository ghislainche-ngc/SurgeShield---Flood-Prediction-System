"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { RiskLevel } from "../dashboard/risk";
import { listClerkUsers, type ClerkUserRow } from "@/app/(app)/admin/actions";
import styles from "./admin.module.css";

type MlStatus = {
  online: boolean;
  modelLoaded: boolean;
  latencyMs: number | null;
  bestModel: string | null;
  accuracy: number | null;
};

/*
 * Admin overview, ported from designs/09-admin.html. Everything here is LIVE
 * Convex data except the ML-API health/metrics, which stay honest "—"
 * placeholders until the Flask API is tunnelled + ML_API_URL is set (project
 * rule: never hard-code model metrics). The design's demo figures (156 users,
 * "XGBoost loaded", 93.2% accuracy) are intentionally not reproduced.
 */

const RISK_HEX: Record<RiskLevel, string> = {
  Low: "#15803d",
  Moderate: "#b45309",
  High: "#b91c1c",
  Critical: "#7f1d1d",
};
const RISK_DOT: Record<RiskLevel, string> = {
  Low: "#16a34a",
  Moderate: "#d97706",
  High: "#dc2626",
  Critical: "#7f1d1d",
};

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function initials(label: string): string {
  const parts = label.trim().split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function relativeTime(ts: number, now: number): string {
  if (!ts) return "—";
  if (!now) return "…";
  const diff = now - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString();
}

export default function AdminView() {
  const overview = useQuery(api.admin.getSystemOverview);
  const summaries = useQuery(api.admin.getUserSummaries);
  const feed = useQuery(api.admin.getActivityFeed, { limit: 12 });
  const trends = useQuery(api.admin.getPredictionTrends, { days: 30 });

  // Authoritative roster from Clerk (all registered users, even those who never
  // predicted). Refetched every 60s to pick up new signups. Falls back to the
  // Convex directory (`summaries`) if it's empty/unavailable.
  const [roster, setRoster] = useState<ClerkUserRow[] | null>(null);
  useEffect(() => {
    let ignore = false;
    const load = () => {
      listClerkUsers()
        .then((u) => {
          if (!ignore) setRoster(u);
        })
        .catch(() => {
          if (!ignore) setRoster([]);
        });
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      ignore = true;
      clearInterval(id);
    };
  }, []);

  // Activity (prediction count + last-active) keyed by Clerk user id, from the
  // reactive Convex summaries.
  const activityById = useMemo(() => {
    const m = new Map<
      string,
      { predictionCount: number; lastActive: number; role: string }
    >();
    (summaries ?? []).forEach((s) =>
      m.set(s.userId, {
        predictionCount: s.predictionCount,
        lastActive: s.lastActive,
        role: s.role,
      }),
    );
    return m;
  }, [summaries]);

  // Merge roster (preferred) with activity. While the roster is loading, use the
  // Convex directory so the table isn't empty.
  const users = useMemo(() => {
    if (roster && roster.length > 0) {
      return roster.map((c) => {
        const a = activityById.get(c.id);
        return {
          userId: c.id,
          name: c.name ?? undefined,
          email: c.email ?? undefined,
          role: c.role === "admin" ? "admin" : "user",
          predictionCount: a?.predictionCount ?? 0,
          // Heartbeat-based presence only (Clerk lastSignInAt ≠ in-app presence),
          // so "online" reflects an actually-open app.
          lastActive: a?.lastActive ?? 0,
        };
      });
    }
    if (roster === null) return undefined; // still loading the roster
    return summaries; // roster empty (error/non-admin) → Convex directory
  }, [roster, activityById, summaries]);

  const totalUsers =
    roster && roster.length > 0 ? roster.length : overview?.totalUsers;

  // Live ML-API health (status + latency + best model + accuracy). Convex
  // queries above are already reactive; this action is polled every 30s so the
  // health panel stays current too.
  const getMlStatus = useAction(api.actions.getMlStatus);
  const [ml, setMl] = useState<MlStatus | null>(null);
  useEffect(() => {
    let ignore = false;
    const poll = () => {
      getMlStatus({})
        .then((s) => {
          if (!ignore) setMl(s);
        })
        .catch(() => {
          if (!ignore)
            setMl({
              online: false,
              modelLoaded: false,
              latencyMs: null,
              bestModel: null,
              accuracy: null,
            });
        });
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => {
      ignore = true;
      clearInterval(id);
    };
  }, [getMlStatus]);

  const [search, setSearch] = useState("");
  // Read wall-clock time off the render path (React purity) and refresh it each
  // minute so "online" status and relative times stay current. Starts at 0 so
  // server and first client render agree, then the effect fills it in.
  const [now, setNow] = useState(0);
  useEffect(() => {
    // Fill in immediately (timeout, not a direct effect-body setState) and
    // refresh each minute, both via callbacks so render stays pure.
    const t = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  const num = (v: number | undefined) => (v === undefined ? "…" : v.toLocaleString());

  const filteredUsers = useMemo(() => {
    if (!users) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const floodRatePct =
    overview === undefined ? "…" : `${(overview.floodDetectionRate * 100).toFixed(1)}%`;

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const newUsersThisWeek =
    roster && roster.length > 0 && now
      ? roster.filter((c) => now - c.createdAt < WEEK_MS).length
      : (overview?.newUsersThisWeek ?? 0);

  // Derived ML-API health values for the cards + System Health panel.
  const mlOnline = ml?.online ?? false;
  const mlAccuracy =
    ml && ml.accuracy != null ? `${(ml.accuracy * 100).toFixed(1)}%` : "—";
  const mlLatency = ml && ml.latencyMs != null ? `${ml.latencyMs} ms` : "—";
  const mlBest = ml?.bestModel ?? "—";
  const dbConnected = overview !== undefined;

  return (
    <>
      <div className={styles.header}>
        <h1>System Overview</h1>
        <span className={styles["admin-badge"]}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Admin Access
        </span>
      </div>

      {/* ===== 5 stat cards ===== */}
      <section className={styles.stats} aria-label="System statistics">
        <div className={styles["stat-card"]}>
          <div className={styles["stat-head"]}>
            <span className={styles["stat-title"]}>Total Users</span>
            <span className={`${styles["stat-ic"]} ${styles["ic-blue"]}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3" />
                <path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5s4.8 1.5 5.5 4.5" />
                <path d="M16 5a3 3 0 0 1 0 6" />
              </svg>
            </span>
          </div>
          <p className={styles["stat-num"]}>{num(totalUsers)}</p>
          {newUsersThisWeek > 0 ? (
            <p className={`${styles["stat-foot"]} ${styles.up}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
              {newUsersThisWeek} this week
            </p>
          ) : (
            <p className={styles["stat-foot"]}>Registered accounts</p>
          )}
        </div>

        <div className={styles["stat-card"]}>
          <div className={styles["stat-head"]}>
            <span className={styles["stat-title"]}>Total Predictions</span>
            <span className={`${styles["stat-ic"]} ${styles["ic-teal"]}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="12" cy="12" r="0.8" fill="currentColor" />
              </svg>
            </span>
          </div>
          <p className={styles["stat-num"]}>{num(overview?.totalPredictions)}</p>
          {overview && overview.predictionsThisWeek > 0 ? (
            <p className={`${styles["stat-foot"]} ${styles.up}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
              {overview.predictionsThisWeek} this week
            </p>
          ) : (
            <p className={styles["stat-foot"]}>All-time</p>
          )}
        </div>

        <div className={styles["stat-card"]}>
          <div className={styles["stat-head"]}>
            <span className={styles["stat-title"]}>Flood Detection Rate</span>
            <span className={`${styles["stat-ic"]} ${styles["ic-amber"]}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" />
              </svg>
            </span>
          </div>
          <p className={styles["stat-num"]}>{floodRatePct}</p>
          <p className={styles["stat-foot"]}>
            {overview ? `${overview.floodDetectedCount} floods detected` : " "}
          </p>
        </div>

        <div className={styles["stat-card"]}>
          <div className={styles["stat-head"]}>
            <span className={styles["stat-title"]}>Predictions Today</span>
            <span className={`${styles["stat-ic"]} ${styles["ic-purple"]}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18M7 21V11M12 21V7M17 21v-8" />
              </svg>
            </span>
          </div>
          <p className={styles["stat-num"]}>{num(overview?.predictionsToday)}</p>
          <p className={styles["stat-foot"]}>Since midnight UTC</p>
        </div>

        <div className={styles["stat-card"]}>
          <div className={styles["stat-head"]}>
            <span className={styles["stat-title"]}>ML API Health</span>
            <span className={`${styles["stat-ic"]} ${styles["ic-green"]}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h4l3 8 4-16 3 8h4" />
              </svg>
            </span>
          </div>
          {/* Live: pings the Flask API /health every 30s. */}
          {ml === null ? (
            <>
              <p className={styles["stat-num"]} style={{ fontSize: 22 }}>…</p>
              <p className={styles["stat-foot"]}>Checking…</p>
            </>
          ) : mlOnline ? (
            <>
              <p className={styles["stat-num"]} style={{ fontSize: 22, display: "flex", alignItems: "center", gap: 9 }}>
                Operational <span className={styles["online-dot"]} />
              </p>
              <p className={styles["stat-foot"]}>
                {ml.latencyMs != null ? `${ml.latencyMs} ms response` : "Model loaded"}
              </p>
            </>
          ) : (
            <>
              <p className={styles["stat-num"]} style={{ fontSize: 22, display: "flex", alignItems: "center", gap: 9 }}>
                Offline <span className={styles["offline-dot"]} />
              </p>
              <p className={styles["stat-foot"]}>API unreachable</p>
            </>
          )}
        </div>
      </section>

      {/* ===== users + system health ===== */}
      <div className={styles["row-2"]}>
        <section className={`${styles.card} ${styles["card-pad"]}`}>
          <div className={styles["card-head-flex"]}>
            <h2>Registered Users</h2>
            <span className={styles["mini-search"]}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.5-4.5" />
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search users"
              />
            </span>
          </div>

          {filteredUsers === undefined ? (
            <p className={styles.empty}>Loading users…</p>
          ) : filteredUsers.length === 0 ? (
            <p className={styles.empty}>
              {users && users.length > 0
                ? "No users match your search."
                : "No registered users yet."}
            </p>
          ) : (
            <div className={styles["table-scroll"]}>
            <table className={styles.utable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Predictions</th>
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const label = u.name ?? u.email ?? `User ${u.userId.slice(-6)}`;
                  const online = now !== 0 && now - u.lastActive < ONLINE_WINDOW_MS;
                  return (
                    <tr key={u.userId}>
                      <td>
                        <div className={styles["u-name"]}>
                          <span className={styles["u-av"]}>{initials(label)}</span>
                          <div>
                            <strong>{label}</strong>
                            {u.email && <div className={styles["u-email"]}>{u.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        {u.role === "admin" ? (
                          <span className={`${styles.role} ${styles["role-admin"]}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
                            </svg>
                            Admin
                          </span>
                        ) : (
                          <span className={`${styles.role} ${styles["role-user"]}`}>User</span>
                        )}
                      </td>
                      <td className={styles["u-count"]}>{u.predictionCount}</td>
                      <td className={styles["u-active"]}>{relativeTime(u.lastActive, now)}</td>
                      <td>
                        <span className={`${styles.status} ${online ? styles["st-online"] : styles["st-offline"]}`}>
                          <span className={styles.sd} />
                          {online ? "Online" : "Offline"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </section>

        <section className={`${styles.card} ${styles["card-pad"]}`}>
          <h2>System Health</h2>
          <div className={styles["health-row"]}>
            <span className={styles["health-k"]}>
              <span className={`${styles.hd} ${mlOnline ? "" : styles["hd-off"]}`} />ML API Status
            </span>
            <span className={`${styles["health-v"]} ${mlOnline ? "" : styles.muted}`}>
              {ml === null ? "…" : mlOnline ? "Operational" : "Not connected"}
            </span>
          </div>
          <div className={styles["health-row"]}>
            <span className={styles["health-k"]}>Best Model</span>
            <span className={`${styles["health-v"]} ${mlBest === "—" ? styles.muted : ""}`}>{mlBest}</span>
          </div>
          <div className={styles["health-row"]}>
            <span className={styles["health-k"]}>Model Accuracy</span>
            <span className={`${styles["health-v"]} ${mlAccuracy === "—" ? styles.muted : ""}`}>{mlAccuracy}</span>
          </div>
          <div className={styles["health-row"]}>
            <span className={styles["health-k"]}>API Response Time</span>
            <span className={`${styles["health-v"]} ${mlLatency === "—" ? styles.muted : ""}`}>{mlLatency}</span>
          </div>
          <div className={styles["health-row"]}>
            <span className={styles["health-k"]}>
              <span className={`${styles.hd} ${dbConnected ? "" : styles["hd-off"]}`} />Database Status
            </span>
            <span className={`${styles["health-v"]} ${dbConnected ? "" : styles.muted}`}>
              {dbConnected ? "Convex Connected" : "Connecting…"}
            </span>
          </div>
          <p className={styles.note}>
            ML API status, latency, best model and accuracy are read live from the
            Flask service (refreshed every 30s); user, prediction and activity data
            stream in real time from Convex.
          </p>
        </section>
      </div>

      {/* ===== activity feed ===== */}
      <section className={`${styles.card} ${styles["card-pad"]} ${styles.full}`}>
        <h2>Recent Platform Activity</h2>
        {feed === undefined ? (
          <p className={styles.empty}>Loading activity…</p>
        ) : feed.length === 0 ? (
          <p className={styles.empty}>No predictions have been made yet.</p>
        ) : (
          feed.map((f) => {
            const risk = f.riskLevel as RiskLevel;
            const pct = Math.round(f.probability * 100);
            return (
              <div key={f.id} className={styles["feed-item"]}>
                <span className={styles["feed-dot"]} style={{ background: RISK_DOT[risk] }} />
                <div className={styles["feed-body"]}>
                  <p className={styles.ft}>
                    <strong>{f.userName}</strong> predicted{" "}
                    <strong style={{ color: RISK_HEX[risk] }}>
                      {risk.toUpperCase()} RISK ({pct}%)
                    </strong>{" "}
                    for {f.locationName?.trim() || "an unnamed location"}
                  </p>
                  <p className={styles.fm}>{relativeTime(f.createdAt, now)}</p>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ===== prediction trends ===== */}
      <section className={`${styles.card} ${styles["card-pad"]} ${styles.full}`}>
        <h2>Prediction Trends — Last 30 Days</h2>
        <div className={styles.legend} aria-hidden="true">
          <span><i style={{ background: "#0d9488" }} />All predictions</span>
          <span><i style={{ background: "#dc2626" }} />High / critical risk</span>
        </div>
        <div className={styles["trends-box"]}>
          <TrendsChart data={trends} />
        </div>
      </section>
    </>
  );
}

/** Lightweight SVG area+line chart for the 30-day prediction trend. */
function TrendsChart({
  data,
}: {
  data: { date: number; count: number; highCount: number }[] | undefined;
}) {
  if (data === undefined) return <p className={styles.empty}>Loading trend…</p>;

  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return <p className={styles.empty}>No predictions in the last 30 days yet.</p>;
  }

  const W = 800;
  const H = 240;
  const padT = 10;
  const padB = 22;
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.count));
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const baseY = H - padB;

  const area =
    `M ${x(0)},${baseY} ` +
    data.map((d, i) => `L ${x(i)},${y(d.count)}`).join(" ") +
    ` L ${x(n - 1)},${baseY} Z`;
  const line = data.map((d, i) => `${x(i)},${y(d.count)}`).join(" ");
  const highLine = data.map((d, i) => `${x(i)},${y(d.highCount)}`).join(" ");

  return (
    <svg
      className={styles["trends-svg"]}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Daily prediction counts over the last 30 days"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(13,148,136,0.22)" />
          <stop offset="100%" stopColor="rgba(13,148,136,0)" />
        </linearGradient>
      </defs>
      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#f1ece1" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d={area} fill="url(#trendFill)" />
      <polyline points={line} fill="none" stroke="#0d9488" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <polyline points={highLine} fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
