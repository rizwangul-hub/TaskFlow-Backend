import mongoose from "mongoose";

const { Schema, model } = mongoose;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "Task must belong to a board"],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    deadlineReminderSent: {
      type: Boolean,
      default: false,
    },
    statusHistory: [
      {
        previousStatus: {
          type: String,
          enum: ["todo", "in_progress", "review", "done"],
          required: true,
        },
        newStatus: {
          type: String,
          enum: ["todo", "in_progress", "review", "done"],
          required: true,
        },
        changedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        fileName: {
          type: String,
          required: true,
          trim: true,
        },
        fileUrl: {
          type: String,
          required: true,
          trim: true,
        },
        publicId: {
          type: String,
          required: true,
          trim: true,
        },
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes for common query patterns
taskSchema.index({ boardId: 1, status: 1 });
taskSchema.index({ boardId: 1, priority: 1 });
taskSchema.index({ boardId: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1, deadlineReminderSent: 1 });
taskSchema.index({ title: "text", description: "text" });

export const Task = model("Task", taskSchema);
export default Task;
