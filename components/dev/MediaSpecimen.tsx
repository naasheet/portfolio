"use client";

import { Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/media/Avatar";
import { ICON_SIZE, type IconSize } from "@/components/media/iconSize";
import { Img } from "@/components/media/Img";
import { LoopVideo } from "@/components/media/LoopVideo";
import sampleSquare from "./media/sample-square.jpg";
import sampleWide from "./media/sample-wide.jpg";

/*
 * Dev placeholders only, not real media: sample-*.jpg were generated locally and
 * public/dev/loop.webm (+ poster) was recorded from a canvas.
 */
const VIDEO = {
  sources: [{ src: "/dev/loop.webm", type: "video/webm" }],
  poster: "/dev/loop-poster.jpg",
  width: 640,
  height: 360,
};

function Caption({ children }: { children: string }) {
  return <span className="text-caption-1 text-text-tertiary">{children}</span>;
}

/** Which dev videos are playing, from their play / pause events (no polling). */
function PlaybackReadout() {
  const [state, setState] = useState<string[]>([]);
  useEffect(() => {
    const videos = [
      ...document.querySelectorAll<HTMLVideoElement>("#media video"),
    ];
    const update = () =>
      setState(
        videos.map(
          (v, i) => `video ${i + 1}: ${v.paused ? "paused" : "playing"}`,
        ),
      );
    update();
    for (const v of videos) {
      v.addEventListener("play", update);
      v.addEventListener("pause", update);
    }
    return () => {
      for (const v of videos) {
        v.removeEventListener("play", update);
        v.removeEventListener("pause", update);
      }
    };
  }, []);
  return (
    <p
      aria-live="polite"
      className="text-footnote font-mono text-text-secondary"
    >
      {state.join(" · ") || "—"}
    </p>
  );
}

/** Img, LoopVideo, Avatar and the icon sizes, with placeholder media. */
export function MediaSpecimen() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-3">
        <figure className="flex flex-col gap-2">
          <Img
            src={sampleWide}
            alt="Placeholder: teal to amber gradient"
            width={1600}
            height={900}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="rounded-card"
          />
          <Caption>Static import: blur from Next, fades in over 300 ms</Caption>
        </figure>
        <figure className="flex flex-col gap-2">
          <Img
            src={sampleSquare}
            alt="Placeholder: amber to teal gradient"
            width={512}
            height={512}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="rounded-card"
          />
          <Caption>Square, same treatment</Caption>
        </figure>
        <figure className="flex flex-col gap-2">
          <Img
            src="/dev/loop-poster.jpg"
            alt="Placeholder: video poster"
            width={640}
            height={360}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="rounded-card"
          />
          <Caption>
            URL string, no blurDataURL: surface colour while loading
          </Caption>
        </figure>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <Avatar initials="NK" name="[Your name]" size="sm" />
        <Avatar initials="NK" name="[Your name]" size="md" />
        <Avatar initials="NK" name="[Your name]" size="lg" />
        <Avatar
          initials="NK"
          name="[Your name]"
          photo={{ src: sampleSquare }}
          size="sm"
        />
        <Avatar
          initials="NK"
          name="[Your name]"
          photo={{ src: sampleSquare }}
          size="md"
        />
        <Avatar
          initials="NK"
          name="[Your name]"
          photo={{ src: sampleSquare }}
          size="lg"
        />
        <Caption>Avatar sm / md / lg: initials, then photo</Caption>
      </div>

      <div className="flex flex-wrap items-end gap-6 text-text-secondary">
        {(Object.keys(ICON_SIZE) as IconSize[]).map((k) => (
          <span key={k} className="flex flex-col items-center gap-2">
            <ImageIcon size={ICON_SIZE[k]} aria-hidden />
            <Caption>{`${k} · ${ICON_SIZE[k]}px`}</Caption>
          </span>
        ))}
      </div>

      <PlaybackReadout />

      <figure className="flex max-w-xl flex-col gap-2">
        <LoopVideo {...VIDEO} className="rounded-card" />
        <Caption>
          Video 1: plays while at least 25% is on screen and the tab is visible
        </Caption>
      </figure>

      {/* Pushes video 2 well below the fold, so one video is always off screen. */}
      <div
        aria-hidden
        className="flex h-[120vh] items-center justify-center rounded-card border border-dashed border-border-default"
      >
        <Caption>Spacer: scroll on to bring video 2 into view</Caption>
      </div>

      <figure className="flex max-w-xl flex-col gap-2">
        <LoopVideo {...VIDEO} className="rounded-card" />
        <Caption>Video 2: paused until scrolled into view</Caption>
      </figure>
    </div>
  );
}
