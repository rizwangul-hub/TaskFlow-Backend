import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
} from "../controllers/notificationController.js";

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

// GET    /api/notifications              — list (paginated)
// DELETE /api/notifications              — clear all
router
  .route("/")
  .get(getNotifications)
  .delete(deleteAllNotifications);

// GET    /api/notifications/unread-count — lightweight count poll
router.get("/unread-count", getUnreadCount);

// PATCH  /api/notifications/read-all    — mark all read
router.patch("/read-all", markAllAsRead);

// PATCH  /api/notifications/:id/read    — mark one read
// DELETE /api/notifications/:id         — delete one
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
