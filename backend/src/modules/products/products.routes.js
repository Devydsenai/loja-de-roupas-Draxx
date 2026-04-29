import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "./products.controller.js";
import {
  createProductSchema,
  productIdSchema,
  updateProductSchema,
} from "./products.schema.js";

const productsRouter = Router();

productsRouter.get("/", asyncHandler(listProducts));
productsRouter.get("/:id", validate(productIdSchema), asyncHandler(getProductById));

productsRouter.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createProductSchema),
  asyncHandler(createProduct),
);
productsRouter.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateProductSchema),
  asyncHandler(updateProduct),
);
productsRouter.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(productIdSchema),
  asyncHandler(deleteProduct),
);

export { productsRouter };
