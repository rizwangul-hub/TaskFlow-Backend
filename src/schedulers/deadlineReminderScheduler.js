import { processDeadlineReminders } from "../services/deadlineReminderService.js";
import logger from "../utils/logger.js";

let intervalId = null;
let isRunning = false;

const getIntervalMs = () =>
  parseInt(process.env.DEADLINE_REMINDER_INTERVAL_MS, 10) || 60 * 60 * 1000;

const runJob = async () => {
  if (isRunning) {
    logger.warn("Deadline reminder job skipped: previous run still in progress");
    return;
  }

  isRunning = true;
  try {
    await processDeadlineReminders();
  } catch (error) {
    logger.error(`Deadline reminder job error: ${error.message}`);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the in-process deadline reminder scheduler.
 * Swap this interval for node-cron / Bull / Agenda in production if needed.
 */
export const startDeadlineReminderScheduler = () => {
  if (process.env.ENABLE_DEADLINE_REMINDER_SCHEDULER === "false") {
    logger.info("Deadline reminder scheduler is disabled");
    return null;
  }

  const intervalMs = getIntervalMs();

  runJob();
  intervalId = setInterval(runJob, intervalMs);

  logger.info(
    `Deadline reminder scheduler started (interval: ${intervalMs}ms)`,
  );

  return intervalId;
};

export const stopDeadlineReminderScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("Deadline reminder scheduler stopped");
  }
};

export default startDeadlineReminderScheduler;
