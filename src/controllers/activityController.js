import { asyncHandler } from "../utils/asyncHandler.js";
import { ActivityLog } from "../models/ActivityLog.js";
import {
  loadTaskAndBoard,
  assertCanViewTask,
} from "../utils/taskAccess.js";

const ACTIVITY_POPULATE = [
  {
    path: "performedBy",
    select: "name email avatar role",
  },
  {
    path: "taskId",
    select: "title status priority",
  },
];

export const getTaskActivity = asyncHandler(async (req, res) => {
  const { id: taskId } = req.params;

  const { task, board } = await loadTaskAndBoard(taskId);
  assertCanViewTask(task, board, req.user);

  const activities = await ActivityLog.find({ taskId: task._id })
    .populate(ACTIVITY_POPULATE)
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    taskId: task._id,
    total: activities.length,
    activities,
  });
});
