/*
 * The Now card (opened from the mug in the particle room; Home board, "The mug: Now"). Nasheet's
 * own facts. Update it as the work moves: the chunk, the count, the coffee, the last commit.
 * Follow-up: generate `lastCommit` from git at build time when the card is built.
 */
export const now = {
  headline: "Building this site, one chunk at a time.",
  /** The chunk in progress. */
  chunk: "4.7",
  /** Finished chunks: 0.1–0.6, 1.1–1.7, 2.1–2.5, 3.1–3.6, R.1–R.7, 4.1, 4.2 (replaced), 4.3, 4.4, 4.5, 4.6. */
  chunksDone: 37,
  /** The build plan's 72 chunks plus phase R's 7. */
  chunksTotal: 79,
  coffeeToday: 3,
  lastCommit: {
    hash: "15a893b",
    /** ISO time; the card shows it as "2 h ago". */
    at: "2026-11-22T15:37:42+05:30",
    message: "feat(4.5): case-study template with MDX and a shared-element cover",
  },
} as const;
