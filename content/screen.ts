/*
 * The code on the laptop's screen in the particle room (R.3). Real code from this site: the
 * heart of canvas/RouteMorph.tsx, the effect that morphs the canvas you're looking at when the
 * page changes (lightly trimmed to fit 11 lines). canvas/shapes/room.ts lays each token out as a
 * bar of particles: names teal, strings and numbers amber, keywords and punctuation grey, and an
 * amber cursor block after the last line.
 */
export const screen = {
  source: "canvas/RouteMorph.tsx",
  lines: [
    "useEffect(() => {",
    "  const current = shapePageAt(pathname);",
    "  fadeTo(current ? 0 : SCATTER_FADE);",
    '  const id = current?.id ?? "scatter";',
    "  const apply = () => {",
    "    const shape = getShape(id);",
    "    if (!mesh || !shape) return;",
    "    morphTo(mesh, shape, { instant: reduced });",
    "    moodTo(current?.mood ?? fallbackMood);",
    "  };",
    "  if (getShape(id)) apply();",
  ],
  /** Drawn grey like punctuation; other names are teal, strings and numbers amber. */
  keywords: [
    "const",
    "let",
    "if",
    "return",
    "function",
    "useEffect",
    "true",
    "false",
    "null",
  ],
} as const;
