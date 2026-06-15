import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m" },
  );
};

export const generateRefreshToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    { userId, tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" },
  );
};

export const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction || process.env.COOKIE_SECURE === "true",
  sameSite:
    process.env.COOKIE_SAME_SITE ||
    (env.isProduction ? "none" : "lax"),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export default { generateAccessToken, generateRefreshToken, cookieOptions };
