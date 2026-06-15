import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Task } from "../models/Task.js";
import { Board } from "../models/Board.js";
import { User } from "../models/user.model.js";
import { logActivity, ACTIVITY_ACTIONS } from "../utils/activityLogger.js";
import { sendTaskAssignedEmail } from "../services/emailService.js";
import {
  getCache,
  setCache,
  cacheKeys,
  invalidateUserCaches,
  invalidateBoardTaskCaches,
} from "../services/cacheService.js";
import {
  isValidObjectId,
  assertCanViewTask,
  assertCanManageTask,
  assertCanUpdateTaskFields,
} from "../utils/taskAccess.js";

const TASK_POPULATE = [
  { path: "assignedTo", select: "name email avatar role" },
  { path: "boardId", select: "title" },
];

const loadBoardForAccess = async (boardId) => {
  if (!isValidObjectId(boardId)) {
    throw new ApiError(400, "Invalid board ID");
  }

  const board = await Board.findById(boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  return board;
};

const notifyTaskAssignment = async (task, assigneeId, assignedBy) => {
  if (!assigneeId) return;

  const [assignee, board] = await Promise.all([
    User.findById(assigneeId).select("name email"),
    Board.findById(task.boardId).select("title"),
  ]);

  if (!assignee || !board) return;

  await sendTaskAssignedEmail({
    assignee,
    task,
    board,
    assignedBy,
  });
};

const assertBoardViewAccess = (board, user) => {
  if (user.role === "admin") return;

  if (user.role === "project_manager") {
    if (board.isOwner(user._id)) return;
    throw new ApiError(403, "You do not have access to this board");
  }

  if (board.isMember(user._id)) return;

  throw new ApiError(403, "You do not have access to this board");
};

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, boardId, assignedTo, priority, status, dueDate } =
    req.body;

  const board = await loadBoardForAccess(boardId);
  assertCanManageTask(board, req.user);

  if (assignedTo) {
    if (!isValidObjectId(assignedTo)) {
      throw new ApiError(400, "Invalid assignedTo user ID");
    }
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      throw new ApiError(404, "Assigned user not found");
    }
    if (!board.isMember(assignedTo)) {
      throw new ApiError(400, "Assigned user must be a board member");
    }
  }

  const task = await Task.create({
    title,
    description,
    boardId,
    assignedTo: assignedTo || undefined,
    priority,
    status,
    dueDate,
  });

  await logActivity(task._id, ACTIVITY_ACTIONS.TASK_CREATED, req.user._id);
  await invalidateBoardTaskCaches(boardId);
  await invalidateUserCaches(req.user._id.toString());

  if (assignedTo) {
    await notifyTaskAssignment(task, assignedTo, req.user);
  }

  const populated = await Task.findById(task._id).populate(TASK_POPULATE);

  return res.status(201).json({
    success: true,
    message: "Task created successfully",
    task: populated,
  });
});

export const getTasksByBoard = asyncHandler(async (req, res) => {
  const { boardId } = req.params;
  const { priority } = req.query;

  const cacheKey = cacheKeys.tasks(
    boardId,
    priority,
    req.user._id.toString(),
  );
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ ...cached, cached: true });
  }

  const board = await loadBoardForAccess(boardId);
  assertBoardViewAccess(board, req.user);

  const filter = { boardId };
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate(TASK_POPULATE)
    .sort({ createdAt: -1 });

  const response = {
    success: true,
    boardId,
    total: tasks.length,
    tasks,
  };

  await setCache(cacheKey, response);

  return res.status(200).json(response);
});

export const getSingleTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(id).populate(TASK_POPULATE);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  assertCanViewTask(task, board, req.user);

  return res.status(200).json({
    success: true,
    task,
  });
});

export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, assignedTo, priority, status, dueDate } =
    req.body;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  assertCanManageTask(board, req.user);

  const previousAssignee = task.assignedTo?.toString();
  let newAssigneeId = null;

  if (assignedTo !== undefined) {
    if (assignedTo === null || assignedTo === "") {
      task.assignedTo = undefined;
    } else {
      if (!isValidObjectId(assignedTo)) {
        throw new ApiError(400, "Invalid assignedTo user ID");
      }
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        throw new ApiError(404, "Assigned user not found");
      }
      if (!board.isMember(assignedTo)) {
        throw new ApiError(400, "Assigned user must be a board member");
      }
      task.assignedTo = assignedTo;
      newAssigneeId = assignedTo;
    }
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (dueDate !== undefined) {
    task.dueDate = dueDate;
    task.deadlineReminderSent = false;
  }

  await task.save();
  await logActivity(task._id, ACTIVITY_ACTIONS.TASK_UPDATED, req.user._id);
  await invalidateBoardTaskCaches(task.boardId.toString());
  await invalidateUserCaches(req.user._id.toString());

  if (newAssigneeId && newAssigneeId !== previousAssignee) {
    await notifyTaskAssignment(task, newAssigneeId, req.user);
  }

  const populated = await Task.findById(task._id).populate(TASK_POPULATE);

  return res.status(200).json({
    success: true,
    message: "Task updated successfully",
    task: populated,
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  assertCanManageTask(board, req.user);

  await logActivity(task._id, ACTIVITY_ACTIONS.TASK_DELETED, req.user._id);
  await invalidateBoardTaskCaches(task.boardId.toString());
  await invalidateUserCaches(req.user._id.toString());
  await Task.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  assertCanUpdateTaskFields(task, board, req.user);

  const previousStatus = task.status;
  if (previousStatus === status) {
    throw new ApiError(400, "Task is already in this status");
  }

  task.statusHistory.push({
    previousStatus,
    newStatus: status,
    changedBy: req.user._id,
  });
  task.status = status;

  await task.save();
  await logActivity(task._id, ACTIVITY_ACTIONS.STATUS_CHANGED, req.user._id);
  await invalidateBoardTaskCaches(task.boardId.toString());
  await invalidateUserCaches(req.user._id.toString());

  const populated = await Task.findById(task._id).populate(TASK_POPULATE);

  return res.status(200).json({
    success: true,
    message: "Task status updated successfully",
    task: populated,
  });
});

export const updateTaskPriority = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  assertCanManageTask(board, req.user);

  if (task.priority === priority) {
    throw new ApiError(400, "Task already has this priority");
  }

  task.priority = priority;
  await task.save();
  await logActivity(task._id, ACTIVITY_ACTIONS.PRIORITY_CHANGED, req.user._id);
  await invalidateBoardTaskCaches(task.boardId.toString());
  await invalidateUserCaches(req.user._id.toString());

  const populated = await Task.findById(task._id).populate(TASK_POPULATE);

  return res.status(200).json({
    success: true,
    message: "Task priority updated successfully",
    task: populated,
  });
});

export const getOverdueTasks = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    dueDate: { $lt: now },
    status: { $ne: "done" },
  };

  if (req.user.role === "admin") {
    // no extra filter
  } else if (req.user.role === "project_manager") {
    const ownedBoards = await Board.find({ createdBy: req.user._id }).select(
      "_id",
    );
    const boardIds = ownedBoards.map((b) => b._id);
    filter.boardId = { $in: boardIds };
  } else {
    filter.assignedTo = req.user._id;
  }

  const tasks = await Task.find(filter)
    .populate(TASK_POPULATE)
    .sort({ dueDate: 1 });

  return res.status(200).json({
    success: true,
    total: tasks.length,
    tasks,
  });
});
