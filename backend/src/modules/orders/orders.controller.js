import { db } from "../../config/db.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * Finaliza compra com os itens do carrinho.
 * Regra: só usuário autenticado pode comprar.
 */
export async function createOrder(req, res) {
  const userId = req.user.sub;
  const { paymentMethod } = req.body;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const cart = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [userId],
    );

    if (cart.rows.length === 0) {
      throw new ApiError(400, "Carrinho vazio.");
    }

    for (const item of cart.rows) {
      if (item.stock < item.quantity) {
        throw new ApiError(400, `Estoque insuficiente para o produto: ${item.name}.`);
      }
    }

    const total = cart.rows.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

    const orderInsert = await client.query(
      `INSERT INTO orders (user_id, payment_method, total, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING id, user_id, payment_method, total, status, created_at`,
      [userId, paymentMethod, total],
    );

    const order = orderInsert.rows[0];

    for (const item of cart.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.quantity, item.price, Number(item.price) * item.quantity],
      );

      await client.query("UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2", [
        item.quantity,
        item.product_id,
      ]);
    }

    await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Pedido criado com sucesso.",
      order,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listMyOrders(req, res) {
  const userId = req.user.sub;
  const query = await db.query(
    `SELECT id, payment_method, total, status, created_at
     FROM orders
     WHERE user_id = $1
     ORDER BY id DESC`,
    [userId],
  );
  return res.json(query.rows);
}

export async function listAllOrders(req, res) {
  const query = await db.query(
    `SELECT o.id, o.user_id, u.name AS customer_name, u.email AS customer_email,
            o.payment_method, o.total, o.status, o.created_at
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.id DESC`,
  );
  return res.json(query.rows);
}
