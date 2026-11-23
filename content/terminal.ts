/*
 * The terminal's strings (6.1–6.3): the shell itself, the generated home directory (lib/fs.ts)
 * and every command's help line and messages. Kept out of content/copy.ts on purpose: that object
 * ships with every page, this one only with the terminal's chunk (CLAUDE.md §8 allows strings in
 * any content/ file).
 */
export const terminalCopy = {
  /** The terminal (6.1). Command output is the commands' own (6.2+). */
  terminal: {
    title: "Terminal",
    close: "Close the terminal",
    /** Before the Esc key cap in the drawer's header. */
    escHint: "close",
    user: "nasheet",
    host: "portfolio",
    path: "~",
    banner: "Type help to start",
    /** Three clickable commands under the banner on the first open. */
    suggestionsLabel: "Try",
    suggestions: ["help", "whoami", "projects"],
    inputLabel: "Command. Type one and press Enter.",
    /** The full-page terminal (6.6, phones). */
    page: {
      back: "Back to the site",
      /** The page's meta description. */
      description: "The site's terminal, full screen: every feature, one command away.",
      /** Above the keyboard: one tap runs each. */
      chipsLabel: "Quick commands",
      chips: ["help", "projects", "whoami", "play", "ar on"],
    },
    /** The drawer's drag handle (6.6, desktop). */
    resize: "Resize the terminal",
    outputLabel: "Terminal output",
    /** Unknown command (6.2): with a suggestion when one is 2 edits away or closer. */
    notFound: (command: string, suggestion?: string) =>
      suggestion
        ? `command not found: ${command} — did you mean ${suggestion}?`
        : `command not found: ${command}. Type help for the list.`,
    syntax: (error: string) => `syntax error: ${error}`,
  },
  /** The terminal's generated home directory (6.3, lib/fs.ts): labels inside the files. */
  fs: {
    home: "/home/nasheet",
    readMore: "More on the About page",
    stack: "Stack",
    links: "Links",
    caseStudy: "Case study",
    live: "Live site",
    repo: "Repository",
    learning: "Learning now",
    tools: "Tools",
    email: "Email",
    based: "Based in",
    resume: "Resume (PDF)",
    platforms: {
      github: "GitHub",
      linkedin: "LinkedIn",
      x: "X",
      dribbble: "Dribbble",
      behance: "Behance",
      instagram: "Instagram",
      email: "Email",
    },
    /** ~/.secrets. TODO(content): review the hints (only found or planned secrets get one). */
    secrets: {
      header: (found: number, total: number) =>
        `# Secrets: ${found} of ${total} found`,
      found: "✓",
      missing: "?",
      unknown: "???",
      hints: {
        plant: "Something on the desk looks thirsty.",
        dotfile: "Some files hide behind a dot.",
      },
      footer: "The rest are out there. No spoilers.",
    },
  },
  /** Each command's help line and messages (6.2+): lib/commands/<name>.ts reads its own. */
  commands: {
    /** help's groups, in this order (6.4). */
    categories: {
      navigate: "Getting around",
      site: "The site",
      music: "Music",
      about: "About me",
      shell: "Shell",
      fun: "Just for fun",
    },
    help: {
      description: "List every command, or explain one",
      usage: "help [command]",
      count: (n: number) =>
        `${n} commands. Type one to run it, or help <command> for more.`,
      usageLabel: "Usage",
      examplesLabel: "Examples",
      aliasesLabel: "Also",
    },
    whoami: {
      description: "Who you are, and who I am",
      usage: "whoami",
      you: "visitor",
      me: (name: string, title: string, city: string) =>
        `…and I'm ${name}, ${title.toLowerCase()} in ${city}. Try neofetch for the long version.`,
    },
    skills: {
      description: "My skills as a table",
      usage: "skills",
      head: ["Skill", "Level", "Years"],
      years: (n: number) => `${n} yrs`,
      learning: "Learning now",
    },
    history: {
      description: "The commands you've typed (-c forgets them)",
      usage: "history [-c]",
      empty: "No history yet. You're a blank slate.",
      cleared: "History cleared. We never speak of it again.",
    },
    clear: {
      description: "Clear the screen (or Ctrl+L)",
      usage: "clear",
    },
    date: {
      description: "Your time and mine",
      usage: "date",
      yours: "You",
      mine: (city: string) => `Me (${city})`,
    },
    exit: {
      description: "Close the terminal (or Esc)",
      usage: "exit",
      bye: "logout. See you around.",
    },
    neofetch: {
      description: "The system info, starring me",
      usage: "neofetch",
      name: "Name",
      role: "Role",
      location: "Location",
      stack: "Stack",
      /** The site's own stack (CLAUDE.md §3): a fact about this site, not a bio claim. */
      stackValue: "Next.js · React · Three.js · GSAP",
      uptime: "Uptime",
      theme: "Theme",
      track: "Track",
      silence: "silence (press M for music)",
      themes: { dark: "dark", light: "light" },
      duration: (s: number) =>
        s < 60
          ? `${s} s`
          : s < 3600
            ? `${Math.floor(s / 60)} min ${s % 60} s`
            : `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min`,
    },
    sudo: {
      description: "Do something as admin (try: sudo hire-me)",
      usage: "sudo <command>",
      missing: "sudo: and do what, exactly? Try: sudo hire-me",
      /** TODO(content): review the steps and the refusals. */
      steps: [
        "Checking references",
        "Compiling the portfolio",
        "Brewing coffee",
        "Asking the particles nicely",
        "Warming up the keyboard",
        "Drafting a hello",
      ],
      bar: (done: number, total: number, step: string) =>
        `[${"#".repeat(done)}${"-".repeat(total - done)}] ${Math.round((done / total) * 100)}% ${step}…`,
      granted: "Access granted. Opening a message to me…",
      refusals: [
        "visitor is not in the sudoers file. This incident will be reported (to nobody).",
        "Nice try. The only thing you can sudo here is hire-me.",
        "Permission denied. But I like the confidence.",
      ],
    },
    echo: {
      description: "Print what you type after it",
      usage: "echo <text…>",
    },
    ls: {
      description: "List files (-l for details, -a for hidden ones)",
      usage: "ls [-l] [-a] [path…]",
    },
    cd: {
      description: "Change directory (no path: home)",
      usage: "cd [path]",
      notDir: (p: string) => `cd: ${p}: not a directory`,
    },
    pwd: {
      description: "Print the current directory",
      usage: "pwd",
    },
    cat: {
      description: "Print a file (Markdown with styling)",
      usage: "cat <file…>",
      missing: "cat: which file? Try: cat about.md",
      isDir: (p: string) => `cat: ${p}: is a directory. Try: ls ${p}`,
      binary: (p: string) => `cat: ${p}: binary file. Try: open ${p}`,
    },
    tree: {
      description: "Show the folders as a tree (-a for hidden files)",
      usage: "tree [-a] [path]",
      summary: (dirs: number, files: number) =>
        `${dirs} ${dirs === 1 ? "directory" : "directories"}, ${files} ${files === 1 ? "file" : "files"}`,
    },
    open: {
      description: "Open a file or a project: a page, the PDF, or a track to play",
      usage: "open <path | project>",
      missing: "open: what should I open? Try: open resume.pdf",
      cannot: (p: string) => `open: ${p}: nothing to open here`,
      opening: (where: string) => `Opening ${where}…`,
      playing: (title: string, artist: string) =>
        `Playing ${title} — ${artist}`,
      noPage: (slug: string) => `open: ${slug} has no page or link yet`,
    },
    // --- Site control (6.5) ---------------------------------------------------------------
    /** Shared by the commands whose feature lands in a later phase. TODO(content): review. */
    soon: (feature: string, phase: string) =>
      `${feature} is on its way (${phase}). Watch this space.`,
    /** Shared: a value that isn't one of the choices. */
    oneOf: (command: string, got: string, choices: readonly string[]) =>
      `${command}: "${got}" isn't one of: ${choices.join(", ")}`,
    projects: {
      description: "My projects as a table (--stack or --domain to filter)",
      usage: "projects [--stack <tech>] [--domain <kind>]",
      head: ["Slug", "Title", "Year", "Stack"],
      count: (shown: number, total: number) =>
        shown === total
          ? `${total} ${total === 1 ? "project" : "projects"}. Open one: open <slug>`
          : `${shown} of ${total} projects. Open one: open <slug>`,
      none: (filter: string, options: string) =>
        `No projects match ${filter}. Try one of: ${options}`,
      flagValue: (flag: string) => `projects: --${flag} needs a value, e.g. --${flag}=react`,
    },
    goto: {
      description: "Go to a page (by name or number)",
      usage: "goto <page>",
      missing: (pages: string) => `goto: where to? One of: ${pages}`,
      unknown: (page: string, pages: string) =>
        `goto: no page called "${page}". One of: ${pages}`,
      going: (number: string, name: string) => `Going to ${number} ${name}…`,
      here: (name: string) => `You're on ${name} already. Back to the top.`,
    },
    play: {
      description: "Play music (a track number or name), or a game",
      usage: "play [track | slice | stack]",
      resuming: "Playing.",
      playing: (title: string, artist: string) => `Playing ${title} — ${artist}`,
      unknown: (what: string) =>
        `play: no track called "${what}". Try: ls music/ or play 1`,
      game: (name: string) => `The ${name} game`,
      games: "phase 9",
    },
    pause: {
      description: "Pause the music",
      usage: "pause",
      paused: "Paused. play picks it back up.",
      nothing: "Nothing's playing. Try: play",
    },
    next: {
      description: "Skip to the next track",
      usage: "next",
    },
    prev: {
      description: "Back to the previous track (or the start of this one)",
      usage: "prev",
    },
    /** next / prev before the music ever started. */
    noMusic: "The music isn't on yet. Try: play",
    nowPlaying: (title: string, artist: string) => `Now playing ${title} — ${artist}`,
    vol: {
      description: "Show or set the volume, 0 to 100",
      usage: "vol [0-100]",
      level: (n: number) => `Volume ${n}%`,
      bad: (v: string) => `vol: "${v}" isn't a number from 0 to 100`,
    },
    sound: {
      description: "Turn sound on or off (music and UI sounds)",
      usage: "sound [on | off]",
      state: (on: boolean) => (on ? "Sound is on." : "Sound is off."),
      already: (on: boolean) => (on ? "Sound's already on." : "Sound's already off."),
    },
    theme: {
      description: "Switch the theme",
      usage: "theme [dark | light | toggle]",
      state: (mode: string) => `The theme is ${mode}.`,
      already: (mode: string) => `Already ${mode}. Easy one.`,
      switched: (mode: string) => `Switched to ${mode}.`,
    },
    particles: {
      description: "Reshape the particles, or blow them up",
      usage: "particles <shape> | --explode | --reset",
      /** Names a visitor types → the canvas's shape ids (canvas/shapes/registry.ts). */
      shapes: {
        room: "home",
        sphere: "about",
        laptop: "work",
        rings: "skills",
        controller: "arcade",
        envelope: "contact",
        name: "name",
        grid: "grid",
        scatter: "scatter",
      },
      missing: (shapes: string) =>
        `particles: which shape? One of: ${shapes}, or --explode / --reset`,
      shaped: (shape: string) => `Particles: ${shape}. particles --reset puts them back.`,
      exploded: "Boom. They'll find their way back.",
      reset: "Particles back to this page's shape.",
      still: "Reduced motion is on, so they stay put.",
    },
    ar: {
      description: "Hand mode on or off (control the site with your hand)",
      usage: "ar [on | off]",
      state: (on: boolean) => (on ? "Hand mode is on." : "Hand mode is off."),
      /** 8.1: Hand asks for the camera first (the explainer opens over the terminal). */
      on: "Asking for your camera. The video never leaves your device.",
      already: "Hand mode is already on.",
      off: "Hand mode off. Camera off, back to the mouse.",
    },
    ask: {
      description: "Ask the chatbot something about me",
      usage: "ask <question>",
      missing: "ask: what do you want to know? Try: ask what are you working on",
      feature: "The chatbot",
      phase: "phase 7",
      meanwhile: "Meanwhile: cat about.md has the short version.",
    },
    contact: {
      description: "Send me a message without leaving the terminal",
      usage: "contact [--topic=project|collab|hi]",
      intro: "Let's write a message. Ctrl+C cancels at any point.",
      name: "Your name:",
      email: "Your email (so I can reply):",
      message: "Your message (one line):",
      summary: "Here's what I'll send:",
      labels: { topic: "Topic", name: "Name", email: "Email", message: "Message" },
      confirm: "Send it? (y/n)",
      yesNo: "Type y to send or n to cancel.",
      sending: "Sending…",
      sent: "Sent. I'll reply within a day.",
      cancelled: "Not sent. Nothing left the terminal.",
    },
    /** Shared: a path that doesn't exist. */
    notFound: (command: string, p: string) =>
      `${command}: ${p}: no such file or directory`,
    grep: {
      description: "Keep the piped lines that match a pattern",
      usage: "grep [-i] [-v] [-n] <pattern>",
      noPattern: "grep: what should I look for? Try: help | grep music",
      noInput: "grep: nothing to search. Pipe something in: help | grep music",
    },
  },
} as const;
