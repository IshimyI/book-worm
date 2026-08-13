const { createCanvas, loadImage } = require("@napi-rs/canvas");

const AVATAR_SIZE = 256;
const WEBP_QUALITY = 82;

// Uploaded avatars arrive as whatever format/size/orientation the user's
// device produced (JPEG/PNG/WebP, sometimes multiple MB, any aspect ratio).
// Normalizing to a fixed-size square WebP keeps stored/served files small
// and consistent, and drops any embedded EXIF metadata as a side effect.
async function processAvatar(buffer) {
  const source = await loadImage(buffer);

  const canvas = createCanvas(AVATAR_SIZE, AVATAR_SIZE);
  const ctx = canvas.getContext("2d");

  // Center-crop to a square before scaling, so non-square uploads don't
  // get squished — the shorter side becomes the crop dimension.
  const cropSize = Math.min(source.width, source.height);
  const cropX = (source.width - cropSize) / 2;
  const cropY = (source.height - cropSize) / 2;

  ctx.drawImage(source, cropX, cropY, cropSize, cropSize, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  return canvas.toBuffer("image/webp", WEBP_QUALITY);
}

module.exports = { processAvatar, AVATAR_SIZE };
