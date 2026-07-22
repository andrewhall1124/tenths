"use client";

import { useEffect } from "react";

// When a new service worker takes control (a new deploy), reload once so the
// installed PWA shows fresh assets instead of stale cached UI. Guards against
// the first-install claim and reload loops. Also nudges the browser to check
// for an update whenever the app is reopened / refocused.
export function SwUpdater() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let hadController = !!navigator.serviceWorker.controller;
    let reloading = false;

    const onControllerChange = () => {
      if (!hadController) {
        // First SW to ever control this page — not an update, don't reload.
        hadController = true;
        return;
      }
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const checkForUpdate = () => {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update());
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}
