"use client";

import { useEffect, useState } from "react";
import { copy } from "@/content/copy";
import {
  classify,
  openCamera,
  rememberAllowed,
  stopCamera,
} from "@/features/ar/camera";
import { startGestures } from "@/features/ar/gestures";
import { startTracker } from "@/features/ar/tracker";
import { arCopy } from "@/content/ar";
import { island } from "@/lib/island";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { ARCoach, coachSeen } from "./ARCoach";
import { CameraPreview } from "./CameraPreview";
import { IslandAR } from "./IslandAR";

/** Camera refused or lost: the AR board's "Camera's shy?" island alert, then back to Mouse. */
function cameraAlert(kind: "denied" | "lost" | "error") {
  const a = copy.alerts;
  const [text, detail] =
    kind === "denied"
      ? [a.cameraDenied, a.cameraDeniedDetail]
      : kind === "lost"
        ? [a.cameraLost, a.cameraLostDetail]
        : [a.cameraError, a.cameraErrorDetail];
  island.alert({ icon: "hand", tone: "danger", text, detail, long: true });
}

/**
 * Hand mode's camera (8.1), mounted in the persistent layer the first time Hand turns on
 * (ARLayerSlot). It follows ar.enabled:
 *
 *   on     ar.status "loading", getUserMedia (the browser asks the first time). Live → "ready",
 *          the "Hand mode" alert, the preview; the permission is remembered, so next time Hand
 *          skips the explainer. Refused → "denied"; anything else → "error"; both raise an
 *          alert, forget the permission (denied only) and switch back to Mouse.
 *   off    every track stops (the camera light goes off), the preview goes, status "off" (a
 *          "denied" / "error" from the attempt stays, for the About card later).
 *   lost   a track's `ended` (permission revoked mid-session, the webcam unplugged): the
 *          "lost" alert, every track stops, back to Mouse.
 *
 * Detection (8.2): once the camera is live, features/ar/tracker.ts runs the hand model in a
 * worker on the same stream and fills `landmarks`; it stops with the camera. If it fails, an
 * error toast, ar.status "error", and back to Mouse (the camera light goes off). Once the model
 * is ready, features/ar/gestures.ts (8.3) turns the landmarks into the hand cursor and gestures.
 * 8.4: while the camera is on, IslandAR puts Hand mode in the island; the first time the tracker
 * is ready, ARCoach runs its three steps (once, `ar-coach`). The legend sits in the preview.
 */
export default function ARLayer() {
  const enabled = useStore((s) => s.ar.enabled);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const ar = useStore.getState().ar;
    let cancelled = false;
    let live: MediaStream | null = null;

    const onEnded = () => {
      if (cancelled) return;
      cameraAlert("lost");
      useStore.getState().ar.setStatus("error");
      useStore.getState().ar.setEnabled(false);
    };

    ar.setStatus("loading");
    openCamera().then(
      (s) => {
        // Hand was switched off while the browser was asking: let the camera go at once.
        if (cancelled) {
          stopCamera(s);
          return;
        }
        live = s;
        for (const track of s.getVideoTracks())
          track.addEventListener("ended", onEnded);
        rememberAllowed(true);
        setStream(s);
        useStore.getState().ar.setStatus("ready");
        island.alert({
          icon: "hand",
          tone: "neutral",
          text: copy.alerts.handMode,
          detail: copy.alerts.switchBack("A"),
        });
      },
      (error: unknown) => {
        if (cancelled) return;
        const kind = classify(error);
        if (kind === "denied") rememberAllowed(false);
        cameraAlert(kind);
        useStore.getState().ar.setStatus(kind);
        useStore.getState().ar.setEnabled(false);
      },
    );

    return () => {
      cancelled = true;
      if (live) {
        for (const track of live.getVideoTracks())
          track.removeEventListener("ended", onEnded);
        stopCamera(live);
      }
      setStream(null);
      const status = useStore.getState().ar.status;
      if (status === "loading" || status === "ready")
        useStore.getState().ar.setStatus("off");
    };
  }, [enabled]);

  // 8.4: the coach, the first time the tracker is ready (and while it hasn't been seen).
  const [coach, setCoach] = useState(false);

  useEffect(() => {
    if (!stream) return;
    // 8.3: the cursor and gestures start once the model answers, and stop with the tracker.
    let stopGestures: (() => void) | null = null;
    const stopTracker = startTracker(stream, {
      onReady: () => {
        stopGestures ??= startGestures();
        if (!coachSeen()) setCoach(true);
      },
      onError: (message) => {
        stopGestures?.();
        stopGestures = null;
        console.error("[hand tracker]", message);
        toast(arCopy.tracker.error, { kind: "error" });
        useStore.getState().ar.setStatus("error");
        useStore.getState().ar.setEnabled(false);
      },
    });
    return () => {
      stopGestures?.();
      stopTracker();
      setCoach(false);
    };
  }, [stream]);

  if (!stream) return null;
  return (
    <>
      <CameraPreview stream={stream} />
      <IslandAR />
      {coach ? <ARCoach onClose={() => setCoach(false)} /> : null}
    </>
  );
}
