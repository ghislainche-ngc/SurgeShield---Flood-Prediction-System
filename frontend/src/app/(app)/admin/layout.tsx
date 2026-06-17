import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

/*
 * Admin route gate. Reads the role straight from the user's public_metadata via
 * currentUser() (server-side) rather than the session token, so it works with
 * only `{ "role": "admin" }` set on the user — no Clerk session-token
 * customization needed. Non-admins are sent to the dashboard. Admin *data* is
 * still independently guarded by Convex `requireAdmin`.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
