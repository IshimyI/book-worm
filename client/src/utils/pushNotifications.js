import axiosInstance from '../axiosInstance';

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// applicationServerKey needs to be a Uint8Array, but VAPID public keys are
// handed out as URL-safe base64 — the Push API gives no other way in.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Этот браузер не поддерживает push-уведомления');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Разрешение на уведомления не получено');
  }

  const { data } = await axiosInstance.get('/push/vapid-public-key');
  if (!data.publicKey) {
    throw new Error('Push-уведомления сейчас недоступны на сервере');
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.publicKey),
  });

  const json = subscription.toJSON();
  await axiosInstance.post('/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
  return subscription;
}

export async function unsubscribeFromPush() {
  const subscription = await getExistingSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await axiosInstance.post('/push/unsubscribe', { endpoint });
}
