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
import { TaglineCard } from "@/components/cards/TaglineCard";
import { TerminalCard } from "@/components/cards/TerminalCard";
import { TextCard } from "@/components/cards/TextCard";
import { GitHubIcon } from "@/components/media/icons/GitHubIcon";
import { LinkedInIcon } from "@/components/media/icons/LinkedInIcon";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { BentoItem } from "@/components/ui/BentoItem";
import { Button } from "@/components/ui/Button";
import { DotDigits } from "@/components/ui/DotDigits";
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

        {/* 4.3 additions (About page): variants and new kit pieces. */}
        <BentoItem col={{ md: 3, lg: 4 }} row={{ lg: 2 }}>
          <ProfileCard {...fx.profile} variant="hero" hoverable meta="Indore · 12:00 IST" className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 2 }}>
          <StatCard label="Dots (hoverable)" value={26} display="dots" monoEyebrow hoverable className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 6, lg: 6 }} row={{ lg: 2 }}>
          <TaglineCard
            hoverable
            className="h-full"
            status="[Status line]"
            tagline="[One big sentence about you, with its calls to action under it.]"
            actions={
              <>
                <Button size="lg">[Primary]</Button>
                <Button size="lg" variant="secondary">[Secondary]</Button>
              </>
            }
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 2 }}>
          <div className="flex h-full flex-col justify-center gap-4 rounded-card border border-border-default p-6">
            <span className="text-caption-1 font-mono text-text-tertiary">DotDigits 0 / 7 / 12</span>
            <DotDigits value={0} countUp={false} />
            <DotDigits value={7} countUp={false} />
            <DotDigits value={12} />
          </div>
        </BentoItem>
        <BentoItem col={{ md: 6, lg: 6 }}>
          <TextCard
            eyebrow="Lead (scrubbed) + footnote"
            body="[Words fade from grey to full as this card scrolls through the view.]"
            tone="lead"
            monoEyebrow
            footnote="content/profile.ts · bio"
            hoverable
            className="h-full"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <PhotoCard caption="[Placeholder photo]" placeholderLabel="[Photo 1]" className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 3 }}>
          <ARCard {...fx.ar} state="off" compact={{ body: "[Compact phone row]" }} />
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
