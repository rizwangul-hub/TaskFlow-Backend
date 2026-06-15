import { createClient } from "redis";
import logger from "../utils/logger.js";
import { env } from "./env.js";

let client = null;
let isAvailable = false;

export const initRedis = async () => {
  if (!env.redisUrl) {
    logger.info("REDIS_URL not set — cache layer disabled (in-memory fallback unavailable, queries run direct)");
    return null;
  }

  try {
    client = createClient({ url: env.redisUrl });

    client.on("error", (err) => {
      logger.error(`Redis error: ${err.message}`);
      isAvailable = false;
    });

    client.on("connect", () => {
      isAvailable = true;
      logger.info("Redis connected successfully");
    });

    client.on("end", () => {
      isAvailable = false;
    });

    await client.connect();
    isAvailable = true;
    return client;
  } catch (error) {
    logger.warn(`Redis unavailable — running without cache: ${error.message}`);
    client = null;
    isAvailable = false;
    return null;
  }
};

export const getRedisClient = () => client;

export const isRedisAvailable = () => isAvailable && client?.isOpen;

export const closeRedis = async () => {
  if (client?.isOpen) {
    await client.quit();
    logger.info("Redis connection closed");
  }
};

export default initRedis;
