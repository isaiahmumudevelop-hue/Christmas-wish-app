"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AddressPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      wishId: params.id,
      street: formData.get("street"),
      city: formData.get("city"),
      state: formData.get("state"),
      phone: formData.get("phone"),
    };

    try {
      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save address");
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">📍</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Delivery Address</h1>
          <p className="text-gray-500 text-sm mt-1">This information is encrypted and only shared with the courier.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input required name="street" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="123 Main Street, Ikeja" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input required name="city" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Lagos" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input required name="state" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Lagos" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input required name="phone" type="tel" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="+234 800 000 0000" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 mt-4">
            {loading ? "Encrypting & Saving..." : "Save Secure Address"}
          </button>
        </form>
      </div>
    </main>
  );
}
