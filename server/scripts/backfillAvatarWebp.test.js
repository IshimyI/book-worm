const fs = require("fs");
const path = require("path");
const { sequelize, User } = require("../db/models");
const { AVATAR_DIR } = require("../src/middlewares/uploadAvatar");
const backfillAvatarWebp = require("./backfillAvatarWebp");

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true, cascade: true });
  for (const file of fs.readdirSync(AVATAR_DIR)) {
    fs.unlinkSync(path.join(AVATAR_DIR, file));
  }
});

afterAll(async () => {
  await sequelize.close();
});

describe("backfillAvatarWebp", () => {
  it("converts a legacy non-webp avatar to webp and updates the user", async () => {
    const legacyFilename = "legacy-avatar.png";
    fs.writeFileSync(path.join(AVATAR_DIR, legacyFilename), ONE_PIXEL_PNG);
    const user = await User.create({
      name: "Legacy",
      email: "legacy-avatar@example.com",
      password: "hash",
      avatarUrl: `/uploads/avatars/${legacyFilename}`,
    });

    const result = await backfillAvatarWebp();
    expect(result.converted).toBe(1);

    await user.reload();
    expect(user.avatarUrl).toMatch(/\.webp$/);
    expect(fs.existsSync(path.join(AVATAR_DIR, path.basename(user.avatarUrl)))).toBe(true);
    expect(fs.existsSync(path.join(AVATAR_DIR, legacyFilename))).toBe(false);
  });

  it("skips users whose avatar is already webp", async () => {
    const webpFilename = "already.webp";
    fs.writeFileSync(path.join(AVATAR_DIR, webpFilename), ONE_PIXEL_PNG);
    await User.create({
      name: "AlreadyWebp",
      email: "already-webp@example.com",
      password: "hash",
      avatarUrl: `/uploads/avatars/${webpFilename}`,
    });

    const result = await backfillAvatarWebp();
    expect(result.converted).toBe(0);
    expect(fs.existsSync(path.join(AVATAR_DIR, webpFilename))).toBe(true);
  });

  it("skips a user whose avatar file is missing on disk without crashing", async () => {
    await User.create({
      name: "Missing",
      email: "missing-avatar@example.com",
      password: "hash",
      avatarUrl: "/uploads/avatars/does-not-exist.png",
    });

    const result = await backfillAvatarWebp();
    expect(result.converted).toBe(0);
    expect(result.skippedMissing).toBe(1);
  });

  it("ignores users with no avatar at all", async () => {
    await User.create({ name: "NoAvatar", email: "no-avatar@example.com", password: "hash" });

    const result = await backfillAvatarWebp();
    expect(result.converted).toBe(0);
    expect(result.skippedMissing).toBe(0);
  });
});
