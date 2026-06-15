import { ApiError } from "./apiError.js";
import { Task } from "../models/Task.js";
import { Board } from "../models/Board.js";
import mongoose from "mongoose";

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const loadTaskAndBoard = async (taskId) => {
  if (!isValidObjectId(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  return { task, board };
};

export const assertCanViewTask = (task, board, user) => {
  if (user.role === "admin") return;

  if (user.role === "project_manager") {
    if (board.isOwner(user._id) || board.isMember(user._id)) return;
    throw new ApiError(403, "You are not authorized to access this task");
  }

  if (user.role === "team_member") {
    if (board.isMember(user._id)) return;
    throw new ApiError(403, "You are not authorized to access this task");
  }

  throw new ApiError(403, "You are not authorized to access this task");
};

export const assertCanManageTask = (board, user) => {
  if (user.role === "admin") return;

  if (user.role === "project_manager") {
    if (board.isOwner(user._id)) return;
    throw new ApiError(403, "You are not authorized to manage this task");
  }

  throw new ApiError(403, "You are not authorized to manage this task");
};

export const assertCanUpdateTaskFields = (task, board, user) => {
  if (user.role === "admin") return;

  if (user.role === "project_manager") {
    if (board.isOwner(user._id)) return;
    throw new ApiError(403, "You are not authorized to update this task");
  }

  if (user.role === "team_member") {
    if (task.assignedTo?.toString() === user._id.toString()) return;
    throw new ApiError(403, "You are not authorized to update this task");
  }

  throw new ApiError(403, "You are not authorized to update this task");
};

export const assertCanModifyComment = (comment, board, user) => {
  if (user.role === "admin") return;

  if (user.role === "project_manager") {
    if (board.isOwner(user._id)) return;
    throw new ApiError(403, "You are not authorized to modify this comment");
  }

  if (user.role === "team_member") {
    if (comment.userId.toString() === user._id.toString()) return;
    throw new ApiError(403, "You are not authorized to modify this comment");
  }

  throw new ApiError(403, "You are not authorized to modify this comment");
};
