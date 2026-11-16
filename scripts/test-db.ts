import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { users } from "../db/schema";

async function main() {
  const result = await db.select().from(users).limit(1);
  console.log("Connected. Users table rows:", result);
  process.exit(0);
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
