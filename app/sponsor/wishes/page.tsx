"use client";

import { useEffect, useState } from "react";

type WishData = {
  wish: { id: string; title: string; description: string; estimatedCost: string; currency: string; category: string };
  wisher: { fullName: string; isMinor: boolean };
};

export default function SponsorWishesPage() {
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadWishes() {
    setLoading(true);
    try {
      const res = await fetch("/api/sponsor/wishes");
      const json = await res.json();
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setWishes(json.wishes || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishes();
  }, []);

  async function handlePledge(id: string) {
    setProcessingId(id);
    try {
      const res = await fetch("/api/sponsor/pledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to pledge");
      
      alert("Thank you! You have successfully sponsored this wish.");
      // Remove from list
      setWishes((prev) => prev.filter((w) => w.wish.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading verified wishes...</div>;
  if (error) return <div className="p-8 text-center text-red-600 bg-red-50 rounded max-w-lg mx-auto mt-10">Error: {error}</div>;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sponsor a Wish</h1>
          <p className="text-gray-600 mt-2">These wishes have been verified by our team. Choose one to fund and make someone's Christmas special.</p>
        </div>

        {wishes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow text-center border">
            <p className="text-gray-500 text-lg">No verified wishes are currently available to sponsor. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {wishes.map((item) => (
              <div key={item.wish.id} className="bg-white p-6 rounded-2xl shadow border border-gray-200 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{item.wish.category}</span>
                    <span className="text-xs text-gray-500">For {item.wisher.fullName} {item.wisher.isMinor && "(Minor)"}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{item.wish.title}</h2>
                  <p className="text-gray-600 mt-2 text-sm">{item.wish.description}</p>
                </div>
                
                <div className="text-right flex flex-col items-end min-w-[200px]">
                  <p className="text-2xl font-extrabold text-gray-900 mb-4">
                    ₦{Number(item.wish.estimatedCost).toLocaleString()}
                  </p>
                  <button 
                    onClick={() => handlePledge(item.wish.id)}
                    disabled={processingId === item.wish.id}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
                  >
                    {processingId === item.wish.id ? "Processing..." : "Fund This Wish"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
