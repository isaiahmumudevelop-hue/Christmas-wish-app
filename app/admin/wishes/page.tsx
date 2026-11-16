"use client";

import { useEffect, useState } from "react";

type WishData = {
  wish: { id: string; title: string; description: string; estimatedCost: string; status: string; category: string };
  wisher: { fullName: string; isMinor: boolean };
};

export default function AdminWishesPage() {
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadWishes() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/wishes?status=submitted");
      const json = await res.json();
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setWishes(json.wishes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishes();
  }, []);

  async function handleDecision(id: string, decision: "approve" | "reject") {
    try {
      const res = await fetch(`/api/admin/wishes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: `Reviewed via dashboard` }),
      });
      if (!res.ok) throw new Error("Failed to update");
      // Remove from list
      setWishes((prev) => prev.filter((w) => w.wish.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading queue...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin: Verification Queue</h1>
          <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full text-sm">
            {wishes.length} Pending
          </span>
        </div>

        {wishes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow text-center border">
            <p className="text-gray-500 text-lg">No wishes are waiting for review right now. 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {wishes.map((item) => (
              <div key={item.wish.id} className="bg-white p-6 rounded-2xl shadow border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{item.wish.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Requested by <strong>{item.wisher.fullName}</strong> {item.wisher.isMinor && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded ml-1">Minor (Consent Granted)</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₦{Number(item.wish.estimatedCost).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.wish.category}</p>
                  </div>
                </div>

                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg text-sm mb-6 border">
                  {item.wish.description}
                </p>

                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => handleDecision(item.wish.id, "reject")}
                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleDecision(item.wish.id, "approve")}
                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
                  >
                    Approve Wish
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
