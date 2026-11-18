import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { guardians, users } from "@/db/schema";
import ConsentForm from "./ConsentForm";

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const hash = createHash("sha256").update(token).digest("hex");

  const rows = await db
    .select({ guardian: guardians, minor: users })
    .from(guardians)
    .innerJoin(users, eq(guardians.minorUserId, users.id))
    .where(eq(guardians.consentToken, hash))
    .limit(1);

  if (rows.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Link</h1>
          <p className="text-gray-600">This consent link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const { guardian, minor } = rows[0];

  if (guardian.consentStatus === "granted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow text-center max-w-md w-full border-t-4 border-green-500">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Consent Already Granted</h1>
          <p className="text-gray-600">You have already approved {minor.name} to use Christmas Wish.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-emerald-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <span className="text-4xl">🛡️</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Guardian Consent Required</h1>
        </div>
        
        <p className="text-gray-600 mb-6 text-center">
          A minor is requesting permission to join Christmas Wish. As their guardian, we need your approval.
        </p>

        <div className="bg-gray-50 p-4 rounded-xl mb-8 border border-gray-100">
          <p className="mb-2"><strong className="text-gray-900">Minor's Name:</strong> <span className="text-gray-700">{minor.name}</span></p>
          <p><strong className="text-gray-900">Relationship:</strong> <span className="text-gray-700 capitalize">{guardian.relationship}</span></p>
        </div>

        <ConsentForm token={token} />
      </div>
    </div>
  );
}
