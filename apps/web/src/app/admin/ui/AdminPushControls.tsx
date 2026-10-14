"use client";

import { Bell, Download, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { publicApiUrl } from "../../apiConfig";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function AdminPushControls() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    void fetch(`${publicApiUrl}/push/config`, { cache: "no-store" })
      .then((response) => response.json())
      .then((config) => setPushEnabled(Boolean(config.enabled)))
      .catch(() => setPushEnabled(false));

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function installPwa() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  async function enableNotifications() {
    if (!pushEnabled) {
      setMessage("Server chưa cấu hình khóa thông báo PUSH.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Trình duyệt này chưa hỗ trợ thông báo PUSH.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("Bạn chưa cho phép gửi thông báo.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" });
      const config = await fetch(`${publicApiUrl}/push/config`, { cache: "no-store" }).then((response) => response.json());
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey)
      });
      const response = await fetch(`${publicApiUrl}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON())
      });
      if (!response.ok) throw new Error("subscribe_failed");
      setSubscribed(true);
      setMessage("Đã bật thông báo đơn hàng trên thiết bị này.");
    } catch {
      setMessage("Chưa bật được thông báo. Hãy kiểm tra HTTPS và cấu hình PUSH.");
    }
  }

  return (
    <div className="admin-push-controls">
      {installPrompt ? (
        <button className="admin-install-button" type="button" onClick={installPwa}>
          <Download size={16} /> Cài PWA
        </button>
      ) : null}
      <button className="admin-notification-button" type="button" onClick={enableNotifications}>
        {subscribed ? <CheckCircle2 size={16} /> : <Bell size={16} />}
        {subscribed ? "Đã bật thông báo" : "Bật thông báo đơn hàng"}
      </button>
      {message ? <span role="status">{message}</span> : null}
    </div>
  );
}
