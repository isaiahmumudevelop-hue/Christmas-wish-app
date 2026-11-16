import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishes, sponsorships, orders, shipments, trackingEvents, auditLog } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const createOrderSchema = z.object({
  wishId: z.string().uuid(),
  vendor: z.string().min(2).max(120),
  vendorOrderRef: z.string().max(120).optional(),
  totalCost: z.number().positive(),
  carrier: z.enum(["terminal_africa", "dhl", "gig", "local"]).default("terminal_africa"),
});

function generateTrackingId() {
  return "XW" + randomBytes(8).toString("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.user!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const wishRows = await db.select().from(wishes).where(eq(wishes.id, data.wishId)).limit(1);
  if (wishRows.length === 0) return NextResponse.json({ error: "Wish not found" }, { status: 404 });
  const wish = wishRows[0];

  if (wish.status !== "sponsored") {
    return NextResponse.json(
      { error: `Cannot create order — wish is "${wish.status}", must be "sponsored"`, currentStatus: wish.status },
      { status: 409 }
    );
  }

  const spRows = await db.select().from(sponsorships).where(eq(sponsorships.wishId, wish.id)).limit(1);
  if (spRows.length === 0) return NextResponse.json({ error: "No sponsorship for this wish" }, { status: 409 });
  const sponsorship = spRows[0];

  if (sponsorship.paymentStatus !== "paid") {
    return NextResponse.json(
      { error: `Sponsorship payment is "${sponsorship.paymentStatus}", must be "paid"` },
      { status: 409 }
    );
  }

  const existing = await db.select().from(orders).where(eq(orders.wishId, wish.id)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Order already exists for this wish", orderId: existing[0].id }, { status: 409 });
  }

  const now = new Date();
  const trackingId = generateTrackingId();

  const [order] = await db
    .insert(orders)
    .values({
      wishId: wish.id,
      sponsorshipId: sponsorship.id,
      vendor: data.vendor,
      vendorOrderRef: data.vendorOrderRef ?? null,
      totalCost: data.totalCost.toFixed(2),
      status: "purchased",
      createdBy: admin.id,
    })
    .returning();

  const [shipment] = await db
    .insert(shipments)
    .values({
      orderId: order.id,
      carrier: data.carrier,
      trackingId,
      status: "label_created",
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000"}/track/${trackingId}`,
    })
    .returning();

  await db.insert(trackingEvents).values({
    shipmentId: shipment.id,
    status: "label_created",
    locationText: "Origin warehouse",
    occurredAt: now,
    rawPayload: { source: "manual_admin_create" },
  });

  await db.update(wishes)
    .set({ status: "ordered", updatedAt: now })
    .where(eq(wishes.id, wish.id));

  await db.insert(auditLog).values({
    actorId: admin.id,
    actorRole: admin.role,
    action: "order.created",
    entityType: "order",
    entityId: order.id,
    metadata: {
      wishId: wish.id,
      trackingId,
      vendor: data.vendor,
      totalCost: data.totalCost,
      carrier: data.carrier,
    },
  });

  return NextResponse.json({ ok: true, order, shipment, trackingId }, { status: 201 });
}
