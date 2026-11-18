import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { wishes, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const VALID_STATUSES = [
  "submitted",
  "under_review",
  "verified",
  "rejected",
  "sponsored",
  "ordered",
  "shipped",
  "delivered",
] as const;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const statusParam = req.nextUrl.searchParams.get("status") ?? "submitted";
  if (!VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json(
      { error: `Invalid status. Use one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const rows = await db
    .select({
      wish: wishes,
      wisher: {
        id: users.id,
        name: users.name,
        isMinor: users.isMinor,
        dateOfBirth: users.dateOfBirth,
      },
    })
    .from(wishes)
    .innerJoin(users, eq(wishes.wisherId, users.id))
    .where(eq(wishes.status, statusParam))
    .orderBy(desc(wishes.createdAt))
    .limit(100);

  return NextResponse.json({ status: statusParam, count: rows.length, wishes: rows });
}
