import { ConvexReactClient } from "convex/react";

// Single browser-side Convex client. NEXT_PUBLIC_CONVEX_URL is written to
// .env.local by `npx convex dev`. Imported only by ConvexClientProvider.
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
);
