import AdminView from "@/components/admin/AdminView";

// Admin overview. Access is enforced upstream by src/proxy.ts (role: "admin"
// from the session token) and again by every admin query via requireAdmin;
// AdminView renders its own header per designs/09-admin.html.
export default function AdminPage() {
  return <AdminView />;
}
