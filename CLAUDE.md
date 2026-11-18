# CLAUDE.md — The Living Canvas (Nasheet's portfolio)

This file is the source of truth for how this project is built. Read it fully before
writing code. If a request conflicts with a rule here, point out the conflict and ask
before going ahead.

---

## 1. What this project is

A personal portfolio website for Nasheet, built as a showcase of interaction design,
motion, 3D and frontend engineering.

The goal is that **every interaction feels smooth and intentional**. Smoothness matters
more than adding features. A feature that drops frames is not finished.

---

## 2. The concept: one living canvas

The whole site sits on **one continuous WebGL particle scene** that every feature talks to.
Content floats on top of it in clean, frosted-glass panels set in iOS-style typography.

- **Scroll** reshapes the particles. Each homepage chapter has a target shape (your name →
  sphere → grid → controller → envelope).
- **Music** makes the particles breathe and pulse with the track.
- **Hand (AR)** pushes the particles away like water, and a pinch acts as a click.
- **Terminal commands** change the scene live (`particles --explode`, `theme light`).
- **Chatbot** makes the canvas pulse while it is answering.

Non-goals: no OS/desktop metaphor, no whiteboard or kanban board, no iOS-looking UI.
**Only the typography is iOS-style**; the layout and visual language are original.

### Features and where they live

