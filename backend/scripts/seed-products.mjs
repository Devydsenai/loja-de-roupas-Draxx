/**
 * Insere produtos de exemplo se a tabela `products` estiver vazia.
 * Uso (na pasta backend): npm run seed:products
 */
import { db } from "../src/config/db.js";

const samples = [
  {
    name: "Camiseta Draxx Essential",
    description: "Malha 100% algodão, corte regular. Ideal para o dia a dia.",
    price: 89.9,
    stock: 45,
    image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    active: true,
  },
  {
    name: "Calça Jeans Slim Draxx",
    description: "Jeans com elastano, lavagem escura e caimento slim.",
    price: 199.9,
    stock: 28,
    image_url:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
    active: true,
  },
  {
    name: "Jaqueta Corta-Vento",
    description: "Leve, resistente à água, capuz embutido.",
    price: 279.0,
    stock: 15,
    image_url:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    active: true,
  },
  {
    name: "Tênis Urban Draxx",
    description: "Solado em borracha, palmilha acolchoada.",
    price: 359.9,
    stock: 0,
    image_url:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80",
    active: false,
  },
];

async function main() {
  const count = await db.query("SELECT COUNT(*)::int AS c FROM products");
  const n = count.rows[0].c;
  if (n > 0) {
    console.log(`Já existem ${n} produto(s). Nenhuma inserção (use o admin para novos itens).`);
    await db.end();
    return;
  }

  for (const p of samples) {
    await db.query(
      `INSERT INTO products (name, description, price, stock, image_url, active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [p.name, p.description, p.price, p.stock, p.image_url, p.active],
    );
  }
  console.log(`Inseridos ${samples.length} produtos de exemplo.`);
  await db.end();
}

main().catch(async (err) => {
  console.error(err);
  await db.end();
  process.exit(1);
});
