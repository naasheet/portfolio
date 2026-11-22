import { Mail } from "lucide-react";
import { GitHubIcon } from "@/components/media/icons/GitHubIcon";
import { LinkedInIcon } from "@/components/media/icons/LinkedInIcon";
import { colorTransition, focusRing } from "@/components/ui/controlStyles";
import { copy } from "@/content/copy";
import { profile } from "@/content/profile";
import { socials, type Social } from "@/content/socials";
import { cn } from "@/lib/utils";

const ICONS: Partial<Record<Social["platform"], () => React.ReactElement>> = {
  github: () => <GitHubIcon className="size-4" />,
  linkedin: () => <LinkedInIcon className="size-4" />,
};

const LABELS: Partial<Record<Social["platform"], string>> = {
  github: copy.about.social.github,
  linkedin: copy.about.social.linkedin,
};

/**
 * GitHub, LinkedIn and email as square icon links (About's ProfileCard and the footer, 4.3).
 * From content/socials.ts (platforms with an icon) and profile.email; a platform appears once
 * its entry exists. Links open in a new tab; email opens the mail app.
 */
export function SocialButtons({ className }: { className?: string }) {
  const button = cn(
    "flex size-11 items-center justify-center rounded-control border border-border-default bg-glass-fill text-text-primary hover:border-text-tertiary hover:bg-surface-glass",
    colorTransition,
    focusRing,
  );
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {socials
        .filter((s) => ICONS[s.platform])
        .map((s) => (
          <a
            key={s.platform}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${LABELS[s.platform] ?? s.platform}: ${s.handle}`}
            className={button}
          >
            {ICONS[s.platform]?.()}
          </a>
        ))}
      <a
        href={`mailto:${profile.email}`}
        aria-label={`${copy.about.social.email}: ${profile.email}`}
        className={button}
      >
        <Mail aria-hidden className="size-4" />
      </a>
    </div>
  );
}
