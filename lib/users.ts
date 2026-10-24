import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export const DEMO_PARENT = { email: "parent@edupulse.ai", password: "parent123", name: "陈小明", phone: "012-3456789" };

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
}

export function checkPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}

// In-memory users (always used) + best-effort Supabase `app_users` table when configured.
const g = globalThis as unknown as { __users?: AppUser[]; __usb?: SupabaseClient | null };
const mem: AppUser[] = (g.__users ??= [
  {
    id: "demo-parent",
    name: DEMO_PARENT.name,
    phone: DEMO_PARENT.phone,
    email: DEMO_PARENT.email,
    password_hash: hashPassword(DEMO_PARENT.password),
    created_at: new Date().toISOString(),
  },
]);

function client(): SupabaseClient | null {
  if (g.__usb !== undefined) return g.__usb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  g.__usb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return g.__usb;
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const e = email.trim().toLowerCase();
  const hit = mem.find((u) => u.email === e);
  if (hit) return hit;
  const sb = client();
  if (sb) {
    const { data } = await sb.from("app_users").select("*").eq("email", e).maybeSingle();
    if (data) return data as AppUser;
  }
  return null;
}

export async function createUser(d: { name: string; phone: string; email: string; password: string }): Promise<AppUser> {
  const user: AppUser = {
    id: crypto.randomUUID(),
    name: d.name.trim(),
    phone: d.phone.trim(),
    email: d.email.trim().toLowerCase(),
    password_hash: hashPassword(d.password),
    created_at: new Date().toISOString(),
  };
  mem.push(user);
  const sb = client();
  if (sb) {
    const { error } = await sb.from("app_users").insert(user);
    if (error) console.error("Supabase user insert failed (kept in memory):", error.message);
  }
  return user;
}
