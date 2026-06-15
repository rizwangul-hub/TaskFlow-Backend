import { Router } from 'express';
import {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadImage } from '../middlewares/uploadMiddleware.js';
import {
  createBoardRules,
  updateBoardRules,
  validate,
} from '../validators/boardValidator.js';

const router = Router();

// ─── All board routes require a valid JWT ─────────────────────────────────────
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/boards
// Access: Admin, Project Manager
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  (req, res, next) => {
    // Inline role guard — only admin or project_manager can create
    const allowed = ['admin', 'project_manager'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create a board',
      });
    }
    next();
  },
  uploadImage,            // optional board image (multipart/form-data field: "image")
  createBoardRules,
  validate,
  createBoard
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/boards
// Access: All authenticated users (filter applied per role in controller)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', getBoards);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/boards/:id
// Access: Admin | Board members
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', getBoardById);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/boards/:id
// Access: Admin | Project Manager (owner only)
// ─────────────────────────────────────────────────────────────────────────────
router.put(
  '/:id',
  (req, res, next) => {
    const allowed = ['admin', 'project_manager'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update a board',
      });
    }
    next();
  },
  uploadImage,            // optional new board image
  updateBoardRules,
  validate,
  updateBoard
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/boards/:id
// Access: Admin | Project Manager (owner only)
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  '/:id',
  (req, res, next) => {
    const allowed = ['admin', 'project_manager'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete a board',
      });
    }
    next();
  },
  deleteBoard
);

export default router;
