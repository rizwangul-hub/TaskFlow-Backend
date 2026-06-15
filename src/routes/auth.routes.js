import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
} from '../controllers/auth.controller.js';
import {
  forgotPassword,
  resetPassword,
} from '../controllers/password.controller.js';
import {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  validate,
} from '../validators/auth.validator.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registerRules, validate, registerUser);
router.post('/login', loginRules, validate, loginUser);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);
router.post('/logout', logoutUser);
router.post('/refresh', refreshAccessToken);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
