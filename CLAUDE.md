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
  providers/            # SmoothScroll and other app-wide client wiring (render nothing or wrap)
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
- Respect the design frames when they exist. If a design decision isn't covered, propose it; don't invent silently.

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
- **UI chunks:** match the attached design PNG (exported from the Key Frames canvas or Figma). If none is attached, ask for it before building.

### Palette (B — Signal Teal)

Near-black neutral, teal accent, amber for highlights. CSS variables use these names
(`--color-bg-base` …). Every text pair below passes WCAG AA.

| Token | Dark | Light |
| --- | --- | --- |
| `bg/base` | `#090B0B` | `#F4F7F6` |
| `surface/glass` (base fill; blur and opacity set at the layer) | `#1E2524` | `#E4EBE9` |
| `surface/solid` | `#121716` | `#FFFFFF` |
| `text/primary` | `#F4F7F6` | `#121716` |
| `text/secondary` | `#A3B2AF` | `#43514F` |
| `text/tertiary` | `#7A8B88` | `#5B6B68` |
| `border/default` | `#2F3A38` | `#C9D4D2` |
| `border/focus` | `#2EC0A0` | `#22997F` |
| `accent/primary` | `#2EC0A0` (dark text on it) | `#187263` (white text on it) |
| `accent/primary-hover` | `#4FD9B8` | `#11564A` |
| `accent/contrast` (text and icons on `accent/primary`) | `#090B0B` | `#FFFFFF` |
| `accent/secondary` (amber) | `#FFC56B` | `#E68D1E` |
| `canvas/particle-a` (`uColorA`) | `#2EC0A0` | `#22997F` |
| `canvas/particle-b` (`uColorB`) | `#FFC56B` | `#FFAD3D` |
| `status/success` | `#2EC0A0` | `#187263` |
| `status/danger` | `#FF7A6B` | `#B42318` |
| `overlay/scrim` | `#000000` | `#000000` |

- Glass cards in dark mode: `rgba(30, 37, 36, 0.55)` + `backdrop-filter: blur(24px)` + 1 px
  `border/default` + `inset 0 1px 0 rgba(244, 247, 246, 0.06)`.
- Light-mode amber fails as text (2.4:1): use it only as a fill with dark text, or in the canvas.

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
9. **After every chunk, update this file, then commit and push.** Once the checks pass:
   - Update **Progress** (§15): completed chunks, carry-overs, open `TODO(content)` items,
     known issues, and any decision a fresh session would need to know.
   - If the chunk changed a rule, the stack, a script or the folder layout, update that section too.
   - Commit the chunk's code and this file together (conventional commit, e.g.
     `feat(0.3): …`), then `git push` to `origin main`. Nasheet has approved commit and push
     after each chunk; no need to ask.
   - Assume the next chunk may start in a fresh session with no memory of this one. If it isn't
     written here or in the code, it's lost.

---

## 13. Manual work (only Nasheet can do these)

- Design: mobile (390 px) screenshots of the reference site; reviewing and approving the
  component sheet (controls and every card type, with states) and the desktop and mobile key
  frames (gate, hero, about, work, case study, skills, contact, nav, mobile menu) that the
  planning chat draws on the Key Frames canvas; and a PNG export of each frame for its chunk.
  Done: desktop reference screenshots, reference board, palette.
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

Current phase: **1 — Design system and UI kit** (phase 0 is complete)
Completed chunks: 0.1 (scaffold and tooling), 0.2 (SF Pro typography), 0.3 (design tokens and
themes), 0.4 (motion foundation), 0.5 (store and shared utilities), 0.6 (/dev specimen page),
1.1 (primitives)
Carry-over into later chunks:
- **Phase 1:** every new component gets a section on `/dev` (a `DevSection` with each state:
  hover, focus-visible, active, disabled). Fake hover/pressed/focus cells with the classes in
  `components/dev/devStates.ts` (dev only; components never take a "force state" prop), and lay
  states out with `DevState`.
- **Bundle (every chunk that touches `/`):** first-load JS is about 197 KB after 1.1, so only about
  3 KB is left. Anything new on `/` goes behind `next/dynamic`. If it gets tight, register
  SplitText lazily where it's used (about 6 KB).
