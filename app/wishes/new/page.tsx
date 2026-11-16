"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWishPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      estimatedCost: Number(formData.get("estimatedCost")),
      currency: "NGN",
      reason: formData.get("reason"),
    };

    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit wish");
      
      setSuccess(true);
      // REDIRECT TO ADDRESS FORM
      setTimeout(() => router.push(`/wishes/${json.wish.id}/address`), 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wish Submitted!</h1>
          <p className="text-gray-600">Redirecting to secure address form...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-12 px-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Make a Wish</h1>
        <p className="text-gray-600 mb-6 text-sm">Tell us what you need. Our team verifies every wish before sponsors see it.</p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wish Title</label>
            <input required name="title" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="e.g. School textbooks for JSS2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required name="description" rows={3} className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Explain what you need and why..."></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select required name="category" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none">
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="shelter">Shelter</option>
                <option value="food">Food</option>
                <option value="clothing">Clothing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (NGN)</label>
              <input required name="estimatedCost" type="number" min="1" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="25000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <input name="reason" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Why do you need this?" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-rose-600 text-white font-bold py-3 rounded-lg hover:bg-rose-700 transition disabled:opacity-50">
            {loading ? "Submitting..." : "Submit Wish"}
          </button>
        </form>
      </div>
    </main>
  );
}
