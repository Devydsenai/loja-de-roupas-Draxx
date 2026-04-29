import { app } from "./app.js";
import { db } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";

async function bootstrap() {
  validateEnv();
  await db.query("SELECT 1");

  app.listen(env.port, () => {
    console.log(`API Draxx rodando na porta ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error.message);
  process.exit(1);
});
