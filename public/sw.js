import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));

self.addEventListener("push", (event) => {
  let data = { title: "Reminder", body: "" };
  try {
    if (event.data) data = event.data.json();
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "Reminder", {
      body: data.body || "",
      icon: "/vite.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length) clientList[0].focus();
      else if (self.clients.openWindow) self.clients.openWindow("/");
    })
  );
});
