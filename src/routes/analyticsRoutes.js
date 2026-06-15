import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getDashboardAnalytics } from "../controllers/analyticsController.js";

const router = Router();

router.use(authMiddleware);
router.get("/dashboard", getDashboardAnalytics);

export default router;
