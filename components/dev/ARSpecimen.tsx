"use client";

import { useEffect, useState } from "react";
import { CameraPreview } from "@/components/ar/CameraPreview";
import { HandSkeleton } from "@/components/ar/HandSkeleton";
import { Button } from "@/components/ui/Button";
import { rememberAllowed } from "@/features/ar/camera";
import { LANDMARK_COUNT, landmarks } from "@/features/ar/landmarks";
import { gsap } from "@/lib/motion/gsap";
import { useStore } from "@/lib/store";
import { DevState } from "./DevState";

/** A camera stand-in: a canvas stream with a moving bar, so the preview can be checked anywhere. */
function testPattern(): { stream: MediaStream; stop: () => void } {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext("2d")!;
  const draw = (time: number) => {
    ctx.fillStyle = "#121716";
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = "#2ec0a0";
    ctx.fillRect(((time * 80) % 360) - 40, 0, 40, 240);
    ctx.fillStyle = "#f4f7f6";
    ctx.font = "24px sans-serif";
    ctx.fillText("TEST", 16, 40);
  };
  gsap.ticker.add(draw);
  const stream = canvas.captureStream(30);
  return {
    stream,
    stop: () => {
      gsap.ticker.remove(draw);
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

/** An open palm in camera space (0–1, not mirrored), to see the landmark drawing. */
function fakePalm(on: boolean) {
  const palm = [
    [0.5, 0.9],
    [0.6, 0.84],
    [0.68, 0.76],
    [0.76, 0.7],
    [0.83, 0.64],
    [0.6, 0.6],
    [0.62, 0.46],
    [0.64, 0.36],
    [0.65, 0.26],
    [0.52, 0.58],
    [0.52, 0.42],
    [0.52, 0.31],
    [0.52, 0.2],
    [0.44, 0.6],
    [0.42, 0.45],
    [0.41, 0.35],
    [0.4, 0.26],
    [0.37, 0.64],
    [0.33, 0.53],
    [0.31, 0.45],
    [0.29, 0.37],
  ];
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    landmarks.points[i * 2] = palm[i]![0]!;
    landmarks.points[i * 2 + 1] = palm[i]![1]!;
  }
  landmarks.visible = on;
  landmarks.version++;
}

/**
 * Hand mode, 8.1: the explainer (through the store, as the switch opens it), the three gesture
 * drawings, and the camera preview fed by a test pattern instead of the webcam (drag it to a
 * corner; "Palm" draws fake landmarks over it). The real flow: the Hand switch or A.
 */
export function ARSpecimen() {
  const status = useStore((s) => s.ar.status);
  const enabled = useStore((s) => s.ar.enabled);
  const camera = useStore((s) => s.ar.camera);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [palm, setPalm] = useState(false);

  useEffect(() => () => fakePalm(false), []);

  const togglePreview = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      return;
    }
    const pattern = testPattern();
    pattern.stream.getTracks()[0]?.addEventListener("ended", pattern.stop);
    setStream(pattern.stream);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => useStore.getState().ar.setExplainerOpen(true)}
        >
          Open the explainer
        </Button>
        <Button variant="secondary" onClick={() => rememberAllowed(false)}>
          Forget “allowed”
        </Button>
        <Button variant="secondary" onClick={togglePreview}>
          {stream ? "Hide test preview" : "Test-pattern preview"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            fakePalm(!palm);
            setPalm(!palm);
          }}
        >
          {palm ? "Clear landmarks" : "Palm landmarks"}
        </Button>
        <span className="text-footnote font-mono text-text-secondary">
          ar.enabled {String(enabled)} · status {status} · camera {camera}
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        {(["point", "pinch", "palm"] as const).map((pose) => (
          <DevState key={pose} label={pose}>
            <span className="flex size-28 items-center justify-center rounded-control border border-island-border bg-island-bg p-2">
              <HandSkeleton pose={pose} />
            </span>
          </DevState>
        ))}
      </div>
      {stream ? <CameraPreview stream={stream} /> : null}
    </div>
  );
}
