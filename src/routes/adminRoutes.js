import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/rbac.middleware.js";
import {
  getAllUsers,
  changeUserRole,
  deleteUser,
} from "../controllers/adminController.js";
import {
  listUsersQueryRules,
  userIdParamRule,
  changeRoleRules,
  validate,
} from "../validators/adminValidator.js";

const router = Router();

router.use(authMiddleware);
router.use(adminOnly);

router.get("/users", listUsersQueryRules, validate, getAllUsers);

router.put(
  "/users/:id/role",
  userIdParamRule,
  changeRoleRules,
  validate,
  changeUserRole,
);

router.delete("/users/:id", userIdParamRule, validate, deleteUser);

export default router;
