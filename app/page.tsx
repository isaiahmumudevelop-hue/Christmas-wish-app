import Link from "next/link";
import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { wishes, sponsors } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where status = 'delivered')::int`,
    })
    .from(wishes);

  const [sponsorCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sponsors)
    .where(eq(sponsors.verificationStatus, "verified"));

  return (
    <main className="bg-gradient-to-b from-rose-50 via-white to-emerald-50">
      
      {/* Hero Section - Full Screen */}
      <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold mb-6">
            🎄 Spreading joy across Africa
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            Christmas wishes, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-emerald-600">
              verified and delivered.
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Children and families across Nigeria, Ghana, and Cameroon tell us what they need. Our team verifies every wish. Sponsors fund them. We deliver — with real tracking.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wishes/new" className="px-8 py-4 bg-rose-600 text-white rounded-xl font-bold text-lg hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all hover:-translate-y-0.5">
              Make a Wish
            </Link>
            <Link href="/sponsor/wishes" className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 shadow-lg shadow-gray-900/30 transition-all hover:-translate-y-0.5">
              Sponsor a Wish
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 border-t border-gray-200 pt-8">
            <div>
              <p className="text-4xl font-extrabold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">Wishes Submitted</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-emerald-600">{stats.delivered}</p>
              <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">Gifts Delivered</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-rose-600">{sponsorCount.count}</p>
              <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">Verified Sponsors</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-24 border-t">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl mb-6">📝</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">1. Make a wish</h3>
              <p className="text-gray-600 leading-relaxed">
                Tell us what you need — schoolbooks, medicine, food, a laptop. Guardians consent for minors.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl mb-6">✅</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">2. We verify</h3>
              <p className="text-gray-600 leading-relaxed">
                Our team confirms each wish is genuine, appropriate, and within budget. No scams, no spam.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl mb-6">🎁</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">3. Sponsors deliver</h3>
              <p className="text-gray-600 leading-relaxed">
                Verified sponsors purchase and ship the gift. You track every step with your tracking ID.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
