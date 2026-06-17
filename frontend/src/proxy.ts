import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware(async (auth, req) => {
  // Protect every non-public route. Unauthenticated users are redirected to
  // the sign-in page (NEXT_PUBLIC_CLERK_SIGN_IN_URL).
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // /admin is additionally gated to admins, but that check lives in
  // app/(app)/admin/layout.tsx (reads user.publicMetadata via currentUser) so
  // it works from public_metadata alone — no session-token customization needed.
});

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ...and always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
