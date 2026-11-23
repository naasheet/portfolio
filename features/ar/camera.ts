/*
 * The webcam (8.1): open it, stop it, and find out whether there is one. No React and no store
 * writes here: components/ar/ARLayer.tsx drives ar.status from these, and the nav's switch reads
 * detectCamera(). Video stays in the page (CLAUDE.md §9.6): nothing is uploaded, ever.
 */
import { storage } from "@/lib/browser";

/** The constraints from the build plan: the front camera, 640 × 480 at 30 fps. */
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: "user",
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 30 },
  },
  audio: false,
};

/**
 * Saved once the visitor allows the camera: Hand then skips the explainer (Nasheet, 8.1). Keep in
 * step with AR_ALLOWED_KEY in lib/shortcuts.ts (which doesn't import this module).
 */
const ALLOWED_KEY = "ar-allowed";

export const cameraAllowed = () => storage.get(ALLOWED_KEY) === "1";
export const rememberAllowed = (allowed: boolean) =>
  allowed ? storage.set(ALLOWED_KEY, "1") : storage.remove(ALLOWED_KEY);

/** Ask for the camera. Rejects like getUserMedia does; classify() the error. */
export function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia)
    return Promise.reject(
      new DOMException("No camera API", "NotSupportedError"),
    );
  return navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
}

/** Stop every track, so the camera light goes off. */
export function stopCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * Why the camera didn't start: "denied" (the visitor or the browser said no) or "error" (no
 * camera, busy in another app, unsupported).
 */
export function classify(error: unknown): "denied" | "error" {
  const name = error instanceof DOMException ? error.name : "";
  return name === "NotAllowedError" || name === "SecurityError"
    ? "denied"
    : "error";
}

/**
 * Whether there's a camera at all: one enumerateDevices call (it lists kinds without asking for
 * permission; labels stay empty until then). "unknown" when the API is missing.
 */
export async function detectCamera(): Promise<"yes" | "none" | "unknown"> {
  const devices = navigator.mediaDevices;
  if (!devices?.enumerateDevices) return "unknown";
  try {
    const list = await devices.enumerateDevices();
    return list.some((d) => d.kind === "videoinput") ? "yes" : "none";
  } catch {
    return "unknown";
  }
}

/** A webcam plugged in or out; returns the unsubscribe. */
export function onDeviceChange(listener: () => void): () => void {
  const devices = navigator.mediaDevices;
  if (!devices?.addEventListener) return () => {};
  devices.addEventListener("devicechange", listener);
  return () => devices.removeEventListener("devicechange", listener);
}
