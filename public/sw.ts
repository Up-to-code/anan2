/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { createHandlerBoundToURL } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));

self.addEventListener("push", (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string } = { title: "Reminder", body: "" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // ignore
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Reminder", {
      body: data.body || "",
      icon: "/vite.svg",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification as Notification & { data?: { url?: string } }).data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length) {
        clientList[0].focus();
        clientList[0].navigate?.(url);
      } else if (self.clients.openWindow) {
        self.clients.openWindow(url);
      }
    })
  );
});
