import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../config/db.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * Cadastro de cliente.
 * Novos usuários entram com papel "customer".
 */
export async function register(req, res) {
  const {
    name,
    cpf,
    birthDate,
    phone,
    email,
    password,
    zipCode,
    street,
    number,
    neighborhood,
    city,
    state,
    complement,
  } = req.body;

  const existing = await db.query("SELECT id FROM users WHERE email = $1 OR cpf = $2", [
    email,
    cpf,
  ]);

  if (existing.rows.length > 0) {
    throw new ApiError(409, "E-mail ou CPF já cadastrado.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const inserted = await db.query(
    `INSERT INTO users (
      name, cpf, birth_date, phone, email, password_hash, role,
      zip_code, street, number, neighborhood, city, state, complement
    ) VALUES (
      $1, $2, $3, $4, $5, $6, 'customer',
      $7, $8, $9, $10, $11, $12, $13
    )
    RETURNING id, name, email, role, created_at`,
    [
      name,
      cpf,
      birthDate,
      phone,
      email,
      passwordHash,
      zipCode,
      street,
      number,
      neighborhood,
      city,
      state,
      complement ?? null,
    ],
  );

  return res.status(201).json({
    message: "Cliente cadastrado com sucesso.",
    user: inserted.rows[0],
  });
}

/**
 * Login de cliente, funcionário ou administrador.
 */
export async function login(req, res) {
  const { email, password } = req.body;

  const query = await db.query(
    "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
    [email],
  );

  if (query.rows.length === 0) {
    throw new ApiError(401, "Credenciais inválidas.");
  }

  const user = query.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new ApiError(401, "Credenciais inválidas.");
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return res.json({
    message: "Login realizado com sucesso.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
