import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = rows[0];
    if (!user.passwordHash) {
      return NextResponse.json({ error: "Please log in with OTP (not implemented yet)" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("dev_user_id", user.id, { path: "/", httpOnly: true, maxAge: 60 * 60 * 24 * 7 }); // 1 week

    return NextResponse.json({ 
      ok: true, 
      user: { id: user.id, fullName: user.fullName, role: user.role } 
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
