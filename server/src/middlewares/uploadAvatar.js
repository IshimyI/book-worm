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

const storage = multer.diskStorage({
  destination: AVATAR_DIR,
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype];
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.userId}-${unique}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      return cb(new Error("Разрешены только изображения JPG, PNG или WebP"));
    }
    cb(null, true);
  },
});

module.exports = { uploadAvatar, AVATAR_DIR };
