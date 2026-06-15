import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Board } from "../models/Board.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// ─── Helper: Validate MongoDB ObjectId ───────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Populate config for members ─────────────────────────────────────────────
const MEMBER_SELECT = "name email avatar role";

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Invite (add) a user to a board's members
// @route   POST /api/v1/boards/:id/invite
// @access  Admin | Project Manager (owner only)
// ─────────────────────────────────────────────────────────────────────────────
export const inviteUserToBoard = asyncHandler(async (req, res) => {
  const { id: boardId } = req.params;
  const { userId } = req.body;

  // ── Validate IDs ───────────────────────────────────────────────────────────
  if (!isValidObjectId(boardId)) {
    throw new ApiError(400, "Invalid board ID");
  }
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // ── Fetch board ────────────────────────────────────────────────────────────
  const board = await Board.findById(boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  // ── RBAC: only admin or owning project manager can manage members ─────────
  const canManageBoard =
    req.user.role === "admin" ||
    (req.user.role === "project_manager" && board.isOwner(req.user._id));

  if (!canManageBoard) {
    throw new ApiError(403, "You are not authorized to manage this board");
  }

  // ── Verify target user exists ──────────────────────────────────────────────
  const targetUser = await User.findById(userId).select(MEMBER_SELECT);
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  // ── Prevent duplicate membership ───────────────────────────────────────────
  if (board.isMember(userId)) {
    throw new ApiError(409, "User is already a member of this board");
  }

  // ── Add user to members ────────────────────────────────────────────────────
  board.members.push(userId);
  await board.save();

  return res.status(200).json({
    success: true,
    message: "User invited successfully",
    invitedUser: targetUser,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Remove a user from a board's members
// @route   DELETE /api/v1/boards/:id/remove-user
// @access  Admin | Project Manager (owner only)
// ─────────────────────────────────────────────────────────────────────────────
export const removeUserFromBoard = asyncHandler(async (req, res) => {
  const { id: boardId } = req.params;
  const { userId } = req.body;

  // ── Validate IDs ───────────────────────────────────────────────────────────
  if (!isValidObjectId(boardId)) {
    throw new ApiError(400, "Invalid board ID");
  }
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // ── Fetch board ────────────────────────────────────────────────────────────
  const board = await Board.findById(boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  // ── RBAC: only admin or owning project manager can manage members ─────────
  const canManageBoard =
    req.user.role === "admin" ||
    (req.user.role === "project_manager" && board.isOwner(req.user._id));

  if (!canManageBoard) {
    throw new ApiError(403, "You are not authorized to manage this board");
  }

  // ── Protect board creator from being removed ───────────────────────────────
  if (board.createdBy.toString() === userId.toString()) {
    throw new ApiError(400, "Board creator cannot be removed from the board");
  }

  // ── Verify user is actually a member ──────────────────────────────────────
  if (!board.isMember(userId)) {
    throw new ApiError(404, "User is not a member of this board");
  }

  // ── Remove user from members array ────────────────────────────────────────
  board.members = board.members.filter(
    (m) => m.toString() !== userId.toString(),
  );
  await board.save();

  return res.status(200).json({
    success: true,
    message: "User removed successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all members of a board
// @route   GET /api/v1/boards/:id/members
// @access  Admin | Board members
// ─────────────────────────────────────────────────────────────────────────────
export const getBoardMembers = asyncHandler(async (req, res) => {
  const { id: boardId } = req.params;

  // ── Validate ID ────────────────────────────────────────────────────────────
  if (!isValidObjectId(boardId)) {
    throw new ApiError(400, "Invalid board ID");
  }

  // ── Fetch & populate board ─────────────────────────────────────────────────
  const board = await Board.findById(boardId)
    .populate({ path: "members", select: MEMBER_SELECT })
    .populate({ path: "createdBy", select: "name email avatar" });

  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  // ── Access control ─────────────────────────────────────────────────────────
  const isAdmin = req.user.role === "admin";
  const isMember = board.isMember(req.user._id);

  if (!isAdmin && !isMember) {
    throw new ApiError(403, "You do not have access to this board");
  }

  return res.status(200).json({
    success: true,
    boardId: board._id,
    boardTitle: board.title,
    totalMembers: board.members.length,
    members: board.members,
  });
});
