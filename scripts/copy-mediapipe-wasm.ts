/*
 * Copies @mediapipe/tasks-vision's wasm/ folder into public/mediapipe/wasm (8.2), so Hand mode
 * loads MediaPipe from this site and never from a CDN. Runs as `postinstall` (so every install,
 * Vercel's included, has the files; the folder is gitignored) on Node's built-in TypeScript
 * support, like check-content.ts.
 */
import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const from = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const to = join(root, "public", "mediapipe", "wasm");

if (!existsSync(from)) {
  // A partial install (e.g. `npm ci --omit=…`) shouldn't fail on this; Hand mode would.
  console.warn(`copy-mediapipe-wasm: ${from} not found, skipped.`);
} else {
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
  console.log("copy-mediapipe-wasm: public/mediapipe/wasm updated.");
}
