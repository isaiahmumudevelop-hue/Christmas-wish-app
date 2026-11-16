import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { wishes, sponsors, users, sponsorships } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  
  // Security check: Only admins can see this
  if (!user || (user.role !== "admin" && user.role !== "reviewer")) {
    redirect("/");
  }

  // 1. Get Wish Stats
  const [wishStats] = await db.select({
    total: sql<number>`count(*)::int`,
    pending: sql<number>`count(*) filter (where status = 'submitted')::int`,
    verified: sql<number>`count(*) filter (where status = 'verified')::int`,
    delivered: sql<number>`count(*) filter (where status = 'delivered')::int`,
  }).from(wishes);

  // 2. Get Sponsor Stats
  const [sponsorStats] = await db.select({
    total: sql<number>`count(*)::int`,
    pending: sql<number>`count(*) filter (where verification_status = 'pending')::int`,
    verified: sql<number>`count(*) filter (where verification_status = 'verified')::int`,
  }).from(sponsors);

  // 3. Get Financial Stats
  const [financials] = await db.select({
    totalPledged: sql<number>`coalesce(sum(amount), 0)::int`,
  }).from(sponsorships).where(eq(sponsorships.paymentStatus, "paid"));

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
        <p className="text-gray-500 mt-2">Monitor platform activity, verify users, and track impact.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Pledged</p>
          <p className="text-4xl font-extrabold text-emerald-600 mt-2">
            ₦{financials.totalPledged.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">Successfully funded by sponsors</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Wishes</p>
          <p className="text-4xl font-extrabold text-gray-900 mt-2">{wishStats.total}</p>
          <p className="text-sm text-gray-500 mt-2">{wishStats.delivered} successfully delivered</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Verified Sponsors</p>
          <p className="text-4xl font-extrabold text-blue-600 mt-2">{sponsorStats.verified}</p>
          <p className="text-sm text-gray-500 mt-2">Registered businesses</p>
        </div>
      </div>

      {/* Action Queues */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Action Required</h2>
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Wish Queue Card */}
        <Link href="/admin/wishes" className="group block bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-rose-300 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📝</div>
            {wishStats.pending > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                {wishStats.pending} Pending
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Wish Verification Queue</h3>
          <p className="text-gray-500 text-sm">Review new wishes, verify their authenticity, and approve them for sponsors.</p>
        </Link>

        {/* Sponsor Queue Card */}
        <Link href="/admin/sponsors" className="group block bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏢</div>
            {sponsorStats.pending > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                {sponsorStats.pending} Pending
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Sponsor Verification Queue</h3>
          <p className="text-gray-500 text-sm">Review business registrations to ensure only legitimate companies can fund wishes.</p>
        </Link>

      </div>
    </main>
  );
}
