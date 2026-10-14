"use client";

import { useEffect } from "react";

export default function DisableServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations
        .filter((registration) => registration.active?.scriptURL.includes("firebase-messaging-sw.js"))
        .forEach((registration) => registration.unregister());
    });
  }, []);

  return null;
}
