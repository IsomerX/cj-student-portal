"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("✅ Service worker registered:", reg))
      .catch((err) => console.error("❌ Service worker registration failed:", err));
  }, []);

  return null;
}
