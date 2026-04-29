import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

/**
 * Pool de conexões PostgreSQL (Supabase usa PostgreSQL).
 */
export const db = new Pool({
  connectionString: env.databaseUrl,
  ssl:
    env.nodeEnv === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

db.on("error", (error) => {
  console.error("Erro inesperado no pool de conexões:", error);
});
