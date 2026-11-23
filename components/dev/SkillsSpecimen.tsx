"use client";

import { LegendCard } from "@/components/cards/LegendCard";
import { LinkListCard } from "@/components/cards/LinkListCard";
import { ProgressCard } from "@/components/cards/ProgressCard";
import { SkillsCard } from "@/components/cards/SkillsCard";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { BentoItem } from "@/components/ui/BentoItem";
import { LevelDots } from "@/components/ui/LevelDots";
import { DevState } from "./DevState";

// Dev-only sample values (the page itself reads content/skills.ts).
const areas = [
  {
    name: "[Frontend]",
    summary: "[What I reach for first.]",
    skills: [
      { name: "[Skill A]", level: 5, years: 4 },
      { name: "[Skill B]", level: 4, years: 2 },
      { name: "[Skill C]", level: 3, years: 1 },
      { name: "[Skill D]" },
    ],
  },
  {
    name: "[3D & motion]",
    summary: "[Where the fun is.]",
    skills: [
      { name: "[Skill E]", level: 2 },
      { name: "[Skill F]", level: 1 },
    ],
  },
];

const levelLabel = (l: number | undefined) =>
  l === undefined ? "Not rated yet" : `${l} of 5`;

/** The Skills page's cards (4.6) with dev values, and LevelDots states. */
export function SkillsSpecimen() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-8">
        {[undefined, 1, 3, 5].map((l) => (
          <DevState key={String(l)} label={`LevelDots · ${levelLabel(l)}`}>
            <LevelDots level={l} label={levelLabel(l)} />
          </DevState>
        ))}
      </div>
      <BentoGrid>
        <BentoItem col={{ md: 6, lg: 8 }} row={{ lg: 2 }}>
          <SkillsCard
            variant="rated"
            className="h-full"
            areas={areas}
            labels={{
              region: "Skills by area",
              prev: "Previous area",
              next: "Next area",
              hint: "or swipe",
              swipeHint: "Swipe for the next area",
              level: levelLabel,
              years: (n) => `${n} yrs`,
              areas: "Areas",
            }}
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 4 }}>
          <ProgressCard
            hoverable
            className="h-full"
            eyebrow="Learning now"
            items={[
              { name: "[62%]", progress: 62 },
              { name: "[35%]", progress: 35 },
              { name: "[No number yet]" },
            ]}
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 4 }}>
          <LegendCard
            hoverable
            className="h-full"
            eyebrow="How to read the dots"
            rows={[
              { label: "I could teach it", level: 5 },
              { label: "Just started", level: 1 },
            ]}
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 4 }}>
          <LinkListCard
            hoverable
            className="h-full"
            eyebrow="Where I used it"
            title="[Skill pairing]"
            items={[
              { label: "[Case study]", href: "/work/eco-waste-analyzer" },
              { label: "[External]", href: "https://example.com" },
              { label: "[Plain text]" },
            ]}
            newTabLabel="opens in a new tab"
          />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 4 }}>
          <LinkListCard
            hoverable
            className="h-full"
            eyebrow="Compact (phones)"
            title="[Skill pairing]"
            compact
            items={[
              { label: "[Case study]", href: "/work/eco-waste-analyzer" },
              { label: "[Plain text]" },
            ]}
          />
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
