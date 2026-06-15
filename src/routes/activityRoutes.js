import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getTaskActivity } from "../controllers/activityController.js";
import { taskIdParamRule, validate } from "../validators/activityValidator.js";

const router = Router();

router.use(authMiddleware);

router.get("/tasks/:id/activity", taskIdParamRule, validate, getTaskActivity);

export default router;
