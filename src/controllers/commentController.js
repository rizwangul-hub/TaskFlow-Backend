import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Comment } from "../models/Comment.js";
import { logActivity, ACTIVITY_ACTIONS } from "../utils/activityLogger.js";
import {
  isValidObjectId,
  loadTaskAndBoard,
  assertCanViewTask,
  assertCanModifyComment,
} from "../utils/taskAccess.js";

const COMMENT_USER_SELECT = "name email avatar role";

export const addComment = asyncHandler(async (req, res) => {
  const { id: taskId } = req.params;
  const { message } = req.body;

  const { task, board } = await loadTaskAndBoard(taskId);
  assertCanViewTask(task, board, req.user);

  const comment = await Comment.create({
    taskId: task._id,
    userId: req.user._id,
    message,
  });

  await logActivity(task._id, ACTIVITY_ACTIONS.COMMENT_ADDED, req.user._id);

  const populated = await Comment.findById(comment._id).populate({
    path: "userId",
    select: COMMENT_USER_SELECT,
  });

  return res.status(201).json({
    success: true,
    message: "Comment added successfully",
    comment: populated,
  });
});

export const getComments = asyncHandler(async (req, res) => {
  const { id: taskId } = req.params;

  const { task, board } = await loadTaskAndBoard(taskId);
  assertCanViewTask(task, board, req.user);

  const comments = await Comment.find({ taskId: task._id })
    .populate({ path: "userId", select: COMMENT_USER_SELECT })
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    taskId: task._id,
    total: comments.length,
    comments,
  });
});

export const editComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const { task, board } = await loadTaskAndBoard(comment.taskId);
  assertCanModifyComment(comment, board, req.user);

  comment.message = message;
  await comment.save();

  await logActivity(task._id, ACTIVITY_ACTIONS.COMMENT_UPDATED, req.user._id);

  const populated = await Comment.findById(comment._id).populate({
    path: "userId",
    select: COMMENT_USER_SELECT,
  });

  return res.status(200).json({
    success: true,
    message: "Comment updated successfully",
    comment: populated,
  });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const { task, board } = await loadTaskAndBoard(comment.taskId);
  assertCanModifyComment(comment, board, req.user);

  await logActivity(task._id, ACTIVITY_ACTIONS.COMMENT_DELETED, req.user._id);
  await Comment.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Comment deleted successfully",
  });
});