| Feature | Where it lives | How a visitor reaches it |
| --- | --- | --- |
| Smooth experience | Everywhere | Lenis + GSAP, one shared clock |
| AR hand control | Global toggle in the nav; also drives the Slice game | AR button, or `ar on` |
| Music | Persistent mini-player, bottom-left; drives the canvas | "Enter with sound", or `play` |
| iOS-style fonts | All text | Self-hosted SF Pro Text, Display and Mono |
| Chatbot | Floating "Ask" bubble, bottom-right | Click it, press `/`, or `ask …` |
| Working terminal | Drop-down drawer; full page on mobile | Backtick key (`) or the nav icon |
| Games (2) | `/arcade`: Slice (played by hand) and Stack (3D tower) | Arcade chapter, or `play slice` / `play stack` |

### Routes

- `/` — homepage scroll chapters: Hero → About → Work → Skills → Arcade → Contact
- `/work/[slug]` — case studies (MDX)
- `/arcade`, `/arcade/slice`, `/arcade/stack`
- `/terminal` — full-page terminal for mobile
- `/credits` — asset credits generated from the license fields in `content/`
- `/api/chat`, `/api/scores`, `/api/contact` — server routes
- `/dev` — component and type specimen page; never linked from the site

---

## 3. Stack (locked)

Do not add, swap or remove a dependency without asking first. Say why it is needed and
what it costs in bundle size.

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript (strict) |
| Styling | Tailwind CSS + CSS variables for design tokens |
| State | Zustand (one store, sliced) |
| 3D | Three.js via React Three Fiber + drei; custom GLSL shaders |
| Motion | GSAP + ScrollTrigger (+ SplitText), Framer Motion, Lenis |
| Audio | Web Audio API (no audio library unless approved) |
| AR | `@mediapipe/tasks-vision` HandLandmarker, run in a Web Worker |
| Game physics | `cannon-es` (Stack only) |
| Chatbot | Next.js route handler + Vercel AI SDK (`streamText`) + an LLM API |
| Backend | Supabase (leaderboards, contact messages, chat rate limits) |
| Content | `content/*.ts` typed data + MDX for case studies (`@next/mdx`) |
| UI utilities | `clsx`, `tailwind-merge` (for `cn()`), `lucide-react` icons |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights` (added in chunk 11.1) |
| Dev only | `prettier-plugin-tailwindcss`, `eslint-config-prettier`, `@next/bundle-analyzer`, `raw-loader` (GLSL imports), `vitest` |

Scripts must work on Windows, macOS and Linux. Don't use Unix-only syntax like `VAR=value cmd`
in `package.json`; set environment variables in a small Node script in `scripts/` instead
(for example `scripts/analyze.mjs`). No `cross-env`.

Any package not in this table needs approval, including ones a build-plan chunk names.

### Responsibilities (don't mix them)

- **GSAP + ScrollTrigger** — scroll chapters, shader uniform tweens, text reveals, game timelines.
- **Framer Motion** — UI components: panels, drawer, chat, player, layout animations, route transitions.
- **Lenis** — scrolling only, driven by `gsap.ticker`.
- Never animate the same property of one element with two libraries.

---

## 4. Folder layout

```
app/
  layout.tsx            # mounts Canvas, Gate, Nav, PersistentLayer, Cursor ONCE
  template.tsx          # page-transition enter
  page.tsx              # homepage scroll chapters
  work/[slug]/page.tsx  # case studies
  arcade/               # layout.tsx, page.tsx, slice/, stack/
  terminal/page.tsx
  credits/page.tsx
  dev/page.tsx
  api/chat/route.ts
  api/scores/route.ts
  api/contact/route.ts
canvas/                 # CanvasRoot.tsx, Scene.tsx, particles/, shaders/*.glsl, shapes/
features/ar/            # camera.ts, tracker.ts, hand.worker.ts, gestures.ts, oneEuro.ts, synthetic.ts
games/                  # shared/, slice/, stack/ — each game self-contained
components/
  ui/                   # primitives: Button, Chip, Kbd, Card, BentoGrid, Tooltip …
  cards/                # bento card kit: ProfileCard, StatCard, PhotoCard …
  motion/               # RevealText, ScrambleText, Marquee
  overlay/              # Sheet, Modal, Drawer, Toast
  media/                # Img, LoopVideo, Avatar
  cursor/  nav/  gate/  layer/  chapters/  case-study/  contact/
  player/  chat/  terminal/  ar/  dev/
lib/
  store.ts              # the Zustand store
  audio/                # context.ts, engine.ts, levels.ts, mediaSession.ts
  chat/                 # knowledge.ts, system.ts, rateLimit.ts, tools.ts
  commands/             # one file per terminal command + registry.ts + parser.ts + types.ts
  motion/               # gsap.ts, lenis.ts, tokens.ts, intro.ts, scrollMemory.ts
  hooks/                # useReducedMotion, useMediaQuery, useFocusTrap, useCountUp …
  fs.ts                 # virtual filesystem built from content/
  sfx.ts  shortcuts.ts  quality.ts  preload.ts  theme.ts  browser.ts  supabase.ts  utils.ts
content/                # profile, socials, projects, skills, music, chapters, copy, preload (.ts),
                        # knowledge.md, case-studies/*.mdx
supabase/migrations/    # 001_contact.sql, 002_chat.sql, 003_scores.sql
scripts/                # analyze, check-content, chat-eval, copy-mediapipe-wasm, compress-media
docs/                   # motion-audit.md, deploy.md
public/                 # fonts/, models/, audio/, sfx/, mediapipe/
```

Put new code in the folder that owns it. Don't create new top-level folders without asking.

---

## 5. Architecture rules

1. **One store.** Every input (scroll, music, hand, terminal, chatbot) writes to the Zustand
   store in `lib/store.ts`. The canvas and the UI only read from it. Features never import
   or call each other directly. Terminal `ar on` and the AR button flip the same store flag.
2. **Store slices:** `audio` (playing, track, volume, bass/mid/high levels), `scroll`
   (chapter, progress), `ar` (enabled, status, hand x/y, pinching), `ui` (terminal open,
   chat open, chat streaming, sound enabled), `theme`.
3. **Fast values skip React.** Audio levels, hand position and scroll progress change every
   frame. Read them with `useStore.getState()` inside `useFrame` or the ticker, and keep them
   in refs. Never put them in `useState`, and never subscribe a component to them.
4. **One clock.** `gsap.ticker` drives Lenis (`lenis.raf`), and Lenis scroll events call
   `ScrollTrigger.update`. The R3F scene reads the same state on the same frame. Don't start
   extra `requestAnimationFrame` loops; the AR worker and game loops are the only exceptions.
5. **Persistent layer.** The canvas, MiniPlayer, ChatBubble, TerminalDrawer and ARToggle mount
   once in `app/layout.tsx` and must survive navigation. Music must never stop on a route change.
6. **Single content source.** `content/projects.ts` feeds the hero stats, Work filters,
   case studies, the terminal's `projects` and `ls`, and the chatbot. Never hardcode a project
   or a count anywhere else.
7. **Heavy things load on demand.** Use `next/dynamic` with `ssr: false` for the canvas,
   terminal, AR and both games. The MediaPipe WASM and model load only when AR is switched on.
   Game code loads only when a game is opened.

---

## 6. Performance rules (a feature isn't done until these pass)

- **60 fps** on a mid-range Android phone and a low-end laptop, with the canvas running.
- **First-load JS around 200 KB gzipped** or less on `/`. Check with `@next/bundle-analyzer`.
- **Largest content visible in under 2.5 s** on a throttled connection.
- Animate **only `transform` and `opacity`** on DOM elements. Never width, height, top, left or margin.
- Cap `devicePixelRatio` at 1.5–2. Particle count is 20k–40k in **one draw call**.
- **Quality tiers:** measure frame time over the first 2 s. If it's slow, halve the particles
  and lower the DPR automatically.
- No main-thread task over 50 ms. Hand detection runs in a worker, capped at about 30 fps.
- No component re-renders every frame (check with the React Profiler and `r3f-perf`).
- Images: `next/image` (AVIF/WebP). Video: short compressed WebM loops. GLB: Draco or meshopt.
  Audio: 128–192 kbps.
- Dispose of Three.js geometries, materials and textures on unmount. Stop camera tracks
  when AR turns off.

---

## 7. Typography (iOS-style)

- Fonts: **SF Pro Text, SF Pro Display, SF Mono**, self-hosted as WOFF2 in `public/fonts/`
  and loaded with `next/font/local` as `--font-sf-text`, `--font-sf-display`, `--font-sf-mono`.
  Load only the weights in use (400, 500, 600, 700).
- Never hardcode a font family outside these variables.
- Use Display for 20 pt and above and Text below it, as iOS does.
- Stacks: body `var(--font-sf-text), -apple-system, system-ui, sans-serif`;
  mono `var(--font-sf-mono), ui-monospace, monospace`.
- Type scale as Tailwind tokens (px): Large Title 34, Title1 28, Title2 22, Title3 20,
  Headline 17 semibold, Body 17, Callout 16, Subhead 15, Footnote 13, Caption1 12, Caption2 11.
- Tracking: about −0.02em on large sizes, slightly positive on 11–13 px. Use
  `-webkit-font-smoothing: antialiased`.
- Use only scale tokens. No one-off font sizes.

---

## 8. Design and motion rules

- **Dark theme first**, with a light theme. All colours, radii and spacing come from CSS variables
  wired into Tailwind. No raw hex values in components.
- Panels are frosted glass (`backdrop-filter: blur`) over the canvas, and text on them must stay readable.
- Spacing on an 8 px grid.
- Motion should feel physical: use spring or ease-out curves, never linear for UI. Most UI
  transitions run 200–400 ms; scroll morphs follow the scroll.
- Every interactive element needs hover, focus-visible, active and disabled states.
- UI sounds are short (under 100 ms), throttled, and **fully silent** when sound is off.
- Respect Figma frames when they exist. If a design decision isn't covered, propose it; don't invent silently.

### UI/UX direction

- **Quality bar:** the reference portfolio (chandreshhere.com): dense, personal, card-based
  modules with real personality. Match its polish; never copy its layout, copy or content.
- **Layout:** every homepage chapter is a 12-column bento grid of cards floating over the
  canvas (6 columns on tablets, 1 on phones), with a 16 px gap. Every card says what it is
  at a glance.
- **Surfaces:** three levels only: canvas → glass card (blur 24 px, 1 px hairline border,
  faint top inner highlight) → solid overlay. Radius: 24 px cards, 12 px controls, round chips.
- **Card kit** (build pages from these; don't invent one-off cards): ProfileCard, StatCard,
  SocialCard, PhotoCard, SkillsCard, CTACard, NowPlayingCard, TextCard, ProjectCard, GameCard.
- **Micro-interactions:** hover lift 2 px + shadow + pointer spotlight (CSS variables, no React
  state); press scale 0.97 with a spring; 2 px accent focus ring; staggered entry (40–60 ms);
  numbers count up once; skeletons in the card's shape instead of spinners; every action gives
  feedback within 100 ms.
- **Motion:** one signature move per chapter, and everything else quiet. Only the status dot
  and the now-playing bars loop.
- **Copy:** short, first person, a little funny. Labels say what happens. Every string lives
  in `content/copy.ts` or another `content/` file, never hardcoded in a component.
- **UI chunks:** match the attached Figma PNG. If none is attached, ask for it before building.

---

## 9. Feature specs

### 9.1 Entry gate
- Preload critical assets with a **real** 0–100% counter (never fake progress).
- Two choices: "Enter with sound" and "Enter in silence". Create the `AudioContext` inside
  the click handler, because browsers only allow audio after a user gesture.
- Save the choice in localStorage (wrapped in try/catch) and skip the gate on repeat visits.

### 9.2 Particle canvas
- One `Points` mesh, a custom `ShaderMaterial`, and attributes `aFrom` and `aTo`.
- Shapes are precomputed `Float32Array`s that all have the same point count: `fromText`,
  `fromModel` (MeshSurfaceSampler), and maths shapes. Morphing tweens `uMorph` 0→1, with a
  random delay per particle.
- Uniforms: `uTime`, `uMorph`, `uScroll`, `uPointer`, `uPointerRadius`, `uPointerStrength`,
  `uBass`, `uMid`, `uHigh`, `uPulse`, `uColorA`, `uColorB`, `uTheme`.
- Fallbacks: reduced motion gets a still frame of the hero shape; no WebGL gets a CSS gradient.

### 9.3 Music
- Signal chain: `<audio>` → `MediaElementSource` → gain (for crossfades) → `AnalyserNode` → speakers.
- The playlist lives in `content/music.ts` and includes each track's license source. Use only
  tracks Nasheet has the rights to stream.
- Use the Media Session API so lock screens and media keys control playback.
- Each frame, analyser data is reduced to smoothed bass, mid and high levels in the store,
  plus a beat flag for `uPulse`.

### 9.4 Terminal
- Built in-house (no xterm.js). Prompt: `nasheet@portfolio:~$`.
- Must support: history (↑/↓), Tab autocomplete for commands and paths, Ctrl+L, Esc to close,
  and quoted arguments with `--flags`.
- **Command contract:** one file per command in `lib/commands/`, exporting
  `{ name, description, usage, run(args, ctx) }`. `ctx` provides `print`, `store`, `router`
  and `fs`. Register every command in `registry.ts`, and every command must appear in `help`.
- The virtual filesystem (`lib/fs.ts`) is generated from `content/`, never hand-written.
- Required commands: `help` (alias `man`), `whoami`, `neofetch`, `skills`, `ls`, `cd`, `pwd`,
  `cat`, `tree`, `open`, `grep`, `echo`, `date`, `projects`, `goto`, `play`, `pause`, `next`,
  `prev`, `vol`, `sound`, `ar`, `theme`, `particles`, `ask`, `contact`, `history`, `clear`,
  `exit`, plus a `sudo hire-me` easter egg. Pipes (`|`) must work.
- Rule: **every feature on the site must be reachable from the terminal.**

### 9.5 Chatbot
- `POST /api/chat` with `streamText`. The system prompt contains `content/knowledge.md` in full.
- It answers **only** about Nasheet and the portfolio, keeps answers short, and politely
  declines anything else. It must never invent facts that aren't in `knowledge.md`.
- Cap input length and maximum output tokens. Rate-limit per IP (for example 20 messages
  an hour) using a Supabase table.
- The UI streams token by token, offers 3–4 suggested questions, turns site links into
  navigation buttons, and sets `ui.chatStreaming` so the canvas pulses.
- Optional tools: `navigate`, `playTrack`, `openProject`.

### 9.6 AR hand control
- Explain before asking for the camera: video is processed on the device and never uploaded.
- Show a small mirrored preview with the hand skeleton. Handle a denied or revoked camera gracefully.
- Run detection in a worker, in `VIDEO` running mode, with `ImageBitmap` frames. Send back
  only the landmarks that are used.
- Gestures: the index fingertip moves the cursor (smoothed with a One Euro filter). A pinch,
  measured as thumb-to-index distance divided by hand size, is a click, with separate press and
  release thresholds. A pinch-drag scrolls through Lenis. An open palm held for 1 s plays or
  pauses the music. Show a legend of the gestures while AR is on.
- The fingertip writes to the same `uPointer` as the mouse.

### 9.7 Games
- Two games, polished rather than many. Both are playable with mouse or touch as well as
  by hand. Both are self-contained in `games/<name>/`, with their own loop, and pause when
  the tab is hidden.
- **Slice:** shapes fly up and are sliced when the fingertip's path crosses them; avoid bombs;
  combos; 60-second rounds. Polish: a ribbon trail, bursts, slow motion on big combos,
  screen shake, sounds, and vibration on Android.
- **Stack:** blocks slide in along alternating axes; tap to drop; overhang is sliced off and
  falls (cannon-es); perfect-drop streaks; the camera rises; colours shift per level.
- **Leaderboard:** Supabase table `scores(game, name, score, duration_ms, created_at)` with RLS
  on and writes only from the server (service key). Submit through `/api/scores`, which
  rejects scores impossible for the time played and rate-limits by hashed IP.

---

## 10. Accessibility and fallbacks (required, not optional)

- The site must work fully **without WebGL, without sound and without a camera**.
- `prefers-reduced-motion`: native scrolling instead of Lenis, no morphs, and no shake or slow-motion.
- Everything is reachable by keyboard, with visible focus rings, ARIA labels on the player,
  chat and terminal, and AA colour contrast on glass panels.
- Target Lighthouse 90+ for Performance, Accessibility and SEO on `/`.

---

## 11. Code conventions

- TypeScript `strict`. No `any`; use `unknown` and narrow it. Type the content data.
- Server Components by default. Add `'use client'` only where needed, and keep client
  components small.
- Components: PascalCase files, one component per file. Hooks: `useX.ts`. Shaders live in
  `.glsl` files, not template strings.
- Tailwind for styling. Use `cn()` for conditional classes. No inline style objects, except
  for values computed at runtime.
- Every effect cleans up after itself: listeners, GSAP contexts (`gsap.context().revert()`),
  observers, workers, camera tracks, audio nodes and Three.js resources.
- Wrap browser APIs (localStorage, `navigator.*`, `window`) in guards so server rendering
  never breaks.
- Secrets live only in `.env.local`. Never commit them, and never expose a non-`NEXT_PUBLIC_`
  key to the client.

### Scripts (add these in chunk 0.1)

```
npm run dev        # local dev server
npm run build      # production build — must pass before a chunk counts as done
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run format     # Prettier
npm run analyze    # bundle analyzer: node scripts/analyze.mjs (sets ANALYZE=true, runs next build)
npm run test       # vitest (from chunk 6.2)
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server only
LLM_API_KEY=                   # server only; rename to the provider's own variable
EMAIL_API_KEY=                 # optional, server only (contact form)
CHAT_SALT=                     # server only; salt for hashing IPs in rate limits
NEXT_PUBLIC_SHOW_DEV=          # set to 1 to show /dev in production builds
```

---

## 12. How Claude works on this repo

1. **Work in chunks.** The build plan breaks the work into numbered chunks (0.1, 0.2 … 11.3),
   each with Goal, Needs, Files, Build, Done when and Out of scope. Do one chunk at a time.
   Before coding, restate the chunk and its "Done when" checks in two or three lines. If a
   chunk's **Needs** aren't met, stop and say what's missing. Never touch anything listed as
   Out of scope.
2. **Plan, then code.** For anything that touches more than three files, list the files and the
   approach first, and wait for approval.
3. **Verify before saying done.** Run `typecheck`, `lint` and `build`, and fix every error.
   State exactly what you checked and what Nasheet still needs to check by hand (frame rate,
   feel, real devices).
4. **Never fake content.** Don't invent projects, numbers, bio facts, quotes or testimonials.
   Use clearly marked placeholders (`TODO(content): …`) and list them at the end of your reply.
5. **Don't touch Nasheet's own files** — `content/knowledge.md`, case-study prose, music
   licenses — beyond fixing formatting, unless he asks.
6. **No surprise dependencies or rewrites.** Ask first for any new package, any change to
   this file's rules, or any refactor outside the current chunk.
7. **Keep it smooth.** If a change could cost frames (a new effect, more particles, a
   re-render path), say so and suggest the cheaper option.
8. **Flag manual work clearly.** When a step needs Nasheet (accounts, keys, assets, recordings,
   device tests, playtests), mark it **[manual]** and stop at that point; don't work around it.
9. After finishing a chunk, update the **Progress** section below.

---

## 13. Manual work (only Nasheet can do these)

- Design: screenshots of the reference site (desktop and mobile), a Figma moodboard, palette,
  a component sheet (controls and every card type, with states), key frames for desktop and
  mobile (gate, hero, about, work, case study, skills, contact, nav, mobile menu), and a PNG
  export of each frame for its chunk.
- Copy: entry-gate lines, every UI string in `content/copy.ts`, case-study prose.
- Accounts and keys: GitHub, Vercel, Supabase, the LLM provider (with a
  monthly spend limit), and optionally an email API.
- SF Pro and SF Mono downloaded from Apple and converted to WOFF2, plus one OTF of SF Pro
  Display in `public/fonts/og/` for the Open Graph image.
- Content: bio, photo, resume PDF, project write-ups, screenshots, preview loops, and
  `content/knowledge.md` (fact-checked).
- Audio: 3–6 tracks with streaming rights and their license notes, cover art, and 5–8 UI sounds.
- 3D: 3–4 low-poly GLB models for particle shapes; the MediaPipe `hand_landmarker.task` model
  in `public/mediapipe/`.
- Testing: gesture tuning on his own webcam in bright and dim light, real-device tests
  (iPhone Safari, Android Chrome, low-end laptop), and game playtests with friends.
- Reviews: the design checkpoint (1.8), the MVP checkpoint (4.9) and the polish audit (10.1),
  each producing a fix list.
- Media: gameplay preview loops for the arcade cards, a README demo GIF, a 30-second demo
  video, and `ffmpeg` installed for the media-compression script.

---

## 14. Build order

| Phase | Focus | Week |
| --- | --- | --- |
| 0 | Foundations: scaffold, SF Pro typography, tokens and themes, motion, store, /dev (0.1–0.6) | 1 |
| 1 | Design system and UI kit: primitives, cards and bento, text motion, card kit, overlays, media, cursor and sounds, design review (1.1–1.8) | 2–3 |
| 2 | Entry gate, preloader, persistent layer, nav and shortcuts, page transitions (2.1–2.5) | 4 |
| 3 | Living canvas: particles, shapes, scroll morph, pointer, theme and moods, quality tiers (3.1–3.6) | 5–6 |
| 4 | Homepage chapters and content: content model, hero, about, work, case studies, skills, contact, SEO, MVP review (4.1–4.9) — **MVP** | 7–8 |
| 5 | Music: engine, mini-player, expanded player, audio-reactive canvas, now-playing card (5.1–5.5) | 9 |
| 6 | Terminal: UI, parser and registry, virtual filesystem, core and site commands, mobile (6.1–6.6) | 10 |
| 7 | Chatbot: knowledge, API, rate limits, UI, actions (7.1–7.5) | 11 |
| 8 | AR: permission and preview, worker tracking, gestures, legend and coach, canvas link (8.1–8.5) | 12 |
| 9 | Games: shell, Slice, Stack, leaderboard, arcade (9.1–9.7) | 13–14 |
| 10 | Polish pass: UI audit, responsive, motion, performance, bundle, accessibility, devices (10.1–10.7) | 15 |
| 11 | Ship: deploy and monitoring, README and credits, demo video (11.1–11.3) | 16 |

If scope must shrink, cut in this order: chatbot actions (7.5), then Stack (9.4–9.5). The
canvas, music, terminal, AR and Slice are the identity of the site; never cut those.

---

## 15. Progress

Current phase: **0 — Foundations**
Completed chunks: 0.1 (scaffold and tooling), 0.2 (SF Pro typography)
Carry-over into later chunks:
- **0.6:** delete the temporary type specimen `app/type/page.tsx` (from 0.2); `/dev` replaces it.
Open TODO(content) items:
- `app/page.tsx` — homepage placeholder line → `content/copy.ts` (chunk 4.1)
- `app/layout.tsx` — metadata title/description → `content/` (chunk 4.1 / 4.8)
Known issues:
- `npm run analyze` builds with `--webpack`, because `@next/bundle-analyzer` only hooks into webpack.
  Production builds use Turbopack, so the reported sizes are close but not exact. The Turbopack-native
  `next analyze` needs no package, if exact numbers are wanted later.
