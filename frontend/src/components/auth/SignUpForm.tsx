"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import styles from "./auth.module.css";
import SocialButtons from "./SocialButtons";
import { MailIcon, LockIcon, LockCheckIcon, UserIcon, EyeIcon, EyeOffIcon, ArrowIcon } from "./icons";

const AFTER_SIGN_UP =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? "/";

// Matches the form hint: ≥8 chars, at least one number and one symbol.
const PASSWORD_RE = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

type MaybeError = { longMessage?: string; message?: string } | null | undefined;
const text = (e: MaybeError, fallback: string) =>
  e?.longMessage ?? e?.message ?? fallback;

export default function SignUpForm() {
  const { signUp } = useSignUp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Second step: email-code verification.
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp || submitting) return;
    setError(null);

    if (!name.trim()) return setError("Please enter your full name.");
    if (!PASSWORD_RE.test(password))
      return setError("Password must be at least 8 characters and include a number and a symbol.");
    if (password !== confirm) return setError("Passwords don't match.");
    if (!agree) return setError("Please accept the Terms of Service to continue.");

    setSubmitting(true);
    try {
      // The "Name" field isn't enabled on every Clerk instance, so keep it in
      // unsafeMetadata (always accepted) rather than firstName/lastName.
      const { error: createError } = await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { fullName: name.trim() },
        legalAccepted: agree,
      });
      if (createError) {
        setError(text(createError, "Couldn't create your account."));
        setSubmitting(false);
        return;
      }
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(text(sendError, "Couldn't send the verification code."));
        setSubmitting(false);
        return;
      }
      setVerifying(true);
      setSubmitting(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code,
      });
      if (verifyError) {
        setError(text(verifyError, "Invalid or expired code."));
        setSubmitting(false);
        return;
      }
      if (signUp.status === "complete") {
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          setError(text(finalizeError, "Couldn't complete sign-up."));
          setSubmitting(false);
          return;
        }
        // Hard navigation (not router.push): forces the server to read the
        // freshly-set session cookie, avoiding a bounce back to sign-in.
        window.location.assign(AFTER_SIGN_UP);
      } else {
        setError("That code didn't complete sign-up. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function resendCode() {
    if (!signUp) return;
    setError(null);
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) setError(text(sendError, "Couldn't resend the code."));
  }

  // ----- Verification step -----
  if (verifying) {
    return (
      <div className={styles["form-box"]}>
        <h1>Check your email</h1>
        <p className={styles["form-sub"]}>
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
          finish creating your account.
        </p>

        {error && (
          <p className={styles["form-error"]} role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleVerify} noValidate>
          <div className={styles.field}>
            <label htmlFor="code">Verification code</label>
            <div className={styles["input-wrap"]}>
              <MailIcon className={styles["lead-icon"]} />
              <input
                type="text"
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className={styles["btn-submit"]} disabled={submitting}>
            {submitting ? (
              <>
                Verifying
                <span className={styles.spinner} aria-hidden="true" />
              </>
            ) : (
              <>
                Verify &amp; Continue
                <ArrowIcon />
              </>
            )}
          </button>
        </form>

        <p className={styles["switch-auth"]}>
          Didn&apos;t get it?{" "}
          <button type="button" className={styles.forgot} onClick={resendCode}>
            Resend code
          </button>
        </p>
      </div>
    );
  }

  // ----- Details step -----
  return (
    <div className={styles["form-box"]}>
      <h1>Create your account</h1>
      <p className={styles["form-sub"]}>
        Start predicting flood risk in minutes — free for citizens.
      </p>

      {error && (
        <p className={styles["form-error"]} role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleCreate} noValidate>
        <div className={styles.field}>
          <label htmlFor="name">Full name</label>
          <div className={styles["input-wrap"]}>
            <UserIcon className={styles["lead-icon"]} />
            <input
              type="text"
              id="name"
              placeholder="Ghislain Nkeneng"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

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
              placeholder="Create a password"
              autoComplete="new-password"
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
          <p className={styles.hint}>
            At least 8 characters, with one number and one symbol.
          </p>
        </div>

        <div className={styles.field}>
          <label htmlFor="confirm">Confirm password</label>
          <div className={styles["input-wrap"]}>
            <LockCheckIcon className={styles["lead-icon"]} />
            <input
              type={showPassword ? "text" : "password"}
              id="confirm"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        <label className={styles.terms}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I agree to the <a href="#">Terms of Service</a> and{" "}
            <a href="#">Privacy Policy</a>.
          </span>
        </label>

        {/* Clerk bot-protection (Smart CAPTCHA) renders into this element. */}
        <div id="clerk-captcha" />

        <button type="submit" className={styles["btn-submit"]} disabled={submitting}>
          {submitting ? (
            <>
              Creating account
              <span className={styles.spinner} aria-hidden="true" />
            </>
          ) : (
            <>
              Create Account
              <ArrowIcon />
            </>
          )}
        </button>
      </form>

      <div className={styles.divider}>or continue with</div>

      <SocialButtons mode="sign-up" />

      <p className={styles["switch-auth"]}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </div>
  );
}
