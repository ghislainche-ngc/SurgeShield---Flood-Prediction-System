import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

/*
 * Post-login router. Both the password and OAuth flows land here after a
 * successful sign-in; we read the role from public_metadata and forward admins
 * to /admin and everyone else to /dashboard. Renders nothing — it only
 * redirects. Protected by proxy.ts (not a public route), so it's only reached
 * by an authenticated user.
 */
export default async function ContinuePage() {
  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  redirect(role === "admin" ? "/admin" : "/dashboard");
}
