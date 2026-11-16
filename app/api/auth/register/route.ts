import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { users, sponsors } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const uploadedFileUrl = formData.get("uploadedFileUrl") as string;

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    let isMinor = false;
    let dateOfBirth = "1990-01-01";
    let invitationCode = null;

    if (role === "wisher") {
      dateOfBirth = formData.get("dateOfBirth") as string;
      const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      isMinor = age < 18;
      invitationCode = randomBytes(4).toString("hex").toUpperCase();
    }

    const [newUser] = await db.insert(users).values({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      dateOfBirth,
      isMinor,
      role: role === "sponsor" ? "wisher" : "wisher", // Upgrade to sponsor after verification
      profilePictureUrl: uploadedFileUrl || null,
      invitationCode,
    }).returning();

    // If Sponsor, create their pending profile
    if (role === "sponsor") {
      await db.insert(sponsors).values({
        userId: newUser.id,
        companyName: formData.get("companyName") as string,
        rcNumber: formData.get("rcNumber") as string,
        reason: formData.get("reason") as string,
        logoUrl: uploadedFileUrl || null,
        verificationStatus: "pending",
      });
    }

    return NextResponse.json({ ok: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
