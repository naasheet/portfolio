"use client";

import { useEffect } from "react";
import { detectCamera, onDeviceChange } from "@/features/ar/camera";
import { useStore } from "@/lib/store";

/** Started once per page load, however many switches mount (the nav and the phone menu). */
let started = false;

/**
 * Find out whether there's a camera (8.1) and keep ar.camera current: once on first use, then on
 * every devicechange (a webcam plugged in or out). The listener lives for the page's lifetime,
 * like the nav that starts it.
 */
export function useCameraDetection(): void {
  useEffect(() => {
    if (started) return;
    started = true;
    const check = () =>
      void detectCamera().then((found) =>
        useStore.getState().ar.setCamera(found),
      );
    check();
    onDeviceChange(check);
  }, []);
}
