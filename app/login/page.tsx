import { redirect } from "next/navigation";
import { currentSession, homeFor } from "@/lib/auth";
import AuthView from "@/components/AuthView";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const s = currentSession();
  if (s) redirect(homeFor(s.role));
  return <AuthView />;
}
