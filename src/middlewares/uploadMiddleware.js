import multer from "multer";

// Store files in memory for direct upload to Cloudinary
const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const taskAttachmentFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const imageUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const taskFileUpload = multer({
  storage,
  fileFilter: taskAttachmentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Export specific field uploads
export const uploadAvatar = imageUpload.single("avatar");
export const uploadImage = imageUpload.single("image");
export const uploadTaskFiles = taskFileUpload.array("files", 5);
