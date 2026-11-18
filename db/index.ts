import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

let connectionString = process.env.DATABASE_URL || "";

// Fix the pg warning by stripping the sslmode params from the string
connectionString = connectionString.replace("?sslmode=require", "");
connectionString = connectionString.replace("&sslmode=require", "");
connectionString = connectionString.replace("?channel_binding=require", "");
connectionString = connectionString.replace("&channel_binding=require", "");
connectionString = connectionString.replace(/[?&]$/, ""); // clean up dangling characters

const isNeon = connectionString.includes("neon.tech");

const pool = new Pool({
  connectionString,
  // Neon requires SSL. Localhost does not.
  ssl: isNeon ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
