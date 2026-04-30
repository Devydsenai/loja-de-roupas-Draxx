import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { cartRouter } from "../modules/cart/cart.routes.js";
import { ordersRouter } from "../modules/orders/orders.routes.js";
import { productsRouter } from "../modules/products/products.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "draxx-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/users", usersRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);

export { router };
