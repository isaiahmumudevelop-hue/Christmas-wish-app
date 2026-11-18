import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sponsors, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await db
    .select({
      id: sponsors.id,
      companyName: sponsors.companyName,
      rcNumber: sponsors.rcNumber,
      user: { name: users.name, email: users.email }
    })
    .from(sponsors)
    .innerJoin(users, eq(sponsors.userId, users.id))
    .where(eq(sponsors.verificationStatus, "pending"));

  return NextResponse.json({ sponsors: rows });
}
