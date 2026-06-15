import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createTask,
  getTasksByBoard,
  getSingleTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority,
  getOverdueTasks,
} from "../controllers/taskController.js";
import {
  createTaskRules,
  updateTaskRules,
  statusUpdateRules,
  priorityUpdateRules,
  boardIdParamRule,
  taskIdParamRule,
  priorityFilterRule,
  validate,
} from "../validators/taskValidator.js";

const router = Router();

router.use(authMiddleware);

router.post("/tasks", createTaskRules, validate, createTask);
router.get("/tasks/overdue", getOverdueTasks);
router.get(
  "/tasks/:boardId",
  boardIdParamRule,
  priorityFilterRule,
  validate,
  getTasksByBoard,
);
router.get("/task/:id", taskIdParamRule, validate, getSingleTask);
router.put("/task/:id", updateTaskRules, validate, updateTask);
router.patch(
  "/tasks/:id/status",
  statusUpdateRules,
  validate,
  updateTaskStatus,
);
router.patch(
  "/tasks/:id/priority",
  priorityUpdateRules,
  validate,
  updateTaskPriority,
);
router.delete("/task/:id", taskIdParamRule, validate, deleteTask);

export default router;
