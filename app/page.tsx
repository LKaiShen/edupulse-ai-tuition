import { redirect } from "next/navigation";
import { currentSession, homeFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function Root() {
  const s = currentSession();
  redirect(s ? homeFor(s.role) : "/login");
}
