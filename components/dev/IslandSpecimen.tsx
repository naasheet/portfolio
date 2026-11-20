"use client";

import { Hand, ListMusic, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { EqBars } from "@/components/nav/EqBars";
import { island } from "@/lib/island";
import { toast } from "@/lib/toast";
import { useStore } from "@/lib/store";

/** Dev only: fake album art (no real cover until 5.x). */
function FakeArt({ size = "size-7" }: { size?: string }) {
  return (
    <span
      aria-hidden
      className={`${size} shrink-0 rounded-[8px] bg-linear-to-br from-accent-secondary to-status-danger`}
    />
  );
}

/** Dev only: the expanded player shape (Island board), with non-working controls. */
function FakePlayer() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <FakeArt size="size-14" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-headline">[Track title]</span>
          <span className="text-footnote text-island-text-secondary">
            [Artist] · track 3 of 8
          </span>
        </div>
        <EqBars className="text-island-accent" />
      </div>
      <div className="flex items-center gap-2 text-caption-2 font-mono text-island-text-secondary">
        1:12
        <span className="relative h-1 flex-1 overflow-hidden rounded-chip bg-island-text/15">
          <span className="absolute inset-y-0 left-0 w-2/5 rounded-chip bg-island-accent" />
        </span>
        3:08
      </div>
      <div className="relative flex items-center justify-center gap-4 text-island-text [&_svg]:size-5">
        <SkipBack aria-hidden />
        <span className="flex size-11 items-center justify-center rounded-chip bg-island-text text-island-bg">
          <Pause aria-hidden />
        </span>
        <SkipForward aria-hidden />
        <ListMusic aria-hidden className="absolute right-4" />
      </div>
    </div>
  );
}

function pushMusic() {
  useStore.getState().audio.setPlaying(true);
  island.push({
    id: "dev-music",
    kind: "music",
    label: "Open the player (dev)",
    lead: <FakeArt />,
    trail: <EqBars className="text-island-accent" />,
    expanded: <FakePlayer />,
  });
}

function pushAr() {
  island.push({
    id: "dev-ar",
    kind: "ar",
    label: "AR tracking (dev)",
    lead: (
      <span className="relative flex text-island-text [&_svg]:size-4">
        <Hand aria-hidden />
        <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-chip bg-island-accent" />
      </span>
    ),
  });
}

function stopAll() {
  useStore.getState().audio.setPlaying(false);
  island.remove("dev-music");
  island.remove("dev-ar");
}

/**
 * The island's states (2.4), on the real island in the nav: alerts, a fake music activity
 * (live → expanded → split with a fake AR activity), and the nav row's buttons.
 */
export function IslandSpecimen() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" onClick={() => toast("Email copied")}>
          Success alert (toast)
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast("Link copied", { kind: "info" })}
        >
          Info alert (toast)
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            island.alert({
              icon: "star",
              tone: "amber",
              text: "New best in Stack",
              detail: "31 blocks",
            })
          }
        >
          Amber alert
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast("Couldn't reach the server", {
              kind: "error",
              action: { label: "Retry", onClick: () => toast("Sent") },
            })
          }
        >
          Error + Retry (corner toast)
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" onClick={pushMusic}>
          Fake music: live
        </Button>
        <Button variant="secondary" onClick={() => island.expand("dev-music")}>
          Expand the player
        </Button>
        <Button variant="secondary" onClick={pushAr}>
          Add AR (split)
        </Button>
        <Button variant="ghost" onClick={stopAll}>
          Stop all
        </Button>
        <IconButton
          aria-label="Shortcuts (dev)"
          label="?"
          icon={null}
          onClick={() => useStore.getState().ui.setShortcutsOpen(true)}
        />
      </div>
    </div>
  );
}
