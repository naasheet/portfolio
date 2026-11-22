import type { MetadataRoute } from "next";
import { chapters } from "@/content/chapters";
import { getCaseStudies } from "@/lib/content/caseStudies";
import { absoluteUrl } from "@/lib/site";

/*
 * /sitemap.xml (4.8): Home and the five pages from content/chapters.ts, then every case study
 * from content/projects.ts. Not listed: /dev (never linked), /api, and routes that don't exist yet
 * (arcade games, /terminal, /credits): add them when their chunks land.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = chapters.map((c) => ({
    url: absoluteUrl(c.route),
    changeFrequency: "monthly" as const,
    priority: c.route === "/" ? 1 : 0.8,
  }));
  const caseStudies = getCaseStudies().map((p) => ({
    url: absoluteUrl(`/work/${p.slug}`),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));
  return [...pages, ...caseStudies];
}
