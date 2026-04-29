import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createEmployee,
  getMyProfile,
  listEmployees,
  updateMyProfile,
} from "./users.controller.js";
import { createEmployeeSchema, updateProfileSchema } from "./users.schema.js";

const usersRouter = Router();

usersRouter.get("/me", authenticate, asyncHandler(getMyProfile));
usersRouter.patch("/me", authenticate, validate(updateProfileSchema), asyncHandler(updateMyProfile));

usersRouter.get(
  "/employees",
  authenticate,
  authorize("admin"),
  asyncHandler(listEmployees),
);
usersRouter.post(
  "/employees",
  authenticate,
  authorize("admin"),
  validate(createEmployeeSchema),
  asyncHandler(createEmployee),
);

export { usersRouter };
