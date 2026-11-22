"use client";

import { ProjectNav } from "@/components/case-study/ProjectNav";
import { Callout } from "@/components/case-study/mdx/Callout";
import { Compare } from "@/components/case-study/mdx/Compare";
import { Figure } from "@/components/case-study/mdx/Figure";
import { Gallery } from "@/components/case-study/mdx/Gallery";
import { MarginNote } from "@/components/case-study/mdx/MarginNote";
import { Metric } from "@/components/case-study/mdx/Metric";
import { Metrics } from "@/components/case-study/mdx/Metrics";
import { DevState } from "./DevState";

const cover = "/projects/placeholder-cover.svg";

/**
 * The case-study MDX components (4.5) outside an MDX file. The full page with every component
 * is /work/project-1 (the sample, content/case-studies/project-1.mdx).
 */
export function CaseStudySpecimen() {
  return (
    <div className="flex max-w-180 flex-col gap-8">
      <DevState label="Callout · lesson (default) and note">
        <div className="flex flex-col gap-4">
          <Callout title="[Callout title]">
            [A lesson or a decision worth highlighting.]
          </Callout>
          <Callout kind="note" title="[A note]">
            [Something a reader should know.]
          </Callout>
        </div>
      </DevState>
      <DevState label="Figure with caption">
        <Figure
          src={cover}
          alt="[Screenshot]"
          caption="[Figure caption: what to notice.]"
        />
      </DevState>
      <DevState label="Gallery (two columns from md)">
        <Gallery>
          <Figure
            src="/projects/placeholder-before.svg"
            alt="[One]"
            caption="[Caption one]"
          />
          <Figure
            src="/projects/placeholder-after.svg"
            alt="[Two]"
            caption="[Caption two]"
          />
        </Gallery>
      </DevState>
      <DevState label="Metrics: a number counts up once in view; a string shows as written">
        <Metrics>
          <Metric value={42} prefix="−" suffix="%" label="[load time]" />
          <Metric
            value={3.5}
            decimals={1}
            suffix="×"
            label="[faster checkout]"
          />
          <Metric value="[12k]" label="[monthly users]" />
        </Metrics>
      </DevState>
      <DevState label="Compare: drag, or focus the handle and use ← → (Shift: bigger steps), Home, End">
        <Compare
          before={{ src: "/projects/placeholder-before.svg", alt: "[Before]" }}
          after={{ src: "/projects/placeholder-after.svg", alt: "[After]" }}
        />
      </DevState>
      <DevState label="MarginNote (inline below 88rem; in the margin inside a case study's body)">
        <div className="relative">
          <MarginNote>
            [Optional side notes sit here on wide screens.]
          </MarginNote>
        </div>
      </DevState>
      <DevState label="ProjectNav (prev hidden on phones)">
        <ProjectNav
          prev={{
            href: "/work/project-1",
            slug: "dev-prev",
            title: "[Previous project]",
            cover: "/projects/placeholder-before.svg",
          }}
          next={{
            href: "/work/project-1",
            slug: "dev-next",
            title: "[Next project]",
            cover: "/projects/placeholder-after.svg",
          }}
          labels={{ previous: "Previous", next: "Next" }}
        />
      </DevState>
    </div>
  );
}
