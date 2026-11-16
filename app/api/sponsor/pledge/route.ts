import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishes, sponsors, sponsorships, auditLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const pledgeSchema = z.object({ wishId: z.string().uuid() });
const DEV_BYPASS = process.env.PAYMENT_DEV_BYPASS === "true";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "sponsor") {
    return NextResponse.json({ error: "Only sponsors can pledge" }, { status: 403 });
  }

  const sp = await db.select().from(sponsors).where(eq(sponsors.userId, user.id)).limit(1);
  if (sp.length === 0) {
    return NextResponse.json({ error: "No sponsor profile" }, { status: 403 });
  }
  const sponsor = sp[0];
  if (sponsor.verificationStatus !== "verified") {
    return NextResponse.json({ error: "Sponsor not verified" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = pledgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const wishRows = await db.select().from(wishes).where(eq(wishes.id, parsed.data.wishId)).limit(1);
  if (wishRows.length === 0) return NextResponse.json({ error: "Wish not found" }, { status: 404 });
  const wish = wishRows[0];

  if (wish.status !== "verified") {
    return NextResponse.json(
      { error: `Cannot pledge a wish in status "${wish.status}"`, currentStatus: wish.status },
      { status: 409 }
    );
  }

  const existing = await db
    .select()
    .from(sponsorships)
    .where(eq(sponsorships.wishId, wish.id))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Already sponsored", sponsorshipId: existing[0].id }, { status: 409 });
  }

  const paymentStatus = DEV_BYPASS ? "paid" : "pending";
  const now = new Date();

  const [sponsorship] = await db
    .insert(sponsorships)
    .values({
      wishId: wish.id,
      sponsorId: sponsor.id,
      amount: wish.estimatedCost!,
      currency: wish.currency!,
      paymentStatus,
      paymentRef: DEV_BYPASS ? `DEV-${Date.now()}` : null,
      gateway: DEV_BYPASS ? "dev_bypass" : "flutterwave",
      paidAt: DEV_BYPASS ? now : null,
    })
    .returning();

  if (DEV_BYPASS) {
    await db.update(wishes).set({ status: "sponsored", updatedAt: now }).where(eq(wishes.id, wish.id));
  }

  await db.insert(auditLog).values({
    actorId: user.id,
    actorRole: user.role,
    action: "sponsor.pledged",
    entityType: "wish",
    entityId: wish.id,
    metadata: {
      sponsorshipId: sponsorship.id,
      sponsorId: sponsor.id,
      amount: wish.estimatedCost,
      currency: wish.currency,
      paymentStatus,
    },
  });

  return NextResponse.json({
    ok: true,
    sponsorship,
    wishStatus: DEV_BYPASS ? "sponsored" : "verified",
  }, { status: 201 });
}
