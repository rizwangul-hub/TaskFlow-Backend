import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import logger from "./utils/logger.js";
import { env } from "./config/env.js";
import { setupSwagger } from "./config/swagger.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { ApiError } from "./utils/apiError.js";
import {
  helmetMiddleware,
  corsMiddleware,
  mongoSanitizeMiddleware,
  xssMiddleware,
  globalRateLimiter,
  authRateLimiter,
} from "./middlewares/security.middleware.js";
import { healthCheck } from "./controllers/health.controller.js";

// Route Imports
import healthcheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import boardRoutes from "./routes/boardRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import commentRoutes, { commentRouter } from "./routes/commentRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
    level: 6,
  }),
);
// ─── Security ─────────────────────────────────────────────────────────────────
// Apply CORS early so preflight requests are handled before other middleware
app.use(corsMiddleware);

app.use(helmetMiddleware);
// Temporary debug middleware: log incoming Origin and configured CORS_ORIGIN
app.use((req, res, next) => {
  try {
    const incomingOrigin = req.headers.origin || '<no-origin-header>';
    logger.info(`CORS Debug - incoming Origin: ${incomingOrigin} | configured CORS_ORIGIN: ${env.corsOrigin}`);
  } catch (err) {
    logger.debug('CORS Debug logging failed');
  }
  next();
});

// Temporary permissive CORS handler for debugging preflight issues.
// This will set CORS response headers and respond to OPTIONS requests.
app.use((req, res, next) => {
  const originHeader = req.headers.origin;
  const allowed = (env.corsOrigin || '').split(',').map((o) => o.trim()).filter(Boolean);

  if (originHeader && (allowed.includes(originHeader) || allowed.includes('*'))) {
    res.header('Access-Control-Allow-Origin', originHeader);
  } else if (allowed.includes('*')) {
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(mongoSanitizeMiddleware);
app.use(xssMiddleware);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use("/api", globalRateLimiter);
app.use("/api/v1/auth", authRateLimiter);
app.use("/api/auth", authRateLimiter);

// ─── Request Parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ─── HTTP Request Logging ────────────────────────────────────────────────────
const morganFormat =
  env.isProduction
    ? ":remote-addr :method :url :status :res[content-length] - :response-time ms"
    : ":method :url :status :res[content-length] - :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.url === "/health",
  }),
);

// ─── Health Check (deployment probes) ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TaskFlow API",
    status: "healthy",
    docs: "/api-docs"
  });
});
app.get("/health", healthCheck);

// ─── API Documentation ───────────────────────────────────────────────────────
setupSwagger(app);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/auth", authRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/boards", boardRoutes);
app.use("/api/v1/boards", teamRoutes);
app.use("/api", commentRoutes);
app.use("/api/comments", commentRouter);
app.use("/api", activityRoutes);
app.use("/api", taskRoutes);
app.use("/api", attachmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl || req.url} not found`));
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorMiddleware);

export { app };
export default app;
