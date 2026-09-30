/* =========================================================
   GAMINGVERSE PUSH SERVICE WORKER
   Receives Firebase Cloud Messaging web-push messages and shows
   them as system notifications, even when no GamingVerse tab is
   open. Messages are data-only ({ title, body, link, tag }) and
   sent by /api/send-push, so this worker needs no Firebase SDK.
========================================================= */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { data: { body: event.data ? event.data.text() : "" } };
  }
  // FCM wraps our fields in `data`; tolerate a `notification` block too.
  const data = payload.data || {};
  const note = payload.notification || {};
  const title = data.title || note.title || "GamingVerse";
  const body = data.body || note.body || "You have a new notification.";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: data.tag || undefined,
      data: { link: data.link || "/games" },
    }),
  );
});

// Focus an open GamingVerse tab (or open one) on the notification's page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.link || "/games", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (new URL(win.url).origin === self.location.origin && "focus" in win) {
          win.navigate(target);
          return win.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
