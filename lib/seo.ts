/*
 * Metadata (4.8). Next replaces the layout's whole `openGraph` / `twitter` objects when a page sets
 * its own, so the shared parts (site name, locale, the share image, the large card) live here and
 * every page spreads them back in. Titles go through the layout's template ("Work · Nasheet Khan").
 */
import type { Metadata } from "next";
import { chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { profile } from "@/content/profile";

/** app/opengraph-image.tsx, for every route. */
const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${profile.name} · ${profile.title}`,
};

export const baseOpenGraph = {
  type: "website",
  siteName: profile.name,
  locale: "en_IN",
  images: [shareImage],
} satisfies NonNullable<Metadata["openGraph"]>;

export const baseTwitter = {
  card: "summary_large_image",
  images: [shareImage.url],
} satisfies NonNullable<Metadata["twitter"]>;

type PageWithMeta = keyof typeof copy.meta.pages;

/** Title, description, canonical URL and share text for one of the content pages. */
export function pageMetadata(id: PageWithMeta): Metadata {
  const page = chapters.find((c) => c.id === id);
  const title = page?.name ?? id;
  const description = copy.meta.pages[id];
  const url = page?.route ?? "/";
  const full = `${title} · ${profile.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...baseOpenGraph, title: full, description, url },
    twitter: { ...baseTwitter, title: full, description },
  };
}

/** A case study (app/work/[slug]): the project's title and summary, shared as an article. */
export function caseStudyMetadata(
  title: string,
  description: string,
  url: string,
): Metadata {
  const full = `${title} · ${profile.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      ...baseOpenGraph,
      type: "article",
      title: full,
      description,
      url,
    },
    twitter: { ...baseTwitter, title: full, description },
  };
}

/** Home: the layout's defaults, plus the canonical "/". */
export const homeMetadata: Metadata = {
  alternates: { canonical: "/" },
};
