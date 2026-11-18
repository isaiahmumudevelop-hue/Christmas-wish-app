import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Pool } from "pg";
import { Bucket } from "@upstash/blob";

async function checkEnvironment() {
  console.log("🔍 Checking Environment Variables...");
  const required = [
    "DATABASE_URL", "NEXT_PUBLIC_APP_URL", "AUTH_SECRET", 
    "GMAIL_USER", "GOOGLE_CLIENT_ID", "UPSTASH_BLOB_TOKEN"
  ];
  
  let missing = false;
  required.forEach((key) => {
    if (!process.env[key]) {
      console.log(`❌ MISSING: ${key}`);
      missing = true;
    } else {
      console.log(`✅ FOUND: ${key}`);
    }
  });
  if (missing) console.log("\n⚠️ Some variables are missing! Check your Vercel settings or .env.local\n");
}

async function checkDatabase() {
  console.log("\n🔍 Checking Database Connection...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT count(*) FROM users");
    console.log(`✅ Database connected successfully! Total users: ${res.rows[0].count}`);
    
    // Check if the columns were renamed successfully
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    const columns = colRes.rows.map((r) => r.column_name);
    if (columns.includes("name") && columns.includes("image")) {
      console.log("✅ Users table columns are updated correctly (name, image).");
    } else {
      console.log("❌ Users table is missing 'name' or 'image' columns. Run drizzle-kit push again.");
    }
  } catch (e: any) {
    console.log(`❌ Database connection FAILED: ${e.message}`);
  } finally {
    await pool.end();
  }
}

async function checkBlobStorage() {
  console.log("\n🔍 Checking Upstash Blob Storage...");
  try {
    const bucket = Bucket.fromEnv();
    await bucket.put("health-check.txt", "Health check ping");
    console.log("✅ Upstash Blob Storage is working!");
  } catch (e: any) {
    console.log(`❌ Upstash Blob FAILED: ${e.message}`);
    console.log("   Make sure UPSTASH_BLOB_TOKEN is correct and the bucket exists.");
  }
}

async function main() {
  console.log("🚀 STARTING SYSTEM HEALTH CHECK 🚀\n");
  await checkEnvironment();
  await checkDatabase();
  await checkBlobStorage();
  console.log("\n🏁 HEALTH CHECK COMPLETE 🏁");
  process.exit(0);
}

main();
