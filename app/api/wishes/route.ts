import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, guardians, wishes, auditLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum(["education", "health", "shelter", "food", "clothing", "other"]),
  estimatedCost: z.number().positive().max(10_000_000),
  currency: z.enum(["NGN", "GHS", "XAF"]).default("NGN"),
  reason: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(wishes)
    .where(eq(wishes.wisherId, user.id))
    .orderBy(wishes.createdAt);

  return NextResponse.json({ wishes: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.status !== "active") {
    return NextResponse.json({ error: "Account not active" }, { status: 403 });
  }

  // 🛡️ MINOR GATE — consent must be granted
  if (user.isMinor) {
    const rows = await db
      .select()
      .from(guardians)
      .where(
        and(
          eq(guardians.minorUserId, user.id),
          eq(guardians.consentStatus, "granted")
        )
      )
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "Guardian consent required",
          hint: "A parent or legal guardian must grant consent before you can submit wishes.",
        },
        { status: 403 }
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [wish] = await db
    .insert(wishes)
    .values({
      wisherId: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      estimatedCost: data.estimatedCost.toFixed(2),
      currency: data.currency,
      reason: data.reason,
      status: "submitted",
    })
    .returning();

  await db.insert(auditLog).values({
    actorId: user.id,
    actorRole: user.role,
    action: "wish.submitted",
    entityType: "wish",
    entityId: wish.id,
    metadata: { category: data.category, amount: data.estimatedCost },
  });

  return NextResponse.json({ ok: true, wish }, { status: 201 });
}
