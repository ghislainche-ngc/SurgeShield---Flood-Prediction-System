"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/*
 * OAuth return target. Google/GitHub redirect here after the user authorizes;
 * Clerk finalizes the sign-in/sign-up and forwards to the redirectUrlComplete
 * passed from SocialButtons (the configured fallback URL).
 */
export default function SSOCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
