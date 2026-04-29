import { db } from "../../config/db.js";
import { ApiError } from "../../utils/apiError.js";

export async function listProducts(req, res) {
  const query = await db.query(
    "SELECT id, name, description, price, stock, image_url, active, created_at FROM products ORDER BY id DESC",
  );
  return res.json(query.rows);
}

export async function getProductById(req, res) {
  const { id } = req.params;
  const query = await db.query(
    "SELECT id, name, description, price, stock, image_url, active, created_at FROM products WHERE id = $1",
    [id],
  );

  if (query.rows.length === 0) {
    throw new ApiError(404, "Produto não encontrado.");
  }

  return res.json(query.rows[0]);
}

export async function createProduct(req, res) {
  const { name, description, price, stock, imageUrl, active } = req.body;
  const query = await db.query(
    `INSERT INTO products (name, description, price, stock, image_url, active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, description, price, stock, image_url, active, created_at`,
    [name, description, price, stock, imageUrl ?? null, active ?? true],
  );
  return res.status(201).json(query.rows[0]);
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const existing = await db.query("SELECT id FROM products WHERE id = $1", [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, "Produto não encontrado.");
  }

  const current = await db.query("SELECT * FROM products WHERE id = $1", [id]);
  const prev = current.rows[0];
  const data = req.body;

  const query = await db.query(
    `UPDATE products SET
      name = $1,
      description = $2,
      price = $3,
      stock = $4,
      image_url = $5,
      active = $6,
      updated_at = NOW()
    WHERE id = $7
    RETURNING id, name, description, price, stock, image_url, active, created_at, updated_at`,
    [
      data.name ?? prev.name,
      data.description ?? prev.description,
      data.price ?? prev.price,
      data.stock ?? prev.stock,
      data.imageUrl ?? prev.image_url,
      data.active ?? prev.active,
      id,
    ],
  );

  return res.json(query.rows[0]);
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  const query = await db.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
  if (query.rows.length === 0) {
    throw new ApiError(404, "Produto não encontrado.");
  }
  return res.status(204).send();
}
