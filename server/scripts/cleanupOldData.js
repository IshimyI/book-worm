require("dotenv").config();
const { Sequelize } = require("sequelize");
const { sequelize, SecurityEvent, User } = require("../db/models");

const SECURITY_EVENT_RETENTION_DAYS = 90;

async function cleanupOldData() {
  const cutoff = new Date(Date.now() - SECURITY_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const deletedEvents = await SecurityEvent.destroy({
    where: { createdAt: { [Sequelize.Op.lt]: cutoff } },
  });

  const clearedResetTokens = await User.update(
    { resetPasswordToken: null, resetPasswordExpires: null },
    {
      where: {
        resetPasswordToken: { [Sequelize.Op.ne]: null },
        resetPasswordExpires: { [Sequelize.Op.lt]: new Date() },
      },
    }
  );

  console.log(
    `Cleanup done: removed ${deletedEvents} security events older than ${SECURITY_EVENT_RETENTION_DAYS} days, cleared ${clearedResetTokens[0]} expired password reset tokens.`
  );
}

if (require.main === module) {
  cleanupOldData()
    .catch((error) => {
      console.error("Cleanup failed:", error);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = cleanupOldData;
