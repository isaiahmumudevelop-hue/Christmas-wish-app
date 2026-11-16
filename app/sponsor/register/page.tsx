"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SponsorRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      companyName: formData.get("companyName"),
      rcNumber: formData.get("rcNumber"),
    };

    try {
      const res = await fetch("/api/sponsor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error(json.error || "Failed to register");
      
      // Redirect to a success/pending page, or dashboard
      alert("Profile created! Awaiting Admin verification.");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">🏢</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Become a Sponsor</h1>
          <p className="text-gray-500 text-sm mt-1">Register your company to start funding verified wishes.</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input required name="companyName" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="e.g. MTN Nigeria" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RC Number (Registration)</label>
            <input required name="rcNumber" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="e.g. RC-123456" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 mt-4">
            {loading ? "Submitting..." : "Register Company"}
          </button>
        </form>
      </div>
    </main>
  );
}
