import { NextResponse } from "next/server";
import { updateInquiry } from "@/lib/db";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (currentSession()?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const patch: { status?: "pending" | "approved"; ai_draft?: string } = {};
  if (body.status === "pending" || body.status === "approved") patch.status = body.status;
  if (typeof body.ai_draft === "string" && body.ai_draft.trim()) patch.ai_draft = body.ai_draft;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const updated = await updateInquiry(params.id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ inquiry: updated });
}
