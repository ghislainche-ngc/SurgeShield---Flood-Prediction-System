"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";

export type ClerkUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: number;
  lastSignInAt: number | null;
  role: string | null;
};

/*
 * The authoritative list of registered users, straight from Clerk (the source
 * of truth for accounts) — so the admin roster shows everyone, including users
 * who haven't made a prediction yet. Admin-gated server-side. Returns [] for
 * non-admins or on error so the UI falls back to the Convex directory.
 */
export async function listClerkUsers(): Promise<ClerkUserRow[]> {
  const me = await currentUser();
  const myRole = (me?.publicMetadata as { role?: string } | undefined)?.role;
  if (myRole !== "admin") return [];

  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({
      limit: 200,
      orderBy: "-created_at",
    });
    return data.map((u) => {
      const email =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
          ?.emailAddress ??
        u.emailAddresses[0]?.emailAddress ??
        null;
      const fullName = (u.unsafeMetadata as { fullName?: string } | undefined)
        ?.fullName;
      const name =
        fullName ||
        [u.firstName, u.lastName].filter(Boolean).join(" ") ||
        u.username ||
        null;
      return {
        id: u.id,
        email,
        name,
        createdAt: u.createdAt,
        lastSignInAt: u.lastSignInAt,
        role: (u.publicMetadata as { role?: string } | undefined)?.role ?? null,
      };
    });
  } catch {
    return [];
  }
}
