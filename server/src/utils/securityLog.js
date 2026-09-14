const { SecurityEvent } = require("../../db/models");

async function logSecurityEvent({ type, email, ip, detail }) {
  try {
    await SecurityEvent.create({ type, email, ip, detail });
  } catch (error) {
    console.error("Не удалось записать security event:", error.message);
  }
}

module.exports = logSecurityEvent;
