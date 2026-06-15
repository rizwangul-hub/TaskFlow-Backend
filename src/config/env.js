import logger from "../utils/logger.js";

const REQUIRED_VARS = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    throw new Error(
      `Environment validation failed. Missing: ${missing.join(", ")}`,
    );
  }

  if (process.env.NODE_ENV === "production") {
    if (process.env.JWT_ACCESS_SECRET.length < 32) {
      logger.warn("JWT_ACCESS_SECRET should be at least 32 characters in production");
    }
    if (process.env.CORS_ORIGIN === "*") {
      logger.warn("CORS_ORIGIN is set to * in production — consider restricting origins");
    }
  }

  logger.info("Environment variables validated successfully");
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  isProduction: process.env.NODE_ENV === "production",
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 60,
  redisUrl: process.env.REDIS_URL || "",
  trustProxy: process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production",
};

export { validateEnv, env };
export default env;
