self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "Bạn có thông báo mới." };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "May Flowers", {
      body: data.body || "Bạn có thông báo mới.",
      icon: "/img/logo.png",
      badge: "/img/logo.png",
      tag: data.orderCode || "may-flowers-admin",
      data: { url: data.url || "/admin" },
      vibrate: [160, 80, 160]
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
