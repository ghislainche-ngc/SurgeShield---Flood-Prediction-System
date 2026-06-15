import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Next 16 renamed the `middleware` file convention to `proxy` (same runtime
// mechanism). Clerk detects that it ran via the `AuthStatus` header it sets,
// not by filename, so `clerkMiddleware` works unchanged here.

// Public routes — everything else requires a signed-in user.
const isPublicRoute = createRouteMatcher([
  "/", // landing
  "/about(.*)", // about / how it works
  "/contact(.*)", // contact form
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)", // OAuth return — must finalize before auth gating
]);

// Admin panel — additionally requires an "admin" role on the user.
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Protect every non-public route. Unauthenticated users are redirected to
  // the sign-in page (NEXT_PUBLIC_CLERK_SIGN_IN_URL).
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Gate /admin to admins only. The role is read from the session token —
  // configure it in Clerk: Dashboard → Sessions → Customize session token:
  //   { "metadata": "{{user.public_metadata}}" }
  // and set { "role": "admin" } in the user's public metadata.
  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)
      ?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ...and always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
