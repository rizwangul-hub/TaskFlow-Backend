import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

// ─── Create Board Validation Rules ────────────────────────────────────────────
export const createBoardRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Board title is required')
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
];

// ─── Update Board Validation Rules ────────────────────────────────────────────
export const updateBoardRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
];

// ─── Validation Error Handler ─────────────────────────────────────────────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extractedErrors = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  throw new ApiError(400, 'Validation failed', extractedErrors);
};
