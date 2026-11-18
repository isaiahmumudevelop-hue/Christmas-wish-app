import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { wishes, shipments, orders, guardians } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import GuardianRequestForm from "@/components/GuardianRequestForm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Check consent status for minors
  let needsConsent = false;
  if (user.isMinor) {
    const consentRows = await db.select().from(guardians)
      .where(and(eq(guardians.minorUserId, user.id), eq(guardians.consentStatus, "granted")))
      .limit(1);
    if (consentRows.length === 0) needsConsent = true;
  }

  const myWishes = await db
    .select({
      wish: wishes,
      shipment: { trackingId: shipments.trackingId },
    })
    .from(wishes)
    .leftJoin(orders, eq(wishes.id, orders.wishId))
    .leftJoin(shipments, eq(orders.id, shipments.orderId))
    .where(eq(wishes.wisherId, user.id))
    .orderBy(desc(wishes.createdAt));

  const totalWishes = myWishes.length;
  const deliveredWishes = myWishes.filter(w => w.wish.status === "delivered").length;
  const pendingWishes = myWishes.filter(w => ["submitted", "under_review", "verified", "sponsored", "ordered", "shipped"].includes(w.wish.status)).length;

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      {/* Header Banner */}
      <div className="bg-gray-900 rounded-[2rem] p-8 md:p-12 text-white mb-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6 z-10">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-20 h-20 rounded-full border-4 border-gray-700 object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold border-4 border-gray-700">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome back, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-gray-400 mt-2 text-lg">Manage your wishes and track your deliveries here.</p>
          </div>
        </div>
        <Link href="/wishes/new" className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-500 transition shadow-lg shadow-rose-600/30 whitespace-nowrap z-10">
          + Make a New Wish
        </Link>
        <div className="absolute top-0 right-0 text-9xl opacity-5 transform translate-x-10 -translate-y-10">🎄</div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Total Wishes</p>
          <p className="text-3xl font-extrabold text-gray-900">{totalWishes}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">In Progress</p>
          <p className="text-3xl font-extrabold text-yellow-600">{pendingWishes}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Delivered</p>
          <p className="text-3xl font-extrabold text-emerald-600">{deliveredWishes}</p>
        </div>
      </div>

      {needsConsent && <GuardianRequestForm minorUserId={user.id} />}

      {user.role === "wisher" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Want to make a difference?</h3>
            <p className="text-gray-500 text-sm mt-1">Register your company as a sponsor to fund verified wishes.</p>
          </div>
          <Link href="/sponsor/register" className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-bold whitespace-nowrap hover:bg-gray-800 transition">
            Become a Sponsor
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Wishes</h2>
      </div>

      {myWishes.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-3xl shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No wishes yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">You haven't made any wishes. When you do, you'll be able to track their progress right here.</p>
          <Link href="/wishes/new" className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition">
            Create Your First Wish
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {myWishes.map((item) => (
            <div key={item.wish.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${item.wish.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 
                      item.wish.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      item.wish.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {item.wish.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ₦{Number(item.wish.estimatedCost).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.wish.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">{item.wish.description}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 capitalize flex items-center gap-1">
                  📁 {item.wish.category}
                </span>
                {item.shipment?.trackingId ? (
                  <Link href={`/track/${item.shipment.trackingId}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                    Track Delivery <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400 italic">Awaiting Tracking</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
