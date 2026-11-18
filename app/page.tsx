import Link from "next/link";
import Image from "next/image";
import { sql, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { wishes, sponsors } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch Stats
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

  // Fetch Recent Verified Wishes
  const recentWishes = await db
    .select()
    .from(wishes)
    .where(eq(wishes.status, "verified"))
    .orderBy(desc(wishes.verifiedAt))
    .limit(3);

  return (
    <main className="bg-[#FFF9F9] min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-red-700 via-red-800 to-red-900 overflow-hidden pt-20 pb-32">
        <div className="absolute top-10 left-10 text-6xl opacity-20 transform -rotate-12 blur-sm">🎄</div>
        <div className="absolute bottom-20 right-10 text-8xl opacity-10 transform rotate-12 blur-sm">🎁</div>
        <div className="absolute top-1/3 right-1/4 text-4xl opacity-30 blur-[1px]">❄️</div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md text-red-100 text-sm font-semibold mb-6 border border-white/20 shadow-lg">
            ✨ Spreading joy across Africa
          </span>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Spread joy with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
              thoughtful holiday gifts.
            </span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-red-100 max-w-2xl mx-auto leading-relaxed mb-10">
            Children and families across Nigeria, Ghana, and Cameroon tell us what they need. Our team verifies every wish. Sponsors fund them. We deliver with real tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/wishes/new" className="w-full sm:w-auto px-8 py-4 bg-white text-red-800 rounded-full font-bold text-lg hover:bg-gray-50 shadow-[0_10px_40px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1">
              🎁 Make a Wish
            </Link>
            <Link href="/sponsor/wishes" className="w-full sm:w-auto px-8 py-4 bg-red-950/40 text-white backdrop-blur-md border border-white/20 rounded-full font-bold text-lg hover:bg-red-950/60 shadow-lg transition-all hover:-translate-y-1">
              ❤️ Sponsor a Wish
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#FFF9F9] rounded-t-[3rem]"></div>
      </section>

      {/* FLOATING STATS CARD */}
      <section className="max-w-4xl mx-auto px-6 relative -mt-24 z-20">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-red-50 p-8 md:p-10 grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
          <div>
            <p className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-1">{stats.total}</p>
            <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider">Wishes Made</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-extrabold text-red-600 mb-1">{stats.delivered}</p>
            <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider">Gifts Delivered</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-extrabold text-emerald-600 mb-1">{sponsorCount.count}</p>
            <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider">Verified Sponsors</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-16">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mb-6">📝</div>
            <h3 className="font-bold text-2xl text-gray-900 mb-3">Make a wish</h3>
            <p className="text-gray-600 leading-relaxed">
              Tell us exactly what you need. Whether it's schoolbooks, medicine, or food, we've got you covered. Guardians consent for minors.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center text-3xl mb-6">✅</div>
            <h3 className="font-bold text-2xl text-gray-900 mb-3">We verify</h3>
            <p className="text-gray-600 leading-relaxed">
              Our dedicated team manually reviews and confirms each wish to ensure it is genuine and appropriate. No scams, just real needs.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-6">🚚</div>
            <h3 className="font-bold text-2xl text-gray-900 mb-3">Sponsors deliver</h3>
            <p className="text-gray-600 leading-relaxed">
              Verified sponsors purchase and ship the gift directly. You get a tracking ID to follow the package every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* RECENT GIFTS SHOWCASE */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Smiles Delivered</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Real wishes fulfilled by our generous sponsors. Every package tracked, every smile genuine.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Static Placeholders for visual impact until you have real delivery photos */}
            <div className="rounded-3xl overflow-hidden shadow-sm group relative">
              <img src="https://images.unsplash.com/photo-1543502038-677632fc1f9b?q=80&w=800&auto=format&fit=crop" alt="Gift Delivery" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <p className="text-white font-bold">School books delivered to Amina in Lagos 📚</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-sm group relative">
              <img src="https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=800&auto=format&fit=crop" alt="Gift Delivery" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <p className="text-white font-bold">Winter clothes sponsored by MTN ❄️</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-sm group relative">
              <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop" alt="Gift Delivery" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <p className="text-white font-bold">A new laptop for a coding student 💻</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED VERIFIED WISHES */}
      {recentWishes.length > 0 && (
        <section className="py-20 bg-[#FFF9F9] px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Wishes waiting for a hero</h2>
                <p className="text-gray-500 mt-2">These verified wishes are ready to be sponsored today.</p>
              </div>
              <Link href="/sponsor/wishes" className="hidden md:inline-block text-red-600 font-bold hover:text-red-700 hover:underline">
                See all wishes →
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {recentWishes.map((wish) => (
                <div key={wish.id} className="bg-white rounded-3xl p-6 border border-red-100 flex flex-col justify-between hover:shadow-lg transition-all">
                  <div>
                    <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                      {wish.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{wish.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6">{wish.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="font-extrabold text-gray-900 text-lg">₦{Number(wish.estimatedCost).toLocaleString()}</span>
                    <Link href={`/sponsor/wishes`} className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition">
                      Sponsor
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS / REVIEWS */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-16">Wall of Love</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <div className="flex text-yellow-400 mb-4 text-xl">★★★★★</div>
              <p className="text-gray-700 italic mb-6">"I never thought I would get a new laptop for school. The tracking updates were so clear, I knew exactly when it would arrive. Thank you!"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center font-bold text-red-800">A</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Amina B.</p>
                  <p className="text-xs text-gray-500">Wisher, Lagos</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <div className="flex text-yellow-400 mb-4 text-xl">★★★★★</div>
              <p className="text-gray-700 italic mb-6">"Partnering with Christmas Wish was incredibly seamless. We sponsored 50 wishes and received detailed reports on every single delivery."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-800">M</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">MTN CSR Team</p>
                  <p className="text-xs text-gray-500">Verified Sponsor</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <div className="flex text-yellow-400 mb-4 text-xl">★★★★★</div>
              <p className="text-gray-700 italic mb-6">"As a guardian, the consent process made me feel safe. I knew exactly what my child was signing up for, and the gift was delivered right to our door."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center font-bold text-emerald-800">M</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Mrs. Bello</p>
                  <p className="text-xs text-gray-500">Guardian</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPONSOR CTA BANNER */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 text-9xl opacity-10 transform translate-x-10 -translate-y-10">🏢</div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 relative z-10">
            Simplify your gifting journey.
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 relative z-10">
            Join top brands and verified organizations making a real impact this holiday season. Every sponsored wish is tracked and reported.
          </p>
          <Link href="/sponsor/register" className="inline-block bg-white text-gray-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg relative z-10">
            Become a Sponsor
          </Link>
        </div>
      </section>

    </main>
  );
}
