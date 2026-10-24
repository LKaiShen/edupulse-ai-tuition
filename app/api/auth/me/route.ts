import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = currentSession();
  return s ? NextResponse.json(s) : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
