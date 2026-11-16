import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { shipments, trackingEvents, orders, wishes, users } from "@/db/schema";

// PUBLIC endpoint — no auth. Must never expose:
// - Delivery address
// - Wisher full name (show first name + initial only)
// - Contact details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  const rows = await db
    .select({
      shipment: shipments,
      order: orders,
      wish: { id: wishes.id, title: wishes.title, category: wishes.category },
      wisher: { fullName: users.fullName },
    })
    .from(shipments)
    .innerJoin(orders, eq(shipments.orderId, orders.id))
    .innerJoin(wishes, eq(orders.wishId, wishes.id))
    .innerJoin(users, eq(wishes.wisherId, users.id))
    .where(eq(shipments.trackingId, trackingId))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Tracking ID not found" }, { status: 404 });
  }

  const { shipment, wish, wisher } = rows[0];

  const events = await db
    .select({
      status: trackingEvents.status,
      locationText: trackingEvents.locationText,
      occurredAt: trackingEvents.occurredAt,
    })
    .from(trackingEvents)
    .where(eq(trackingEvents.shipmentId, shipment.id))
    .orderBy(desc(trackingEvents.occurredAt));

  // Redact: first name + first letter of last name only
  const nameParts = wisher.fullName.trim().split(/\s+/);
  const redactedName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts[0];

  return NextResponse.json({
    trackingId: shipment.trackingId,
    status: shipment.status,
    carrier: shipment.carrier,
    estimatedDelivery: shipment.estimatedDelivery,
    deliveredAt: shipment.deliveredAt,
    recipient: redactedName,
    wish: wish.title,
    category: wish.category,
    events,
  });
}
