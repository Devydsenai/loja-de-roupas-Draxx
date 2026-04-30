import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

/** Supabase exige TLS; o host direto db.* costuma ser só IPv6 — o pooler tem IPv4. */
function supabaseSsl() {
  try {
    const u = new URL(
      env.databaseUrl.replace(/^postgres(ql)?:/, "http:"),
    );
    const host = u.hostname;
    return (
      host.endsWith(".supabase.co") ||
      host.endsWith(".pooler.supabase.com")
    );
  } catch {
    return false;
  }
}

/**
 * Pool de conexões PostgreSQL (Supabase usa PostgreSQL).
 */
export const db = new Pool({
  connectionString: env.databaseUrl,
  ssl:
    env.nodeEnv === "production" || supabaseSsl()
      ? { rejectUnauthorized: false }
      : false,
});

db.on("error", (error) => {
  console.error("Erro inesperado no pool de conexões:", error);
});
