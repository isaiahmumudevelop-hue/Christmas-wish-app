"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GuardianRequestForm({ minorUserId }: { minorUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      minorUserId,
      guardianName: formData.get("guardianName"),
      guardianEmail: formData.get("guardianEmail"),
      guardianPhone: formData.get("guardianPhone"),
      relationship: formData.get("relationship"),
    };

    try {
      const res = await fetch("/api/auth/guardian-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send request");
      
      setSuccessLink(json.consentUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (successLink) {
    return (
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-green-800 font-bold mb-2">Consent Request Sent!</h3>
        <p className="text-sm text-green-700 mb-4">In production, an email/SMS would be sent. For now, click the link below to simulate the parent opening it:</p>
        <a href={successLink} className="inline-block bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">
          Open Guardian Consent Link →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-8">
      <h3 className="text-yellow-800 font-bold mb-2">Guardian Consent Required</h3>
      <p className="text-sm text-yellow-700 mb-4">Because you are under 18, you need a parent or guardian to approve your account before you can make wishes.</p>
      
      {error && <div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <input required name="guardianName" placeholder="Guardian's Full Name" className="border p-2 rounded text-sm" />
        <input required name="guardianEmail" type="email" placeholder="Guardian's Email" className="border p-2 rounded text-sm" />
        <input required name="guardianPhone" placeholder="Guardian's Phone (e.g. +234...)" className="border p-2 rounded text-sm" />
        <select required name="relationship" className="border p-2 rounded text-sm">
          <option value="parent">Parent</option>
          <option value="legal_guardian">Legal Guardian</option>
          <option value="other">Other</option>
        </select>
        <button disabled={loading} type="submit" className="md:col-span-2 bg-yellow-600 text-white py-2 rounded font-bold hover:bg-yellow-700 disabled:opacity-50">
          {loading ? "Sending..." : "Send Consent Request"}
        </button>
      </form>
    </div>
  );
}
