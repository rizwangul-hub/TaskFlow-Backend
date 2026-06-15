import { Task } from "../models/Task.js";
import { Board } from "../models/Board.js";
import { User } from "../models/user.model.js";
import { sendDeadlineReminderEmail } from "./emailService.js";
import logger from "../utils/logger.js";

const getReminderWindowHours = () =>
  parseInt(process.env.DEADLINE_REMINDER_HOURS_BEFORE, 10) || 24;

/**
 * Find tasks approaching their due date and send reminder emails.
 * Designed to be invoked by a scheduler (cron, interval, or worker).
 */
export const processDeadlineReminders = async () => {
  const hoursBefore = getReminderWindowHours();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

  const tasks = await Task.find({
    dueDate: { $gte: now, $lte: windowEnd },
    status: { $ne: "done" },
    deadlineReminderSent: { $ne: true },
    assignedTo: { $exists: true, $ne: null },
  });

  if (tasks.length === 0) {
    logger.debug("Deadline reminder job: no tasks due in reminder window");
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      const [assignee, board] = await Promise.all([
        User.findById(task.assignedTo).select("name email"),
        Board.findById(task.boardId).select("title"),
      ]);

      if (!assignee || !board) {
        failed += 1;
        continue;
      }

      const msRemaining = new Date(task.dueDate).getTime() - now.getTime();
      const hoursRemaining = Math.max(1, Math.ceil(msRemaining / (60 * 60 * 1000)));

      await sendDeadlineReminderEmail({
        assignee,
        task,
        board,
        hoursRemaining,
      });

      task.deadlineReminderSent = true;
      await task.save({ validateBeforeSave: false });
      sent += 1;
    } catch (error) {
      failed += 1;
      logger.error(
        `Deadline reminder failed for task ${task._id}: ${error.message}`,
      );
    }
  }

  logger.info(
    `Deadline reminder job complete: ${sent} sent, ${failed} failed (${tasks.length} candidates)`,
  );

  return { processed: tasks.length, sent, failed };
};

export default processDeadlineReminders;
