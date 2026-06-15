import { body, param, validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

export const boardIdParamRule = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Board ID is required")
    .isMongoId()
    .withMessage("Board ID must be a valid MongoDB ObjectId"),
];

// ─── Invite User Validation Rules ─────────────────────────────────────────────
export const inviteUserRules = [
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("userId is required")
    .isMongoId()
    .withMessage("userId must be a valid MongoDB ObjectId"),
];

// ─── Remove User Validation Rules ─────────────────────────────────────────────
export const removeUserRules = [
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("userId is required")
    .isMongoId()
    .withMessage("userId must be a valid MongoDB ObjectId"),
];

// ─── Shared Validation Error Handler ─────────────────────────────────────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extractedErrors = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  throw new ApiError(400, "Validation failed", extractedErrors);
};
