import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shipments, trackingEvents, orders, wishes, auditLog } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const updateSchema = z.object({
  status: z.enum(["dispatched", "in_transit", "delivered", "failed", "returned"]),
  locationText: z.string().max(120).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.user!;

  const { trackingId } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  const { status, locationText } = parsed.data;

  const rows = await db.select().from(shipments).where(eq(shipments.trackingId, trackingId)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  const shipment = rows[0];

  const now = new Date();

  await db.update(shipments)
    .set({
      status,
      deliveredAt: status === "delivered" ? now : shipment.deliveredAt,
    })
    .where(eq(shipments.id, shipment.id));

  await db.insert(trackingEvents).values({
    shipmentId: shipment.id,
    status,
    locationText: locationText ?? null,
    occurredAt: now,
    rawPayload: { source: "manual_admin_update" },
  });

  // Sync wish status
  const orderRows = await db.select().from(orders).where(eq(orders.id, shipment.orderId)).limit(1);
  if (orderRows.length > 0) {
    const order = orderRows[0];
    const wishStatusMap = {
      dispatched: "shipped",
      in_transit: "shipped",
      delivered: "delivered",
      failed: "failed",
      returned: "failed",
    } as const;
    await db.update(wishes)
      .set({ status: wishStatusMap[status], updatedAt: now })
      .where(eq(wishes.id, order.wishId));
    await db.update(orders).set({ status }).where(eq(orders.id, order.id));
  }

  await db.insert(auditLog).values({
    actorId: admin.id,
    actorRole: admin.role,
    action: "shipment.updated",
    entityType: "shipment",
    entityId: shipment.id,
    metadata: { trackingId, status, locationText },
  });

  return NextResponse.json({ ok: true, trackingId, status });
}
