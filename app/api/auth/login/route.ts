import { NextResponse } from "next/server";
import { ADMIN_EMAIL, ADMIN_PASSWORD, COOKIE, adminSession, makeToken, type Session } from "@/lib/auth";
import { DEMO_PARENT, checkPassword, findUserByEmail } from "@/lib/users";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role = body.role === "admin" ? "admin" : "user";
  const demo = body.demo === true;
  let session: Session | null = null;

  if (role === "admin") {
    const id = demo ? ADMIN_EMAIL : String(body.email ?? "").trim().toLowerCase();
    const pw = demo ? ADMIN_PASSWORD : String(body.password ?? "");
    if ((id === ADMIN_EMAIL.toLowerCase() || id === "admin") && pw === ADMIN_PASSWORD) session = adminSession();
  } else {
    const email = demo ? DEMO_PARENT.email : String(body.email ?? "");
    const pw = demo ? DEMO_PARENT.password : String(body.password ?? "");
    const u = await findUserByEmail(email);
    if (u && checkPassword(pw, u.password_hash))
      session = { uid: u.id, email: u.email, role: "user", name: u.name, phone: u.phone };
  }

  if (!session) return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  const res = NextResponse.json({ ok: true, role: session.role });
  res.cookies.set(COOKIE, makeToken(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
