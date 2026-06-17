"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/*
 * OAuth return target. Google/GitHub redirect here after the user authorizes;
 * Clerk finalizes the sign-in/sign-up and forwards to the app. The fallback
 * URLs guarantee an onward destination so Clerk never strands the user on the
 * hosted Account Portal ("signed in, but cannot redirect to your application").
 */
// /continue forwards admins to /admin and everyone else to /dashboard.
const SIGN_IN_FALLBACK = "/continue";
const SIGN_UP_FALLBACK = "/continue";

export default function SSOCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl={SIGN_IN_FALLBACK}
      signUpFallbackRedirectUrl={SIGN_UP_FALLBACK}
    />
  );
}
