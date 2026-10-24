import { NextResponse } from "next/server";
import { triage } from "@/lib/ai";
import { insertInquiry, listInquiries, storageMode } from "@/lib/db";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = currentSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await listInquiries();
  if (s.role === "admin") return NextResponse.json({ inquiries: all, storage: storageMode() });
  // Parents only see their own inquiries, and the draft is exposed only once an admin approved it.
  const mine = all
    .filter((i) => i.user_id === s.uid)
    .map((i) => ({ ...i, ai_draft: i.status === "approved" ? i.ai_draft : "", needs_human: false }));
  return NextResponse.json({ inquiries: mine, storage: storageMode() });
}

export async function POST(req: Request) {
  const s = currentSession();
  if (!s) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (s.role !== "user") return NextResponse.json({ error: "仅家长账号可提交咨询" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parent_name = String(body.parent_name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const branch = body.branch;
  const child_age = Number(body.child_age);
  const question = String(body.question ?? "").trim();

  if (!parent_name || !phone || !question)
    return NextResponse.json({ error: "请填写所有必填项" }, { status: 400 });
  if (branch !== "SS2" && branch !== "SS15")
    return NextResponse.json({ error: "分店必须是 SS2 或 SS15" }, { status: 400 });
  if (!Number.isInteger(child_age) || child_age < 1 || child_age > 99)
    return NextResponse.json({ error: "孩子年龄无效" }, { status: 400 });

  const { result, engine } = await triage({ parent_name, branch, child_age, question });
  const inquiry = await insertInquiry({ parent_name, phone, branch, child_age, question, user_id: s.uid, ...result });
  // The parent must not see the unapproved AI draft.
  return NextResponse.json(
    { inquiry: { ...inquiry, ai_draft: "", needs_human: false }, engine, category: inquiry.category, needs_human: inquiry.needs_human },
    { status: 201 }
  );
}
