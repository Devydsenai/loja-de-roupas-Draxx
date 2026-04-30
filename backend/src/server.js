import http from "node:http";

import { app } from "./app.js";
import { db } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";
import { logger } from "./lib/logger.js";

async function bootstrap() {
  validateEnv();
  await db.query("SELECT 1");

  const server = http.createServer(app);

  server.listen(env.port, () => {
    logger.info("Servidor Draxx iniciado", {
      port: env.port,
      env: env.nodeEnv,
      api: `http://localhost:${env.port}/api`,
      site: `http://localhost:${env.port}/`,
    });
  });

  function shutdown(signal) {
    logger.warn(`Encerrando (${signal})…`);
    server.close(() => {
      db.end(() => {
        logger.info("Pool PostgreSQL fechado.");
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  logger.error("Falha ao iniciar o servidor", error);
  process.exit(1);
});
