import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, wishes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { encryptAddress } from "@/lib/crypto";

const addressSchema = z.object({
  wishId: z.string().uuid(),
  street: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  phone: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { wishId, street, city, state, phone } = parsed.data;

  // Verify the wish belongs to this user
  const wishRows = await db.select().from(wishes).where(eq(wishes.id, wishId)).limit(1);
  if (wishRows.length === 0 || wishRows[0].wisherId !== user.id) {
    return NextResponse.json({ error: "Wish not found" }, { status: 404 });
  }

  // Encrypt the sensitive data
  const encryptedPayload = encryptAddress({ street, phone });

  const [address] = await db.insert(addresses).values({
    wisherId: user.id,
    encryptedPayload,
    countryCode: "NG", // Hardcoded for now
    stateRegion: state,
    city,
    validated: true,
  }).returning();

  // Link address to wish
  await db.update(wishes).set({ deliveryAddressId: address.id }).where(eq(wishes.id, wishId));

  return NextResponse.json({ ok: true, addressId: address.id });
}
