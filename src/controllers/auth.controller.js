import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { cookieOptions } from '../utils/generateTokens.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import jwt from 'jsonwebtoken';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, avatar, role } = req.body;

  // Check if an active user already exists
  const existingUser = await User.findOne({ email, isDeleted: { $ne: true } });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    avatar: avatar || { public_id: '', url: '' },
    role: role || 'team_member',
  });

  // Retrieve created user without select:false password field
  const createdUser = await User.findById(user._id);
  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registering the user');
  }

  // Generate access & refresh tokens
  const accessToken = createdUser.generateAccessToken();
  const refreshToken = createdUser.generateRefreshToken();

  // Set HTTP-Only Cookie for Refresh Token
  res.cookie('refreshToken', refreshToken, cookieOptions);

  sendWelcomeEmail(createdUser);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: createdUser,
    accessToken,
  });
});

/**
 * Login a user
 * POST /api/auth/login
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and explicitly select password field
  const user = await User.findOne({ email, isDeleted: { $ne: true } }).select(
    '+password',
  );
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Compare hashed password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Retrieve user payload without password field
  const loggedInUser = await User.findById(user._id);

  // Generate access & refresh tokens
  const accessToken = loggedInUser.generateAccessToken();
  const refreshToken = loggedInUser.generateRefreshToken();

  // Set HTTP-Only Cookie for Refresh Token
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    user: loggedInUser,
    accessToken,
  });
});

/**
 * Logout a user and clear cookie
 * POST /api/auth/logout
 */
export const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', {
    ...cookieOptions,
    maxAge: 0,
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Retrieve authenticated current user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

/**
 * Refresh Access Token
 * POST /api/auth/refresh
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is missing');
  }

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findOne({
      _id: decoded.userId,
      isDeleted: { $ne: true },
    }).select('+refreshTokenVersion');

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (
      decoded.tokenVersion !== undefined &&
      decoded.tokenVersion !== user.refreshTokenVersion
    ) {
      throw new ApiError(401, 'Refresh token has been revoked');
    }

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // Rotate refresh token cookie
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      accessToken,
    });
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
});
