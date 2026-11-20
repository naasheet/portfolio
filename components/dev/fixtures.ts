/*
 * Placeholder data for the card kit on /dev. Nothing here is real content.
 * TODO(content): real values come from content/ in chunk 4.1 (profile, socials, skills,
 * music, copy). Don't import this file outside components/dev.
 */
import type { ARCardCopy } from "@/components/cards/ARCard";
import type { SkillArea } from "@/components/cards/SkillsCard";
import type { StatSegment } from "@/components/cards/StatCard";
import type { TerminalPreview } from "@/components/cards/TerminalCard";

// TODO(content): name, title, study line, location and time from content/profile.ts.
export const profile = {
  name: "[Your name]",
  initials: "NK",
  title: "[Title, e.g. Designer & frontend developer]",
  line: "[Study or role line]",
  status: { text: "[City] · [local time]", tone: "live" as const },
};

// TODO(content): real numbers from content/skills.ts and content/projects.ts.
export const stat = {
  label: "[Stat label]",
  value: 26,
  caption: "[What the number counts]",
  segments: [
    { value: 10, tone: "accent" },
    { value: 9, tone: "amber" },
    { value: 7, tone: "muted" },
  ] satisfies StatSegment[],
};

// TODO(content): real handles and URLs from content/socials.ts.
export const socials = {
  github: {
    platform: "GitHub",
    handle: "@[handle]",
    href: "https://github.com/",
  },
  linkedin: {
    platform: "LinkedIn",
    handle: "/in/[handle]",
    href: "https://www.linkedin.com/",
  },
  newTabLabel: "(opens in a new tab)",
};

// TODO(content): real photo and caption.
export const photo = {
  caption: "[Photo caption]",
  subcaption: "[Image · caption]",
};

// TODO(content): real skill areas from content/skills.ts.
export const skills = {
  eyebrow: "[Area]",
  areas: [
    {
      name: "[Frontend]",
      skills: [
        "React",
        "Next.js",
        "TypeScript",
        "Tailwind",
        "Framer Motion",
        "GSAP",
        "Three.js",
        "GLSL",
        "Zustand",
        "Accessibility",
        "Vitest",
      ],
    },
    {
      name: "[Design]",
      skills: [
        "Figma",
        "Prototyping",
        "Motion design",
        "Design systems",
        "Typography",
      ],
    },
    {
      name: "[Other]",
      skills: ["Web Audio", "MediaPipe", "Supabase", "Node.js"],
    },
  ] satisfies SkillArea[],
  labels: {
    region: "[Skills by area]",
    prev: "[Previous area]",
    next: "[Next area]",
    hint: "← → keys when focused · swipe on touch",
  },
};

// TODO(content): CTA copy from content/copy.ts.
export const cta = {
  eyebrow: "[Contact]",
  title: "[Have something to build?]",
  actionLabel: "[Open the contact form]",
};

// TODO(content): wired to the player in chunk 5.5.
export const nowPlaying = {
  eyebrow: "[Now playing]",
  title: "[Track title]",
  artist: "[Artist]",
  progress: 0.38,
  progressLabel: "[Track progress]",
  liveLabel: "[Live]",
};

// TODO(content): bio from content/profile.ts.
export const text = {
  eyebrow: "[About]",
  heading: "[One-line headline about you.]",
  body: "[Two or three lines of bio go here. Heading and body both come from props.]",
};

// TODO(content): AR copy from content/copy.ts.
export const ar = {
  copy: {
    title: "[Steer it with your hand]",
    off: {
      body: "[Point to push the particles. Pinch to click. The camera feed never leaves your device.]",
      action: "[Turn on AR]",
      hint: { before: "or type", key: "ar on" },
    },
    on: {
      chip: "[Tracking]",
      body: "[Hand found. Point to push, pinch to click.]",
      hint: { before: "Press", key: "Esc", after: "to stop." },
      action: "[Turn off AR]",
    },
    blocked: {
      chip: "[Camera blocked]",
      body: "[Allow the camera in your browser settings, then try again. Everything else works without it.]",
      help: "[How to allow the camera]",
    },
  } satisfies ARCardCopy,
  helpHref: "#card-kit",
};

// TODO(content): terminal copy from content/copy.ts; command count from the registry (6.2).
export const terminal = {
  eyebrow: "[Terminal]",
  shortcut: "`",
  preview: {
    prompt: "nasheet@portfolio:~$",
    command: "help",
    output: [
      [
        { text: "[30 commands. Try " },
        { text: "play", code: true },
        { text: ", " },
        { text: "ar on", code: true },
        { text: " or]" },
      ],
      [{ text: "sudo hire-me", code: true }],
    ],
  } satisfies TerminalPreview,
  actionLabel: "[Open the terminal]",
};
