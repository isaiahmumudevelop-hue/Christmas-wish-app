import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcryptjs";

async function main() {
  const email = "isaiahmumudevelop@gmail.com";
  const password = "isaiahmumudevelop-hue";
  const hash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email,
    name: "Isaiah Admin",
    dateOfBirth: "1990-01-01",
    role: "admin",
    passwordHash: hash,
    isMinor: false,
  }).onConflictDoUpdate({
    target: users.email,
    set: { role: "admin", passwordHash: hash }
  });

  console.log("Admin account created/updated successfully!");
  process.exit(0);
}
main();
