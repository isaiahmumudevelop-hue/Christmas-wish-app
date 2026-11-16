import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await req.json();

  if (body.action === "approve") {
    await db.update(sponsors).set({ verificationStatus: "verified" }).where(eq(sponsors.id, id));
  } else if (body.action === "reject") {
    await db.update(sponsors).set({ verificationStatus: "rejected" }).where(eq(sponsors.id, id));
  }

  return NextResponse.json({ ok: true });
}
