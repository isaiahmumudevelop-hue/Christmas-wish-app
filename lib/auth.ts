import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers"; // <-- NEW
import { db } from "@/db";
import { users } from "@/db/schema";

// TEMP AUTH — reads from cookie (browser) or header (curl)
export async function getCurrentUser(req?: NextRequest) {
  // 1. Try cookie first (for the browser)
  const cookieStore = await cookies();
  let id = cookieStore.get("dev_user_id")?.value;

  // 2. Fallback to header (for your curl tests)
  if (!id && req) {
    id = req.headers.get("x-user-id") ?? undefined;
  }

  if (!id) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return { error: "Unauthorized", status: 401 as const, user: null };
  if (user.role !== "admin" && user.role !== "reviewer") {
    return { error: "Forbidden", status: 403 as const, user: null };
  }
  return { error: null, status: 200 as const, user };
}
