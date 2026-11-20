"use client";

import { useState } from "react";
import { ARCard, type ARState } from "@/components/cards/ARCard";
import { CTACard } from "@/components/cards/CTACard";
import { NowPlayingCard } from "@/components/cards/NowPlayingCard";
import { PhotoCard } from "@/components/cards/PhotoCard";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { SkillsCard } from "@/components/cards/SkillsCard";
import { SocialCard } from "@/components/cards/SocialCard";
import { StatCard } from "@/components/cards/StatCard";
import { TerminalCard } from "@/components/cards/TerminalCard";
import { TextCard } from "@/components/cards/TextCard";
import { GitHubIcon } from "@/components/media/icons/GitHubIcon";
import { LinkedInIcon } from "@/components/media/icons/LinkedInIcon";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { BentoItem } from "@/components/ui/BentoItem";
import * as fx from "./fixtures";

/** Every card from the kit in one bento, fed by the placeholder fixtures. */
export function CardKitSpecimen() {
  const [arState, setArState] = useState<ARState>("off");
  const [log, setLog] = useState("—");
  const [playing, setPlaying] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-footnote text-text-secondary" aria-live="polite">
        Last action: <span className="font-mono text-text-primary">{log}</span>
      </p>
      <BentoGrid>
        <BentoItem col={{ md: 4, lg: 4 }}>
          <ProfileCard {...fx.profile} className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 2, lg: 2 }}>
          <StatCard {...fx.stat} className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 6, lg: 6 }}>
          <SkillsCard {...fx.skills} className="h-full" />
        </BentoItem>

        <BentoItem col={{ md: 3, lg: 3 }}>
          <PhotoCard {...fx.photo} className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <SocialCard
            {...fx.socials.github}
            newTabLabel={fx.socials.newTabLabel}
            icon={<GitHubIcon />}
            className="h-full"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <SocialCard
            {...fx.socials.linkedin}
            newTabLabel={fx.socials.newTabLabel}
            icon={<LinkedInIcon />}
            className="h-full"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <TextCard {...fx.text} className="h-full" />
        </BentoItem>

        <BentoItem col={{ md: 3, lg: 3 }}>
          <NowPlayingCard
            {...fx.nowPlaying}
            playing={playing}
            className="h-full"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <CTACard
            {...fx.cta}
            onClick={() => {
              setLog("CTACard onClick");
              setPlaying((p) => !p);
            }}
            className="h-full"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <CTACard {...fx.cta} href="#card-kit" className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <TerminalCard
            {...fx.terminal}
            onOpen={() => setLog("TerminalCard onOpen")}
            className="h-full"
          />
        </BentoItem>

        <BentoItem col={{ md: 3, lg: 3 }}>
          <ARCard
            {...fx.ar}
            state={arState}
            onToggle={() => {
              setArState((s) => (s === "off" ? "on" : "off"));
              setLog("ARCard onToggle");
            }}
            eyebrow="Live: toggles off ↔ on"
            className="h-full"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <ARCard {...fx.ar} state="off" className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <ARCard {...fx.ar} state="on" className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <ARCard {...fx.ar} state="blocked" className="h-full" />
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
