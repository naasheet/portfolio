/*
 * Visitor-facing UI strings (CLAUDE.md §8: copy lives in content/, never in components): buttons,
 * labels, empty states, errors, toasts and the site's metadata. Facts about Nasheet live in
 * profile.ts, projects.ts, skills.ts and socials.ts (4.1).
 */
export const copy = {
  /** The site's <title> and description (app/layout.tsx, 4.8 adds Open Graph). */
  meta: {
    title: (name: string, title: string) => `${name} · ${title}`,
    /** TODO(content): a one-sentence description for search results. */
    description: "[One sentence about you and this site]",
  },
  ui: {
    /** Screen-reader text for a button that is busy. */
    loading: "Loading",
    /** Accessible name of a toast's close button. */
    dismiss: "Dismiss",
  },
  /** Shared errors (4.1): any feature that can fail uses these unless it has its own line. */
  errors: {
    generic: "Something broke on my side.",
    retry: "Try again",
    offline: "You look offline. I'll keep trying.",
    notFound: "Nothing lives at this address.",
    backHome: "Back to the desk",
  },
  /** The About page (4.3; About frames). Facts come from profile.ts; these are the labels. */
  about: {
    lede: "Who's behind this. The short version first, then the rest.",
    ledeShort: "Who's behind this.",
    available: "Available",
    skills: "Skills",
    projects: "Projects",
    seeWork: "See the work",
    workWithMe: "Work with me",
    resume: "Resume",
    shortVersion: "The short version",
    offScreen: "Off the screen",
    /** The small source line under a card ("content/profile.ts · bio"). */
    source: (field: string) => `content/profile.ts · ${field}`,
    photo: (n: number) => `[Photo ${n}]`,
    /** TODO(content): photo captions come with the photos (profile.photos). */
    photoCaptions: ["[A playful caption]", "[Hover: the card tilts toward the pointer]", "[Another caption]"],
    interests: "Interests",
    ar: {
      title: "Steer it with your hand",
      body: "Point to push the particles, pinch to click. The camera never leaves your device.",
      bodyShort: "Front camera. Nothing leaves your phone.",
      action: "Switch to Hand",
      /** Not shown on About yet (Hand mode arrives in phase 8). */
      on: {
        chip: "Hand on",
        body: "Point to push, pinch to click.",
        action: "Back to mouse",
      },
      blocked: {
        chip: "Camera blocked",
        body: "The camera is blocked, so Hand mode can't start.",
        help: "How to allow the camera",
      },
    },
    terminal: {
      eyebrow: "terminal",
      action: "Open the terminal",
      /** The card's peek: `whoami`, then `ls ./about`. */
      whoami: "nasheet · designs, then builds",
      ls: "ls ./about",
      files: "bio.md photos/ now.md",
    },
    social: {
      github: "GitHub",
      linkedin: "LinkedIn",
      email: "Email",
    },
  },
  /** The Work page (4.4; Work frames). Projects come from projects.ts; these are the labels. */
  work: {
    lede: "Case studies and side projects. Hover a card to play its preview.",
    ledeShort: "Case studies and side projects.",
    /** "3 projects · 1 case study", counted from content/projects.ts. */
    counts: (projects: number, caseStudies: number) =>
      `${projects} ${projects === 1 ? "project" : "projects"} · ${caseStudies} ${caseStudies === 1 ? "case study" : "case studies"}`,
    filters: "Filter projects",
    all: "All",
    /** Announced after a filter change. */
    showing: (n: number) => `Showing ${n} ${n === 1 ? "project" : "projects"}`,
    empty: "Nothing matches that filter. Yet.",
    showAll: "Show all projects",
    card: {
      caseStudy: "Case study",
      preview: "Preview",
      playingInView: "Playing in view",
    },
  },
  /** The footer on content pages (4.3; About frames). */
  footer: {
    psst: "Psst. Press ` for the terminal.",
    backToTop: "Back to top",
  },
  /** Shared empty states (4.1). */
  empty: {
    nothing: "Nothing here yet.",
    noResults: "No matches. Try fewer filters.",
  },
  /** The nav row, the island and the phone menu (2.4). */
  nav: {
    label: "Main",
    wordmark: "nasheet.",
    home: "Home",
    /** The island's button; the chapter follows, e.g. "Navigation, 03 Work". */
    island: "Navigation",
    menu: "Open the menu",
    menuTitle: "Menu",
    close: "Close",
    mode: "Pointer",
    mouse: "Mouse",
    hand: "Hand",
    terminal: "Terminal",
    theme: "Theme",
    soundOff: "Sound is off",
    soundOn: "Sound is on",
    tapForSound: "Tap for sound",
    getInTouch: "Get in touch",
    /** Accessible name of the second activity's circle in the split shape. */
    collapse: "Close",
  },
  /** Island alerts for quiet actions (Island board: "Light theme · T to switch back"). */
  alerts: {
    lightTheme: "Light theme",
    darkTheme: "Dark theme",
    soundOn: "Sound on",
    soundOff: "Sound off",
    handMode: "Hand mode",
    mouseMode: "Mouse mode",
    switchBack: (key: string) => `${key} to switch back`,
  },
  /** The ? overlay (Navigation board). */
  shortcuts: {
    title: "Keyboard",
    description:
      "Lit keys do something. They work anywhere except while you're typing.",
    close: "Close",
    terminal: "Terminal",
    chat: "Ask about my work",
    sound: "Sound",
    theme: "Theme",
    ar: "Mouse / Hand mode",
    shortcuts: "Shortcuts (⇧ + /)",
    escape: "Close what's open",
    pages: "Open About, Work, Skills, Arcade or Contact",
    groups: { everywhere: "Everywhere", home: "Home" },
  },
  /** Home (R.1, Home board): the intro and the hint row. The room arrives in R.3. */
  home: {
    // TODO(content): confirm "Open to work" and the role line (from the Home board).
    status: "Open to work",
    /** Desktop title (the teal full stop is drawn separately). */
    title: "Hi, I'm Nasheet",
    lines: [
      "Designer and frontend developer.",
      "This is my desk. Pick something up.",
    ],
    /** The phone's eyebrow and title (Home — phone 390). */
    eyebrow: "Hi, I'm Nasheet",
    phoneTitle: "This is my desk",
    hints: {
      look: "Hover to look, click to open",
      or: "or",
      hand: "Pinch in Hand mode",
      phone: "Tap something on the desk. Or jump straight there:",
      /** Accessible name of the phone's chip row. */
      pages: "Pages",
    },
    /** The particle room's hover, focus and open (R.4; Home — hovering the laptop). */
    room: {
      /** The cursor's view pill over an object. */
      open: "Open ↗",
      /** Hover card footer: "Click, or [3]". */
      clickOr: "Click, or",
      /** Accessible name of the visually hidden list of the room's links. */
      links: "Things on the desk",
      /** TODO(content): Work's three project tiles until content/projects.ts exists (4.1). */
      projectTile: (n: number) => `Project ${n}`,
      /** Hover card footer for objects without a key. */
      click: "Click",
      /** The headphones until Phase 5 brings the player. */
      musicSoon: "Music's warming up",
      musicSoonDetail: "The player lands soon",
      /** Phone sheet (R.5, Home — phone 390). */
      openPage: (name: string) => `Open ${name}`,
      tapAgain: (noun: string) => `Or tap ${noun} again`,
      sheetLabel: "Selected on the desk",
      /** No WebGL / Save-Data: the six as cards. */
      cardsLabel: "On the desk",
      musicCard: "Starts the player in the island",
    },
    /** The Now card in the island (R.5; the mug). */
    now: {
      title: "Now",
      live: "live",
      chunk: (id: string) => `chunk ${id}`,
      coffee: "Coffee today",
      lastCommit: "Last commit",
      ago: (ms: number) => {
        const min = Math.round(ms / 60_000);
        if (min < 1) return "just now";
        if (min < 60) return `${min} min ago`;
        const h = Math.round(min / 60);
        if (h < 24) return `${h} h ago`;
        return `${Math.round(h / 24)} d ago`;
      },
      label: "What I'm working on now",
    },
    /** Secrets (R.5): the plant is the first of five. */
    secrets: {
      total: 5,
      plant: "You watered the plant",
      count: (found: number, total: number) => `secret ${found} of ${total}`,
    },
  },
  /** Placeholder pill in the persistent layer (2.3); 7.4 replaces it with the Ask bubble. */
  layer: {
    ask: "Ask",
  },
} as const;
