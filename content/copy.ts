/*
 * Visitor-facing UI strings (CLAUDE.md §8: copy lives in content/, never in components): buttons,
 * labels, empty states, errors, toasts and the site's metadata. Facts about Nasheet live in
 * profile.ts, projects.ts, skills.ts and socials.ts (4.1).
 */
export const copy = {
  /** The site's <title> and description (app/layout.tsx, 4.8 adds Open Graph). */
  meta: {
    /** Home's title, and the default. */
    title: (name: string, title: string) => `${name} · ${title}`,
    /** Every other page: "Work · Nasheet Khan". */
    template: (name: string) => `%s · ${name}`,
    /** Per-page descriptions (4.8). The site's own description is profile.tagline. */
    pages: {
      about:
        "Who's behind this site: the short version, photos, and life off the screen.",
      work: "Case studies and side projects, filterable by domain and stack.",
      skills: "What I use, and how much. Honest dots, no logo wall.",
      arcade: "Two small games, played with a mouse, a finger or your hand.",
      contact: "Say hi, or hire me: a message form, email and socials.",
    },
  },
  ui: {
    /** Screen-reader text for a button that is busy. */
    loading: "Loading",
    /** Accessible name of a toast's close button. */
    dismiss: "Dismiss",
  },
  /** Shared errors (4.1): any feature that can fail uses these unless it has its own line. */
  /** The music engine's messages (5.1). */
  music: {
    loadError: (title: string) => `Couldn't load "${title}". Skipping it.`,
    gaveUp: "The music won't load right now. Sound effects still work.",
  },
  /** The music player in the island (5.2). */
  player: {
    /** Accessible name of the island's art and equalizer buttons. */
    open: (title: string, artist: string) =>
      `Now playing: ${title} by ${artist}. Open the player`,
    /** Under the title: "[Artist] · track 3 of 8". */
    trackOf: (n: number, total: number) => `track ${n} of ${total}`,
    previous: "Previous track",
    next: "Next track",
    play: "Play",
    pause: "Pause",
    /** The queue button and sheet (5.3). */
    queue: "Queue",
    queueEyebrow: (n: number) => `Music · ${n} tracks`,
    queueClose: "Close the queue",
    /** A row's accessible name: "Play Gehra by DARZI, 6:10". */
    playTrack: (title: string, artist: string, length: string) =>
      `Play ${title} by ${artist}, ${length}`,
    nowPlaying: (title: string, artist: string) =>
      `Now playing: ${title} by ${artist}`,
    /** A track marked "local" in content/music.ts (no licence; never deployed). */
    localFile: "Local file",
    licenceLink: (source: string) => `${source} licence (opens in a new tab)`,
    volume: "Volume",
    mute: "Mute",
    unmute: "Unmute",
    /** Footer key hint: [↑] [↓] move · [↵] play. */
    keysMove: "move",
    keysPlay: "play",
    creditsBefore: "All music credits on",
    creditsLink: "/credits",
    seek: "Position in the track",
    /** Scrubber's aria-valuetext: "1 minute 20 of 3 minutes 05". */
    spokenTime: (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      if (m === 0) return `${sec} second${sec === 1 ? "" : "s"}`;
      return `${m} minute${m === 1 ? "" : "s"} ${String(sec).padStart(2, "0")}`;
    },
    valueText: (now: string, total: string) => `${now} of ${total}`,
  },
  /** The 404 page (4.8). */
  notFound: {
    code: "404",
    title: "This page wandered off the desk.",
    body: "The link is old, mistyped, or never existed. The particles are as lost as you are.",
    /** Before and after the key: "Or press ` and type ls to look around." */
    hintBefore: "Or press",
    hintAfter: "and type ls to look around.",
  },
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
    photoCaptions: [
      "[A playful caption]",
      "[Hover: the card tilts toward the pointer]",
      "[Another caption]",
    ],
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
      newTab: "opens in a new tab",
    },
  },
  /** The Skills page (4.6; Skills frames). Skills come from skills.ts; these are the labels. */
  skills: {
    lede: "What I use, and how much. Honest dots, no logo wall.",
    ledeShort: "What I use, and how much.",
    region: "Skills by area",
    areas: "Areas",
    prev: "Previous area",
    next: "Next area",
    orSwipe: "or swipe",
    swipeHint: "Swipe for the next area",
    /** The dots' accessible text. */
    level: (level: number | undefined) =>
      level === undefined ? "Not rated yet" : `${level} of 5`,
    years: (n: number) => `${n} ${n === 1 ? "yr" : "yrs"}`,
    learning: "Learning now",
    legend: "How to read the dots",
    /** The legend, as drawn: label and number of dots. */
    legendRows: [
      { label: "I could teach it", level: 5 },
      { label: "I ship with it daily", level: 4 },
      { label: "Comfortable", level: 3 },
      { label: "Just started", level: 1 },
    ],
    usedIn: "Where I used it",
    tools: "Open every day",
    newTab: "opens in a new tab",
  },
  /** The Contact page, its sheet and its email (4.7; Contact frames). */
  contact: {
    lede: "Say hi, or hire me. Pick whichever button is closest.",
    ledeShort: "Say hi, or hire me.",
    /** After the message is sent (the frame's line, approved). */
    success: "I'll reply within a day.",
    sent: "Message sent",
    /** TODO(content): the line on the local-time card, in your words. */
    timeNote: "[Night owl. Usually replies by noon.]",
    messages: {
      eyebrow: "Messages",
      title: "Say hello",
      body: "Projects, internships, collabs, or just a hi. I read everything and reply within a day.",
      bodyShort: "Projects, internships, collabs, or just a hi.",
      write: "Write a message",
      resume: "Resume",
    },
    emailCard: {
      eyebrow: "Email",
      copy: "Copy",
      copied: "Copied",
      openMail: "Open mail app",
      /** The island alert after copying. */
      copiedAlert: "Email copied",
      copyFailed: "Couldn't copy it. Select the address instead.",
    },
    time: {
      eyebrow: (city: string) => `Local time · ${city}`,
    },
    social: {
      github: "GitHub",
      linkedin: "LinkedIn",
      instagram: "Instagram",
      follow: "Follow",
      newTab: "opens in a new tab",
    },
    resumeCard: {
      title: "Resume",
      meta: (kb: number) => `PDF · ${kb} KB`,
      updated: (when: string) => `Updated ${when}`,
    },
    sheet: {
      title: "Say hello",
      close: "Close",
      topic: "What's it about?",
      name: "Name",
      email: "Email",
      message: "Message",
      escHint: "Esc to close",
      /** The honeypot's hidden label (only bots see it). */
      honeypot: "Website",
      send: "Send message",
      direct: "Or email me directly:",
      /** Inline errors (codes from lib/contact/validate.ts). */
      errors: {
        required: {
          name: "Tell me what to call you.",
          email: "I'll need an email to reply to.",
          message: "Say something. Even just hi.",
        },
        tooLong: (max: number) => `That's over ${max} characters.`,
        emailFormat: "That doesn't look like an email.",
        emailUnfinished: "That email looks unfinished. Missing the .com?",
        topic: "Pick what it's about.",
        rateLimited:
          "That's a lot of messages for one hour. Try again later, or email me.",
        failed: "Something broke on my side. Email me instead?",
        offline: "You look offline. Try again in a moment.",
      },
    },
    /** The chips, also the email's subject tag. */
    topics: { project: "Project", collab: "Collab", hi: "Just saying hi" },
    /** The email you get (Resend). */
    email: {
      from: "Portfolio <onboarding@resend.dev>",
      subject: (topic: string, name: string) =>
        `[${topic}] ${name} via your portfolio`,
      body: (name: string, email: string, topic: string, message: string) =>
        `${name} <${email}> wrote (${topic}):

${message}

Reply to this email to answer them.`,
    },
  },
  /** Case studies (4.5; Case study frames). Facts come from projects.ts and the MDX body. */
  caseStudy: {
    allWork: "All work",
    eyebrow: "Case study",
    role: "Role",
    year: "Year",
    team: "Team",
    stack: "Stack",
    liveSite: "Live site",
    repo: "Repo",
    newTab: "opens in a new tab",
    contents: "Contents",
    /** The phone's contents pill: "2 / 5". */
    position: (i: number, n: number) => `${i} / ${n}`,
    previous: "Previous",
    next: "Next",
    marginNote: "Margin note",
    before: "Before",
    after: "After",
    /** The Compare slider's accessible name. */
    compare: "Before and after",
    /** The page's <title>: "[Project 1] · Case study". */
    title: (project: string) => `${project} · Case study`,
  },
  /** The footer on content pages (4.3; About frames). */
  footer: {
    /** The footer landmark's name. */
    label: "Site footer",
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
