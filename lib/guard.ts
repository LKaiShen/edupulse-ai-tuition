import { redirect } from "next/navigation";
import { currentSession, homeFor, type Role } from "./auth";

/** Server-side route guard: send anonymous users to /login and wrong-role users to their own home. */
export function requireRole(role: Role) {
  const s = currentSession();
  if (!s) redirect("/login");
  if (s.role !== role) redirect(homeFor(s.role));
  return s;
}
