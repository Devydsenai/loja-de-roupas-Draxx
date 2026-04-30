import { logger } from "../lib/logger.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Middleware central de erros.
 * Sempre retorna uma estrutura de resposta consistente.
 */
export function errorHandler(error, req, res, next) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details,
      },
    });
  }

  if (error?.name === "ZodError") {
    return res.status(400).json({
      error: {
        message: "Dados inválidos na requisição.",
        details: error.issues,
      },
    });
  }

  logger.error("Erro não tratado", error);
  return res.status(500).json({
    error: {
      message: "Erro interno do servidor.",
      details: null,
    },
  });
}
