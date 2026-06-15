import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Board, BOARD_POPULATE } from '../models/Board.js';
import {
  getCache,
  setCache,
  cacheKeys,
  invalidateUserCaches,
  invalidateBoardTaskCaches,
} from '../services/cacheService.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

// ─── Helper: Upload image buffer → Cloudinary ─────────────────────────────────
const uploadToCloudinary = (buffer, folder = 'taskflow/boards') => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      console.error('[Cloudinary] No buffer provided for upload');
      return reject(new Error('No image buffer provided'));
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ─── Helper: Delete image from Cloudinary safely ──────────────────────────────
const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return;
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (err) {
    // Log but do not fail the primary operation
    console.error(`[Cloudinary] Failed to delete asset (${public_id}):`, err.message);
  }
};

// ─── Helper: Validate MongoDB ObjectId ───────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new board
// @route   POST /api/v1/boards
// @access  Admin | Project Manager
// ─────────────────────────────────────────────────────────────────────────────
export const createBoard = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Build board payload
  const boardData = {
    title,
    description,
    createdBy: req.user._id,
    members: [],        // pre-save hook auto-adds creator
  };

  // Optional board image upload
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer);
      boardData.image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (err) {
      console.error('[Board Creation] Image upload failed:', err);
      throw new ApiError(500, 'Image upload failed. Please try again.');
    }
  }

  const board = await Board.create(boardData);

  await invalidateUserCaches(req.user._id.toString());

  // Populate before returning
  const populated = await Board.findById(board._id).populate(BOARD_POPULATE);

  return res.status(201).json({
    success: true,
    message: 'Board created successfully',
    board: populated,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get boards (role-aware)
// @route   GET /api/v1/boards?page=1&limit=10
// @access  All authenticated users
// ─────────────────────────────────────────────────────────────────────────────
export const getBoards = asyncHandler(async (req, res) => {
  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50); // cap at 50
  const skip  = (page - 1) * limit;

  const cacheKey = cacheKeys.boards(req.user._id.toString(), page, limit);
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ ...cached, cached: true });
  }

  // Build query filter based on role
  let filter = {};

  if (req.user.role === 'admin') {
    filter = {};                                          // Admin sees ALL boards
  } else if (req.user.role === 'project_manager') {
    filter = { createdBy: req.user._id };                // PM sees own boards
  } else {
    filter = { members: req.user._id };                  // Team member sees boards they're in
  }

  const [boards, total] = await Promise.all([
    Board.find(filter)
      .populate(BOARD_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Board.countDocuments(filter),
  ]);

  const response = {
    success: true,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    boards,
  };

  await setCache(cacheKey, response);

  return res.status(200).json(response);
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single board by ID
// @route   GET /api/v1/boards/:id
// @access  Admin | Board member
// ─────────────────────────────────────────────────────────────────────────────
export const getBoardById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid board ID');
  }

  const board = await Board.findById(id).populate(BOARD_POPULATE);

  if (!board) {
    throw new ApiError(404, 'Board not found');
  }

  // Access control
  const isAdmin   = req.user.role === 'admin';
  const isMember  = board.isMember(req.user._id);

  if (!isAdmin && !isMember) {
    throw new ApiError(403, 'You do not have access to this board');
  }

  return res.status(200).json({
    success: true,
    board,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a board
// @route   PUT /api/v1/boards/:id
// @access  Admin | Project Manager (owner only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid board ID');
  }

  const board = await Board.findById(id);

  if (!board) {
    throw new ApiError(404, 'Board not found');
  }

  // Ownership check for Project Managers
  if (req.user.role === 'project_manager' && !board.isOwner(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to update this board');
  }

  // Apply text updates
  if (title !== undefined)       board.title       = title;
  if (description !== undefined) board.description = description;

  // Handle image replacement
  if (req.file) {
    // Delete existing image from Cloudinary first
    if (board.image?.public_id) {
      await deleteFromCloudinary(board.image.public_id);
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer);
      board.image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (err) {
      console.error('[Board Update] Image upload failed:', err);
      throw new ApiError(500, 'Image upload failed. Please try again.');
    }
  }

  await board.save();

  await invalidateUserCaches(req.user._id.toString());
  await invalidateBoardTaskCaches(board._id.toString());

  const populated = await Board.findById(board._id).populate(BOARD_POPULATE);

  return res.status(200).json({
    success: true,
    message: 'Board updated successfully',
    board: populated,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a board
// @route   DELETE /api/v1/boards/:id
// @access  Admin | Project Manager (owner only)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid board ID');
  }

  const board = await Board.findById(id);

  if (!board) {
    throw new ApiError(404, 'Board not found');
  }

  // Ownership check for Project Managers
  if (req.user.role === 'project_manager' && !board.isOwner(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to delete this board');
  }

  // Remove board image from Cloudinary if it exists
  if (board.image?.public_id) {
    await deleteFromCloudinary(board.image.public_id);
  }

  await Board.findByIdAndDelete(id);

  await invalidateUserCaches(req.user._id.toString());
  await invalidateBoardTaskCaches(id);

  return res.status(200).json({
    success: true,
    message: 'Board deleted successfully',
  });
});
