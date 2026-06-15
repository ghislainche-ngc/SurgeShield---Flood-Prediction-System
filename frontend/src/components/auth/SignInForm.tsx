"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import styles from "./auth.module.css";
import SocialButtons from "./SocialButtons";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowIcon } from "./icons";

const AFTER_SIGN_IN =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? "/";

// Clerk's signals-API methods resolve to { error }. Prefer the user-facing
// longMessage; fall back to message, then a generic line.
type MaybeError = { longMessage?: string; message?: string } | null | undefined;
const text = (e: MaybeError, fallback: string) =>
  e?.longMessage ?? e?.message ?? fallback;

export default function SignInForm() {
  const { signIn } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error: submitError } = await signIn.password({
        identifier: email,
        password,
      });
      if (submitError) {
        setError(text(submitError, "Couldn't sign you in."));
        setSubmitting(false);
        return;
      }
      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          setError(text(finalizeError, "Couldn't complete sign-in."));
          setSubmitting(false);
          return;
        }
        // Hard navigation (not router.push): forces the server to read the
        // freshly-set session cookie, avoiding a bounce back to sign-in.
        window.location.assign(AFTER_SIGN_IN);
      } else {
        // e.g. MFA — not part of this app's flow yet.
        setError("Additional verification is required to sign in.");
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className={styles["form-box"]}>
      <h1>Welcome back</h1>
      <p className={styles["form-sub"]}>
        Sign in to access your flood prediction dashboard.
      </p>

      {error && (
        <p className={styles["form-error"]} role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="email">Email address</label>
          <div className={styles["input-wrap"]}>
            <MailIcon className={styles["lead-icon"]} />
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <div className={styles["input-wrap"]}>
            <LockIcon className={styles["lead-icon"]} />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles["toggle-vis"]}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div className={styles["row-between"]}>
          <label className={styles.remember}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            Remember me
          </label>
          {/* Stub for now — password reset flow is a follow-up task. */}
          <button type="button" className={styles.forgot} disabled>
            Forgot password?
          </button>
        </div>

        <button type="submit" className={styles["btn-submit"]} disabled={submitting}>
          {submitting ? (
            <>
              Signing in
              <span className={styles.spinner} aria-hidden="true" />
            </>
          ) : (
            <>
              Sign In
              <ArrowIcon />
            </>
          )}
        </button>
      </form>

      <div className={styles.divider}>or continue with</div>

      <SocialButtons mode="sign-in" />

      <p className={styles["switch-auth"]}>
        Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
      </p>
    </div>
  );
}
