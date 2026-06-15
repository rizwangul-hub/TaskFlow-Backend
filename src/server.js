import "dotenv/config";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/env.js";
import { initRedis, closeRedis } from "./config/redis.js";
import { app } from "./app.js";
import logger from "./utils/logger.js";
import { startDeadlineReminderScheduler } from "./schedulers/deadlineReminderScheduler.js";

process.on("uncaughtException", (err) => {
  logger.error(
    `UNCAUGHT EXCEPTION! Shutting down...\nError: ${err.message}\nStack: ${err.stack}`,
  );
  process.exit(1);
});

const gracefulShutdown = async (server, signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await closeRedis();
    process.exit(0);
  });
};

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    await initRedis();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
      logger.info(`API docs available at /api-docs`);
    });

    startDeadlineReminderScheduler();

    process.on("unhandledRejection", (err) => {
      logger.error(
        `UNHANDLED REJECTION!\nError: ${err.message}\nStack: ${err.stack}`,
      );
      server.close(async () => {
        await closeRedis();
        process.exit(1);
      });
    });

    process.on("SIGTERM", () => gracefulShutdown(server, "SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown(server, "SIGINT"));
  } catch (error) {
    logger.error(`Server initialization failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
