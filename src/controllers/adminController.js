import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { Board } from "../models/Board.js";
import { Task } from "../models/Task.js";
import { ROLES } from "../utils/roles.js";
import cloudinary from "../config/cloudinary.js";
import logger from "../utils/logger.js";

const USER_SELECT = "-password -resetPasswordToken -resetPasswordExpire -refreshTokenVersion -archivedEmail";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const assertNotLastAdmin = async (user) => {
  if (user.role !== ROLES.ADMIN) return;

  const adminCount = await User.countDocuments({
    role: ROLES.ADMIN,
    isDeleted: { $ne: true },
  });

  if (adminCount <= 1) {
    throw new ApiError(400, "Cannot modify or remove the last admin account");
  }
};

const deleteAvatarFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(`Failed to delete avatar (${publicId}): ${error.message}`);
  }
};

/**
 * GET /api/admin/users
 * List users with search, sorting, and pagination
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const search = req.query.search?.trim();
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const includeDeleted = req.query.includeDeleted === "true";

  const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };

  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const sort = { [sortBy]: sortOrder };

  const [users, total] = await Promise.all([
    User.find(filter).select(USER_SELECT).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    users,
  });
});

/**
 * PUT /api/admin/users/:id/role
 * Change a user's role
 */
export const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === role) {
    throw new ApiError(400, "User already has this role");
  }

  if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
    await assertNotLastAdmin(user);
  }

  user.role = role;
  await user.save();

  const updatedUser = await User.findById(user._id).select(USER_SELECT);

  return res.status(200).json({
    success: true,
    message: "User role updated successfully",
    user: updatedUser,
  });
});

/**
 * DELETE /api/admin/users/:id
 * Soft-delete user with cascade cleanup
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (req.user._id.toString() === id.toString()) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } }).select(
    "+refreshTokenVersion",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await assertNotLastAdmin(user);

  await deleteAvatarFromCloudinary(user.avatar?.public_id);

  await Board.updateMany(
    { members: user._id },
    { $pull: { members: user._id } },
  );

  await Task.updateMany(
    { assignedTo: user._id },
    { $unset: { assignedTo: "" } },
  );

  user.avatar = { public_id: "", url: "" };
  user.softDelete();
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
