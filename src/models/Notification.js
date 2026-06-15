import mongoose from "mongoose";

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "task_assigned",
        "task_updated",
        "task_completed",
        "deadline_reminder",
        "overdue",
        "comment",
        "mention",
        "status_changed",
        "board_invited",
        "board_removed",
        "welcome",
        "general",
      ],
      default: "general",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    link: {
      type: String,
      trim: true,
      default: null,
    },
    icon: {
      type: String,
      trim: true,
      default: "general",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Optional references to related entities
    relatedTask: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    relatedBoard: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      default: null,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common query patterns
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const Notification = model("Notification", notificationSchema);
export default Notification;
