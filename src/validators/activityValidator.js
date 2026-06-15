import { param, validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

export const taskIdParamRule = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID is required")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extractedErrors = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  throw new ApiError(400, "Validation failed", extractedErrors);
};
