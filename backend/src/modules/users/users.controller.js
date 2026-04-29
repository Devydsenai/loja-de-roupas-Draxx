import bcrypt from "bcryptjs";
import { db } from "../../config/db.js";
import { ApiError } from "../../utils/apiError.js";

export async function getMyProfile(req, res) {
  const userId = req.user.sub;
  const query = await db.query(
    `SELECT id, name, cpf, birth_date, phone, email, role, zip_code, street, number,
            neighborhood, city, state, complement, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId],
  );

  if (query.rows.length === 0) {
    throw new ApiError(404, "Usuário não encontrado.");
  }

  return res.json(query.rows[0]);
}

export async function updateMyProfile(req, res) {
  const userId = req.user.sub;
  const current = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
  if (current.rows.length === 0) {
    throw new ApiError(404, "Usuário não encontrado.");
  }

  const prev = current.rows[0];
  const data = req.body;
  const query = await db.query(
    `UPDATE users SET
      name = $1,
      phone = $2,
      email = $3,
      zip_code = $4,
      street = $5,
      number = $6,
      neighborhood = $7,
      city = $8,
      state = $9,
      complement = $10,
      updated_at = NOW()
    WHERE id = $11
    RETURNING id, name, cpf, birth_date, phone, email, role, zip_code, street, number,
              neighborhood, city, state, complement, created_at, updated_at`,
    [
      data.name ?? prev.name,
      data.phone ?? prev.phone,
      data.email ?? prev.email,
      data.zipCode ?? prev.zip_code,
      data.street ?? prev.street,
      data.number ?? prev.number,
      data.neighborhood ?? prev.neighborhood,
      data.city ?? prev.city,
      data.state ?? prev.state,
      data.complement ?? prev.complement,
      userId,
    ],
  );

  return res.json(query.rows[0]);
}

export async function createEmployee(req, res) {
  const { name, cpf, birthDate, phone, email, password } = req.body;
  const exists = await db.query("SELECT id FROM users WHERE email = $1 OR cpf = $2", [email, cpf]);
  if (exists.rows.length > 0) {
    throw new ApiError(409, "E-mail ou CPF já cadastrado.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const query = await db.query(
    `INSERT INTO users (name, cpf, birth_date, phone, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6, 'employee')
     RETURNING id, name, email, role, created_at`,
    [name, cpf, birthDate, phone, email, passwordHash],
  );
  return res.status(201).json(query.rows[0]);
}

export async function listEmployees(req, res) {
  const query = await db.query(
    `SELECT id, name, email, phone, role, created_at, updated_at
     FROM users
     WHERE role IN ('employee', 'admin')
     ORDER BY id DESC`,
  );
  return res.json(query.rows);
}
