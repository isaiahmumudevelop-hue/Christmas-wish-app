import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, sponsors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const sponsorSchema = z.object({
  companyName: z.string().min(2),
  rcNumber: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if they are already a sponsor
  const existing = await db.select().from(sponsors).where(eq(sponsors.userId, user.id)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "You already have a sponsor profile" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = sponsorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { companyName, rcNumber } = parsed.data;

  // 1. Upgrade user role to sponsor
  await db.update(users).set({ role: "sponsor" }).where(eq(users.id, user.id));

  // 2. Create sponsor profile (Pending verification)
  const [sponsor] = await db.insert(sponsors).values({
    userId: user.id,
    companyName,
    rcNumber,
    verificationStatus: "pending",
  }).returning();

  return NextResponse.json({ ok: true, sponsor });
}
