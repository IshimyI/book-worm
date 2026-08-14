const fs = require("fs");
const path = require("path");

const COVER_CACHE_DIR = path.join(__dirname, "../../uploads/covers");
fs.mkdirSync(COVER_CACHE_DIR, { recursive: true });

const ALLOWED_HOST = "covers.openlibrary.org";
const FILENAME_PATTERN = /^[\w.-]+\.(jpg|jpeg|png)$/i;

// Every book cover is hotlinked straight from Open Library's CDN — fine as
// an external dependency, but not one this site controls: a slow response
// or a hiccup on their end shows up here as a broken image. Fetch each
// cover once and cache it on disk so a real user's load never depends on
// Open Library being fast (or even reachable) at that exact moment.
// Returns a local /uploads/covers/... path on success, or null if the URL
// isn't an Open Library cover, or the fetch/cache failed — callers should
// fall back to the original URL in that case rather than break the image.
async function getCachedCoverPath(src) {
  let url;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== ALLOWED_HOST) {
    return null;
  }

  const filename = path.basename(url.pathname);
  if (!FILENAME_PATTERN.test(filename)) {
    return null;
  }

  const diskPath = path.join(COVER_CACHE_DIR, filename);
  if (fs.existsSync(diskPath)) {
    return `/uploads/covers/${filename}`;
  }

  let response;
  try {
    response = await fetch(src, { signal: AbortSignal.timeout(8000) });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(diskPath, buffer);
  return `/uploads/covers/${filename}`;
}

module.exports = { getCachedCoverPath, COVER_CACHE_DIR };
