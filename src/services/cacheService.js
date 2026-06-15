import { isRedisAvailable, getRedisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

export const cacheKeys = {
  boards: (userId, page, limit) => `boards:${userId}:${page}:${limit}`,
  tasks: (boardId, priority, userId) =>
    `tasks:${boardId}:${priority || "all"}:${userId}`,
  analytics: (userId) => `analytics:${userId}`,
};

export const getCache = async (key) => {
  if (!isRedisAvailable()) return null;

  try {
    const data = await getRedisClient().get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Cache GET failed [${key}]: ${error.message}`);
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds = env.cacheTtlSeconds) => {
  if (!isRedisAvailable()) return false;

  try {
    await getRedisClient().setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Cache SET failed [${key}]: ${error.message}`);
    return false;
  }
};

export const deleteCache = async (key) => {
  if (!isRedisAvailable()) return false;

  try {
    await getRedisClient().del(key);
    return true;
  } catch (error) {
    logger.error(`Cache DEL failed [${key}]: ${error.message}`);
    return false;
  }
};

export const invalidateUserCaches = async (userId) => {
  if (!isRedisAvailable()) return;

  try {
    const redis = getRedisClient();
    const patterns = [`boards:${userId}:*`, `analytics:${userId}`];

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    }
  } catch (error) {
    logger.error(`Cache invalidation failed for user ${userId}: ${error.message}`);
  }
};

export const invalidateBoardTaskCaches = async (boardId) => {
  if (!isRedisAvailable()) return;

  try {
    const redis = getRedisClient();
    const keys = await redis.keys(`tasks:${boardId}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    logger.error(`Cache invalidation failed for board ${boardId}: ${error.message}`);
  }
};

export default { getCache, setCache, deleteCache, cacheKeys };
