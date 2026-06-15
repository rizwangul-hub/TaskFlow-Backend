import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import { xss } from "express-xss-sanitizer";
import rateLimit from "express-rate-limit";
import { corsOptions } from "../config/cors.js";
import { env } from "../config/env.js";

export const helmetMiddleware = helmet({
  contentSecurityPolicy: env.isProduction,
  crossOriginEmbedderPolicy: false,
});

export const corsMiddleware = cors(corsOptions);

// Utility function to recursively sanitize an object
const sanitizeObject = (obj, replaceChar = "_") => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === "string") {
        // Replace MongoDB operators and potentially dangerous characters
        if (value.includes("$") || value.includes(".")) {
          obj[key] = value.replace(/[$.]/g, replaceChar);
        }
      } else if (typeof value === "object" && value !== null) {
        sanitizeObject(value, replaceChar);
      }
    }
  }

  return obj;
};

// Safe mongo-sanitize middleware that only sanitizes data objects
export const mongoSanitizeMiddleware = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

export const xssMiddleware = xss();

export const globalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !env.isProduction, // Skip rate limiting in development
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});
