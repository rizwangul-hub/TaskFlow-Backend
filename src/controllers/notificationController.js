import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── GET /api/notifications ───────────────────────────────────────────────────
// Returns paginated notifications for the logged-in user
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { recipient: userId };
  if (req.query.unread === "true") {
    filter.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + notifications.length < total,
    },
  });
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
// Mark a single notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res.status(200).json({
    success: true,
    notification,
  });
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
// Mark all notifications as read for the logged-in user
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
// Delete a specific notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted",
  });
});

// ─── DELETE /api/notifications ───────────────────────────────────────────────
// Delete all notifications for the logged-in user
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id });

  res.status(200).json({
    success: true,
    message: "All notifications deleted",
  });
});

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
// Returns only the unread count (lightweight poll endpoint)
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  res.status(200).json({
    success: true,
    unreadCount: count,
  });
});
