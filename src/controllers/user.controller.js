// src/controllers/user.controller.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Get authenticated user's profile
 * GET /api/v1/users/profile
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  // req.user is populated by authMiddleware
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return res.status(200).json({ success: true, user });
});

/**
 * Update authenticated user's name/email
 * PUT /api/v1/users/profile
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (email) {
    // Check if email already exists for another user
    const existing = await User.findOne({
      email,
      _id: { $ne: req.user._id },
      isDeleted: { $ne: true },
    });
    if (existing) {
      throw new ApiError(409, 'Email already in use');
    }
    updates.email = email;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return res.status(200).json({ success: true, message: 'Profile updated successfully', user });
});

/**
 * Upload or replace user's avatar image
 * PUT /api/v1/users/avatar
 */
export const uploadUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No avatar file uploaded');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // If user already has an avatar stored in Cloudinary, delete it first
  if (user.avatar && user.avatar.public_id) {
    try {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    } catch (err) {
      // Log but don't fail the request
      console.error('Failed to delete old avatar:', err);
    }
  }

  // Upload new avatar from buffer
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'taskflow/avatars', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(req.file.buffer);
  });

  // Update user document with new avatar info
  user.avatar = { public_id: result.public_id, url: result.secure_url };
  await user.save();

  return res.status(200).json({ success: true, message: 'Avatar uploaded successfully', avatar: user.avatar });
});

/**
 * Search active users
 * GET /api/v1/users
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim();
  const filter = { isDeleted: { $ne: true } };

  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  // Exclude current user from search
  filter._id = { $ne: req.user._id };

  const users = await User.find(filter)
    .select('name email avatar role')
    .limit(20);

  return res.status(200).json({ success: true, users });
});

