import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Middleware que exige token JWT válido.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Token não informado.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    next();
  } catch {
    throw new ApiError(401, "Token inválido ou expirado.");
  }
}

/**
 * Middleware para autorização por papel (role).
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Usuário não autenticado.");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "Sem permissão para acessar este recurso.");
    }

    next();
  };
}
