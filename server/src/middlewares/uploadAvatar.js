const fs = require("fs");
const path = require("path");
const multer = require("multer");

const AVATAR_DIR = path.join(__dirname, "../../uploads/avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const uploadAvatar = multer({
  // Uploaded files are processed (resized + re-encoded as WebP) before
  // being written to disk, so multer only needs to hold the raw bytes
  // in memory long enough to hand them to that pipeline.
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      return cb(new Error("Разрешены только изображения JPG, PNG или WebP"));
    }
    cb(null, true);
  },
});

module.exports = { uploadAvatar, AVATAR_DIR };
