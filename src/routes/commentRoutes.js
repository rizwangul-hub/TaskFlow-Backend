import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  addComment,
  getComments,
  editComment,
  deleteComment,
} from "../controllers/commentController.js";
import {
  taskIdParamRule,
  commentIdParamRule,
  addCommentRules,
  editCommentRules,
  validate,
} from "../validators/commentValidator.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/tasks/:id/comments",
  taskIdParamRule,
  addCommentRules,
  validate,
  addComment,
);

router.get("/tasks/:id/comments", taskIdParamRule, validate, getComments);

const commentRouter = Router();
commentRouter.use(authMiddleware);
commentRouter.put(
  "/:id",
  commentIdParamRule,
  editCommentRules,
  validate,
  editComment,
);
commentRouter.delete("/:id", commentIdParamRule, validate, deleteComment);

export { commentRouter };
export default router;
