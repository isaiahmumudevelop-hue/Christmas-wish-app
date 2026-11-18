import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { wishes, users, sponsors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "sponsor" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Sponsor must have a verified sponsor profile
  if (user.role === "sponsor") {
    const sp = await db.select().from(sponsors).where(eq(sponsors.userId, user.id)).limit(1);
    if (sp.length === 0 || sp[0].verificationStatus !== "verified") {
      return NextResponse.json(
        { error: "Sponsor profile not verified", hint: "Contact admin to verify your organization." },
        { status: 403 }
      );
    }
  }

  const rows = await db
    .select({
      wish: wishes,
      wisher: {
        id: users.id,
        name: users.name,
        isMinor: users.isMinor,
      },
    })
    .from(wishes)
    .innerJoin(users, eq(wishes.wisherId, users.id))
    .where(eq(wishes.status, "verified"))
    .orderBy(desc(wishes.verifiedAt))
    .limit(100);

  return NextResponse.json({ count: rows.length, wishes: rows });
}
