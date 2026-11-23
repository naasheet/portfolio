/*
 * The Now card (opened from the mug in the particle room; Home board, "The mug: Now"). Nasheet's
 * own facts. Update it as the work moves: the chunk, the count, the coffee, the last commit.
 * Follow-up: generate `lastCommit` from git at build time when the card is built.
 */
export const now = {
  headline: "Building this site, one chunk at a time.",
  /** The chunk in progress. */
  chunk: "8.2",
  /** Finished chunks: 0.1–0.6, 1.1–1.7, 2.1–2.5, 3.1–3.6, R.1–R.7, 4.1, 4.2 (replaced), 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1–5.5, 6.1–6.6, 8.1. */
  chunksDone: 51,
  /** The build plan's 72 chunks plus phase R's 7. */
  chunksTotal: 79,
  coffeeToday: 3,
  lastCommit: {
    hash: "2198aba",
    /** ISO time; the card shows it as "2 h ago". */
    at: "2026-11-23T06:00:26+05:30",
    message: "chore(order): move Phase 7 (chatbot) after Phase 9",
  },
} as const;
