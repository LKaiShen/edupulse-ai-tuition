import AdminDashboard from "@/components/AdminDashboard";
import { requireRole } from "@/lib/guard";

export default function AdminPage() {
  requireRole("admin");
  return <AdminDashboard />;
}
