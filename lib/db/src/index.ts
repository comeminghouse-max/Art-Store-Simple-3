import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Export tất cả tables từ schema/
export * from "./schema";

// Export carts table (thêm mới)
export * from "./carts";
