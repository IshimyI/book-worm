const { SecurityEvent } = require("../../db/models");

// Fire-and-forget: a logging failure should never break the request it's
// logging. Errors are swallowed (and reported to Sentry if configured via
// its own instrumentation) rather than surfaced to the caller.
async function logSecurityEvent({ type, email, ip, detail }) {
  try {
    await SecurityEvent.create({ type, email, ip, detail });
  } catch (error) {
    console.error("Не удалось записать security event:", error.message);
  }
}

module.exports = logSecurityEvent;
