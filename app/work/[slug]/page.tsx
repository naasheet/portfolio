import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyHeader } from "@/components/case-study/CaseStudyHeader";
import { CaseStudyHero } from "@/components/case-study/CaseStudyHero";
import { ProjectNav } from "@/components/case-study/ProjectNav";
import { ReadingProgress } from "@/components/case-study/ReadingProgress";
import { TableOfContents } from "@/components/case-study/TableOfContents";
import { SiteFooter } from "@/components/layer/SiteFooter";
import { chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import {
  getCaseStudies,
  getCaseStudy,
  getNeighbours,
  getToc,
} from "@/lib/content/caseStudies";

const t = copy.caseStudy;
const workRoute = chapters.find((c) => c.id === "work")?.route ?? "/work";

type Params = { params: Promise<{ slug: string }> };

/**
 * One page per project with `hasCaseStudy` (content/projects.ts), prerendered. Any other slug
 * reaches notFound() below (`dynamicParams` isn't allowed with cacheComponents).
 */
export function generateStaticParams() {
  return getCaseStudies().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = getCaseStudy(slug);
  if (!p) return {};
  return { title: t.title(p.title), description: p.summary };
}

/**
 * A case study (4.5; Case study frames). The MDX file holds only the body; the header, meta
 * and hero come from content/projects.ts, the contents from the body's <Section> titles.
 * Desktop: contents (sticky) | body | margin notes. Phones: a contents pill above the body.
 */
export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const p = getCaseStudy(slug);
  if (!p) notFound();

  const { default: Body } = await import(`@/content/case-studies/${slug}.mdx`);
  const toc = getToc(slug);
  const { prev, next } = getNeighbours(slug);
  const navItem = (q: typeof prev) =>
    q
      ? {
          href: `${workRoute}/${q.slug}`,
          slug: q.slug,
          title: q.title,
          cover: q.cover,
        }
      : undefined;

  return (
    <div className="px-4 md:px-12">
      <ReadingProgress />
      <CaseStudyHeader project={p} backHref={workRoute} />
      <CaseStudyHero slug={p.slug} src={p.cover} alt="" />

      <div className="mt-6 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,248px)_minmax(0,720px)_minmax(0,1fr)] lg:gap-x-12">
        <div className="hidden lg:block">
          <TableOfContents variant="desktop" entries={toc} />
        </div>
        <TableOfContents
          variant="phone"
          entries={toc}
          className="mb-10 lg:hidden"
        />
        <article className="relative space-y-16">
          <Body />
        </article>
      </div>

      <ProjectNav
        className="mt-24"
        prev={navItem(prev)}
        next={navItem(next)}
        labels={{ previous: t.previous, next: t.next }}
      />
      <SiteFooter />
    </div>
  );
}
