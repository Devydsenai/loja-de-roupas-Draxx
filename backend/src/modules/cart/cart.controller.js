import { db } from "../../config/db.js";
import { ApiError } from "../../utils/apiError.js";

export async function getMyCart(req, res) {
  const userId = req.user.sub;
  const query = await db.query(
    `SELECT ci.id, ci.product_id, p.name, p.price, p.image_url, ci.quantity,
            (p.price * ci.quantity) AS subtotal
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1
     ORDER BY ci.id DESC`,
    [userId],
  );

  const total = query.rows.reduce((acc, item) => acc + Number(item.subtotal), 0);
  return res.json({ items: query.rows, total });
}

export async function addItemToCart(req, res) {
  const userId = req.user.sub;
  const { productId, quantity } = req.body;

  const product = await db.query(
    "SELECT id, stock, active FROM products WHERE id = $1",
    [productId],
  );
  if (product.rows.length === 0) {
    throw new ApiError(404, "Produto não encontrado.");
  }
  if (!product.rows[0].active) {
    throw new ApiError(400, "Produto inativo no catálogo.");
  }
  if (product.rows[0].stock < quantity) {
    throw new ApiError(400, "Quantidade solicitada maior que o estoque.");
  }

  const existing = await db.query(
    "SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2",
    [userId, productId],
  );

  if (existing.rows.length > 0) {
    const item = existing.rows[0];
    const newQuantity = item.quantity + quantity;
    const updated = await db.query(
      "UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [newQuantity, item.id],
    );
    return res.json(updated.rows[0]);
  }

  const inserted = await db.query(
    "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
    [userId, productId, quantity],
  );
  return res.status(201).json(inserted.rows[0]);
}

export async function updateCartItem(req, res) {
  const userId = req.user.sub;
  const { id } = req.params;
  const { quantity } = req.body;

  const item = await db.query("SELECT * FROM cart_items WHERE id = $1 AND user_id = $2", [id, userId]);
  if (item.rows.length === 0) {
    throw new ApiError(404, "Item do carrinho não encontrado.");
  }

  const updated = await db.query(
    "UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [quantity, id],
  );
  return res.json(updated.rows[0]);
}

export async function removeCartItem(req, res) {
  const userId = req.user.sub;
  const { id } = req.params;

  const query = await db.query("DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id", [
    id,
    userId,
  ]);
  if (query.rows.length === 0) {
    throw new ApiError(404, "Item do carrinho não encontrado.");
  }
  return res.status(204).send();
}
