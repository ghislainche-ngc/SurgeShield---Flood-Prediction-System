"use client";

import { ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { convex } from "@/lib/convex";

/*
 * Bridges Convex and Clerk on the client: ConvexProviderWithClerk forwards the
 * Clerk auth token to Convex so ctx.auth.getUserIdentity() resolves in queries
 * and mutations. Must render inside <ClerkProvider> (it consumes useAuth).
 */
export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
