import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const s = currentSession();
  if (!s) redirect("/login");
  return <AppShell session={{ name: s.name, email: s.email, phone: s.phone, role: s.role }}>{children}</AppShell>;
}
