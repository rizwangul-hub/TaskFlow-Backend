import { body, param, query, validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";
import { ROLES } from "../utils/roles.js";

const ALLOWED_ROLES = Object.values(ROLES);
const ALLOWED_SORT_FIELDS = ["name", "email", "role", "createdAt"];

export const listUsersQueryRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }),
  query("sortBy")
    .optional()
    .isIn(ALLOWED_SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
  query("includeDeleted")
    .optional()
    .isIn(["true", "false"])
    .withMessage("includeDeleted must be true or false"),
];

export const userIdParamRule = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

export const changeRoleRules = [
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(ALLOWED_ROLES)
    .withMessage(`role must be one of: ${ALLOWED_ROLES.join(", ")}`),
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
