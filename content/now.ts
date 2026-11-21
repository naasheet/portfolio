/*
 * The Now card (opened from the mug in the particle room; Home board, "The mug: Now"). Nasheet's
 * own facts. Update it as the work moves: the chunk, the count, the coffee, the last commit.
 * Follow-up: generate `lastCommit` from git at build time when the card is built.
 */
export const now = {
  headline: "Building this site, one chunk at a time.",
  /** The chunk in progress. */
  chunk: "R.5",
  /** Finished chunks: 0.1–0.6, 1.1–1.7, 2.1–2.5, 3.1–3.6, R.1–R.4. */
  chunksDone: 28,
  /** The build plan's 72 chunks plus phase R's 7. */
  chunksTotal: 79,
  coffeeToday: 3,
  lastCommit: {
    hash: "cc97a17",
    /** ISO time; the card shows it as "2 h ago". */
    at: "2026-11-22T01:00:41+05:30",
    message: "feat(R.4): room hover, focus and open",
  },
} as const;
