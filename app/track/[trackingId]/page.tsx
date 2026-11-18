import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { shipments, trackingEvents, orders, wishes, users } from "@/db/schema";

const STATUS_STYLES: Record<string, { label: string; badge: string; dot: string }> = {
  label_created: { label: "Order Placed", badge: "bg-gray-100 text-gray-800", dot: "bg-gray-400" },
  dispatched:    { label: "Dispatched", badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  in_transit:    { label: "In Transit", badge: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500" },
  delivered:     { label: "Delivered", badge: "bg-green-100 text-green-800", dot: "bg-green-500" },
  failed:        { label: "Failed", badge: "bg-red-100 text-red-800", dot: "bg-red-500" },
  returned:      { label: "Returned", badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
};

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const { trackingId } = await params;

  const rows = await db
    .select({
      shipment: shipments,
      wish: { id: wishes.id, title: wishes.title, category: wishes.category },
      wisher: { name: users.name },
    })
    .from(shipments)
    .innerJoin(orders, eq(shipments.orderId, orders.id))
    .innerJoin(wishes, eq(orders.wishId, wishes.id))
    .innerJoin(users, eq(wishes.wisherId, users.id))
    .where(eq(shipments.trackingId, trackingId))
    .limit(1);

  if (rows.length === 0) notFound();

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

  const nameParts = wisher.name.trim().split(/\s+/);
  const redactedName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts[0];

  const style = STATUS_STYLES[shipment.status] ?? STATUS_STYLES.label_created;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8 pt-4">
          <div className="text-4xl mb-2">🎁</div>
          <h1 className="text-3xl font-bold text-gray-900">Christmas Wish Tracking</h1>
          <p className="text-gray-600 mt-1">Follow your gift from warehouse to doorstep</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Tracking ID</p>
              <p className="font-mono font-bold text-lg text-gray-900">{shipment.trackingId}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${style.badge}`}>
              {style.label}
            </span>
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Recipient</p>
            <p className="text-lg font-semibold text-gray-900">{redactedName}</p>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Gift:</span> {wish.title}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Category:</span> {wish.category}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Carrier:</span> {shipment.carrier}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Timeline</h2>
          <ol className="relative border-l-2 border-gray-200 ml-2">
            {events.map((e, i) => {
              const es = STATUS_STYLES[e.status] ?? STATUS_STYLES.label_created;
              const isLatest = i === 0;
              return (
                <li key={i} className="mb-6 ml-6">
                  <span
                    className={`absolute -left-[9px] w-4 h-4 rounded-full ring-4 ring-white ${es.dot} ${isLatest ? "animate-pulse" : ""}`}
                  />
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <p className={`font-semibold ${isLatest ? "text-gray-900" : "text-gray-700"}`}>
                      {es.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(e.occurredAt).toLocaleString()}
                    </p>
                  </div>
                  {e.locationText && (
                    <p className="text-sm text-gray-600 mt-1">{e.locationText}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Recipient names are shortened for privacy. Contact support with your tracking ID for help.
        </p>
      </div>
    </main>
  );
}
