import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://u0_a254@127.0.0.1:5432/wishes_app";

export const db = drizzle(new Pool({ connectionString }), { schema });
