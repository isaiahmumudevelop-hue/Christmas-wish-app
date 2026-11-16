"use client";
import { useState } from "react";

export default function ConsentForm({ token }: { token: string }) {
  const [loading, setLoading] = useState<"grant" | "revoke" | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function decide(action: "grant" | "revoke") {
    setLoading(action);
    try {
      const res = await fetch(`/api/consent/${token}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(action === "grant" ? "Consent granted. You may now close this page." : "Consent revoked.");
      } else {
        setResult(`Error: ${data.error || "Unknown"}`);
      }
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  if (result) {
    return <div className="p-4 bg-gray-50 text-center font-bold text-gray-800 rounded-xl">{result}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => decide("grant")} disabled={loading !== null} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50">
        {loading === "grant" ? "Granting..." : "I Approve This Account"}
      </button>
      <button onClick={() => decide("revoke")} disabled={loading !== null} className="w-full py-3 bg-gray-100 text-red-600 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
        {loading === "revoke" ? "Declining..." : "Decline"}
      </button>
    </div>
  );
}
