/*
 * The Now card (opened from the mug in the particle room; Home board, "The mug: Now"). Nasheet's
 * own facts. Update it as the work moves: the chunk, the count, the coffee, the last commit.
 * Follow-up: generate `lastCommit` from git at build time when the card is built.
 */
export const now = {
  headline: "Building this site, one chunk at a time.",
  /** The chunk in progress. */
  chunk: "5.4",
  /** Finished chunks: 0.1–0.6, 1.1–1.7, 2.1–2.5, 3.1–3.6, R.1–R.7, 4.1, 4.2 (replaced), 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3. */
  chunksDone: 42,
  /** The build plan's 72 chunks plus phase R's 7. */
  chunksTotal: 79,
  coffeeToday: 3,
  lastCommit: {
    hash: "a476dbe",
    /** ISO time; the card shows it as "2 h ago". */
    at: "2026-11-23T00:35:39+05:30",
    message:
      "feat(5.2): music in the island: activity, player card, live bars and scrubber",
  },
} as const;
