"use client";

import { useEffect, useState } from "react";

type SponsorData = {
  id: string;
  companyName: string;
  rcNumber: string | null;
  user: { name: string; email: string };
};

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSponsors() {
    try {
      const res = await fetch("/api/admin/sponsors");
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      const json = await res.json();
      setSponsors(json.sponsors || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSponsors(); }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/sponsors/${id}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setSponsors((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading sponsors...</div>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sponsor Verification Queue</h1>
        <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full text-sm">
          {sponsors.length} Pending
        </span>
      </div>

      {sponsors.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow text-center border">
          <p className="text-gray-500 text-lg">No sponsors are waiting for verification. 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sponsors.map((s) => (
            <div key={s.id} className="bg-white p-6 rounded-2xl shadow border border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{s.companyName}</h2>
                <p className="text-sm text-gray-500 mt-1">RC: {s.rcNumber}</p>
                <p className="text-sm text-gray-500">Contact: {s.user.name} ({s.user.email})</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleAction(s.id, "reject")} className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold transition">Reject</button>
                <button onClick={() => handleAction(s.id, "approve")} className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-bold transition">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
