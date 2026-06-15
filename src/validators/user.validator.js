// src/validators/user.validator.js
import { body, validationResult } from 'express-validator';

export const updateProfileRules = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Provide a valid email address'),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const formatted = errors.array().map((err) => ({ field: err.path || err.param, message: err.msg }));
  return res.status(400).json({ success: false, errors: formatted });
};
