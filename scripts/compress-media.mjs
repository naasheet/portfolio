/*
 * npm run compress-media (5.1). Re-encodes every MP3 in public/audio/ above 192 kbps to 160 kbps
 * (CLAUDE.md §6: audio at 128–192 kbps), with the embedded cover art and tags removed
 * (covers are separate files). The original is kept once in stuff/audio-src/ (gitignored), so
 * running it again re-encodes from the original, never from a lossy copy.
 *
 * Needs ffmpeg and ffprobe: on PATH, or FFMPEG_PATH / FFPROBE_PATH pointing at them
 * (Windows: `winget install Gyan.FFmpeg`). Cross-platform: no shell syntax.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const audioDir = join(root, "public", "audio");
const srcDir = join(root, "stuff", "audio-src");
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
const TARGET = "160k";
const MAX_KBPS = 192;

function bitrateKbps(file) {
  const out = execFileSync(ffprobe, [
    "-v", "error", "-select_streams", "a:0",
    "-show_entries", "stream=bit_rate", "-of", "default=nw=1:nk=1", file,
  ]).toString().trim();
  return Math.round(Number(out) / 1000);
}

const mb = (f) => (statSync(f).size / 1048576).toFixed(1);

if (!existsSync(audioDir)) {
  console.log("compress-media: no public/audio/ folder, nothing to do");
  process.exit(0);
}
mkdirSync(srcDir, { recursive: true });

for (const name of readdirSync(audioDir).filter((f) => f.toLowerCase().endsWith(".mp3"))) {
  const file = join(audioDir, name);
  const original = join(srcDir, name);
  if (!existsSync(original)) copyFileSync(file, original);
  const current = bitrateKbps(file);
  if (current <= MAX_KBPS) {
    console.log(`  = ${name}: ${current} kbps, already small enough`);
    continue;
  }
  const kbps = bitrateKbps(original);
  const tmp = `${file}.tmp.mp3`;
  execFileSync(ffmpeg, [
    "-y", "-v", "error", "-i", original,
    "-map", "0:a:0", "-map_metadata", "-1",
    "-codec:a", "libmp3lame", "-b:a", TARGET, tmp,
  ]);
  renameSync(tmp, file);
  console.log(`  ✓ ${name}: ${kbps} → ${bitrateKbps(file)} kbps, ${mb(original)} → ${mb(file)} MB`);
}
console.log(`compress-media: done (originals in stuff/audio-src/)`);
