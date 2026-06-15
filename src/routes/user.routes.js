// src/routes/user.routes.js
import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  searchUsers,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';
import { updateProfileRules, validate } from '../validators/user.validator.js';

const router = Router();

// Search users
router.get('/', authMiddleware, searchUsers);

// Get profile
router.get('/profile', authMiddleware, getUserProfile);


// Update profile (name/email)
router.put('/profile', authMiddleware, updateProfileRules, validate, updateUserProfile);

// Upload / replace avatar image
router.put('/avatar', authMiddleware, uploadAvatar, uploadUserAvatar);

export default router;
