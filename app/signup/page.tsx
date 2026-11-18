"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"wisher" | "sponsor">("wisher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("role", role);

    // Handle File Upload first
    if (file) {
      const fileData = new FormData();
      fileData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fileData });
      const uploadJson = await uploadRes.json();
      if (uploadRes.ok) formData.append("uploadedFileUrl", uploadJson.url);
    }

    try {
      const res = await fetch("/api/auth/register", { method: "POST", body: formData });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || "Failed to sign up");
      
      // Auto-login
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-12 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">🎄</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Create an Account</h1>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button type="button" onClick={() => setRole("wisher")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${role === "wisher" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>I am a Wisher</button>
          <button type="button" onClick={() => setRole("sponsor")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${role === "sponsor" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>I am a Sponsor</button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input required name="name" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required name="email" type="email" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required name="password" type="password" minLength={6} className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="••••••••" />
          </div>

          {/* WISHER SPECIFIC */}
          {role === "wisher" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input required name="dateOfBirth" type="date" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100" />
              </div>
            </>
          )}

          {/* SPONSOR SPECIFIC */}
          {role === "sponsor" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input required name="companyName" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="e.g. MTN Nigeria" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RC Number</label>
                <input required name="rcNumber" type="text" className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="RC-123456" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to sponsor?</label>
                <textarea required name="reason" rows={2} className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="We want to give back this Christmas..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAC Document / ID</label>
                <input required type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
            </>
          )}

          <button disabled={loading} type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 mt-4">
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account? <Link href="/login" className="text-rose-600 font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
