const webpush = require("web-push");
const { PushSubscription } = require("../../db/models");

const isConfigured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (isConfigured) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

// Mirrors the notification copy in the client's NotificationBell.describe()
// — the push payload has to carry its own text since the service worker
// renders it directly, it can't call back into the running app for that.
function describeForPush(type, data) {
  if (type === "new_follower") return { title: "Новый подписчик", body: `${data.name || "Кто-то"} подписался на вас` };
  if (type === "review_comment")
    return { title: "Новый комментарий", body: `${data.name || "Кто-то"} прокомментировал(а) вашу рецензию на «${data.bookTitle || "книгу"}»` };
  if (type === "comment_reply")
    return { title: "Новый ответ", body: `${data.name || "Кто-то"} ответил(а) на ваш комментарий к «${data.bookTitle || "книге"}»` };
  return { title: "Mr Book Worm", body: "У вас новое уведомление" };
}

function linkForPush(type, data) {
  if (type === "new_follower" && data.actorId) return `/users/${data.actorId}`;
  if ((type === "review_comment" || type === "comment_reply") && data.bookId) return `/books/${data.bookId}`;
  return "/";
}

// Fire-and-forget, same treatment as in-app notify() — a push failure
// should never break the action that triggered it. A 404/410 from the push
// service means the subscription is dead (browser uninstalled, permission
// revoked, etc.) and gets cleaned up instead of retried forever.
async function sendPushToUser(userId, type, data = {}) {
  if (!isConfigured) return;
  try {
    const subscriptions = await PushSubscription.findAll({ where: { userId } });
    if (subscriptions.length === 0) return;

    const { title, body } = describeForPush(type, data);
    const payload = JSON.stringify({ title, body, url: linkForPush(type, data) });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            await sub.destroy();
          } else {
            console.error("Web push failed:", error.message);
          }
        }
      })
    );
  } catch (error) {
    console.error("sendPushToUser failed:", error.message);
  }
}

module.exports = { sendPushToUser, isConfigured };
