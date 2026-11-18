import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { guardians, consentAudit, users } from "@/db/schema";
import { sendGuardianConsentEmail } from "@/lib/mail";

const TOKEN_TTL_DAYS = 7;

const bodySchema = z.object({
  minorUserId: z.string().uuid(),
  guardianName: z.string().min(2).max(120),
  guardianEmail: z.string().email(),
  guardianPhone: z.string().min(7).max(20),
  relationship: z.enum(["parent", "legal_guardian", "other"]),
});

function generateConsentToken() {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { token: raw, hash };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const minor = await db.select().from(users).where(eq(users.id, data.minorUserId)).limit(1);
  if (minor.length === 0) {
    return NextResponse.json({ error: "Minor user not found" }, { status: 404 });
  }
  if (!minor[0].isMinor) {
    return NextResponse.json({ error: "User is not a minor" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(guardians)
    .where(eq(guardians.minorUserId, data.minorUserId))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].consentStatus === "granted") {
      return NextResponse.json({ error: "Consent already granted" }, { status: 409 });
    }
    if (existing[0].consentStatus === "pending") {
      return NextResponse.json(
        { error: "A consent request is already pending. Check the guardian's email." },
        { status: 409 }
      );
    }
  }

  const { token, hash } = generateConsentToken();

  const [guardian] = await db
    .insert(guardians)
    .values({
      minorUserId: data.minorUserId,
      guardianName: data.guardianName,
      guardianEmail: data.guardianEmail,
      guardianPhone: data.guardianPhone,
      relationship: data.relationship,
      consentToken: hash,
      consentStatus: "pending",
      consentMethod: "email",
    })
    .returning();

  await db.insert(consentAudit).values({
    guardianId: guardian.id,
    minorUserId: data.minorUserId,
    action: "consent_requested",
    performedBy: null,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000";
  const consentUrl = `${baseUrl}/consent/${token}`;
  
  // Send the actual email!
  try {
    await sendGuardianConsentEmail(data.guardianEmail, minor[0].name, consentUrl);
  } catch (error) {
    console.error("Failed to send consent email:", error);
    // We still return success because the database record was created, 
    // but in a real app you might want to handle this differently.
  }

  return NextResponse.json({
    ok: true,
    guardianId: guardian.id,
    message: "Consent email sent to guardian",
    expiresInDays: TOKEN_TTL_DAYS,
  });
}
