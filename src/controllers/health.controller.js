import { asyncHandler } from "../utils/asyncHandler.js";

export const healthCheck = asyncHandler(async (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

export default healthCheck;
