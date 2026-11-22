import { ViewTransition } from "react";
import { Img } from "@/components/media/Img";
import { coverTransitionName } from "@/lib/motion/pageTransition";

export type CaseStudyHeroProps = {
  slug: string;
  src: string;
  alt: string;
};

/**
 * The case study's hero cover (4.5): full width, rounded. It shares a <ViewTransition> name with
 * the project's card cover, so opening the case study from Work morphs the cover into it (and
 * Back morphs it back) where View Transitions exist (lib/motion/pageTransition.ts).
 */
export function CaseStudyHero({ slug, src, alt }: CaseStudyHeroProps) {
  return (
    <ViewTransition
      name={coverTransitionName(slug)}
      share="morph"
      default="none"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-card border border-border-default bg-surface-glass md:aspect-[13/6]">
        <Img
          src={src}
          alt={alt}
          width={1600}
          height={1000}
          priority
          sizes="100vw"
          className="h-full"
        />
      </div>
    </ViewTransition>
  );
}
