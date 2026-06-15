import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadTaskFiles } from "../middlewares/uploadMiddleware.js";
import {
  taskIdParamRule,
  fileIdParamRule,
  validate,
} from "../validators/attachmentValidator.js";
import {
  uploadTaskFiles as uploadTaskFilesController,
  deleteTaskFile,
} from "../controllers/attachmentController.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/tasks/:id/upload",
  taskIdParamRule,
  validate,
  uploadTaskFiles,
  uploadTaskFilesController,
);

router.delete(
  "/tasks/:id/file/:fileId",
  taskIdParamRule,
  fileIdParamRule,
  validate,
  deleteTaskFile,
);

export default router;
