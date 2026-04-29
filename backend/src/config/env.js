import dotenv from "dotenv";

dotenv.config();

/**
 * Configurações de ambiente centralizadas.
 * Este objeto evita acesso espalhado a process.env pelo sistema.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
};

/**
 * Validação mínima de variáveis obrigatórias para execução segura da API.
 */
export function validateEnv() {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variáveis obrigatórias ausentes: ${missing.join(", ")}. Consulte o arquivo .env.example.`,
    );
  }
}
