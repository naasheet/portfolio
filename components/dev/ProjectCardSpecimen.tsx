"use client";

import { ProjectCard, type ProjectCardLabels } from "@/components/cards/ProjectCard";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { BentoItem } from "@/components/ui/BentoItem";
import { DevState } from "./DevState";
import { forced, forcedCardHover } from "./devStates";

const labels: ProjectCardLabels = {
  caseStudy: "Case study",
  preview: "Preview",
  playingInView: "Playing in view",
};

const base = {
  href: "/work/project-1",
  title: "[Project title]",
  role: "[Design + build]",
  year: 2026,
  stack: ["Next.js", "Three.js", "GLSL", "Supabase", "Hidden fifth"],
  cover: { src: "/projects/placeholder-cover.svg", alt: "" },
  labels,
};

/**
 * ProjectCard (4.4): featured + regular in Work's spans, and each state. The preview card uses
 * the dev loop: hover it (mouse) or scroll it into view (touch) to play; the pill shows the
 * clip's length once its metadata has loaded. Links point at /work/project-1 (4.5 builds it).
 */
export function ProjectCardSpecimen() {
  return (
    <div className="flex flex-col gap-8">
      <BentoGrid>
        <BentoItem col={{ md: 6, lg: 8 }}>
          <ProjectCard {...base} title="[Featured project]" featured caseStudy preview="/dev/loop.webm" className="h-full" />
        </BentoItem>
        <BentoItem col={{ md: 3, lg: 4 }}>
          <ProjectCard {...base} caseStudy className="h-full" />
        </BentoItem>
      </BentoGrid>
      <div className="grid gap-4 md:grid-cols-3">
        <DevState label="Rest">
          <ProjectCard {...base} stack={["React", "TypeScript"]} tabIndex={-1} />
        </DevState>
        <DevState label="Hover · playing (data-playing)">
          <ProjectCard
            {...base}
            stack={["Next.js", "Supabase"]}
            preview="/dev/loop.webm"
            tabIndex={-1}
            {...forcedCardHover}
            data-playing=""
          />
        </DevState>
        <DevState label="Focus-visible">
          <ProjectCard {...base} stack={["Python"]} tabIndex={-1} className={forced.focus} />
        </DevState>
      </div>
    </div>
  );
}
