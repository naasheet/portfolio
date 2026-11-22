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
    help: {
      description: "List every command",
      usage: "help",
      count: (n: number) => `${n} commands. Type one to run it.`,
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
      description: "Open a file: a page, the PDF, or a track to play",
      usage: "open <path>",
      missing: "open: what should I open? Try: open resume.pdf",
      cannot: (p: string) => `open: ${p}: nothing to open here`,
      opening: (where: string) => `Opening ${where}…`,
      playing: (title: string, artist: string) =>
        `Playing ${title} — ${artist}`,
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
