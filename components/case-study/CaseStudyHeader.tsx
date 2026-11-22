"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { GitHubIcon } from "@/components/media/icons/GitHubIcon";
import { Button } from "@/components/ui/Button";
import { copy } from "@/content/copy";
import type { Project } from "@/content/projects";
import { navigate } from "@/lib/motion/pageTransition";
import { cn } from "@/lib/utils";

const t = copy.caseStudy;

export type CaseStudyHeaderProps = {
  project: Project;
  /** Where "All work" goes (Work's route). */
  backHref: string;
};

function Tag({ children }: { children: string }) {
  return (
    <li className="flex h-7 items-center rounded-chip border border-border-default px-3 text-caption-1 text-text-secondary">
      {children}
    </li>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt className="text-caption-2 font-mono tracking-widest text-text-tertiary uppercase">
        {label}
      </dt>
      <dd className="text-subhead text-text-primary">{children}</dd>
    </div>
  );
}

/**
 * The top of a case study (4.5; Case study frames): "All work" and the path, the eyebrow, the
 * title and the one-line summary, then the meta row (role, year, team, stack, and Live site /
 * Repo when the project has them). On phones the meta collapses into one chip row and the
 * buttons go full width. Everything comes from content/projects.ts.
 */
export function CaseStudyHeader({
  project: p,
  backHref,
}: CaseStudyHeaderProps) {
  const router = useRouter();
  const back = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
      return;
    e.preventDefault();
    navigate(router, backHref);
  };
  const links = (p.links.live || p.links.repo) && (
    <div className="grid grid-cols-2 gap-3 md:flex md:shrink-0">
      {p.links.live ? (
        <Button
          href={p.links.live}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t.liveSite}, ${t.newTab}`}
          trailingIcon={<ArrowUpRight />}
        >
          {t.liveSite}
        </Button>
      ) : null}
      {p.links.repo ? (
        <Button
          href={p.links.repo}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t.repo}, ${t.newTab}`}
          variant="secondary"
          leadingIcon={<GitHubIcon />}
        >
          {t.repo}
        </Button>
      ) : null}
    </div>
  );

  return (
    <header className="flex flex-col gap-6 pt-[calc(var(--nav-inset-top)+80px)] pb-10 md:pt-[calc(var(--nav-inset-top)+92px)]">
      <div className="flex items-center gap-4">
        <Button
          href={backHref}
          onClick={back}
          size="sm"
          variant="secondary"
          leadingIcon={<ArrowLeft />}
        >
          {t.allWork}
        </Button>
        <span className="hidden text-caption-1 font-mono text-text-tertiary md:inline">
          {backHref}/{p.slug}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-footnote font-mono tracking-widest text-accent-primary uppercase">
          {t.eyebrow} · {p.year}
        </p>
        <h1 className="text-stat-3 font-bold md:text-stat-2">{p.title}</h1>
        <p className="max-w-2xl text-body font-normal text-text-secondary md:text-title-3 md:font-normal">
          {p.summary}
        </p>
      </div>

      {/* Desktop: labelled fields and the buttons on the right. */}
      <div className="hidden items-end justify-between gap-8 md:flex">
        <dl className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <Field label={t.role}>{p.role}</Field>
          <Field label={t.year}>{p.year}</Field>
          {p.team ? <Field label={t.team}>{p.team}</Field> : null}
          <Field label={t.stack}>
            <ul className="flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </ul>
          </Field>
        </dl>
        {links}
      </div>

      {/* Phones: one chip row, then the buttons at full width. */}
      <div className="flex flex-col gap-4 md:hidden">
        <ul aria-label={t.stack} className="flex flex-wrap gap-2">
          <Tag>{p.role}</Tag>
          <Tag>{String(p.year)}</Tag>
          {p.team ? <Tag>{p.team}</Tag> : null}
          {p.stack.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </ul>
        {links}
      </div>
    </header>
  );
}
