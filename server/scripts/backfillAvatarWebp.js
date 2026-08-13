require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
const { sequelize, User } = require("../db/models");
const { AVATAR_DIR } = require("../src/middlewares/uploadAvatar");
const { processAvatar } = require("../src/utils/avatarImage");

// One-off migration for avatars uploaded before the WebP resize pipeline
// existed (see the "resize/re-encode uploaded avatars" change) — those
// files are still whatever format/size the user originally uploaded.
// Re-runs safely: only touches users whose avatarUrl doesn't already end
// in .webp.
async function backfillAvatarWebp() {
  const users = await User.findAll({
    where: { avatarUrl: { [Sequelize.Op.and]: [{ [Sequelize.Op.ne]: null }, { [Sequelize.Op.notLike]: "%.webp" }] } },
  });

  let converted = 0;
  let skippedMissing = 0;
  let failed = 0;

  for (const user of users) {
    const oldFilename = path.basename(user.avatarUrl);
    const oldPath = path.join(AVATAR_DIR, oldFilename);

    if (!fs.existsSync(oldPath)) {
      console.warn(`Skipping user ${user.id}: file not found at ${oldPath}`);
      skippedMissing += 1;
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const buffer = fs.readFileSync(oldPath);
      // eslint-disable-next-line no-await-in-loop
      const processed = await processAvatar(buffer);
      const newFilename = `${user.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      fs.writeFileSync(path.join(AVATAR_DIR, newFilename), processed);

      user.avatarUrl = `/uploads/avatars/${newFilename}`;
      // eslint-disable-next-line no-await-in-loop
      await user.save();
      fs.unlinkSync(oldPath);
      converted += 1;
    } catch (error) {
      console.error(`Failed to convert avatar for user ${user.id}:`, error.message);
      failed += 1;
    }
  }

  console.log(`Avatar backfill done: converted ${converted}, skipped ${skippedMissing} missing files, ${failed} failed.`);
  return { converted, skippedMissing, failed };
}

if (require.main === module) {
  backfillAvatarWebp()
    .catch((error) => {
      console.error("Avatar backfill failed:", error);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = backfillAvatarWebp;