- **1.5 / 10.x:** Tooltip has no collision handling (no flip or shift at the screen edge). Add it
  if a tooltip sits near an edge.
- **1.5 overlays:** use `lockScroll()` / `unlockScroll()` from `lib/motion/lenis.ts`. They don't
  compensate for the scrollbar width yet (the layout may shift by the scrollbar's width on Windows); handle that there.
- **2.x nav:** in-page links should be plain `<a href="#id">` (the SmoothScroll handler glides
  them). `next/link` with a hash handles the click itself and jumps natively; use `scrollTo()`
  if a Link is needed.
- **2.5 route transitions:** call `getLenis()?.scrollTo(0, { immediate: true })` (or restore the
  saved position) on navigation, and `ScrollTrigger.refresh()` once the new page's layout settles.
- **Fonts and ScrollTrigger:** call `ScrollTrigger.refresh()` after `document.fonts.ready` once
  real chapters exist (3.3 / 4.x), so trigger positions account for the loaded fonts.
- **1.x / 2.4:** a site theme toggle (the one on `/dev` is dev-only), and the glass recipe (blur + hairline + inset top highlight)
  as a reusable class or card base. 0.3 only ships the tokens.
- **3.5:** the canvas reads `--color-canvas-particle-a/b` with `getComputedStyle` and re-reads on
  theme change (watch `data-theme` on `<html>`).
Open TODO(content) items:
- `app/page.tsx` — homepage placeholder line → `content/copy.ts` (chunk 4.1)
- `app/layout.tsx` — metadata title/description → `content/` (chunk 4.1 / 4.8)
Known issues:
- `/favicon.ico` returns 404 (there's no icon yet). It shows as one console error on every page.
  Add `app/icon.*` with the brand assets (11.2 at the latest).
- The browser-automation skill's runner wants Chromium build 1248, but only 1243 is in
  `%LOCALAPPDATA%\ms-playwright`. For 1.1 a small patchright runner with `executablePath` pointed
  at 1243 was used. Headless Chromium prefers light, so pages open in the light theme.
- `npm run analyze` builds with `--webpack`, because `@next/bundle-analyzer` only hooks into webpack.
  Production builds use Turbopack, so the reported sizes are close but not exact. The Turbopack-native
  `next analyze` needs no package, if exact numbers are wanted later.
- Git converts files to CRLF on Windows checkout. A `.gitattributes` with `* text=auto eol=lf` is
  proposed but not approved yet.

Decisions so far (don't re-ask):
- **SF Pro license:** Nasheet knows Apple's license only covers UI mock-ups for Apple platforms,
  and chose to self-host SF Pro anyway. Don't raise it again.
- **Font files:** `public/fonts/sf-{pro-text,pro-display,mono}-{400,500,600,700}.woff2`, subset to
  Latin, Latin-1, Latin Ext-A, punctuation, currency, arrows, maths, box-drawing and geometric shapes.
  `public/fonts/og/SF-Pro-Display-Bold.otf` is a subset OTF for OG images (next/og can't read WOFF2).
  The source installers in `stuff/*.dmg` are gitignored. For non-Latin text, re-subset from the DMGs
  (7-Zip, then fontTools `pyftsubset`).
- **Stack versions:** Next.js 16.4 (App Router, Turbopack, `cacheComponents` and
  `partialPrefetching` on), React 19.3, Tailwind v4 via `@tailwindcss/turbopack`. There's no
  `tailwind.config.ts` or PostCSS config; theme tokens live in `@theme` in `app/globals.css`.
  `AGENTS.md` is Next's own agent-rules file; `next dev` re-creates it, so it stays committed.
  Next 16's own docs are in `node_modules/next/dist/docs/`.
- **Scripts:** `typecheck` = `next typegen && tsc --noEmit` (global types like `LayoutProps` need
  typegen). `lint` = `eslint . --max-warnings 0`. `analyze` = `node scripts/analyze.mjs`.
- **ESLint:** `eslint-config-prettier/flat` stays the last entry in `eslint.config.mjs`.
- **Fonts loading:** `app/fonts.ts` exports `fontVariables` for `<html>`. Only SF Pro Text is
  preloaded; Display and Mono load on first use. Mono uses `adjustFontFallback: false`.
- **Text tokens:** one `@utility text-<name>` per token in `globals.css` (family, size, line height,
  tracking; weight only on headline). Stat sizes use line height 1.0, Display, and no fixed weight.
  Every token is also listed in `TEXT_TOKENS` in `lib/utils.ts`, so `cn()` treats it as a font size,
  not a colour. Keep the two lists in sync. `body` repeats the `text-body` values in `@layer base`.
  Use Tailwind's built-in `tabular-nums` for numbers.
- **Palette:** B — Signal Teal, picked from three options. Values are in §8 (Palette); chunk 0.3
  builds the theme tokens from that table. Two shades were moved one step for AA contrast (dark
  `text/tertiary`, light `accent/primary`); the table is current, the Figma variables are not yet.
- **Theme tokens (0.3):** all hex values live only in `app/globals.css`. Dark values sit in
  `@theme static` (the default, registered as Tailwind utilities: `bg-bg-base`,
  `text-text-primary`, `border-border-default`, `bg-accent-primary` …), and
  `:root[data-theme="light"]` overrides the same variables. There's no separate dark block: dark
  is the default. Tailwind's default palette is removed (`--color-*: initial`); only
  `transparent` and `current` are added back. `--glass-fill` is a plain per-theme variable,
  exposed as `bg-glass-fill`. Other tokens: `rounded-card/control/chip`, `backdrop-blur-glass`,
  `shadow-lift/overlay` (lighter in light mode), `z-canvas/content/persistent/overlay/toast/cursor`,
  Tailwind's `ease-out` overridden to our curve, and `--duration-fast/base/slow` CSS variables.
- **Spacing:** Tailwind's default 4 px base stays. The 8 px grid is the even steps (`p-2` = 8,
  `gap-4` = 16). Don't use odd steps.
- **tailwind-merge:** radius, blur and z-index tokens are registered in `lib/utils.ts` (like
  `TEXT_TOKENS`). Add any new non-colour token there too.
- **Theme switching:** `components/ui/ThemeScript.tsx` (inline in `<head>`; saved choice, then
  `prefers-color-scheme`, then dark) sets `data-theme` before paint. `<html>` has
  `suppressHydrationWarning` for that reason. Use `setTheme()`, `getTheme()` and
  `THEME_STORAGE_KEY` (`"theme"`) from `lib/theme.ts`. In dev only, the inline script also puts
  `window.setTheme` on the page for console testing; it isn't in production builds.
- **Motion tokens:** `lib/motion/tokens.ts` has `duration` (ms), `durationS` (s), `easeOut`
  (CSS string), `easeOutPoints` (Framer array) and `spring.snappy/soft/gentle`. These are plain
  objects, so Framer Motion isn't needed yet. Keep them in sync with the CSS variables.
- **Motion packages (0.4):** `gsap` 3.15 (SplitText is free and included), `@gsap/react`, `lenis`
  1.3, `framer-motion` 14 (installed, not imported yet). Import GSAP, plugins and `useGSAP` only
  from `lib/motion/gsap.ts`, which registers ScrollTrigger, SplitText and useGSAP once.
- **Smooth scroll:** `components/providers/SmoothScroll.tsx` is mounted once in `<body>` and
  renders nothing. Lenis uses `autoRaf: false` and `lerp: 0.1`, is driven by `gsap.ticker`, and
  sets `lagSmoothing(0)`; `lenis.on('scroll', ScrollTrigger.update)`. Lenis's CSS is copied into
  `@layer base` in `globals.css`. Don't set CSS `scroll-behavior: smooth` anywhere.
- **Anchors:** Lenis's `anchors` option is off on purpose: it doesn't cancel the native jump, so
  the page flashed to the target for one frame. SmoothScroll has its own click handler for
  same-page `#hash` links: it cancels the jump, `pushState`s the hash and calls `scrollTo()`.
- **`lib/motion/lenis.ts`:** `getLenis()`, `scrollTo(target, opts)`, and `lockScroll()` /
  `unlockScroll()` (counted, so overlays can nest). All of them fall back to native scrolling
  when Lenis is off.
- **Reduced motion:** `useReducedMotion()` (`lib/hooks/`) returns `true` on the server and during
  hydration, then the real value, so motion never starts and tears down on first load. It
  updates live. With reduced motion, Lenis isn't created at all.
- **Verified 0.4 (headless Chromium, production build):** `html.lenis` is present normally and
  absent when reduced motion is emulated, both live and after a reload. An anchor glide rises
  steadily, with no native jump. The pinned section stays at top 0 px across its whole range
  while the bar scrubs from 0 to 1. No console errors.
- **Bundle after 0.4:** about 183 KB (185 KB measured again at the start of 1.1; 197 KB after 1.1) gzipped first-load JS on `/`. That's the Next/React base of
  about 128 KB, plus GSAP, ScrollTrigger and SplitText (46 KB), plus Lenis and SmoothScroll
  (9 KB). Next's 38 KB `noModule` polyfill chunk doesn't count, because modern browsers skip it.
  About 17 KB of headroom is left: keep everything else on `/` behind `next/dynamic`. If it gets
  tight, register SplitText lazily where it's used (saves about 6 KB).
- **Store (0.5):** `zustand` 5 with `subscribeWithSelector`, in `lib/store.ts`. State is nested by
  slice, and each slice carries its own actions: `useStore.getState().audio.setVolume(0.5)`,
  `useStore((s) => s.ui.chatOpen)`. Never select a whole slice (`s.audio` contains the fast
  `levels`); select single fields. Fast values: `audio.levels`, `audio.beat`, `ar.hand` (0–1
  viewport coordinates, top left is 0,0) and `scroll.progress`. They're written with a normal
  `set()` each frame and read only through `getState()`.
- **Store meanings:** `audio.enabled` means the engine is running (the `AudioContext` exists).
  `ui.soundEnabled` is the visitor's choice; it's saved under `"sound"` as `"1"`/`"0"`, defaults to
  `false`, and controls UI sounds too. `setVolume` and `setProgress` clamp to 0–1.
  `setTrackIndex` doesn't know the playlist length yet; the music engine wraps the index (5.1).
- **Persistence:** done in the actions, not with Zustand's `persist` middleware (ThemeScript needs
  the plain `"theme"` key). The store starts with defaults on the server and the client;
  `components/providers/StoreHydrator.tsx` (mounted in `<body>`) calls `hydratePersisted()`
  after hydration. `theme.setMode()` calls `setTheme()` from `lib/theme.ts`, so use the store
  action, not `setTheme()` directly, or the store goes stale.
- **Browser helpers:** `lib/browser.ts` has `isBrowser` and `storage.get/set/remove`, which never
  throw. Use them for every localStorage access.
- **Hooks:** `useMediaQuery(query, serverValue = false)` is the base, and `useReducedMotion`
  (server value `true`) and `useIsTouch` (`(hover: none) and (pointer: coarse)`) are built on it.
  `usePageVisible` (server value `true`).
- **Verified 0.5 (headless Chromium, production build):** all 12 flags and the 4 value controls
  update. `sound` and `theme` survive a reload. Over 2 s of fake 60 fps levels, the `getState()`
  reader stayed at 1 render while a subscribed reader reached 331. No console errors.
- **/dev (0.6):** `app/dev/page.tsx` plus `components/dev/*`. It's `noindex, nofollow`, and in
  production it calls `notFound()` unless `NEXT_PUBLIC_SHOW_DEV=1`. That variable is inlined at
  build time, so it must be set for `next build`, not only `next start`. Its labels are
  developer text, so `/dev` is **exempt from the copy rule** (strings can live in its components).
  The type specimen reads family, size, line height, tracking and weight from `getComputedStyle`.
  The colour swatches find every `--color-*` variable (and `--glass-fill`) in the stylesheet at
  runtime, so new tokens appear automatically. Values show minified (`#fff`, and the glass fill
  as 8-digit hex). The theme toggle goes through the store. Motion boxes use Framer Motion
  (`MotionConfig reducedMotion="user"`). The temporary `/type`, `/motion-test` and `/store-test`
  pages are gone.
- **Themes are page-wide only:** the overrides sit on `:root[data-theme="light"]`, so a subtree
  can't force a theme. Making a theme scopable to a subtree means writing the dark values a
  second time in a `[data-theme="dark"]` block. Ask first.
- **Verified 0.6 (headless Chromium, production build with the flag):** without the flag `/dev`
  returns 404; with it, 200 and noindex. All 18 colour values match the §8 table in both themes.
  All 14 type tokens read back as specified, and mono text renders in SF Mono. All six motion
  boxes reach the same end. Section anchors land below the sticky header. No console errors.
- **Primitives (1.1):** `components/ui/` has Button, IconButton, Kbd, Chip, StatusChip, Tooltip
  and Divider. Shared state classes (focus ring, colour transition, disabled) live in
  `components/ui/controlStyles.ts`; use them for every new control. Hover changes only colour; press
  is `whileTap={{ scale: 0.97 }}` with `spring.snappy`. Focus ring: 2 px `border-focus`, 2 px offset.
  Disabled: native `disabled` (or `aria-disabled`), opacity 40%.
- **Sheet over chunk text:** where the component sheet and the build plan disagreed, the sheet won
  (approved). IconButton is radius 12 (`rounded-control`), not round. The StatusChip pulse keeps
  running under reduced motion (CSS `animate-status-pulse`, transform and opacity only).
- **Button:** `href` renders `m.create(Link)`. A disabled or loading link falls back to a button.
  Loading keeps the label in the DOM at opacity 0 (so the width doesn't change), shows a centred
  spinner plus `copy.ui.loading` for screen readers, sets `aria-busy` and `aria-disabled`, stays
  focusable, and swallows clicks. Loading isn't dimmed; disabled is. Sizes sm/md/lg are 36/44/52 px
  (`h-9/11/13`; the odd steps are set by the sheet).
- **IconButton:** `aria-label` is required by its type. `pressed` sets `aria-pressed` and the teal
  look; `label` + `indicator` give the "AR ●" toggle.
- **Tooltip:** wraps one focusable child and clones `aria-describedby` onto it. The description is
  an always-present `sr-only` `role="tooltip"` span; the animated bubble is `aria-hidden`. Opens
  300 ms after a mouse hover (touch is ignored) or instantly on `:focus-visible`. Esc and blur
  close it. The bubble's padding bridges the gap, so it's hoverable.
- **Framer Motion:** `components/providers/MotionProvider.tsx` (in `app/layout.tsx`) wraps the
  app in `LazyMotion strict` + `MotionConfig reducedMotion="user"`. The features
  (`domAnimation`) load async from `motionFeatures.ts`, which kept 1.1 to about +12 KB on `/` instead
  of +31 KB. **Use `m.*`, never `motion.*`:** strict mode throws. `m.create(Component)` wraps
  components.
- **Tokens added in 1.1:** `--radius-key: 6px` (`rounded-key`, Kbd caps; registered in `lib/utils.ts`) and
  `--animate-status-pulse` with its keyframes in `globals.css`.
- **content/copy.ts** exists now, with `copy.ui.loading` only; 4.1 extends it. Components take
  visitor strings as props or read them from `copy`.
- **Verified 1.1 (headless Chromium, production build with the /dev flag):** Tab reaches all 25 live
  controls in the new sections, each with a 2 px solid focus-visible ring. Hovering 27 controls moves
  none of them (size and offset unchanged). Loading width equals default width for all three
  variants. Sizes are 36/44/52 px, and IconButton is 44 × 44 at radius 12 px. Press reads `scale(0.97)`
  while held and `none` after release. The tooltip is closed at 150 ms and open at 450 ms on hover,
  opens on keyboard focus, and closes on Esc; its description is read through `aria-describedby`.
  Chip toggles `aria-pressed`. The pulse runs with reduced motion emulated. First-load JS on `/`
  is 196.9 KB gzipped (185.3 before). The only console error is the favicon 404.
