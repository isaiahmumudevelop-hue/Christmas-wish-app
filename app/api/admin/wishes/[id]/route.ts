import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishes, auditLog } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const reviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  notes: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const admin = auth.user!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { decision, notes } = parsed.data;

  const existing = await db.select().from(wishes).where(eq(wishes.id, id)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Wish not found" }, { status: 404 });
  }
  const wish = existing[0];

  if (wish.status !== "submitted" && wish.status !== "under_review") {
    return NextResponse.json(
      { error: `Cannot review a wish in status "${wish.status}"`, currentStatus: wish.status },
      { status: 409 }
    );
  }

  const now = new Date();
  const newStatus = decision === "approve" ? "verified" : "rejected";

  const [updated] = await db
    .update(wishes)
    .set({
      status: newStatus,
      reviewerId: admin.id,
      reviewNotes: notes ?? null,
      verifiedAt: decision === "approve" ? now : null,
      updatedAt: now,
    })
    .where(eq(wishes.id, id))
    .returning();

  await db.insert(auditLog).values({
    actorId: admin.id,
    actorRole: admin.role,
    action: decision === "approve" ? "wish.verified" : "wish.rejected",
    entityType: "wish",
    entityId: id,
    metadata: { notes: notes ?? null, previousStatus: wish.status },
  });

  return NextResponse.json({ ok: true, wish: updated });
}
