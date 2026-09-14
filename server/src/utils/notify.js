const { Notification } = require("../../db/models");
const { sendPushToUser } = require("./webPush");

async function notify({ userId, actorId, type, data }) {
  if (userId === actorId) return;
  try {
    await Notification.create({ userId, actorId, type, data: data ? JSON.stringify(data) : null });
  } catch (error) {
    console.error("Не удалось создать уведомление:", error.message);
  }

  sendPushToUser(userId, type, { ...data, actorId });
}

module.exports = notify;
