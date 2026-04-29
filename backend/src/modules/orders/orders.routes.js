import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createOrder, listAllOrders, listMyOrders } from "./orders.controller.js";
import { createOrderSchema } from "./orders.schema.js";

const ordersRouter = Router();

ordersRouter.use(authenticate);
ordersRouter.get("/me", asyncHandler(listMyOrders));
ordersRouter.post("/", validate(createOrderSchema), asyncHandler(createOrder));
ordersRouter.get("/admin/all", authorize("admin"), asyncHandler(listAllOrders));

export { ordersRouter };
