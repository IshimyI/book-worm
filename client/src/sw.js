import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// A live catalog, not offline-first content — API responses must always
// hit the network, never be served stale from cache.
registerRoute(({ url }) => url.pathname.startsWith("/api/"), new NetworkOnly());

// A given cover URL is permanently the same image, so it's safe (and
// worth it — these are the bulk of the page weight) to cache aggressively.
registerRoute(
  ({ url }) => url.hostname === "covers.openlibrary.org" || url.hostname.endsWith("archive.org"),
  new CacheFirst({
    cacheName: "book-covers",
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Mr Book Worm";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    // eslint-disable-next-line no-undef
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // eslint-disable-next-line no-undef
      return clients.openWindow(url);
    })
  );
});

self.skipWaiting();
