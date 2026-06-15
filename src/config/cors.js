import { env } from "./env.js";

const parseOrigins = (originValue) => {
  if (!originValue || originValue === "*") return "*";

  return originValue.split(",").map((o) => o.trim());
};

export const corsOptions = {
  origin: (origin, callback) => {
    const allowed = parseOrigins(env.corsOrigin);

    if (allowed === "*") {
      return callback(null, true);
    }

    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  // Ensure OPTIONS preflight returns a 200 status for older browsers
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export default corsOptions;
