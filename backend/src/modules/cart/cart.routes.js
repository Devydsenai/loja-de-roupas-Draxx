import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  addItemToCart,
  getMyCart,
  removeCartItem,
  updateCartItem,
} from "./cart.controller.js";
import { addCartItemSchema, cartItemIdSchema, updateCartItemSchema } from "./cart.schema.js";

const cartRouter = Router();

cartRouter.use(authenticate);
cartRouter.get("/", asyncHandler(getMyCart));
cartRouter.post("/items", validate(addCartItemSchema), asyncHandler(addItemToCart));
cartRouter.patch("/items/:id", validate(updateCartItemSchema), asyncHandler(updateCartItem));
cartRouter.delete("/items/:id", validate(cartItemIdSchema), asyncHandler(removeCartItem));

export { cartRouter };
