"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import styles from "./auth.module.css";

/*
 * Google + GitHub OAuth, shared by both auth pages. Uses Clerk's signals API
 * (signIn.sso / signUp.sso): the browser is sent to the provider and returns
 * to /sso-callback, which finalizes the session (app/sso-callback/page.tsx).
 *
 * Requires Google and GitHub to be enabled in the Clerk dashboard
 * (Configure → SSO connections); otherwise the call returns an error.
 */

type Provider = "oauth_google" | "oauth_github";

export default function SocialButtons({
  mode,
}: {
  mode: "sign-in" | "sign-up";
}) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [pending, setPending] = useState<Provider | null>(null);

  async function authenticate(strategy: Provider) {
    setPending(strategy);
    const opts = {
      strategy,
      redirectUrl: "/sso-callback",
      redirectCallbackUrl: "/sso-callback",
    };
    try {
      const res =
        mode === "sign-in"
          ? await signIn?.sso(opts)
          : await signUp?.sso(opts);
      // On success the browser navigates away; only re-enable on failure.
      if (res?.error) setPending(null);
    } catch {
      setPending(null);
    }
  }

  return (
    <div className={styles["social-row"]}>
      <button
        type="button"
        className={styles["btn-social"]}
        onClick={() => authenticate("oauth_google")}
        disabled={pending !== null}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.43-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z"
          />
        </svg>
        Google
      </button>
      <button
        type="button"
        className={styles["btn-social"]}
        onClick={() => authenticate("oauth_github")}
        disabled={pending !== null}
      >
        <svg viewBox="0 0 24 24" fill="#1c1c1c" aria-hidden="true">
          <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.94c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .3.2.67.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
        </svg>
        GitHub
      </button>
    </div>
  );
}
