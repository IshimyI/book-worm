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

function drawBrandFooter(ctx, textX) {
  ctx.fillStyle = "#8a8368";
  ctx.font = "28px OgSans, sans-serif";
  ctx.fillText("Mr Book Worm · mrbookworm.ru", textX, HEIGHT - 50);
}

async function generateProfileOgImage(profile) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#2f2a1f");
  gradient.addColorStop(1, "#423a26");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const avatarSize = 260;
  const avatarX = 100;
  const avatarY = (HEIGHT - avatarSize) / 2;
  const centerX = avatarX + avatarSize / 2;
  const centerY = avatarY + avatarSize / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  try {
    if (!profile.avatarUrl) throw new Error("no avatar");
    const avatar = await loadImage(profile.avatarUrl);
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  } catch {
    ctx.fillStyle = "#5a5340";
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = "#f5f0dc";
    ctx.font = "600 110px OgSans, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((profile.name || "?").charAt(0).toUpperCase(), centerX, centerY + 8);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  const textX = avatarX + avatarSize + 70;
  const textMaxWidth = WIDTH - textX - 70;

  ctx.fillStyle = "#f5f0dc";
  ctx.font = "600 56px OgSans, sans-serif";
  const nameLines = wrapText(ctx, profile.name || "", textMaxWidth).slice(0, 2);
  let cursorY = centerY - 40;
  for (const line of nameLines) {
    ctx.fillText(line, textX, cursorY);
    cursorY += 64;
  }

  cursorY += 20;
  ctx.fillStyle = "#a8b25a";
  ctx.font = "600 34px OgSans, sans-serif";
  ctx.fillText(`${profile.reviewCount || 0} рецензий · ${profile.followerCount || 0} подписчиков`, textX, cursorY);

  drawBrandFooter(ctx, textX);

  return canvas.toBuffer("image/png");
}

async function generateListOgImage(list) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#2f2a1f");
  gradient.addColorStop(1, "#423a26");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // A small overlapping stack of covers stands in for "this is a
  // collection", rather than trying to cram a full grid into the frame.
  const coverWidth = 200;
  const coverHeight = 290;
  const coverY = (HEIGHT - coverHeight) / 2 - 20;
  const covers = (list.covers || []).slice(0, 3);
  const stackStartX = 60;

  for (let i = 0; i < 3; i++) {
    const x = stackStartX + i * (coverWidth * 0.55);
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 8;
    // eslint-disable-next-line no-await-in-loop
    try {
      if (!covers[i]) throw new Error("no cover");
      // eslint-disable-next-line no-await-in-loop
      const cover = await loadImage(covers[i]);
      ctx.drawImage(cover, x, coverY, coverWidth, coverHeight);
    } catch {
      ctx.fillStyle = "#5a5340";
      ctx.fillRect(x, coverY, coverWidth, coverHeight);
    }
    ctx.restore();
  }

  const textX = stackStartX + coverWidth * 0.55 * 2 + coverWidth + 60;
  const textMaxWidth = WIDTH - textX - 70;

  ctx.fillStyle = "#f5f0dc";
  ctx.font = "600 50px OgSans, sans-serif";
  const titleLines = wrapText(ctx, list.name || "", textMaxWidth).slice(0, 3);
  let cursorY = HEIGHT / 2 - 60;
  for (const line of titleLines) {
    ctx.fillText(line, textX, cursorY);
    cursorY += 60;
  }

  cursorY += 20;
  ctx.fillStyle = "#a8b25a";
  ctx.font = "600 32px OgSans, sans-serif";
  ctx.fillText(`Подборка · ${list.bookCount || 0} книг`, textX, cursorY);

  drawBrandFooter(ctx, textX);

  return canvas.toBuffer("image/png");
}

module.exports = { generateBookOgImage, generateProfileOgImage, generateListOgImage };
