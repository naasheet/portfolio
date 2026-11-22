"use client";

import { ArrowRight, Download } from "lucide-react";
import { useState, type ReactElement } from "react";
import { CTACard } from "@/components/cards/CTACard";
import { EmailCard } from "@/components/cards/EmailCard";
import { SocialCard } from "@/components/cards/SocialCard";
import { TimeCard } from "@/components/cards/TimeCard";
import { SiteFooter } from "@/components/layer/SiteFooter";
import { GitHubIcon } from "@/components/media/icons/GitHubIcon";
import { InstagramIcon } from "@/components/media/icons/InstagramIcon";
import { LinkedInIcon } from "@/components/media/icons/LinkedInIcon";
import { Stagger } from "@/components/motion/Stagger";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { BentoItem } from "@/components/ui/BentoItem";
import { Button } from "@/components/ui/Button";
import { LocalTime } from "@/components/ui/LocalTime";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { profile } from "@/content/profile";
import { socials, type Social } from "@/content/socials";
import { ContactSheet } from "./ContactSheet";

const t = copy.contact;
const page = chapters.find((c) => c.id === "contact")!;

const ICONS: Partial<Record<Social["platform"], ReactElement>> = {
  github: <GitHubIcon />,
  linkedin: <LinkedInIcon />,
  instagram: <InstagramIcon />,
};
const NAMES: Partial<Record<Social["platform"], string>> = {
  github: t.social.github,
  linkedin: t.social.linkedin,
  instagram: t.social.instagram,
};

/** "● Open to work · Indore 03:58 IST" (desktop only, top right of the Say hello card). */
function Status() {
  return (
    <span className="hidden items-center gap-2 md:flex">
      <span aria-hidden className="relative inline-flex size-2">
        {profile.availability.open ? (
          <span className="absolute inset-0 animate-status-pulse rounded-chip bg-status-success" />
        ) : null}
        <span className="relative size-2 rounded-chip bg-status-success" />
      </span>
      {profile.availability.label} · {profile.location.city}
      <LocalTime className="text-footnote font-mono text-text-tertiary tabular-nums" />
    </span>
  );
}

/**
 * The Contact page (4.7; Contact frames): "Say hello." (opens ContactSheet), the email card
 * (Copy, mail app), the local-time card, and a row of GitHub, LinkedIn, Instagram and the resume.
 * Phones: Say hello, Email, GitHub | LinkedIn, Instagram, Resume (a row), then the time.
 * The envelope sits top right (top centre on phones) through the page's `place`.
 */
export function Contact({ resumeKb }: { resumeKb: number | null }) {
  const [open, setOpen] = useState(false);
  const shown = socials.filter((s) => ICONS[s.platform]);
  const resumeMeta =
    resumeKb !== null ? t.resumeCard.meta(resumeKb) : undefined;
  const resumeLine = profile.resumeUpdated
    ? t.resumeCard.updated(profile.resumeUpdated)
    : (resumeMeta ?? "");

  return (
    <div className="px-4 md:px-12">
      <header className="flex flex-col gap-4 pt-[calc(var(--nav-inset-top)+236px)] pb-12 md:min-h-120 md:pt-[calc(var(--nav-inset-top)+92px)]">
        <span className="text-footnote font-mono text-accent-primary">
          {chapterNumber(chapters.indexOf(page))}
        </span>
        <h1 className="text-stat-2 font-bold md:text-stat-1">
          {page.name}
          <span className="text-accent-primary">.</span>
        </h1>
        <p className="max-w-xl text-body text-text-secondary">
          <span className="md:hidden">{t.ledeShort}</span>
          <span className="hidden md:inline">{t.lede}</span>
        </p>
      </header>

      <Stagger>
        <BentoGrid>
          <BentoItem data-stagger col={{ md: 6, lg: 7 }} row={{ lg: 2 }}>
            <CTACard
              variant="hero"
              hoverable
              className="h-full"
              eyebrow={t.messages.eyebrow}
              status={<Status />}
              title={t.messages.title}
              body={
                <>
                  <span className="md:hidden">{t.messages.bodyShort}</span>
                  <span className="hidden md:inline">{t.messages.body}</span>
                </>
              }
              actions={
                <>
                  <Button
                    size="lg"
                    onClick={() => setOpen(true)}
                    trailingIcon={<ArrowRight />}
                    className="w-full sm:w-auto"
                  >
                    {t.messages.write}
                  </Button>
                  <Button
                    href={profile.resume}
                    download
                    size="lg"
                    variant="ghost"
                    leadingIcon={<Download />}
                    className="hidden md:inline-flex"
                  >
                    {t.messages.resume}
                  </Button>
                </>
              }
            />
          </BentoItem>

          <BentoItem data-stagger col={{ md: 3, lg: 5 }}>
            <EmailCard
              hoverable
              className="h-full"
              eyebrow={t.emailCard.eyebrow}
              email={profile.email}
              labels={t.emailCard}
            />
          </BentoItem>

          {/* Last on phones (frame order), beside Email on wider screens. */}
          <BentoItem
            data-stagger
            className="order-last md:order-none"
            col={{ md: 3, lg: 5 }}
          >
            <TimeCard
              hoverable
              className="h-full"
              eyebrow={t.time.eyebrow(profile.location.city)}
              note={t.timeNote}
            />
          </BentoItem>

          <BentoItem data-stagger col={{ md: 6, lg: 12 }}>
            <div className="grid h-full grid-cols-2 gap-4 md:grid-cols-4">
              {shown.map((s, i) => (
                <SocialCard
                  key={s.platform}
                  className={
                    i === 2 ? "col-span-2 h-full md:col-span-1" : "h-full"
                  }
                  platform={NAMES[s.platform] ?? s.platform}
                  handle={s.handle}
                  href={s.url}
                  icon={ICONS[s.platform]}
                  newTabLabel={t.social.newTab}
                  hoverLabel={t.social.follow}
                />
              ))}
              <SocialCard
                download
                className="col-span-2 hidden h-full md:col-span-1 md:flex"
                platform={t.resumeCard.title}
                handle={
                  profile.resumeUpdated
                    ? t.resumeCard.updated(profile.resumeUpdated)
                    : ""
                }
                meta={resumeMeta}
                href={profile.resume}
                icon={<Download />}
                newTabLabel=""
              />
              <SocialCard
                download
                layout="row"
                className="col-span-2 md:hidden"
                platform={t.resumeCard.title}
                handle={resumeLine}
                href={profile.resume}
                icon={<Download />}
                newTabLabel=""
              />
            </div>
          </BentoItem>
        </BentoGrid>
      </Stagger>

      <SiteFooter />
      <ContactSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
