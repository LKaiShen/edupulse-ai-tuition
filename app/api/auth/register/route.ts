import { NextResponse } from "next/server";
import { COOKIE, makeToken } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/users";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  const phone = String(b.phone ?? "").trim();
  const email = String(b.email ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");

  if (!name || !phone || !email || !password) return NextResponse.json({ error: "请填写所有必填项" }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  if (await findUserByEmail(email)) return NextResponse.json({ error: "该邮箱已注册，请直接登录" }, { status: 409 });

  const u = await createUser({ name, phone, email, password });
  const res = NextResponse.json({ ok: true, role: "user" }, { status: 201 });
  res.cookies.set(COOKIE, makeToken({ uid: u.id, email: u.email, role: "user", name: u.name, phone: u.phone }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
