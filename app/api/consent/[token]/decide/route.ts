import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { guardians, consentAudit } from "@/db/schema";

const bodySchema = z.object({
  action: z.enum(["grant", "revoke"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const hash = createHash("sha256").update(token).digest("hex");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const action = parsed.data.action;

  const rows = await db
    .select()
    .from(guardians)
    .where(eq(guardians.consentToken, hash))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const guardian = rows[0];

  if (guardian.consentStatus === "granted" && action === "grant") {
    return NextResponse.json({ ok: true, already: "granted" });
  }
  if (guardian.consentStatus === "revoked" && action === "revoke") {
    return NextResponse.json({ ok: true, already: "revoked" });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = new Date();

  await db
    .update(guardians)
    .set({
      consentStatus: action === "grant" ? "granted" : "revoked",
      grantedAt: action === "grant" ? now : guardian.grantedAt,
      revokedAt: action === "revoke" ? now : guardian.revokedAt,
      ipAddress: ip,
    })
    .where(eq(guardians.id, guardian.id));

  await db.insert(consentAudit).values({
    guardianId: guardian.id,
    minorUserId: guardian.minorUserId,
    action: action === "grant" ? "consent_granted" : "consent_revoked",
    performedBy: null,
  });

  return NextResponse.json({
    ok: true,
    status: action === "grant" ? "granted" : "revoked",
  });
}
