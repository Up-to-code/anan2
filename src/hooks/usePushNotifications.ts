import { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const saveSubscription = useMutation(api.pushSubscriptions.save);

  useEffect(() => {
    setIsSupported(
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    );
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("VITE_VAPID_PUBLIC_KEY not set");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      await saveSubscription({ subscription: sub.toJSON() });
      setIsSubscribed(true);
    } catch (e) {
      console.error("Push subscribe failed:", e);
    }
  }, [isSupported, saveSubscription]);

  return { isSupported, isSubscribed, subscribe };
}
