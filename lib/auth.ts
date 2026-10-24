import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "edupulse_session";
const SECRET = process.env.AUTH_SECRET || "edupulse-demo-secret-change-me";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@edupulse.ai";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export type Role = "user" | "admin";
export interface Session {
  uid: string;
  email: string;
  role: Role;
  name: string;
  phone: string;
}

const sign = (v: string) => createHmac("sha256", SECRET).update(v).digest("hex");

export function makeToken(s: Session) {
  const payload = JSON.stringify({ ...s, exp: Date.now() + 1000 * 60 * 60 * 12 });
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifyToken(token?: string): Session | null {
  if (!token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const payload = Buffer.from(b64, "base64url").toString();
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { exp, ...s } = JSON.parse(payload);
    return Number(exp) > Date.now() ? (s as Session) : null;
  } catch {
    return null;
  }
}

export function currentSession(): Session | null {
  return verifyToken(cookies().get(COOKIE)?.value);
}

export const homeFor = (role: Role) => (role === "admin" ? "/admin" : "/new");

export const adminSession = (): Session => ({
  uid: "admin",
  email: ADMIN_EMAIL,
  role: "admin",
  name: "教务管理员",
  phone: "",
});
