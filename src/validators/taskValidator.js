import { body, param, query, validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

const TASK_STATUSES = ["todo", "in_progress", "review", "done"];
const TASK_PRIORITIES = ["low", "medium", "high", "critical"];

export const createTaskRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").optional().trim(),
  body("boardId")
    .trim()
    .notEmpty()
    .withMessage("boardId is required")
    .isMongoId()
    .withMessage("boardId must be a valid MongoDB ObjectId"),
  body("assignedTo")
    .optional()
    .trim()
    .isMongoId()
    .withMessage("assignedTo must be a valid MongoDB ObjectId"),
  body("priority")
    .optional()
    .isIn(TASK_PRIORITIES)
    .withMessage(`priority must be one of: ${TASK_PRIORITIES.join(", ")}`),
  body("status")
    .optional()
    .isIn(TASK_STATUSES)
    .withMessage(`status must be one of: ${TASK_STATUSES.join(", ")}`),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("dueDate must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("dueDate must be a future date");
      }
      return true;
    }),
];

export const updateTaskRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID is required")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),
  body("description").optional().trim(),
  body("boardId")
    .optional()
    .trim()
    .isMongoId()
    .withMessage("boardId must be a valid MongoDB ObjectId"),
  body("assignedTo")
    .optional()
    .trim()
    .isMongoId()
    .withMessage("assignedTo must be a valid MongoDB ObjectId"),
  body("priority")
    .optional()
    .isIn(TASK_PRIORITIES)
    .withMessage(`priority must be one of: ${TASK_PRIORITIES.join(", ")}`),
  body("status")
    .optional()
    .isIn(TASK_STATUSES)
    .withMessage(`status must be one of: ${TASK_STATUSES.join(", ")}`),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("dueDate must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("dueDate must be a future date");
      }
      return true;
    }),
];

export const statusUpdateRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID is required")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(TASK_STATUSES)
    .withMessage(`status must be one of: ${TASK_STATUSES.join(", ")}`),
];

export const priorityUpdateRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Task ID is required")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),
  body("priority")
    .trim()
    .notEmpty()
    .withMessage("Priority is required")
    .isIn(TASK_PRIORITIES)
    .withMessage(`priority must be one of: ${TASK_PRIORITIES.join(", ")}`),
];

export const boardIdParamRule = [
  param("boardId")
    .trim()
    .notEmpty()
    .withMessage("Board ID is required")
    .isMongoId()
    .withMessage("Board ID must be a valid MongoDB ObjectId"),
];

export const priorityFilterRule = [
  query("priority")
    .optional()
    .trim()
    .isIn(TASK_PRIORITIES)
    .withMessage(`priority must be one of: ${TASK_PRIORITIES.join(", ")}`),
];

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
