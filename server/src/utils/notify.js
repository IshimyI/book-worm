const { Notification } = require("../../db/models");
const { sendPushToUser } = require("./webPush");

// Fire-and-forget, same treatment as security-event logging — a failed
// notification write should never break the action that triggered it.
async function notify({ userId, actorId, type, data }) {
  if (userId === actorId) return; // never notify someone about their own action
  try {
    await Notification.create({ userId, actorId, type, data: data ? JSON.stringify(data) : null });
  } catch (error) {
    console.error("Не удалось создать уведомление:", error.message);
  }
  // Doesn't need to block the response — a push send can take a moment and
  // the in-app notification (already written above) is what the UI reads.
  sendPushToUser(userId, type, { ...data, actorId });
}

module.exports = notify;
