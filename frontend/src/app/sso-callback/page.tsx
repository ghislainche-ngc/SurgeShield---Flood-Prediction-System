"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/*
 * OAuth return target. Google/GitHub redirect here after the user authorizes;
 * Clerk finalizes the sign-in/sign-up and forwards to the app. The fallback
 * URLs guarantee an onward destination so Clerk never strands the user on the
 * hosted Account Portal ("signed in, but cannot redirect to your application").
 */
const SIGN_IN_FALLBACK =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? "/dashboard";
const SIGN_UP_FALLBACK =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? "/dashboard";

export default function SSOCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl={SIGN_IN_FALLBACK}
      signUpFallbackRedirectUrl={SIGN_UP_FALLBACK}
    />
  );
}
