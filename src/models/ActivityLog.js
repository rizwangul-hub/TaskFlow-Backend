import mongoose from "mongoose";

const { Schema, model } = mongoose;

const activityLogSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({ taskId: 1, createdAt: -1 });
activityLogSchema.index({ performedBy: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });

export const ActivityLog = model("ActivityLog", activityLogSchema);
export default ActivityLog;
