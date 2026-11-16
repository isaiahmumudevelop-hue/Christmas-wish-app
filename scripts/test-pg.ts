import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://u0_a254@127.0.0.1:5432/wishes_app",
});

async function main() {
  const res = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log("Tables:", res.rows.map((r: any) => r.table_name));
  await pool.end();
}

main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
