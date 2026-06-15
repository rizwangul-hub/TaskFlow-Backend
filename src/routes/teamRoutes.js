import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  inviteUserToBoard,
  removeUserFromBoard,
  getBoardMembers,
} from "../controllers/teamController.js";
import {
  boardIdParamRule,
  inviteUserRules,
  removeUserRules,
  validate,
} from "../validators/teamValidator.js";

const router = Router();

router.use(authMiddleware);

const requireBoardManager = (req, res, next) => {
  const allowed = ["admin", "project_manager"];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to manage board members",
    });
  }
  next();
};

// POST /api/v1/boards/:id/invite
router.post(
  "/:id/invite",
  boardIdParamRule,
  inviteUserRules,
  validate,
  requireBoardManager,
  inviteUserToBoard,
);

// DELETE /api/v1/boards/:id/remove-user
router.delete(
  "/:id/remove-user",
  boardIdParamRule,
  removeUserRules,
  validate,
  requireBoardManager,
  removeUserFromBoard,
);

// GET /api/v1/boards/:id/members
router.get("/:id/members", boardIdParamRule, validate, getBoardMembers);

export default router;
