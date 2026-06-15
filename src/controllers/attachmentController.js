import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Task } from "../models/Task.js";
import { Board } from "../models/Board.js";
import { logActivity, ACTIVITY_ACTIONS } from "../utils/activityLogger.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });

const verifyUploadPermission = (task, user) => {
  if (user.role === "admin") return;
  if (user.role === "project_manager") {
    if (!task.boardId) {
      throw new ApiError(404, "Task board not found");
    }
    if (
      !task.boardId.equals(user._id) &&
      !task.boardId.createdBy?.equals(user._id)
    ) {
      // fallback if board not populated properly
      // actual board-level permission is enforced by board owner check in controller
    }
    return;
  }
  if (user.role === "team_member") {
    if (
      !task.assignedTo ||
      task.assignedTo.toString() !== user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You are not authorized to upload files to this task",
      );
    }
    return;
  }
  throw new ApiError(
    403,
    "You are not authorized to upload files to this task",
  );
};

const verifyDeletePermission = (task, attachment, user) => {
  if (user.role === "admin") return;
  if (user.role === "project_manager") return;
  if (user.role === "team_member") {
    if (
      !attachment.uploadedBy ||
      attachment.uploadedBy.toString() !== user._id.toString()
    ) {
      throw new ApiError(403, "You are not authorized to delete this file");
    }
    return;
  }
  throw new ApiError(403, "You are not authorized to delete this file");
};

const verifyBoardOwnership = async (task, user) => {
  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  if (user.role === "admin") return board;
  if (user.role === "project_manager") {
    if (!board.isOwner(user._id)) {
      throw new ApiError(403, "You are not authorized to access this task");
    }
    return board;
  }
  if (user.role === "team_member") {
    if (
      !task.assignedTo ||
      task.assignedTo.toString() !== user._id.toString()
    ) {
      throw new ApiError(403, "You are not authorized to access this task");
    }
    return board;
  }

  throw new ApiError(403, "You are not authorized to access this task");
};

export const uploadTaskFiles = asyncHandler(async (req, res) => {
  const { id: taskId } = req.params;

  if (!isValidObjectId(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  if (req.user.role === "project_manager" && !board.isOwner(req.user._id)) {
    throw new ApiError(
      403,
      "You are not authorized to upload files to this task",
    );
  }

  if (req.user.role === "team_member") {
    if (
      !task.assignedTo ||
      task.assignedTo.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You are not authorized to upload files to this task",
      );
    }
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No files were uploaded");
  }

  const folder = `taskflow/tasks/${task._id}`;
  const uploadedAttachments = [];
  const savedAttachments = [];

  try {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, folder);
      const attachment = {
        fileName: file.originalname,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      };
      task.attachments.push(attachment);
      uploadedAttachments.push(result.public_id);
      savedAttachments.push(attachment);
    }

    await task.save();

    await logActivity(task._id, ACTIVITY_ACTIONS.FILE_UPLOADED, req.user._id);

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      attachments: savedAttachments,
    });
  } catch (error) {
    if (uploadedAttachments.length > 0) {
      for (const publicId of uploadedAttachments) {
        try {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto",
          });
        } catch (cleanupError) {
          // Log cleanup failure and continue
          console.error("Cloudinary cleanup failed:", cleanupError.message);
        }
      }
    }
    throw new ApiError(500, "File upload failed. Please try again.");
  }
});

export const deleteTaskFile = asyncHandler(async (req, res) => {
  const { id: taskId, fileId } = req.params;

  if (!isValidObjectId(taskId) || !isValidObjectId(fileId)) {
    throw new ApiError(400, "Invalid task or file ID");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const attachment = task.attachments.id(fileId);
  if (!attachment) {
    throw new ApiError(404, "Attachment not found");
  }

  const board = await Board.findById(task.boardId);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  if (req.user.role === "project_manager" && !board.isOwner(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this file");
  }

  if (req.user.role === "team_member") {
    if (
      !attachment.uploadedBy ||
      attachment.uploadedBy.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, "You are not authorized to delete this file");
    }
  }

  try {
    await cloudinary.uploader.destroy(attachment.publicId, {
      resource_type: "auto",
    });
  } catch (error) {
    throw new ApiError(500, "Failed to delete file from Cloudinary");
  }

  task.attachments.pull(fileId);
  await task.save();

  await logActivity(task._id, ACTIVITY_ACTIONS.FILE_DELETED, req.user._id);

  return res.status(200).json({
    success: true,
    message: "File deleted successfully",
  });
});
