const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

// DejaVu Sans ships on virtually every Linux box (it's a core fontconfig
// package) and covers Cyrillic, which the default canvas fallback font
// often doesn't — without registering it explicitly, Cyrillic titles can
// render as tofu boxes depending on what's installed on the host.
const CANDIDATE_FONT_PATHS = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];
for (const fontPath of CANDIDATE_FONT_PATHS) {
  try {
    GlobalFonts.registerFromPath(fontPath, "OgSans");
  } catch {
    // Font not present on this host — canvas falls back to its default.
  }
}

const WIDTH = 1200;
const HEIGHT = 630;

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function generateBookOgImage(book) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#2f2a1f");
  gradient.addColorStop(1, "#423a26");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const coverWidth = 320;
  const coverHeight = 460;
  const coverX = 80;
  const coverY = (HEIGHT - coverHeight) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  try {
    if (book.img) {
      const cover = await loadImage(book.img);
      ctx.drawImage(cover, coverX, coverY, coverWidth, coverHeight);
    } else {
      throw new Error("no cover");
    }
  } catch {
    ctx.fillStyle = "#5a5340";
    ctx.fillRect(coverX, coverY, coverWidth, coverHeight);
  }
  ctx.restore();

  const textX = coverX + coverWidth + 70;
  const textMaxWidth = WIDTH - textX - 70;

  ctx.fillStyle = "#f5f0dc";
  ctx.font = "600 52px OgSans, sans-serif";
  const titleLines = wrapText(ctx, book.title || "", textMaxWidth).slice(0, 3);
  let cursorY = coverY + 60;
  for (const line of titleLines) {
    ctx.fillText(line, textX, cursorY);
    cursorY += 62;
  }

  cursorY += 20;
  ctx.fillStyle = "#cbc4a8";
  ctx.font = "32px OgSans, sans-serif";
  ctx.fillText(book.author || "", textX, cursorY);

  cursorY += 70;
  ctx.fillStyle = "#a8b25a";
  ctx.font = "600 36px OgSans, sans-serif";
  const ratingText = book.rating ? `★ ${Number(book.rating).toFixed(1)}` : "Пока нет оценок";
  ctx.fillText(ratingText, textX, cursorY);
  if (book.quantity_rate) {
    ctx.fillStyle = "#cbc4a8";
    ctx.font = "28px OgSans, sans-serif";
    ctx.fillText(`(${book.quantity_rate} отзывов)`, textX + ctx.measureText(ratingText).width + 40, cursorY);
  }

  ctx.fillStyle = "#8a8368";
  ctx.font = "28px OgSans, sans-serif";
  ctx.fillText("Mr Book Worm · mrbookworm.ru", textX, HEIGHT - 50);

  return canvas.toBuffer("image/png");
}

module.exports = { generateBookOgImage };
