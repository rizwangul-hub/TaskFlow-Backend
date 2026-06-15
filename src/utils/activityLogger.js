import { ActivityLog } from "../models/ActivityLog.js";
import logger from "./logger.js";

export const ACTIVITY_ACTIONS = {
  TASK_CREATED: "Task Created",
  TASK_UPDATED: "Task Updated",
  TASK_DELETED: "Task Deleted",
  STATUS_CHANGED: "Status Changed",
  PRIORITY_CHANGED: "Priority Changed",
  COMMENT_ADDED: "Comment Added",
  COMMENT_UPDATED: "Comment Updated",
  COMMENT_DELETED: "Comment Deleted",
  FILE_UPLOADED: "File Uploaded",
  FILE_DELETED: "File Deleted",
};

/**
 * Persist a task activity log entry. Failures are logged but do not
 * interrupt the calling operation.
 */
export const logActivity = async (taskId, action, userId) => {
  try {
    await ActivityLog.create({
      taskId,
      action,
      performedBy: userId,
    });
  } catch (error) {
    logger.error(
      `Failed to log activity [${action}] for task ${taskId}: ${error.message}`,
    );
  }
};

export default logActivity;
