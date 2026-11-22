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

- **Pages** reshape the particles. The old homepage chapters are separate pages now (phase R),
  each with its own URL and particle shape.
- **Home is the particle room:** a desk of objects drawn in particles. Each object opens a page
  (the frame → About, the laptop → Work, the pencils → Skills, the controller → Arcade, the
  envelope → Contact) or does something in place: the **lamp** switches the theme, the **mug**
  opens the Now card, the **headphones** open the music, and the **plant** is a secret.
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
| Music | The nav's music island (2.4, 5.2); drives the canvas | The island, the sound button, `M`, `play`, or the headphones on the desk |
| iOS-style fonts | All text | Self-hosted SF Pro Text, Display and Mono |
| Chatbot | Floating "Ask" bubble, bottom-right | Click it, press `/`, or `ask …` |
| Working terminal | Drop-down drawer; full page on mobile | Backtick key (`) or the nav icon |
| Games (2) | `/arcade`: Slice (played by hand) and Stack (3D tower) | The controller on the desk, the Arcade page, or `play slice` / `play stack` |

### Routes

- `/` — Home: the particle room (with its intro text and hint row). Doesn't scroll.
- `/about`, `/work`, `/skills`, `/contact` — one page each (R.1); `/arcade` below. Numbers and
  order (01 Home … 06 Contact) come from `content/chapters.ts`.
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
| Backend | Supabase (leaderboards, contact messages, chat rate limits) via `@supabase/supabase-js` (server only, added in 4.7) |
| Content | `content/*.ts` typed data + MDX for case studies (`@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, dev `@types/mdx`; added in 4.5) |
| UI utilities | `clsx`, `tailwind-merge` (for `cn()`), `lucide-react` icons |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights` (added in chunk 11.1) |
| Dev only | `prettier-plugin-tailwindcss`, `eslint-config-prettier`, `@next/bundle-analyzer`, `raw-loader` (GLSL imports), `vitest` |

Scripts must work on Windows, macOS and Linux. Don't use Unix-only syntax like `VAR=value cmd`
in `package.json`; set environment variables in a small Node script in `scripts/` instead
(for example `scripts/analyze.mjs`). No `cross-env`.

Any package not in this table needs approval, including ones a build-plan chunk names.

### Responsibilities (don't mix them)

- **GSAP + ScrollTrigger** — scroll chapters, shader uniform tweens, text reveals, game timelines.
- **Framer Motion** — UI components: panels, drawer, chat, player, layout animations. (Page
  transitions are a CSS transition since 2.5: an `m.div` in `app/template.tsx` put Framer's motion
  component into first-load JS on `/`, +5.8 KB.)
- **Lenis** — scrolling only, driven by `gsap.ticker`.
- Never animate the same property of one element with two libraries.

---

## 4. Folder layout

```
app/
  layout.tsx            # mounts Canvas, Gate, Nav, PersistentLayer, Cursor ONCE
  template.tsx          # page-transition enter
  page.tsx              # Home: the particle room (R.3)
  about/page.tsx        # one page each (R.1); placeholders until Phase 4
  work/page.tsx
  work/[slug]/page.tsx  # case studies
  skills/page.tsx
  contact/page.tsx
  arcade/               # layout.tsx, page.tsx, slice/, stack/
  terminal/page.tsx
  credits/page.tsx
  dev/page.tsx
  api/chat/route.ts
  api/scores/route.ts
  api/contact/route.ts
canvas/                 # CanvasRoot.tsx, Scene.tsx, RouteMorph.tsx, particles/, shaders/*.glsl, shapes/
  room/                 # the particle room's hit areas and hover highlight (R.4)
features/ar/            # camera.ts, tracker.ts, hand.worker.ts, gestures.ts, oneEuro.ts, synthetic.ts
games/                  # shared/, slice/, stack/ — each game self-contained
components/
  ui/                   # primitives: Button, Chip, Kbd, Card, BentoGrid, Tooltip …
  cards/                # bento card kit: ProfileCard, StatCard, PhotoCard …
  motion/               # RevealText, ScrambleText, Marquee
  overlay/              # Sheet, Modal, Drawer, Toast
  media/                # Img, LoopVideo, Avatar
  providers/            # SmoothScroll and other app-wide client wiring (render nothing or wrap)
  home/                 # the particle room's DOM: overlay, hover card, links, phone sheet, cards (R.4–R.5)
  chapters/             # PagePlaceholder (ChapterSection was removed in R.1)
  about/  work/  skills/  # About.tsx (4.3), Work.tsx (4.4), Skills.tsx (4.6): one client component per content page
                        # (Contact.tsx lives in contact/ with ContactSheet, 4.7)
  case-study/           # header, hero, contents, reading progress, prev / next (4.5); mdx/ = the MDX components
  cursor/  nav/  gate/  layer/  contact/
  player/  chat/  terminal/  ar/  dev/
lib/
  store.ts              # the Zustand store
  audio/                # context.ts, engine.ts, time.ts, levels.ts, mediaSession.ts
  chat/                 # knowledge.ts, system.ts, rateLimit.ts, tools.ts
  commands/             # one file per terminal command + registry.ts + parser.ts + types.ts
  motion/               # gsap.ts, lenis.ts, tokens.ts, intro.ts, scrollMemory.ts
  content/              # stats.ts: numbers derived from content/ (4.1)
  hooks/                # useReducedMotion, useMediaQuery, useFocusTrap, useCountUp …
  fs.ts                 # virtual filesystem built from content/
  island.ts             # the nav island's activity / alert store (2.4)
  music.ts              # 5.1: startMusic() / getMusic(); loads lib/audio/engine.ts on demand
  terminal/             # 6.1: types.ts (output lines, runner), session.ts (scrollback), history.ts, stub.ts
mdx-components.tsx      # MDX element styles + the case-study components (required by @next/mdx)
  sfx.ts  shortcuts.ts  quality.ts  preload.ts  theme.ts  browser.ts  supabase.ts  utils.ts
content/                # profile, socials, projects, skills, music, chapters, copy, preload (.ts),
                        # knowledge.md, case-studies/*.mdx
supabase/migrations/    # 001_contact.sql, 002_chat.sql, 003_scores.sql
scripts/                # analyze, check-content, chat-eval, copy-mediapipe-wasm, compress-media
types/                  # ambient declarations (glsl.d.ts: `*.glsl` imports as strings)
docs/                   # motion-audit.md, deploy.md
public/                 # fonts/, models/, audio/, sfx/, mediapipe/
```

Put new code in the folder that owns it. Don't create new top-level folders without asking.

---

## 5. Architecture rules

1. **One store.** Every input (scroll, music, hand, terminal, chatbot) writes to the Zustand
   store in `lib/store.ts`. The canvas and the UI only read from it. Features never import
   or call each other directly. Terminal `ar on` and the AR button flip the same store flag.
   Example: `RouteWatcher` (persistent layer) is the only writer of `page.id`, from the URL; the
   island and the menu read it, and the canvas morphs per route (`canvas/RouteMorph.tsx`). DOM code never imports `canvas/` (it would also pull
   three into first-load JS).
2. **Store slices:** `audio` (playing, track, volume, bass/mid/high levels), `scroll`
   (progress), `page` (id: which of the six pages, or null), `room` (hot object; `view`, the
   canvas's projected object boxes, mutated in place), `ar` (enabled, status, hand x/y, pinching), `ui` (terminal open,
   chat open, chat streaming, sound enabled), `theme`.
3. **Fast values skip React.** Audio levels, hand position and scroll progress change every
   frame. Read them with `useStore.getState()` inside `useFrame` or the ticker, and keep them
   in refs. Never put them in `useState`, and never subscribe a component to them.
4. **One clock.** `gsap.ticker` drives Lenis (`lenis.raf`), and Lenis scroll events call
   `ScrollTrigger.update`. The R3F scene reads the same state on the same frame. Don't start
   extra `requestAnimationFrame` loops; the AR worker and game loops are the only exceptions.
5. **Persistent layer.** The canvas, the nav (with its music island and AR switch), ChatBubble,
   TerminalDrawer and the AR layer mount
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
- Cap `devicePixelRatio` at 1–1.75 (by tier). Particle count is 20k–60k (by tier; R.3) in **one draw
  call**, plus one more on Home only: the room's reflection pass (same geometry, no extra particles).
- **Quality tiers (3.6, raised in R.3):** high 60k / DPR 1.75, medium 36k / 1.5, low 20k / 1.0, picked from the
  hardware; drei's `PerformanceMonitor` steps down a tier when frames are slow (draw range and DPR
  only, never up).
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
- **Layout:** every page (the former homepage chapters) is a 12-column bento grid of cards floating over the
  canvas (6 columns on tablets, 1 on phones), with a 16 px gap. Every card says what it is
  at a glance.
- **Surfaces:** three levels only: canvas → glass card (blur 24 px, 1 px hairline border,
  faint top inner highlight) → solid overlay. Radius: 24 px cards, 12 px controls, round chips.
- **Card kit** (build pages from these; don't invent one-off cards): ProfileCard, StatCard,
  SocialCard, PhotoCard, SkillsCard, CTACard, NowPlayingCard, TextCard, ProjectCard, GameCard,
  plus (approved in 4.3–4.7) TaglineCard, ProgressCard, LegendCard, LinkListCard, EmailCard, TimeCard.
- **Micro-interactions:** hover lift 2 px + shadow + pointer spotlight (CSS variables, no React
  state); press scale 0.97 with a spring; 2 px accent focus ring; staggered entry (40–60 ms);
  numbers count up once; skeletons in the card's shape instead of spinners; every action gives
  feedback within 100 ms.
- **Motion:** one signature move per chapter, and everything else quiet. Only the status dot,
  the now-playing bars, the terminal cursor (added in 1.4, approved), the mouse cursor's
  orbiting specks (Orbit board, 1.7; paused when the pointer leaves or the tab is hidden) and the
  entry gate's loading spinner (2.2, only while the gate is up) loop.
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
| `island/bg` · `island/border` | `#090B0B` · `#2F3A38` | same (the island is near-black in both themes) |
| `island/text` · `island/text-secondary` | `#F4F7F6` · `#A3B2AF` | same |
| `island/accent` | `#2EC0A0` | same (light `accent/primary` is too dark on near-black) |
| `island/danger` (6.1, the terminal's errors) | `#FF7A6B` | same (light `status/danger` is 2.6:1 on near-black) |

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
- One `Points` mesh, a custom `ShaderMaterial`, and attributes `aFrom` and `aTo`. On Home only, a
  second `Points` draws the same geometry as the desk's reflection (R.3).
- Shapes are precomputed `Float32Array`s that all have the same point count: `fromText`,
  `fromModel` (MeshSurfaceSampler), and maths shapes. Morphing tweens `uMorph` 0→1, with a
  random delay per particle.
- Uniforms: `uTime`, `uMorph`, `uScroll`, `uPointer`, `uPointerRadius`, `uPointerStrength`,
  `uBass`, `uMid`, `uHigh`, `uPulse`, `uColorA`, `uColorB`, `uTheme`. Added since: `uPointerVelocity`,
  `uRipples` (3.4), `uDriftTime`, `uSpread`, `uFade` (3.5), `uRoom`, `uPhone`, `uLamp`, `uDeskY`,
  `uPool`, `uSteam` (R.3), `uHot[9]`, `uAnyHot`, `uFocus`, `uBurst` (R.4), `uLeaf`, `uLeafAxis`,
  `uPlant` (R.5), `uType`, `uBulb` (R.6), plus `uPixelRatio` and
  `uSize`. Attributes since: `aRoom` (R.3).
- **Room attributes (R.7 naming vs. what's built):** the design names `aObject` and `aWarm`. As
  built (approved in R.3): `aObject` is `aRoom.x` (object 0–8, −1 elsewhere, plus kind, tint and
  extra in `aRoom.yzw`), and the warm light is computed in the shader from each point's distance to
  `uPool` instead of a baked `aWarm`, because the phone layout moves the points. `uHot` is an array
  of nine per-object highlights.
- **One premultiplied blend for both themes:** `ONE` / `ONE_MINUS_SRC_ALPHA`; the fragment shader
  writes `rgb × a` and alpha `a × uTheme`. `uFade` (0–1) pulls the particles toward the background.
- **Quality tiers:** 60k / 36k / 20k points (R.3), by draw range only.
- The canvas is **opaque** (`alpha: false`) and clears to the theme's `bg/base` (3.5); `<body>` stays
  on `bg/base` for the first paint and the no-WebGL case.
- Fallbacks: reduced motion gets a still frame (the settled room on Home); no WebGL or Save-Data
  gets a CSS gradient, and Home shows the room's objects as glass link cards (R.5).

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
npm run check-content  # content check (4.1); also runs as `prebuild`, so a broken content/ stops the build
npm run compress-media # 5.1: MP3s in public/audio/ above 192 kbps → 160 kbps (ffmpeg; originals kept in stuff/audio-src/)
npm run test       # vitest (from chunk 6.2)
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # Supabase's new name for the anon key (4.7)
SUPABASE_SERVICE_ROLE_KEY=     # server only
LLM_API_KEY=                   # server only; rename to the provider's own variable
EMAIL_API_KEY=                 # optional, server only (contact form)
CHAT_SALT=                     # server only; salt for hashing IPs in rate limits
NEXT_PUBLIC_SITE_URL=          # optional (4.8): the final https URL; else Vercel's production URL
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
| R | Separate pages and the particle room: pages (R.1), route-driven canvas (R.2), room shape (R.3), hover and open (R.4), extras and phone (R.5), Home intro (R.6), CLAUDE.md edits (R.7) | — |
| 4 | Pages and content: content model, ~~hero~~ (4.2, replaced by phase R), about, work, case studies, skills, contact, SEO, MVP review (4.1–4.9) — **MVP** | 7–8 |
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

Current phase: **6 — Terminal** (6.1 done; 6.2, the parser and registry, is next). Phase 5 (Music, 5.1–5.5) is complete. Phase 4 is built (4.1, 4.3–4.8;
4.2 replaced by phase R); **4.9, the MVP review, is still Nasheet's open [manual] checkpoint** (skipped ahead to 5.1 at his request).
Phase R (R.1–R.7) is complete. Phases 0, 2 and 3 are complete; phase 1 is built, but 1.8, the design
review, is still Nasheet's open [manual] checkpoint.

Phase R checklist (the R.7 brief asked for R.1–R.6 unticked; they were built before R.7, so they
are ticked):
- [x] R.1 Separate pages
- [x] R.2 Canvas retrofit: opaque, route-driven, one blend
- [x] R.3 Room shape
- [x] R.4 Room hover, focus and open
- [x] R.5 Room extras and phone
- [x] R.6 Home intro
- [x] R.7 CLAUDE.md edits

Completed chunks: 0.1 (scaffold and tooling), 0.2 (SF Pro typography), 0.3 (design tokens and
themes), 0.4 (motion foundation), 0.5 (store and shared utilities), 0.6 (/dev specimen page),
1.1 (primitives), 1.2 (card base and bento grid), 1.3 (text and number motion), 1.4 (bento card kit), 1.5 (overlays), 1.6 (media components), 1.7 (cursor, magnetic controls, UI sounds),
2.1 (asset manifest and preloader), 2.2 (entry gate, loading screen only), 2.3 (root layout and
persistent layer), 2.4 (nav, island, phone menu and keyboard shortcuts), 2.5 (page transitions),
3.1 (particle scene), 3.2 (shape library), 3.3 (scroll morph), 3.4 (pointer interaction),
3.5 (theme, colour and chapter moods), 3.6 (quality tiers and fallbacks), R.1 (separate pages), R.2 (canvas retrofit: route-driven), R.3 (room shape), R.4 (room hover, focus and open), R.5 (room extras and phone), R.6 (Home intro), R.7 (CLAUDE.md edits), 4.1 (content model), 4.2 (replaced by phase R: Home is the particle room,
R.3–R.6), 4.3 (About page), 4.4 (Work page), 4.5 (case-study template), 4.6 (Skills page), 4.7 (Contact page and API), 4.8 (footer, 404 and SEO), 5.1 (audio engine), 5.2 (music in the island), 5.3 (queue sheet and Media Session), 5.4 (audio-reactive canvas), 5.5 (now-playing card), 6.1 (terminal UI)
Carry-over into later chunks:
- **3.x canvas (from 3.1):**
  - **Changing the shape:** always through `morphTo(mesh, shape, { instant })` in
    `canvas/particles/morph.ts` (never write `aFrom` / `aTo` / `uMorph` directly). Shapes are 60k
    points (R.3), shuffled, so the draw range's prefix (the tier's 60k / 36k / 20k through the
    `count` prop) always covers the whole shape.
  - **`DELAY_SPAN` (0.4) in `morph.ts` must match `particles.vert.glsl`** (and the smoothstep), or
    the CPU freeze of a running morph won't match what's on screen and particles will pop.
  - **Pages (R.1):** `ChapterSection` and every per-chapter ScrollTrigger are gone. `page.id` comes
    from the URL (`RouteWatcher`), which (R.2) also writes `scroll.progress`: the current page's
    own scroll, 0–1.
  - **The name shape** ("name", `SHAPE_BOX`) is now only used by Home's intro (R.6); the old
    NameCard / hero is gone from Home (4.3's About holds the hero cards).
  - **Phones:** the room has its own phone layout (R.3), but the other shapes still use `SHAPE_BOX`
    (4 wide) while a 390 px portrait view is only ~1.8 units wide at z = 0: the sphere, laptop etc.
    overflow on phones. Scale the mesh by aspect when the pages are built (4.x / 10.2).
  - **8.5 AR pointer:** feed the fingertip into the same uniforms. `createPointerTracker()` in
    `canvas/particles/pointer.ts` turns a client position into the smoothed z = 0 point, velocity
    and strength; give it a second input (e.g. `feed(clientX, clientY)` from `ar.hand`) rather than
    a second tracker, so mouse and hand never fight over `uPointer`.
  - **Scroll response constants** (top of `Particles.tsx`): from the current page's own scroll
    (`scroll.progress`, R.2): rotate up to 0.5 rad on Y, tilt 0.12 on X, lift up to 0.3 (parallax),
    smoothed with τ 0.35 s. A page that doesn't scroll leaves the mesh at rest. Tune by feel.
  - **Laptop:** the screen frame and deck read, but the keys are a brighter band rather than
    separate keys at 30k (the model's keys are shallow). A model with deeper key gaps would fix it.
  - **Per-frame writes** go through the `points` ref (`mesh.material.uniforms.uX.value = …`), never
    through the memoised `material`: the React Compiler lint (`react-hooks/immutability`) rejects
    mutating a value that went through a hook.
  - **Clock:** the canvas has `frameloop="never"` and `canvas/FrameDriver.tsx` calls R3F's
    `advance(time)` from `gsap.ticker` (added last, after Lenis), so `state.clock.elapsedTime` is
    gsap's time in seconds. It removes itself while the tab is hidden. Reduced motion draws one
    frame on mount and on resize. `FrameDriver` stays the **last** child of `Scene`: effects run in
    sibling order, and the scene must finish its setup before the first frame. A frame drawn before
    `setDrawRange` drew nothing.
  - **Fallbacks (3.6):** `CanvasLoader` checks WebGL (`hasWebGL()` in `lib/quality.ts`) before
    loading the canvas chunk; without it, `CanvasFallback` (CSS gradient) shows and three is never
    downloaded. Not handled yet: a WebGL context **lost** in use (GPU reset) should also switch to
    the fallback (10.6).
  - **Tier and the draw range:** `count` / `pointScale` come from the tier (`CanvasRoot` → `Scene` →
    `Particles`). Never rebuild the geometry for quality; change the draw range.
  - **Bundle:** three, R3F and the shaders are one lazy chunk of about 238 KB gzipped, loaded after
    hydration (first-load JS on `/` unchanged at 204.3 KB). Revisit in 10.5 (three's named imports
    don't tree-shake much). `@react-three/drei` is installed but not imported yet (0 KB).
  - **Theme / moods (3.5):** change the canvas look only through `colors.ts` (theme), `moodTo` /
    `fadeTo` in `mood.ts` (chapter mood, route fade) and `morphTo`; never write those uniforms
    elsewhere. The canvas is opaque, so **never fade the canvas layer with CSS opacity** (the page
    would show through): use `uFade`. Anything drawn in the canvas later must use the same
    premultiplied blend rule (rgb x a, alpha a x uTheme) or switch on `uTheme` itself.
- **Phase 1:** every new component gets a section on `/dev` (a `DevSection` with each state:
  hover, focus-visible, active, disabled). Fake hover/pressed/focus cells with the classes in
  `components/dev/devStates.ts` (dev only; components never take a "force state" prop), and lay
  states out with `DevState`.
- **Bundle (every chunk that touches `/`): OVER BUDGET, decision open.** First-load JS on `/` is **213.7 KB after 6.1** (+0.3: TerminalDrawerSlot is a client component now; the terminal itself loads on first open), **213.4 KB after 5.5** (+0.1: `copy.about.nowPlaying`), **213.3 KB after 5.4** (unchanged: levels.ts loads with the engine), **213.3 KB after 5.3** (+0.2: `ui.queueOpen` and the queue copy in the shared `copy`; the sheet and Media Session load with the player), **213.1 KB after 5.2** (the player loads only once sound is on; the removed "Music's warming up" copy; method: the gzipped module `<script src>`s in `/`'s HTML), **213.4 KB after 5.1** (+0.4: the playlist, read by the gate's preload; the engine is lazy), **213.0 KB after 4.8** (+1.1: the 404's TransitionLink, which Next loads on every page; see 4.8), **211.9 KB after 4.7** (+0.7: `copy.contact`, which sits in the shared `copy` object), **211.2 KB after 4.6** (+0.4: `copy.skills`), **210.8 KB after 4.5** (the MDX runtime is only on case studies), **210.9 KB after 4.4** (+0.2: `copy.work` and Work's `place`), **210.7 KB after 4.3**, **210.0 KB after 4.1**, **209.6 KB after R.6**, **209.4 KB after R.5** (the object actions and the fallback cards load on first use; eager they
  cost +4.6), **208.3 KB after R.4** (+1.9: RoomLinks, server-rendered for the keyboard and screen readers,
  plus the overlay's lazy loader), **206.4 KB after R.3 and R.2** (206.3 after R.1), **206.0 KB after 3.6** (205.5 after 3.5),
  **204.4 KB after 2.5** (+1.1 KB for the template and scroll memory), **203.3 KB after 2.4**
  (198.5 before it, same method: the gzipped `<script src>` files in the HTML,
  nomodule skipped; `scratchpad fl.mjs`). The live nav, the shortcut map, the menu and the ? overlay
  already load after hydration; what's left is the larger `copy` object, `content/chapters.ts`, the
  store / toast / island changes and a 3.6 KB Next error-boundary chunk that appeared with the nav's
  extra `next/dynamic` loaders. SplitText is already lazy. Next candidate: load ScrollTrigger lazily
  (nothing on `/` scrubs yet; about 7 KB, but it touches 0.4's SmoothScroll wiring, so ask first). Ask
  Nasheet whether to raise the target to ~210 KB or make that cut. Anything new on `/` goes behind
  `next/dynamic`, and server components ship no JS: prefer them for static markup.
- **6.1 / 7.4 / 8.x slots:** replace the placeholder inside its slot file and keep the slot's
  position in `PersistentLayer`: `components/chat/ChatBubbleSlot.tsx` (the bottom-right "Ask" pill),
  `components/terminal/TerminalDrawerSlot.tsx` and `components/ar/ARLayerSlot.tsx` (camera preview
  and hand cursor; both render `null` now).
- **Music in the island:** built in 5.2 (see "Music in the island (5.2)" below). The sound circle
  and the idle island still show the CSS `EqBars` loop while `audio.playing`; the island's music
  activity uses the analyser-driven `components/player/Bars.tsx`.
- **6.1 / 7.x / 8.x / 9.x flags:** `` ` `` and the terminal circle flip `ui.terminalOpen`; `/` flips
  `ui.chatOpen`; Hand (and `A`) sets `ar.enabled`; Esc (when no overlay is open) closes chat, then
  the terminal, then an expanded island card. Each feature pushes its own island activity
  (AR: camera dot + hand, chat: "Writing a reply…", game: live score; a new best is
  `island.alert({ icon: "star", tone: "amber", … })`). The "Hint · first use" state is not built yet.
- **Every in-site navigation goes through `TransitionLink` or `navigate()`** (`components/nav/`,
  `lib/motion/pageTransition.ts`), never a bare `next/link` or `router.push`. Besides the exit
  animation, that's how a new page knows it was pushed: a page that mounts without the push mark
  is treated as Back / Forward and restored to its saved scroll position. (Page links:
  `ChapterLink`, a TransitionLink to the page's route.)
- **Terminal (6.1, built):** see "Terminal UI (6.1)" below. "Resizable" is still a later addition.
- **7.4 Ask bubble:** `--toast-offset` in `globals.css` (2.3) is `var(--layer-inset-bottom) + 56px`,
  sized for the 40 px placeholder pill plus a 16 px gap. Change the 56 px to the real bubble's
  height + 16.
- **10.x icon sizes:** `components/media/iconSize.ts` has `ICON_SIZE` (16 / 20 / 24) and `ICON_CLASS`
  (`size-4/5/6`). Earlier components still hard-code `size-4` and friends; move them to the
  constants in the polish pass. New code uses the constants.
- **4.x / 11.x real media:** use `Img` for every image (static imports get the blur for free; URL
  strings need `blurDataURL`) and `LoopVideo` for loops. `public/dev/` and `components/dev/media/`
  hold generated dev placeholders only; never use them on real pages. `public/dev/` is served in
  production too (small and harmless); delete it if it ever matters.
- **Gate over the canvas (from the 2.2 board, still open):** the name now forms under the gate's
  exit (R.6). Making the gate's background transparent over the canvas at 35% and deleting
  `GateScatter` is still to do (10.x).
- **Sound start (2.2 decision: the site always opens silent; there is no "Enter with sound"):**
  turn sound on through `toggleSound()` in `lib/shortcuts.ts` (the nav circle and `M` use it), or
  call `ui.setSoundEnabled(true)` and `initSfx()` **inside the handler** (that creates the
  AudioContext synchronously). The terminal's `play` / `sound` commands (6.x) use the same.
- **6.x terminal / 4.x contact form / 7.x chat input:** the typing sound is opt-in per field:
  `onKeyDown={onTypingSound}` (from `lib/sfx.ts`), or call it from the field's own keydown handler.
  Turn it on in the terminal; ask Nasheet before adding it to the contact form or chat.
- **Later sound wiring:** `lib/audio/sfxEngine.ts` maps `hover`, `click`, `toggleOn`, `toggleOff` and
  `type`. Add names there (and to the `SfxName` union in `lib/sfx.ts`) as chunks need them:
  `transition_up/down` (overlays open / close), `notification` / `caution` (toasts), `swipe_*`
  (SkillsCard paging), `select`, `disabled`, `celebration`
  (games). Note that `caution` (161 ms), `notification` (300 ms) and `swipe_*` (150 ms) are
  longer than the 100 ms rule in §8. Ask before using them. IconButton has no `sound` prop
  yet (not in 1.7's scope).
- **8.3 hand cursor:** same `Cursor` component (`data-mode` is already on the root). Add the amber
  states from the Orbit board (`stuff/reference/Cursor — Orbit (chunks 1.7, 8.3)@2x.png`):
  - **Pointing:** an 8 px amber dot with three specks at 18 px.
  - **Pinching:** the specks collapse into the dot, which grows to 14 px; release clicks and the
    specks burst back out.
  - **Palm hold:** 16 specks form a ring around the action icon and light up one by one over 1 s.
  - **Hand lost:** fades after 500 ms; a hint after 3 s.
  - The specks still ring whatever the hand points at.
- **11.x media compression:** the UI sounds are WAV (~25 KB loaded now). Convert to Opus (ffmpeg is
  installed since 5.1; extend `scripts/compress-media.mjs`).
- **10.x:** Tooltip has no automatic collision handling. 2.4 added `align="end"` (bubble lined up
  with the trigger's right edge) for the nav's right-hand circles; use it, or add real flip / shift,
  for any other tooltip near an edge.
- **Page links:** use `components/nav/ChapterLink.tsx` (`chapter="work"`), a TransitionLink to the
  page's route from `content/chapters.ts` (R.1). From inside an overlay, close it and call
  `navigate(router, route)`, as the phone menu does. Same-page `#hash` glides (SmoothScroll) still
  work inside long pages; from an overlay use `whenUnlocked(() => scrollTo("#id"))`.
- **Fonts and ScrollTrigger:** call `ScrollTrigger.refresh()` after `document.fonts.ready` once
  real pages with triggers exist (4.x), so trigger positions account for the loaded fonts.
- **Separate pages (R.1):** `content/chapters.ts` gives each page a `route` (and `nested` for Work
  and Arcade); `routeTable` / `pageFromPath()` are the one path → page rule (exact route, or deeper
  for nested; else null).
  - **Store:** `scroll.chapter` is gone; `page.id` (`PageId | null`) is written only by
    `components/layer/RouteWatcher.tsx` (persistent layer, layout effect). It also keeps
    `html[data-page]` in step on client navigation.
  - **Head script:** `ThemeScript` is the one inline script for theme and page: it embeds
    `routeTable` as JSON and sets `html[data-page]` (`none` off the six) before paint. `NavShell`
    renders every page's island label plus "Menu" and a generated `<style>` shows the one matching
    `data-page`, so a reload paints the right island. Without JS there's no `data-page` and the shell
    shows "Menu".
  - **Island / menu:** follow `page.id`; off the six pages (credits, dev, terminal, 404) the island
    shows "Menu", no number, every dot dim. Keyboard-opening the links focuses the current link, or
    the first one there. The phone menu's current item just closes the menu.
  - **Canvas:** replaced in R.2 by `RouteMorph` (see below).
  - **Home:** `app/page.tsx` is exactly `h-dvh` with `overflow-hidden` (no scroll). Desktop (md up):
    the status line (`LocalTime`, shared with `GateClock`), "Hi, I'm Nasheet.", two lines and the
    hint row centred 40 px from the bottom. Phone: eyebrow, "This is my desk." and a chip row of the
    five pages (horizontal scroll inside the row) 80 px above the Ask pill. Strings in `copy.home`.
  - **Placeholders:** `/about` `/work` `/skills` `/arcade` `/contact` render `PagePlaceholder`
    (number, name, subtitle) until Phase 4.
  - **Keys 2–6:** `lib/shortcuts.ts` `pages` shortcut (group "home"), only when `page.id` is home and
    nothing is open (terminal, chat, menu, ? overlay, any `[data-overlay]`); typing and modifiers are
    skipped as for every shortcut. `ShortcutsProvider` hands the router in (`setShortcutRouter`).
    Shortcuts now have a `group` (`everywhere` / `home`) and optional `lit` keys; the ? overlay lists
    both groups.
  - **Scroll memory:** never saved or restored for `/`. Restored only on Back / Forward; every link
    goes to the top (unchanged rule). Fix: `placeNewPage` calls `getLenis().resize()` before the
    immediate `scrollTo`, because Lenis still held the previous page's limit and Back from a short
    page to a long one landed at 0.
  - **Phones:** the name shape is wider than a 390 px screen (the old "scale the mesh by aspect"
    carry-over, canvas scope: R.2 / R.3).
- **Canvas retrofit (R.2):** `canvas/RouteMorph.tsx` (was ScrollMorph), `morph.ts`, `mood.ts`,
  `Particles.tsx`, `particles.frag.glsl`, `colors.ts` (comments), `RouteWatcher.tsx`, and
  `shapePageAt()` / `SCATTER_FADE` in `content/chapters.ts`.
  - **Already in place from 3.5:** opaque canvas cleared to bg/base (tweened 400 ms with the
    theme), the one premultiplied blend for both themes (no separate light path), body on bg/base.
  - **Route → shape:** `shapePageAt(path)` = the page whose own route is exactly `path`. Only the
    six routes get a shape; every other route (case studies, `/arcade/*`, 404, `/terminal`,
    `/credits`, `/dev`) gets the scatter, `fallbackMood` and `uFade` = `SCATTER_FADE` (0.6), even
    where the island says Work / Arcade (Nasheet's call). Home keeps the name until R.3.
  - **Timing:** shape, mood and fade all tween together over `MORPH_DURATION` = 0.9 s,
    `power3.inOut` (was 1.2 s for chapters and 2.4 s for the calm-down). The 3.3 coalescing and
    freeze-on-retarget are unchanged.
  - **`uFade` (0–1):** 0 full strength, 1 the background colour. The shader multiplies the
    premultiplied output by `1 - uFade` (in both blends that pulls the colour toward the clear
    colour). `FADE_KEEP` is gone; 0.6 looks the same as 3.5's "keep 40%".
  - **Scroll:** `RouteWatcher` writes `scroll.progress` (this page's `scrollY / (scrollHeight -
    innerHeight)`, 0 if it doesn't scroll) on scroll, resize and route change (its layout effect
    runs after the template placed the page). `Particles` no longer reads Lenis.
- **Room shape (R.3):** Home's shape is the particle room (`{ kind: "room", url: "/models/room.glb" }`);
  the name is still registered as shape "name" (for the arrival sequence later).
  - **Content:** `content/room.ts` (one entry per room.glb node in a fixed order = the object id
    0–8 in `aRoom.x`: label, opens, key, share, idle motion, phone place; the ambience shares; the
    model-space geometry of the desk, light pool, shade, screen plane and steam),
    `content/screen.ts` (11 real lines of `RouteMorph.tsx`), `content/now.ts` (the Now card:
    chunk, 26 / 79 done, coffee 3, last commit; **update it as chunks land**; generating
    `lastCommit` from git at build time is a follow-up for the Now card).
  - **Model:** room.glb's 9 nodes carry no transforms (vertices are in place, Y up, desk at y = 0,
    ~12 × 5.3 units). `fromScene()` samples each node with 3.2's sampler (`sampleGeometry`, now
    exported from `fromModel.ts`), one idle callback per node.
  - **Build (`canvas/shapes/room.ts`):** objects by share (75%), the laptop's screen code (25% of its
    share: token bars, names teal, strings / numbers amber, keywords and punctuation grey, line-number
    dots, an amber cursor), the mug's steam (40% of its share), then ambience (25%: dust, the
    front edge line, the pool, the cone, motes). Both layouts come from the same samples in the
    same order and one shuffle, so `aRoom` (object, kind, tint, extra) is fixed per particle and
    is uploaded once (Particles, after `loadShapes()`). Kinds and tints must match the vertex
    shader. Desktop is fitted to 5.6 wide, phone to 1.75.
  - **Shader:** everything room-specific is gated by `uRoom` (tweened with the morph), so other
    shapes behave as object −1. Steam animates in the vertex shader from `uTime` (three wisps,
    curl, fade with height). Warm light is computed from the distance to `uPool` (not baked: the
    phone layout moves the points), times `uLamp` (= 1 − theme, set in `colors.ts`). Colour moved
    to the vertex shader (`vColor`).
  - **Reflection:** a second `Points` with the same geometry and `REFLECT` defined, sharing the
    uniforms object; flips about `uDeskY`, alpha x 0.16, fading with height, objects / code / steam
    only; hidden unless `uRoom` > 0.
  - **View:** the mesh (not the camera) tilts 25° on Home (40° on phones, so the rows separate),
    plus up to 3° following the pointer, and lifts (`ROOM_LIFT`); all x `uRoom`.
  - **Phones (< 768 px, `(max-width: 47.99rem)` in RouteMorph, live):** shape "home-phone", three
    rows from `content/room.ts`; the lamp, pool and cone become dust (`aRoom.w` = 1, `uPhone`).
  - **State:** `liveRoom` / `roomTo()` in `mood.ts` (room, phone, desk, pool, steam), tweened with
    the morph by RouteMorph.
  - **Preload:** `room.glb` (102 KB gzipped) is in the gate's manifest.
  - **Not built (later R chunks):** hover and click, labels, idle motions other than steam (pencils,
    buttons, bulb flicker, flap, leaves), the arrival sequence.
- **Room hover, focus and open (R.4):** `canvas/room/hitAreas.ts`, `canvas/room/hot.ts`,
  `components/home/RoomOverlay.tsx` (+ `RoomOverlayLoader`, lazy), `HoverCard.tsx`, `RoomLinks.tsx`.
  - **Data flow (DOM never imports canvas):** the canvas projects each object's box (per layout,
    from the room build) through the mesh's current transform every frame and writes the screen
    rects + depth into `room.view` (mutated in place, FAST). `RoomOverlay` hit-tests window
    pointer moves against them (padded 16 px, nearest wins; not over links, buttons or the nav)
    and writes `room.hot`; `RoomLinks` focus writes it too. The canvas watches `room.hot`
    (`watchHot`) and tweens `liveHot` (the `uHot` array itself; in 180 ms, out 240 ms).
  - **Shader:** the hot object's points x1.25 size, x1.35 colour, +0.3 alpha; other objects x0.2,
    ambience x0.7 (all by `uAnyHot`).
  - **DOM layer** (one gsap ticker, transforms only, CLS 0): faint tags (prefix + label, above or
    below per `content/room.ts`; not the plant; desktop with a fine pointer only), an invisible
    100 px hit element scaled over the hot object (`data-cursor="view"`, "Open ↗": the cursor only
    re-reads modes on pointerover, so a hit element is needed; it also takes the click), and the
    320 px HoverCard with a dashed connector. The card keeps clear of Home's intro
    (`data-room-avoid`, `w-fit`).
  - **Interactive in R.4:** only the five page objects (`roomTabOrder`: About, Work, Arcade,
    Skills, Contact). Headphones, mug and lamp have tags but no hover until R.5.
  - **Opening:** click, Enter or keys 2–6 → `navigate(router, route, { immediate: true })` (no
    exit fade; still marked as a push). Island links keep the fade.
  - **Focus morph:** `RouteMorph` gives `morphTo` a `focus` (the object for the page being opened
    or left; Back runs it in reverse). Focus particles' delay x0.15, others 0.3 + 0.7 x delay
    (`FOCUS_EARLY` / `FOCUS_LATE` in `morph.ts`, mirrored in the shader and in the CPU freeze), and
    `uBurst` (its own 0 -> 1 -> 0 timeline, 0.3 s out) pushes the others ~1.6 units (~380 px)
    outward. Reduced motion: no focus, instant swap.
  - **Island peek:** "01 Home → 03 Work ↵" while a page object is hot on Home.
  - **TODO(content):** Work's card shows three placeholder tiles ("Project 1–3") until
    `content/projects.ts` (4.1).
- **Room extras and phone (R.5):** `components/home/roomActions.ts` (one `openRoomObject(id,
  router)` for every path: hover click, RoomLinks, phone sheet, fallback cards), `roomInfo.ts`,
  `NowCard.tsx`, `PhoneSheet.tsx`, `RoomCards.tsx`; `lib/theme.ts` `revealTheme`, `lib/secrets.ts`,
  `lib/quality.ts` `saveData` / `canvasEnabled`.
  - **Lamp / T / theme button:** `toggleTheme(origin)` → `revealTheme(apply, origin)`. View
    Transitions: 600 ms clip-path circle on `::view-transition-new(root)` from the bulb (the canvas
    projects `layout.bulb` into `room.view.bulb`) or the visible `[data-theme-button]`; no API: a
    400 ms `.theme-veil` crossfade; reduced motion: instant. During a reveal `html[data-theme-reveal]`
    makes `colors.ts` switch at once (and `uLamp` with it) and the update fires `canvas:draw-now`
    (`DRAW_NOW_EVENT`), which FrameDriver answers with a synchronous `advance()`. **Never await
    requestAnimationFrame inside a View Transition update: rendering is paused, it deadlocks until
    the transition times out.** The island alert is decided before the switch (it runs later).
  - **Mug:** `openNow()` pushes an island activity of the new kind `"now"` and expands it
    (NowCard: time, live, headline, chunk + progress, coffee, last commit "x h ago"); it removes
    itself when the card collapses (Esc, click outside). Content from `content/now.ts`.
  - **Headphones:** island alert "Music's warming up" (`icon: "music"`, new) until Phase 5 pushes
    the music activity instead (replace the `music` case in `roomActions.ts`).
  - **Plant:** no tag, no hover, not in Tab order; a click (or tap) inside its box calls
    `waterPlant()`: `room.leaf` → the canvas grows the leaf (`uLeaf`, elastic 1.4 s; about 1 in 7
    of its upper particles reach up and out), and the first time `findSecret("plant")` saves it
    (`localStorage.secrets`) and shows the amber achievement "You watered the plant · secret 1 of 5"
    (`copy.home.secrets.total` = 5). The leaf stays grown on later visits.
  - **Hover and Tab:** all eight objects but the plant, left to right (`roomTabOrder`: Music,
    About, Now, Work, Arcade, Skills, Contact, Lights). Action objects' cards show their
    `action` line and key; RoomLinks makes them buttons. The island peek is mouse-only.
  - **Touch (`(hover: none), (pointer: coarse)`):** first tap selects (`room.hot`, white pin tag,
    PhoneSheet up), a second tap on it or the sheet's button opens, empty space cancels. The sheet
    is portalled to `<body>` at `z-overlay`, `bottom: max(12px, env(safe-area-inset-bottom))`. No
    pointer lean on touch (the 40° phone view stays). The phone intro's top padding follows
    `--nav-inset-top`.
  - **No WebGL or Save-Data:** `canvasEnabled()` gates CanvasLoader (three never loads); on Home
    `RoomCards` (lazy, with the overlay) shows six glass cards (About, Work, Skills, Arcade,
    Contact, Music) and sets `html[data-room="cards"]`, which hides `[data-room-only]` (hint row,
    phone chips, RoomLinks).
  - **Reduced motion:** the room shows, the canvas swaps instantly (no fly-through), and pages fade
    in over 200 ms (opacity only, unlayered rule after the `.page` block).
  - Copy for review in `copy.home.room` / `.now` / `.secrets` and the action lines in
    `content/room.ts`.
- **Home intro (R.6):** `lib/motion/intro.ts` (`startIntro`, `finishIntro`), `ui.intro`
  (`pending | play | done`), the intro effect in `canvas/RouteMorph.tsx`, `getIntroShapes()` in
  `canvas/shapes/registry.ts`, `morphTo(..., { ease })`, `roomTo(..., { duration })`.
  - **Start:** the gate calls `startIntro()` when its exit **starts** (or on hydration when it's
    skipped), so the name forms under the wipe. Skipped to "done" off Home, under reduced motion,
    without WebGL or with Save-Data; a 5 s safety timer always finishes it.
  - **Steps** (`INTRO` in RouteMorph, from the start): scatter → name 0.9 s; hold; burst
    (`name x 1.12 + noise`, 0.4 s, power2.out) at 1.5; room 1.0 s with the room state at 1.9;
    `finishIntro()` at 2.5 with the code typing in by line (`liveRoom.type`, `steps(11)`, 0.5 s) and
    the bulb flickering on (`liveRoom.bulb` keyframes, 0.5 s). While `ui.intro` isn't "done" the main
    route effect leaves Home alone; leaving Home mid-intro kills it and finishes.
  - **Pairing:** `getIntroShapes(layout)` gives particle i the name point with the same
    left-to-right rank as its room point (two 60k sorts, warmed in idle after `loadShapes`); the
    phone name is scaled 0.32.
  - **Code typing:** screen-code points carry their line (1/n … 1) in `aRoom.w` (cursor 1);
    `uType` hides lines above it. The phone-dust rule now applies only to kinds 0 / 5 / 6.
  - **Text:** the head script sets `html[data-intro="pending"]` on page loads that land on `/`
    (not under reduced motion); `[data-intro-fade]` (intro text, hints, phone chips, room tags) is at
    opacity 0 until "done", then fades in over 300 ms. Accepted risk: without JS that text stays hidden.
  - **Returning to Home** in the same visit: no name; R.4's reverse focus morph (or scatter → room
    0.9 s from scatter routes).
  - **Shader precompile:** `gl.compileAsync(scene, camera)` on mount compiles the hidden reflection
    program too; compiling it on its first draw cost a 300–400 ms frame mid-intro.
- **4.2 Home: replaced by phase R.** R.3–R.6 build Home as the particle room. The Hero B frames
  (`stuff/reference/Hero — desktop 1440 (B · Bento)@2x.png`, `— phone 390`) stay for reference
  only; their cards (profile, stats, photo, socials …) move to the About page (4.3).
- **About page (4.3):** `app/about/page.tsx` → `components/about/About.tsx` (client), from the
  About frames (`stuff/reference/About — desktop 1440 (4.3)`, `— phone 390`).
  - **Layout (BentoGrid, lg 12 cols):** row 1 ProfileCard (`variant="hero"`, 4) · two StatCards
    (`display="dots"`, stacked, 2; side by side on phones) · TaglineCard (6: availability line,
    `profile.tagline`, See the work → /work, Work with me → /contact, ghost Resume with `download`).
    Row 2 TextCard "The short version" (`tone="lead"`, ScrubText, 6) · ARCard (3; `compact` row on
    phones) · TerminalCard (3; hidden on phones). Row 3 three PhotoCards (silhouette placeholders
    until `profile.photos`; a horizontal snap row on phones) · TextCard "Off the screen" (3). Then
    the interests Marquee (desktop) and `SiteFooter`.
  - **New:** `components/ui/DotDigits.tsx` (3 × 5 dots; lit teal + glow, unlit 7%; counts up once
    on view by toggling `data-on`, no re-renders), `components/motion/Stagger.tsx` (`[data-stagger]`
    in 60 ms apart, ScrollTrigger.batch, clears transforms after), `components/motion/ScrubText.tsx`
    (word opacity 0.3 → 1 scrubbed), `components/cards/TaglineCard.tsx`,
    `components/contact/SocialButtons.tsx` (socials with an icon + email; GitHub / LinkedIn appear
    when `content/socials.ts` has them), `components/layer/SiteFooter.tsx` (content pages, not Home).
  - **Kit changes:** `Card` `hoverable` (the hover look without click semantics or the cursor
    ring; ProfileCard, StatCard, TextCard, TaglineCard and ARCard pass it through), CardEyebrow
    `mono`, ProfileCard `variant="hero"` + `meta` + `actions`, StatCard `display="dots"`, TextCard
    `tone` (`lead` / `callout`), optional `heading`, `footnote`; PhotoCard `placeholderLabel`;
    ARCard `compact`, optional `off.hint`, a hand icon on its button. All on `/dev`'s card kit.
  - **Bento on phones:** rows are now `auto` below md (the 160 px minimum applies from md);
    one-column phone cards size to their content.
  - **Sphere placement:** `Chapter.place` (`{ desktop, phone }` of `{ x, y, scale }`, world units)
    tweened by `placeTo()` (mood.ts) with the morph; About: desktop (1.55, 0.6) × 0.8, phone
    (0, 1.0) × 0.4. **Check placement with viewport screenshots:** a full-page screenshot resizes
    the viewport, so the fixed canvas stretches with it.
  - **Stats:** `getStats().skills` (distinct non-placeholder skills). `getYearsActive(now)` is
    separate: `new Date()` during render fails the prerender with cacheComponents.
  - **Profile** is typed `: Profile` now (not `as const`), so empty lists keep their element type.
  - **Marquee** of interests: approved with the 4.3 plan (the frame's faded-edge row).
- **Verified 4.3 (headless Chromium, production build):** all 11 cards show the hover look
  (border, lift 2 px); Resume downloads `resume.pdf`; Switch to Hand raises "Hand mode"; Back to top
  → 0; See the work → `/work`, Work with me → `/contact`; CLS 0; no console errors. Viewport
  screenshots: desktop matches the frame (sphere centre ~(1100, 290) vs (1090, 322)); phone in
  the frame's order with the sphere above the title. Frames on `/` unchanged (p50 6.1 ms).
  - **[manual]** The digits (00 until real skills / projects), the ScrubText feel, the photo tilt,
    the phone photo row, and copy review.
- **Audio engine (5.1):** `lib/audio/engine.ts`, `lib/music.ts`, `content/music.ts`,
  `scripts/compress-media.mjs`, `components/dev/MusicSpecimen.tsx` (/dev "Music").
  - **MUSIC LICENSING (decided with Nasheet; 5.3: "use local files only", don't ask about
    licences):** the six tracks in `public/audio/` (Nujabes, DARZI, Don Toliver, Metro Boomin et
    al., Nirvana, Kendrick Lamar) are commercial releases, **local development only**:
    `public/audio/*.mp3` and `*.jpg` are gitignored, every `license` is `"local"` (5.3: the field is
    required; missing fails `check-content` everywhere), and `"local"` warns locally but **fails on
    CI / Vercel** (`process.env.CI || VERCEL`), so they can't be deployed. Before 11.1, replace them with tracks Nasheet can stream (his own,
    Pixabay Music, YouTube Audio Library, FMA CC-BY…) and fill `license: { source, url }`, then
    un-ignore deliberately. Never commit or deploy unlicensed audio.
  - **Chain:** two `<audio>` decks (A / B) → MediaElementSource → own GainNode → master gain
    (volume) → AnalyserNode (fftSize 1024, smoothing 0.8, `engine.analyser` for 5.4) → speakers, on
    the shared context (`lib/audio/context.ts`). Decks and nodes are created once and reused (an
    element can only have one MediaElementSource); an idle deck is paused and emptied
    (`removeAttribute("src")` + `load()`).
  - **Crossfade:** 1.2 s, equal-power (sin / cos) `setValueCurveAtTime` on the two deck gains; a
    deck still audible when reused is ramped to 0 in 30 ms first. **Gain ramps read the current
    value, `cancelScheduledValues(0)`, then start the new curve from it:** `cancelScheduledValues(now)`
    leaves an in-progress curve in place and a new curve over it throws (`cancelAndHoldAtTime`
    would do it, but Firefox lacks it). A `switchId` lets stale async steps bail out.
  - **API:** `load(i)` (index into `tracks`), `play()` (first time: track 1 over 2 s; else resume
    with a 0.4 s fade), `pause()` (0.25 s fade, both decks), `next()`, `prev()` (restarts the
    track past 3 s), `seek(t)` (15 ms dip), `setVolume(v)`, `getTime()`, `getDuration()`,
    `isPlaying()`. The store gets only `playing`, `trackIndex`, `volume` (+ `enabled`); volume is
    saved under `"volume"`. Playlist order: track 1, then the rest shuffled once per visit.
    `ended` → next; an `error` (or a rejected play that isn't Abort/NotAllowed) → an error toast
    ("Couldn't load … Skipping it.") and next; after 3 failures in a row it pauses with
    `copy.music.gaveUp`.
  - **Wiring (`lib/music.ts`):** `startMusic()` creates the AudioContext synchronously (call it in
    the gesture), imports the engine on demand and subscribes once to `ui.soundEnabled` (off →
    pause, on → resume), so every sound switch (M, the nav circle, the terminal later) controls the
    music. Called from `toggleSound()` and `TapForSound` (repeat visitors with sound saved on: the
    first gesture anywhere starts music too). `getMusic()` returns the engine or null.
  - **Preload:** track 1's first 256 KB (`when: "sound"`) in `content/preload.ts`.
  - **Files:** 320 kbps originals in `stuff/audio-src/`; `npm run compress-media` re-encodes to
    160 kbps (67 → 31.5 MB for the six). ffmpeg 9.1 was installed with winget (Gyan.FFmpeg) at
    `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_…\ffmpeg-9.1-full_build\bin` (new
    shells have it on PATH; else set `FFMPEG_PATH` / `FFPROBE_PATH`). `world's_end_rhapsody.*` was
    renamed `worlds_end_rhapsody.*` (an apostrophe in a URL).
  - **Analyser range (5.4):** `maxDecibels` -10 / `minDecibels` -90 (was the default -30 / -100,
    which clipped: every bass bin sat at 255, so nothing could breathe or beat).
- **Music in the island (5.2):** `components/player/` (IslandMusic, IslandMusicLoader, PlayerCard,
  Cover, Bars, Scrubber), `lib/audio/time.ts`, `copy.player`, `getQueuePosition()` on the engine,
  `MUSIC_ACTIVITY` (`"music"`) in `lib/music.ts`, focus handling in `components/nav/Island.tsx`.
  - **Loading:** `IslandMusicLoader` (in NavBar) mounts `IslandMusic` with `next/dynamic` only once
    `audio.enabled` is true: silent visitors download none of the player.
  - **Activity:** `IslandMusic` renders nothing; it pushes `{ id: "music", lead: <Cover 28 />,
    trail: <Bars />, expanded: <PlayerCard /> }` when `audio.playing` turns true, re-pushes on a
    track change (the slot name says what's playing), and removes it **30 s after a pause**
    (`LINGER_MS`; resuming cancels). The pushed elements read the store themselves, so a track
    change re-renders only Cover and PlayerCard.
  - **PlayerCard** (Island board, "Music · expanded"): art 56, title, "artist · track n of N"
    (`getQueuePosition()`: the visit's play order), Bars, Scrubber, prev / play-pause / next
    (44 px, Framer press 0.97), and the queue button, **disabled until 5.3** wires the track list to
    it. Play with sound off (M paused it) calls `toggleSound()`, so the sound state and the music
    never disagree.
  - **Bars:** one shared `gsap.ticker` callback for every mounted set: reads the analyser once a
    frame (four bin ranges: 1–4, 4–13, 13–47, 47–186) and writes `scaleY` to the bar refs. The
    byte levels are decibels (they sit high and vary little: bass 0.86–0.99 within a track), so each
    band is shown **against its own slow average and spread** (τ 1.5 s, ±2 spreads = full / empty),
    not a fixed floor. Paused: they ease flat (0.2), then the callback stops writing. Reduced
    motion: a still shape. 5.4 can move the reduction into `lib/audio/levels.ts` and share it.
  - **Scrubber:** a native `<input type="range">` (uncontrolled, `data-lenis-prevent`) over a drawn
    line (`.scrubber` thumb rules in globals.css: the thumb shows on hover / focus / drag). The
    fill (`scaleX`), the value, both labels and `aria-valuetext` ("1 minute 20 of 3 minutes 41",
    `copy.player.spokenTime`) are written from its own ticker through refs. Native `input` =
    preview while dragging, `change` = seek; ←/→ are ±5 s (repeated presses step from the pending
    target, since a seek lands ~20 ms later).
  - **Island focus:** opening a card while focus is in the island (or lost to `<body>`) focuses its
    `[data-island-autofocus]` control (play / pause); closing it hands focus back to the first
    `[data-island-slot]`; Tab out of an open card collapses it. NavRow's centre wrapper is `z-10`,
    so the card covers the phone row's sound circle (Island board phone frame).
  - **Headphones:** `openMusic()` in `roomActions.ts` turns sound on (or resumes), then expands the
    player once the activity exists (5 s give-up). The "Sound on" alert shows first (alert ›
    expanded), so the card opens ~2.5 s later.
  - **Phone menu:** its "now-playing strip (5.2)" comment is gone: no mini-player anywhere.
- **Queue sheet and Media Session (5.3):** `components/player/QueueSheet.tsx` (+ `QueueRow`,
  `VolumeControl`), `lib/audio/mediaSession.ts`, from the Queue sheet frame
  (`stuff/reference/Queue sheet (5.3)@2x.png`).
  - **Track model:** `Track.duration` (whole seconds, **rounded down**, measured with ffprobe: the
    rows show it before a track loads; re-measure when a file changes) and `Track.license`
    required: `{ source, url }` (shown "CC BY 4.0 ↗", new tab) or `"local"` (shown "Local file", no
    link). The frame's "Licence: not set" never appears. check-content: no licence → fails
    everywhere; `"local"` → warning locally, failure on CI / Vercel (verified both).
  - **Opening:** the player's queue button sets `ui.queueOpen` (new, in the store, so the terminal
    can open it later). `IslandMusic` loads `QueueSheet` lazily the first time and keeps it mounted
    (exit animation); it can't live in PlayerCard, because an island alert swaps the card out.
  - **Sheet:** 1.5's Sheet with new `eyebrowClassName` / `titleClassName` (OverlayHeader too): mono
    caps "Music · 6 tracks", "Queue" in title-2 bold. Phones: `max-md:h-[82dvh]`. Footer: the
    volume row, then the key hint (Kbd ↑ ↓ move · ↵ play) and "All music credits on /credits"
    (a TransitionLink with `prefetch={false}`: **/credits 404s until 11.2**; the link closes the
    sheet and the card).
  - **Rows:** this visit's play order (`engine.getOrder()`), so the list matches "track n of N".
    Each row's action is a **stretched button** over it (the licence link can't sit inside a
    button), `aria-current` on the current one. Current: `accent-primary/10` fill, `/40` hairline,
    teal title, Bars over the art (scrim), "elapsed / total" written from a ticker. Others: a play
    icon over the art on hover or `:focus-visible` (`group-has-[button:focus-visible]`). Click or
    Enter → `engine.load(i)` (1.2 s crossfade); with sound off it turns sound on first.
  - **Keyboard:** roving tabindex: only the last-focused row (else the current track) and its
    licence link are Tab stops; ↑ ↓ Home End move between rows; Tab reaches mute, then the slider.
    `useFocusTrap` now takes `[data-autofocus]` inside the trap as the first focus (the current
    row). Esc closes the sheet; the trap returns focus to the island's queue button.
  - **Island:** a pointerdown or a focus move into `[data-overlay]` no longer collapses the expanded
    card, so the player stays open behind the sheet.
  - **Volume:** a native range 0–100, step 5 (← → ±5 %, Home / End), controlled by
    `audio.volume`; `.volume-range` in globals.css (4 px line filled to `--fill`, 16 px thumb).
    The speaker button calls `engine.toggleMute()`: mute saves the level under `volume-unmute`
    (storage helpers), unmute returns to it (60 % if none).
  - **Media Session** (`initMediaSession(engine)`, imported by `startMusic()` with the engine):
    metadata (title, artist, the cover as an absolute URL) on `audio.trackIndex`, `playbackState`
    on `audio.playing`, `setPositionState` on the engine's new `onMedia()` events (the active
    deck's loadedmetadata / seeked / play / pause; the browser extrapolates between). Handlers:
    play (turns sound on if it was off), pause, nexttrack, previoustrack, seekto, seekbackward /
    seekforward (±10 s). Each `setActionHandler` is in try/catch.
- **Audio-reactive canvas (5.4):** `lib/audio/levels.ts`, the music block in
  `canvas/particles/Particles.tsx`'s `useFrame`, and the "Music (5.4)" block in
  `particles.vert.glsl`.
  - **Levels:** `startLevels(engine)` (imported by `startMusic()` with the engine): one
    `gsap.ticker` callback added with **priority** (`add(fn, false, true)`), so it runs before
    FrameDriver's canvas frame in the same tick. `getByteFrequencyData` into one reused
    `Uint8Array`; bands bass 20–150, mid 150–2,000, high 2,000–8,000 Hz. Each byte goes back to
    **linear amplitude** against the analyser's ceiling (a 256-entry table), the band average is
    **divided by the volume** (the analyser is after the volume control: quieter music doesn't
    calm the canvas; mute does), times `GAIN` (bass 3.5, mid 25, high 80, tuned on the six tracks),
    clamped to 1. Smoothing per 60 fps frame: attack 0.5, release 0.1 (frame-rate independent).
    `audio.setLevels(levels, beat)` every tick while live; paused, silent or muted, every level
    eases to 0, then the callback stops writing.
  - **Beat:** the unsmoothed bass above 1.35× its own average (τ 0.7 s) and above 0.3, at most
    every 250 ms: 1–3 a second on the local tracks. Particles sets a ref pulse to 1 on `beat` and
    decays it linearly over 0.3 s (`PULSE_S`); `uPulse` = pulse² (a quick kick, eased out).
  - **Shader (Nasheet: "visible but not way too much"):** `AUDIO_SIZE` 0.2 (bass: up to +20 %
    point size, half the chunk's 40 %), `AUDIO_DRIFT` 0.6 (mid: up to +60 % drift reach),
    `AUDIO_TINT` 0.3 (high: up to 30 % toward `uColorA`), `AUDIO_PUSH` 0.05 world units (the pulse:
    out from the mesh's centre, `modelMatrix[3]`, uneven per particle). Everything × `react` =
    0.5 in the room (`isRoom`), so the desk stays readable. Tune by eye with these four constants.
  - **Reduced motion:** the canvas doesn't render continuously, so no audio effect shows.
  - The 5.2 island bars keep their own 4-band, self-normalising reduction (`Bars.tsx`); they
    don't read `audio.levels`.
- **Terminal UI (6.1):** `components/terminal/` (TerminalDrawerSlot, TerminalDrawer, Terminal, Line,
  Prompt, Welcome), `lib/terminal/` (types, session, history, stub), from the Overlays board's
  Drawer frame ("Holds the terminal").
  - **Decisions (Nasheet, 6.1):** **SF Mono at Footnote 13** (the chunk's 14 px isn't a scale
    token); **55 % of the screen tall from md** (`md:h-[55dvh]`; phones keep 300 px until /terminal,
    6.6); the panel uses the **island tokens** in both themes (Drawer `surface="island"`: panel,
    header border, the close button, the Esc hint, the handle), plus the new `island/danger`.
  - **Loading:** the slot (client, in PersistentLayer) loads the drawer with `next/dynamic` on the
    first `ui.terminalOpen` and keeps it mounted. ` and the nav circle already flip the flag; Esc
    is the Drawer's (OverlayRoot); the trap focuses the input (`data-autofocus`) and returns
    focus to the opener.
  - **Session** (`lib/terminal/session.ts`, outside React, `useSyncExternalStore`): entries
    `{ id, line }` capped at **500**, `running`, `banner`; `print`, `clear` (also hides the
    banner), `begin()` → an AbortSignal, `end()`, `cancel()`. It survives closing the drawer.
    **6.2: commands print through `ctx.print` (= `session.print`) and get `ctx.signal`.**
  - **Output types** (`lib/terminal/types.ts`): input, text (`tone` muted / accent), error, link
    (site paths through TransitionLink, others a new tab), table (`head?`, first column teal),
    ascii (`pre`, scrolls sideways), node. `Line` is memoised, so a new line renders only itself.
    The log is `role="log"` `aria-live="polite"`; the Prompt is aria-hidden, so a command is read
    as its text.
  - **Input:** a real uncontrolled `<input>` (paste, IME, phone keyboards; `enterKeyHint="go"`, no
    autocorrect) with `caret-transparent`; the amber block caret (`.terminal-caret`) is moved by
    `transform` to `selectionStart × 1ch − scrollLeft` (one character measured once), so typing
    renders nothing. Solid and blinking while focused (still under reduced motion), hollow
    otherwise. A click in the terminal focuses the input unless it ends a text selection or hits a
    link / button.
  - **Keys:** Enter runs (ignored while running or composing); ↑ / ↓ history (keeps the draft);
    **Tab** calls the `complete` prop (6.2), **Shift+Tab** still leaves; Ctrl+L clears; Ctrl+C
    cancels a running command ("^C"), or abandons the line ("draft^C"), but copies when text is
    selected; the typing sound is the 1.7 `onTypingSound` (unchanged gain; silent when sound is
    off). While a command runs the prompt row is at opacity 0 and keeps focus.
  - **History** (`lib/terminal/history.ts`): last 50 under `terminal-history` (storage helpers),
    blank lines and immediate repeats skipped.
  - **Welcome:** the ScrambleText "Type help to start" (mount trigger) and three chips (`help`,
    `whoami`, `projects`, from `copy.terminal.suggestions`) that run on click.
  - **Stub** (`lib/terminal/stub.ts`): `echo`, `sleep <s>` (cancellable, for Ctrl+C), otherwise
    "<cmd>: command not found. Type help for the list." **6.2 replaces it** (pass `runner` /
    `complete` to `<Terminal>`).
- **Verified 6.1 (headless Chromium, production build with the /dev flag):** ` opens it with focus in
  the input; 396 px tall at 720 (55 %), `rgb(9, 11, 11)` in light theme, SF Mono 13 px; the banner
  and chips; the `help` chip runs ("help: command not found …"); **0 React commits while typing 20
  characters**, the caret moving 0 → 160.75 px; `echo hello world 123` and an inserted (paste-path)
  `echo pasted ✓ text` echo; ↑ ↑ ↓ ↓ → pasted, hello, pasted, "draft"; Ctrl+C idle → "draft^C";
  `sleep 10` + Ctrl+C → "^C" in 246 ms, prompt hidden while running, focus kept; 270 more commands
  → exactly 500 lines, last "269", scrolled to the bottom; Ctrl+L → 0 lines, no banner; Esc
  closes; opened from the nav's Terminal button → focus back on it; history after a reload ("echo
  269"). Screenshots match the board's drawer; console clean.
  - **[manual]** The feel of typing and pasting (Ctrl+V for real), a screen reader announcing
    output (NVDA / VoiceOver), the drawer on a phone (300 px with the keyboard up; 6.6 makes
    /terminal), the key sound with sound on.
- **Now-playing card (5.5):** `components/cards/NowPlayingCard.tsx` (now a live client card, no
  props but `className`), `components/player/openMusic.ts` (moved out of `roomActions.ts`, shared
  with the headphones), from the updated About frames (row 3 on desktop, after "The short version"
  on phones).
  - **Place:** row 3 is Photo 1 · Photo 2 · Now playing · Off the screen (photos `lg` 6 with two
    photos, `md:grid-cols-2`; the card `md` 3 / `lg` 3). Two instances, like ARCard: `md:hidden`
    after the short version, `hidden md:block` in row 3, so the DOM order matches what's on screen.
    `copy.about.photoCaptions` is down to two.
  - **Renders on** `audio.trackIndex`, `audio.playing` and `ui.soundEnabled` only (the last for
    silent mode). Cover (`Img`, 2:1, filling the row on lg), a mono teal "Now playing" / "Paused"
    eyebrow, the 5.2 `Bars`, title, artist, a 2 px progress line (scaleX from the ticker through a
    ref, only while playing), "Opens the player in the island ↗".
  - **Silent mode:** the cover dims (scrim) with a white speaker button; "Sound's off. Turn it on?"
    and "Starts the first track and opens the player in the island." The whole card is one button
    (absolute, full size) whose click runs `openMusic()`: `toggleSound()` creates the
    AudioContext synchronously in the gesture, track 1 fades in over 2 s, and the player opens
    once the activity exists.
  - **Sound on:** the "Opens the player…" line is the button, stretched over the card (CTACard's
    `::after` pattern). `openMusic()` resumes first if the music left the island (paused > 30 s).
  - **Nav:** `NavAutoHide` now subscribes to the island and clears `data-hidden` whenever an alert or
    an expanded card appears (benefits the headphones too). No scrolling happens.
  - **Keyboard:** `island.expand(id, { focus: true })` (new option; `takeFocusRequest()` in
    `lib/island.ts`) makes the Island move focus into the card even though focus was outside it.
    The card passes it for keyboard clicks (`event.detail === 0`); the headphones don't yet
    (the 5.2 follow-up still stands for them).
- **Verified 5.5 (headless Chromium, production build with the /dev flag, real local tracks):**
  - **Sound off:** the card reads "Now playing · Sound's off. Turn it on? · Starts the first track
    …"; the nav was auto-hidden at scroll 1088. **One click:** exactly one AudioContext, created
    with user activation live; World's End Rhapsody playing, the island expanded, the nav shown,
    scroll still 1088.
  - **Follows the island:** Next in the island → card "Gehra · DARZI"; Pause → "Paused".
  - **0 React commits** over 3 s of playback while the progress line moved (0.011 → 0.020).
  - **Resume:** scrolled so the nav hid, paused card clicked → playing, player open, nav back,
    scroll unchanged.
  - **Keyboard:** Enter on the card → focus on the island's Pause button.
  - **Phone (390):** profile, stats, tagline, short version, **now playing**, hand, photos, off the
    screen (as drawn). Screenshots match both frames (light theme: headless).
  - **[manual]** Turning sound on from the card on **iOS Safari** (first try, the AudioContext rule);
    the card in dark theme; copy review (`copy.about.nowPlaying`, "Paused" is mine).
- **Verified 5.4 (headless Chromium on the Iris Xe, production build, World's End Rhapsody at
  80 %; a main-world WebGL probe recorded the uniforms as uploaded):**
  - **/about playing (6 s):** uBass 0.25–0.90 (p50 0.56), uMid 0.28–0.62, uHigh 0.02–0.11, 17
    pulses; **0 React commits**; frames p50 6.1 / p95 6.3 ms, max 12.3, 0 over 20 ms (silent
    before: 6.1 / 6.2).
  - **Paused** (M): 2.5 s later every audio uniform is exactly 0 and none is uploaded any more.
  - **Home playing:** the same ranges, 18 pulses, 0 commits, p50 6.1 / p95 6.3 ms; the room stays
    readable (screenshot).
  - **Six-track simulation** of the same maths: bass p50 0.21–0.68, mid 0.23–0.62, high
    0.10–0.72, 8–23 beats per 8 s.
  - **[manual]** The feel against the music on your screen (the four `AUDIO_*` constants, and
    whether 2–3 pulses a second is too busy: raise `BEAT_GAP_S` if so); 60 fps on the mid-range
    phone with music on; both themes (headless shows light).
- **Verified 5.3 (headless Chromium, production build with the /dev flag, real local tracks):**
  - **Keyboard:** Enter on the island's Queue → the sheet with focus on "Now playing: World's End
    Rhapsody" (`aria-current`); ↓ → "Play Smells Like Teen Spirit by Nirvana, 4:38"; ↓ ↑ back;
    Enter → it became current (card and row) with "0:01 / 4:38"; Tab → Mute, Tab → the slider
    (80), ← ← → 70 % (aria-valuetext "70%", saved 0.7); End → 100; Mute → 0 ("Unmute"), Unmute →
    100; Esc → sheet gone, focus on the island's Queue button, card still expanded.
  - **Media Session** (a main-world shim captured the handlers and calls): metadata "Smells Like
    Teen Spirit | Nirvana | …/smells_like_teen_spirit.jpg", state playing, all 7 handlers set;
    pause → paused (card shows Play), play → playing, seekto 60 → position 60 and the scrubber at
    60, nexttrack → New Drop (metadata and position state followed), previoustrack → back.
  - **Phone (390 × 844):** the bottom sheet is 82 % of the screen (692 px). Screenshots match the
    frame (light theme: headless prefers light). Console clean.
  - **[manual]** **The lock screen on your phone** (cover, title, controls, the seek bar) and
    media keys on the laptop: the chunk's Done-when; the frame's look in dark theme; the sheet's
    drag-to-close on a real phone; VoiceOver / NVDA reading the rows and the slider.
- **Island hover fix (after 5.5, Nasheet's bug report):** with an activity live, hovering anywhere
  on the island opened the page links (nav hover outranks live), so the album art and the bars
  vanished under the pointer and the player couldn't be opened by mouse on desktop. Now, while an
  activity is live, only resting on the **centre** (the page name) opens the links, after a
  200 ms dwell (`CENTRE_DWELL_MS`); the art and bars stay clickable. Without an activity, the
  whole island still opens them at once. Verified with real mouse paths: onto the art → live,
  click → expanded; art → across the centre → bars → live, click → expanded; resting on the
  centre → links, leaving → live; idle hover → links. **Testing note:** drive island hovers with
  `page.mouse.move(..., { steps })`; `page.focus` / a direct click skips the hover path.
- **Verified 5.2 (headless Chromium, production build with the /dev flag, real local tracks):**
  - **Keyboard on /about:** M → the activity (art, "02 About", bars; slot name "Now playing: World's
    End Rhapsody by Nujabes. Open the player"); focus the art + Enter → the card with focus on
    Pause; Space → paused (bars flat at 0.2, label Play); Space → playing; Tab → Next track, Enter →
    "tv off · Kendrick Lamar · track 2 of 6"; scrubber → → from 1 s → 11 s; Esc → focus back on the slot.
  - **Mouse:** the bars slot opens the card; Pause works; a click outside collapses it.
  - **Re-renders:** 0 React commits over 3 s of playback with the card open (devtools-hook counter),
    while the scrubber went 8 → 11 s and its valuetext "8 seconds of 5 minutes 41" → "11 seconds …".
  - **Bars:** over 2 s each bar ranged ~0.33–1.0 (pinned at 1.0 with fixed floors at first).
  - **Linger:** paused, the activity was still there at 25 s and gone (island idle) at 31 s.
  - **Headphones on Home** (room link, sound off): sound on, the card opened ~3 s later. Phone (390):
    the card spans the width above the sound circle. Screenshots match the board. Console clean.
  - **[manual]** The bars' feel against the music (τ 1.5 s, ±2 spreads, attack 30 / release 160 ms
    in `Bars.tsx`); the scrubber drag on a real phone; VoiceOver / NVDA reading the slider and the
    slot names; the 30 s linger by feel.
  - **Follow-ups:** activating the headphones from the keyboard leaves focus on the room link (focus
    was outside the island, so the card isn't focused): consider focusing the card there. The two
    slot buttons share one name (art and bars); revisit in 10.6.
- **Verified 5.1 (headless Chromium, production build with the /dev flag):**
  - **Fade-in:** output level 0 at 0.1–0.5 s, rising to full by ~1.5–2 s.
  - **Crossfade:** A² + B² stayed 1.000–1.002 over all 194 frames of the 1.2 s fade (equal power,
    no dip); gains 0/1 → 0.49/0.87 → 0.79/0.62 → 0.96/0.27 → 1/0; the largest sample-to-sample
    step during the fade was below the one before it (no click).
  - **Routes:** 7 client navigations (/, /about, /work, a case study, /skills, /contact, /arcade):
    the time ran 2.9 → 11.4 s over ~8.4 s, still playing. (An unknown URL is a full page load in
    Next, which ends the music: expected, no in-site link goes there.)
  - **Memory:** JS heap 14.76 MB → 14.80 after 20 switches (350 ms apart, mostly mid-fade) → 14.80
    after 40 (after GC).
  - **M** off → paused, level 0; M on → playing again. Volume saved. A 404 track → the toast and
    the next track. No console errors.
  - **[manual]** Listen on real speakers / headphones for clicks at the crossfade and at pause;
    the fade lengths by ear; the tracks on a phone (iOS Safari needs the gesture: tap sound on).
- **Footer, 404 and SEO (4.8):** `app/not-found.tsx` → `components/layer/NotFound.tsx`,
  `app/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/icon.svg`, `lib/site.ts`,
  `lib/seo.ts`, metadata in `app/layout.tsx` and every page.
  - **Footer:** `SiteFooter` (4.3) already had the name, socials and "Back to top" (Lenis glide);
    4.8 shows its easter-egg line ("Psst. Press ` for the terminal.") on phones too and names the
    landmark. The chunk's `components/Footer.tsx` is that file (no new file).
  - **404 must stay a server component:** Next mounts `app/not-found.tsx` inside the root layout's
    boundary **on every page**, so its client code ships in everyone's first-load JS. Built on
    Button it cost +18 KB on `/` (Framer); now it's a TransitionLink styled like a large primary
    Button (+1.1 KB). Status 404, "404 · Nasheet Khan", Next's own `noindex`, the R.2 scatter.
  - **Metadata:** `metadataBase` from `lib/site.ts` (`NEXT_PUBLIC_SITE_URL`, else
    `https://$VERCEL_PROJECT_PRODUCTION_URL`, else localhost:3000). Title default
    `copy.meta.title` ("Nasheet Khan · Designer and frontend developer"), template "%s · Nasheet
    Khan"; the site description is `profile.tagline` (approved; `copy.meta.description` is gone).
    **Next replaces the layout's whole `openGraph` / `twitter` when a page sets them**, so
    `lib/seo.ts` exports `baseOpenGraph` / `baseTwitter` (site name, locale, the share image, the
    large card) and `pageMetadata(id)` / `caseStudyMetadata()` / `homeMetadata` spread them back in,
    with a canonical URL per page. Per-page descriptions: `copy.meta.pages`. No `robots` in the
    layout (index/follow is the default, and it contradicted the 404's noindex).
  - **Share image** (`/opengraph-image`, 1200 × 630 PNG, ~0.4 s): name in SF Pro Display Bold, title,
    city and availability, seeded teal / amber specks. Literal palette hex values (Satori can't
    read CSS variables): the one allowed exception, commented. **The OG OTF had its GSUB table
    removed** (fontTools): Satori's parser throws "lookupType: 7 - substFormat: 1 is not yet
    supported". Satori also needs `display: flex` on any div with more than one child.
  - **Sitemap:** Home + the five pages (`content/chapters.ts`) + every case study; add `/arcade/*`,
    `/terminal`, `/credits` when they exist. **robots.txt:** allow all, disallow `/dev` and `/api/`.
  - **Favicon:** `app/icon.svg` (the two brand dots on near-black). The every-page favicon 404 is gone.
- **Verified 4.8 (production build):** `/opengraph-image` 200 `image/png` (screenshot: name, title,
  specks); `/sitemap.xml` 7 URLs; `/robots.txt` as above; `/icon.svg` 200; an unknown URL → 404 with
  the page, its button goes home. Head tags: titles through the template, a description, canonical,
  `og:image` and `summary_large_image` on Home, About and a case study (`og:type` article).
  **Lighthouse SEO 100** on `/`, `/about`, `/work`, `/skills`, `/contact` and `/work/project-1`
  (Lighthouse 12 via `npx`, headless Chromium 1248); **Best Practices 100** on `/`.
  - **[manual]** Paste a deployed URL into a share debugger (LinkedIn Post Inspector, opengraph.xyz)
    after 11.1; set `NEXT_PUBLIC_SITE_URL` to the final domain then.
- **Contact page and API (4.7):** `app/contact/page.tsx` (reads the resume's size at build) →
  `components/contact/Contact.tsx`, `ContactSheet.tsx`, `app/api/contact/route.ts`,
  `lib/contact/validate.ts`, `lib/supabase.ts`, `supabase/migrations/001_contact.sql`, from the
  Contact frames (`stuff/reference/Contact — desktop 1440 (4.7)`, `— message sheet open`, `— phone 390`).
  - **Supabase (run by Nasheet on 2026-11-22):** `contact_messages` (topic in project / collab / hi,
    name 1–100, email 3–254, message 1–2000, `ip_hash` 64 hex) with RLS on, **no policies**, and
    anon / authenticated revoked; `submit_contact_message(...)` (security definer, execute for
    `service_role` only) counts the IP's messages in the last hour and inserts **under a per-IP
    advisory lock**, returning false at 5. Later migrations: `002_chat.sql`, `003_scores.sql`.
  - **`lib/supabase.ts`** (server only; uses the secret key): `getSupabaseAdmin()` (null when not
    configured), `hashIp(ip)` (SHA-256 of `CHAT_SALT:ip`; null without the salt, so a deploy
    without it fails closed with 503), `clientIp(request)` (x-forwarded-for, then x-real-ip). 7.x
    and 9.x reuse it. **Env:** the publishable key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` now (the
    route doesn't need it); `SUPABASE_SERVICE_ROLE_KEY` holds an `sb_secret_` key; `CHAT_SALT` was
    generated into `.env.local` (32 random bytes). **Vercel (11.1) needs all four, plus
    `EMAIL_API_KEY`.**
  - **`/api/contact`:** bad JSON 400; filled honeypot (`website`) → 200 `{ ok: true }`, nothing
    stored or sent (approved); `validateContact` (shared with the sheet) → 422 `{ error: "invalid",
    errors: { field: code } }`; missing Supabase or salt → 503; RPC error → 500 `failed`; over the
    limit → 429 `rateLimited` + `Retry-After: 3600`; then Resend (REST, no package) from
    `onboarding@resend.dev` to `profile.email`, reply-to the sender, subject "[Topic] Name via your
    portfolio" (`copy.contact.email`). A failed email is logged and doesn't fail the request.
    **Deploy check:** the limit trusts x-forwarded-for, which Vercel sets itself; behind any other
    proxy, make sure the header can't be spoofed.
  - **Sheet (1.5's Sheet):** topic chips (`Chip tone="solid"`), Name, Email, Message (counter,
    "Esc to close"), an off-screen honeypot; errors on blur and on submit (focus moves to the first
    bad field), re-checked while typing once shown; server field errors land on their field,
    others above Send (`role="alert"`). Success: the sheet closes, the form resets, the island says
    "Message sent · I'll reply within a day." No typing sound (CLAUDE.md asks first; not added).
  - **Page:** CTACard `variant="hero"` (Messages: status, "Say hello.", Write a message, Resume),
    EmailCard (Copy → "✓ Copied" for 2 s + "Email copied" island alert; mailto), TimeCard
    (`LocalTime` gained `zoneClassName`), and a row of SocialCards (GitHub, LinkedIn, Instagram with
    "Follow ↗" on hover) plus the resume (`download`, "PDF · 513 KB" read at build;
    `profile.resumeUpdated` adds "Updated …" when set). Phones: Say hello, Email, GitHub | LinkedIn,
    Instagram (full width, approved), Resume as a row (`layout="row"`), then the time card
    (`order-last`).
  - **Kit changes:** `components/ui/TextField.tsx` (the first text input: label, error with
    aria-describedby, hint row, respects a passed `id`), `EmailCard`, `TimeCard`, CTACard `hero`,
    SocialCard `hoverLabel` / `meta` / `download` / `layout`, Card `download` (link form),
    `components/media/icons/InstagramIcon.tsx` (Simple Icons, CC0). All on `/dev` ("Contact").
  - **Envelope placement:** desktop (1.55, 0.55) × 0.6, phone (0, 1.05) × 0.3.
- **Verified 4.7 (headless Chromium + the real Supabase project and Resend, production build):**
  - **Access rules:** the publishable key is refused (42501) on select, insert and the function;
    the secret key works.
  - **Keyboard only:** Tab to "Write a message", Enter opens the sheet (focus on Close); order Project
    → Collab → Just saying hi → Name → Email → Message → Send → the email link → Close (trapped).
    Empty submit: three errors, focus on Name; `riya@studio` → "That email looks unfinished. Missing
    the .com?"; Space picks Collab; Enter on Send stores the message, the island says "Message
    sent", focus returns to "Write a message". Esc closes and returns focus.
  - **Delivery:** the row landed (topic collab, a 64-char ip_hash) and Resend accepted the email (no
    error logged); the 5 test emails went to nxsheet@gmail.com.
  - **Rate limit:** 10 quick posts after the form send → 200 ×4, then 429 ×6 (`Retry-After: 3600`).
    10 **simultaneous** posts from a fresh IP (email off) → exactly 5 × 200, 5 × 429 (the lock).
  - **API:** bad JSON 400; invalid fields 422 with codes; honeypot 200 with nothing stored; a
    101-char name 422 `tooLong`. With the table missing, the sheet showed "Something broke on my
    side. Email me instead?" and kept the text.
  - **Copy:** "✓ Copied", the clipboard holds the address, the island says "Email copied".
  - All 10 `[test]` rows were deleted afterwards (the table is empty). Screenshots match the frames.
  - **[manual]** The 5 test emails in your inbox (from onboarding@resend.dev; check spam once and
    mark it "not spam"); the sheet on a real phone (keyboard covering the fields, the drag handle);
    copy review (`copy.contact`).
- **Skills page (4.6):** `app/skills/page.tsx` → `components/skills/Skills.tsx` (client), from the
  Skills frames (`stuff/reference/Skills — desktop 1440 (4.6)`, `— phone 390`). The chunk named
  `components/chapters/Skills.tsx`; it lives in `components/skills/` like About and Work (approved).
  - **Content model (`content/skills.ts`, reshaped, approved):** `skillAreas` (`name`, `summary`,
    `skills: { name, level?: 1–5, years? }[]`), `learning` (`{ name, progress?: 0–100 }`), `tools`
    (strings), `usedIn` (`{ title, items: { label, project?: slug }[] }`). **No level = empty dots,
    no progress = an empty bar with no number:** placeholders never show a made-up rating.
    `getStats().skills` counts skill names. `check-content`: levels 1–5, plausible years,
    progress 0–100, `usedIn` slugs must exist; unrated skills and placeholders are warnings.
  - **Layout (lg 12):** SkillsCard (8, rows 2) | ProgressCard "Learning now" (4) and LegendCard
    "How to read the dots" (4, md up) | three LinkListCards "Where I used it" (4 each) | then,
    **outside the bento** (its rows are at least 160 px), the "Open every day" strip: a Marquee of
    `tools` (approved), repeated to at least 12 items so the loop has no gap (repeats aria-hidden).
  - **Phones, as drawn:** no legend, no tools strip, only the first "Where I used it", as one line
    (`LinkListCard compact`).
  - **SkillsCard `variant="rated"`** (the 1.4 `pills` layout stays the default): area name
    `title-1` / `large-title`, `summary`, "n / N" in mono, arrows from md; rows `h-14` with
    `LevelDots` and "[4 yrs]" (md up), two columns from md; the body reserves the tallest area's
    rows (`--rows-sm` / `--rows-md` × 3.5 rem) so paging never changes the height; area chips
    (`Chip tone="solid"`, `goTo`) and "← → or swipe" (md up); page dots and "Swipe for the next area"
    (phones). Keys, swipe (≥ 40 px, touch / pen) and the counter are 1.4's, unchanged. `eyebrow` is
    optional now; labels gained `swipeHint`, `level()`, `years()`, `areas`.
  - **New kit pieces (approved):** `components/ui/LevelDots.tsx` (5 dots, teal + glow / 10%,
    `role="img"` "4 of 5" or `decorative`), `ProgressCard` (amber bars grow once in view through a
    data attribute + CSS scale transition; the amber eyebrow turns `text-secondary` in light, where
    amber text fails AA: `[:root[data-theme=light]_&]:` is the light-theme variant until a token
    exists), `LegendCard` (a `dl`, decorative dots), `LinkListCard` (bordered rows with ↗; site paths
    through TransitionLink, https in a new tab, none = plain; `compact` = one line). All on `/dev`
    ("Skills cards").
  - **Rows link** to the project's case study, else its live site / repo, else plain text.
  - **Rings placement:** desktop (1.55, 0.55) × 0.6, phone (0, 1.05) × 0.32.
- **Verified 4.6 (headless Chromium on the Iris Xe, production build):**
  - **Keyboard:** Tab reaches the carousel body; → → → gives 2/3, 3/3, 3/3 (stops at the end), ← 2/3;
    the area chip "[Area 1]" → 1/3; Next → 2/3. The heading (`aria-live`) and the counter update.
  - **Swipe (390 × 844, touch pointer events):** left, left, right → 2/3, 3/3, 2/3; a 20 px move
    doesn't page.
  - **Screenshots** match both frames (desktop: the rings top right, the card with chips and the
    hint, Learning / legend, three "Where I used it", the one-line tools strip; phone: one column,
    page dots and the swipe hint, Learning, one compact "Where I used it"). Console: favicon only.
  - First-load JS on `/` 211.2 KB.
  - **[manual]** Swiping on a real phone; the rings on phones read almost white (60k points drawn
    small, additive): judge them, and the mood / scale if needed (a canvas tweak, not done here);
    the level dots and years once your skills are in; copy in `copy.skills`.
- **Case-study template (4.5):** `app/work/[slug]/page.tsx`, `components/case-study/*` (+ `mdx/`),
  `mdx-components.tsx`, `lib/content/caseStudies.ts`, `lib/content/slug.ts`, from the Case study
  frames (`stuff/reference/Case study — desktop 1440 (4.5)`, `— phone 390`).
  - **Data:** the MDX file (`content/case-studies/<slug>.mdx`) holds only the body. Title, summary,
    role, year, `team` (new optional field on `Project`, shown when set), stack and links come
    from `content/projects.ts`. Pages exist for `hasCaseStudy` projects only
    (`generateStaticParams`); `generateMetadata` gives "<title> · Case study" and the summary.
  - **`dynamicParams` isn't allowed with `cacheComponents`:** an unknown slug reaches `notFound()`
    and shows the not-found page with `noindex`, but the status is **200** (the shell has already
    streamed). Known issue below.
  - **Contents:** `getToc(slug)` reads the MDX at build time and lists its `<Section title="…">`
    tags (MDX comments are stripped first); Section ids use the same `slugify`. Desktop: a sticky
    list (current section: the last whose top is above 35% of the window, an IntersectionObserver
    plus five rect reads per crossing). Phones: a "2 / 5 Approach ⌄" disclosure. Plain `#hash`
    links (SmoothScroll glides). `check-content` fails a case study with no Section.
  - **Layout (lg):** `minmax(0,248px) | minmax(0,720px) | 1fr`, gap 48; the body column is
    `relative space-y-16`. `MarginNote` is absolute in the right margin from 88rem (1408 px) and an
    inline aside below; Section is a **block** container on purpose (an absolute child of a flex
    container loses its place in the flow).
  - **MDX components** (registered globally in `mdx-components.tsx`, no imports in the MDX):
    `Section`, `Figure` (src, alt, width / height default 1600 × 1000, caption), `Gallery` (2 cols
    from md), `Callout` (`kind` lesson / note), `Metric` (number → counts up once; string → shown
    as written) + `Metrics` (row), `Compare` (before / after; transforms of one `--pos` variable,
    no clip-path; drag, sideways touch, or the handle's role="slider" with arrows / Shift / Home /
    End), `MarginNote`. Plus styled `h2 h3 p a ul ol strong code pre blockquote hr`; site links in
    the body go through `TransitionLink`, others open in a new tab.
  - **Reading progress:** a 2 px teal bar (`ReadingProgress`) whose `scaleX` follows
    `scroll.progress` through a store subscription (no React state).
  - **Prev / next:** `getNeighbours()` among case studies in `projects.ts` order; `ProjectNav`
    cards with the cover thumbnail on the outer side; Previous is hidden on phones.
  - **Shared element (React `<ViewTransition>`, no config in Next 16 / React 19.3):** the Work
    card's cover, the hero and the prev / next thumbnails are wrapped in
    `<ViewTransition name={coverTransitionName(slug)} share="morph" default="none">`. React starts
    the View Transition itself at commit and applies the names only for it (so R.5's theme reveal
    is untouched). `navigate(router, href, { shared: true })` skips the 2.5 exit fade when the
    API exists, and the template skips its enter fade (`takeSharedNav()`). CSS:
    `::view-transition-group(.morph)` 500 ms ease-out; under reduced motion every VT pseudo has
    `animation: none`. **A hand-rolled `document.startViewTransition` around `router.push` was
    tried first and deadlocked:** Next's navigation needs a rendered frame, and rendering is paused
    during the update (the R.5 lesson again), so it only ended at a 2 s timeout.
  - **R.5's root rule is scoped now:** `::view-transition-old/new(root) { animation: none }` applies
    only under `html[data-theme-reveal]`, so navigations keep the browser's root crossfade.
  - **Template fix (a 2.5 bug):** Next keys the root `template.tsx` by the **first** segment, so
    `/work` → `/work/[slug]` kept the same instance and the new page was never placed (it opened at
    the old scroll position). The placement / enter effect now runs on every pathname change.
  - **Work cards** (4.4 change): projects without a case study link to `links.live`, else
    `links.repo` (new tab, "opens in a new tab" in the name), else aren't links (hover look only).
  - **Sample:** `content/case-studies/project-1.mdx` (TODO(content), bracketed placeholders, every
    component) on placeholder project 1 (`hasCaseStudy: true`, `team: "[Solo]"`);
    `public/projects/placeholder-before.svg` / `-after.svg` for Compare and Gallery.
- **Verified 4.5 (headless Chromium on the Iris Xe, production build):**
  - **Sample page** (desktop and phone): title "[Project 1] · Case study"; five h2s and five contents
    entries; 2 callouts, 3 figures, 1 slider, 3 metrics, the margin note and a code block render.
    Contents follow the reading position ("The problem" → "Approach"; phone pill "2 / 5"). The bar's
    `scaleX` matches the scroll (0.35 at 35%). Compare: End → 100, Home + → + Shift → = 12, a drag to
    a quarter → 45. Screenshots match both frames (body column at x = 344 as drawn).
  - **Cover → hero:** a click on the Work card (scrolled to 300) runs one View Transition with a
    `::view-transition-group(cover-project-1)` and old / new snapshots; a screencast shows the
    cover growing into the hero by ~450 ms; no names left afterwards. Without the API (deleted in
    a probe) the 2.5 fade runs. The case study opens at scroll 0 in both.
  - **Back** returns `/work` to exactly 300; Forward returns to the case study; "All work" → `/work`;
    `T` still switches the theme on a case study.
  - Console: only the favicon 404. First-load JS on `/` 210.8 KB.
  - **[manual]** The morph's feel (500 ms) in Chrome and the fallback in **Safari / Firefox**
    (Safari 18 has View Transitions: check the morph there too); Back's reverse morph by eye; the
    Compare drag on a real phone (sideways drag vs. scroll); VoiceOver reading the slider.
- **Work page (4.4):** `app/work/page.tsx` → `components/work/Work.tsx` (client),
  `components/cards/ProjectCard.tsx`, `lib/content/projectFilters.ts`, from the Work frames
  (`stuff/reference/Work — desktop 1440 (4.4)`, `— phone 390`). The chunk named
  `components/chapters/Work.tsx`; it lives in `components/work/` like About (approved).
  - **Filters:** All, then every domain (first-seen order), a vertical Divider, then the
    `TOP_STACK` (6) most used stack items (ties by first appearance), all from
    `content/projects.ts`. One filter at a time, in the URL as `?domain=<slug>` or `?stack=<slug>`
    (`slugify`: "Next.js" → `next-js`, "AI / ML" → `ai-ml`). An unknown value filters to nothing
    and shows the empty state (`copy.work.empty` + "Show all projects"). The mono hint at the right
    (lg) shows the live path.
  - **URL without Suspense:** Work reads `location.search` through `useSyncExternalStore`
    (server and hydration snapshot `""`), so `/work` stays fully static (no `useSearchParams`,
    no Suspense bail-out). Clicks call `history.replaceState(history.state, …)`: no reload, no
    history entry per click; passing Next's own state means Next doesn't re-render its router.
    A reload on `?stack=…` settles to the filter **without motion** (`animate` turns true only on
    the first click), and the chip selection flips at hydration.
  - **Motion:** `AnimatePresence mode="popLayout" initial={false} custom={animate}` around `m.div
    layout` bento items (spans written as `--col-md/--col-lg`: 3/6 and 4/8 for featured). Enter /
    exit are variants that read `custom`: **leaving children keep their last props, so a
    transition chosen from state must go through `custom`** (the first build's exits were
    instant). Layout uses `spring.soft`, exits 200 ms ease-out. Reduced motion: MotionConfig
    drops the transforms, only opacity fades. The cards' scroll-in Stagger is on an inner
    `[data-stagger]` div (GSAP and Framer never share an element's transform); a filter click
    clears any card still waiting to stagger in, or it could move into view invisible.
  - **Counts line:** "3 projects · 0 case studies" counts the projects the grid shows (placeholders
    included, since they're on screen), not `getStats()` (which skips placeholders).
  - **ProjectCard:** a `Card href` with `p-2`; the cover is inset 8 px with radius
    `calc(var(--radius-card) - 8px)`, `aspect-video` (featured `lg:aspect-[37/10]`, so both covers
    in a row are the same height). The "● Case study" badge and the preview pill use the island
    tokens (the same in both themes). Title `title-2` featured / `title-3`, role + year (mono;
    one line "Role · 2026" on phones), up to 4 stack tags (static `li`s). The click goes through
    `navigate()` (page transition). It passes extra HTML attributes to the Card (for /dev states).
  - **Preview:** `LoopVideo trigger="hover"` (new prop): with a fine pointer it plays only while the
    closest `[data-loop-host]` is hovered or has focus inside; on touch it plays in view. `poster`
    is optional now (the Img underneath shows the still). The card writes `data-playing` from the
    video's `play` / `pause` events in the capture phase (`onPlayCapture`; no state), which shows the
    pill ("▶ Preview · 0:06", the length from `loadedmetadata`; "Playing in view" on
    `pointer-coarse`) and a teal border (`border-accent-primary/50!`, important because the
    unlayered card hover rule beats utilities).
  - **Chip `tone="solid"`:** the selected state as a solid `text-primary` pill with `bg-base` text and
    no check (Work frames and the Skills frame's area chips). The default `tint` is unchanged. On `/dev`.
  - **Laptop placement:** desktop (1.45, 0.55) × 0.58, phone (0, 1.05) × 0.32.
  - **Case-study links:** only `hasCaseStudy` cards link to `/work/<slug>` since 4.5.
- **Verified 4.4 (headless Chromium on the Iris Xe, production build):**
  - **Real content** (three placeholders): All · [Domain] | [Tech]; clicking [Tech] → `/work?stack=tech`
    with no reload; reload keeps it ([Tech] pressed, 3 cards); `?stack=nope` → 0 cards and the empty
    line; "Show all projects" → `/work`. Keyboard: Tab goes nav → All → [Domain] → [Tech] → each
    card link; Space on a chip filters; Enter on a card opens `/work/project-1`.
  - **Throwaway QA build** (9 varied placeholder projects, reverted before commit): All → Python,
    Python → All, All → Systems and rapid switching (6 filters 200 ms apart): p50 6.1 / p95 6.2 ms,
    later switches max 18–24 ms, cards glide with no per-frame skip (largest step 54–79 px during the
    spring's fast part). Filmstrip: leaving cards fade, the rest move into place.
  - **Preview** (dev loop): hover plays it (pill "Preview · 0:02", teal border), leaving pauses it,
    keyboard focus plays it; phone (touch) plays in view with "Playing in view"; reduced motion
    never plays it and filtering only fades. The live region says "Showing 3 projects" after a click
    (silent on load).
  - First-load JS on `/` 210.9 KB (+0.2).
  - **Follow-up (10.4):** the **first** filter switch after a load has one 50–120 ms frame (cold
    React and Framer paths, ~30 ms of script, plus GPU raster); a card can skip ~300 px in it.
    Not the blur, the SVG cover or layer creation (each tested). Same family as the first theme
    toggle / first Now card.
  - **[manual]** The filter animation's feel and frame rate on the low-end laptop and a mid-range
    phone (especially the first switch); hover-to-play with real previews; the phone chip row's
    sideways scroll.
- **Content model (4.1):** `content/profile.ts` (`Profile`: name, title, location `{ city, timeZone,
  zoneLabel }`, availability, tagline, bio, offScreen, photos, resume `/resume.pdf`, email),
  `content/projects.ts` (`Project`: slug, title, year, role, summary, domain, stack, links, cover,
  preview, featured, hasCaseStudy, optional `placeholder`), `content/skills.ts` (`skillAreas`),
  `content/socials.ts` (`socials`), `content/copy.ts` (+ `meta`, `errors`, `empty`),
  `lib/content/stats.ts` (`getStats()`: projects shipped, technologies, case studies, featured,
  years active; placeholders don't count).
  - **Check:** `scripts/check-content.ts` runs as `prebuild` (and `npm run check-content`): unique
    and URL-safe slugs, required fields, plausible years, https links, every `cover` / `preview` /
    photo / the resume present in `public/`, a case study for each `hasCaseStudy`, unique social
    platforms. Failures print `content/<file> › <entry> › <field>: …` and exit 1; placeholders
    (`[…]` strings, `placeholder: true`, empty lists) print as warnings.
  - **No extra package:** it runs on Node's built-in TypeScript support (`node
    --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-content.ts`; needs Node 22.18+ /
    24, and the warning is the "module type" notice). It imports the content files by their `.ts`
    path, so `tsconfig.json` has `allowImportingTsExtensions` (fine with `noEmit`). **Rule: content
    data files import only types, or other content files by a relative `.ts` path** (no `@/` alias),
    or the check can't load them. `jiti` was tried first and declined (a new dependency).
  - **Metadata:** `app/layout.tsx` takes the title from `profile` (`Nasheet Khan · Designer and
    frontend developer`) and the description from `copy.meta`.
  - `public/resume.pdf` is committed now (Nasheet's request); `profile.email` is
    nxsheet@gmail.com (Nasheet's request).
  - `content/now.ts` is updated per chunk by hand.
- **Verified 4.1:** `npm run check-content` passes with 10 placeholder warnings. A duplicate slug plus
  a missing cover makes `npm run build` stop at prebuild with two ✗ lines naming the file, entry
  and field (exit 1); a `hasCaseStudy` without its MDX fails the same way. Typecheck, lint and
  build pass; the page title reads from content. First-load JS on `/` 210.0 KB (+0.4: the larger
  `profile` object, read by the clocks and the gate).
- **Verified R.6 (headless Chromium on the Iris Xe, production build, first visits through the gate):**
  - **Timing:** counter 100% → room settled (code typed, lamp lit) **3.3 s** in every run (3 runs
    + 4 frame runs); intro done (text fading in) at 2.8 s.
  - **Frames from 100% on:** p50 6.1 / p95 6.2–6.3 ms. One 30–60 ms frame ~1 s after 100% in most
    runs is the gate finishing and unmounting (also there with reduced motion, no intro: a 2.2 cost,
    10.4 follow-up); one 103 ms frame in 1 of 7 runs didn't repeat. Phone emulation: one ~100–120 ms
    frame ~0.45 s after the room settles (10.4 / device check).
  - **Layout shift:** 0.0003–0.0005, all from the gate's own line swaps before 100% (2.2); none
    during the intro.
  - **Screencast** (desktop and phone): 100% → name formed by 0.9 s → hold → burst at 2.0 s →
    room by 2.9 s with the text → code and lamp by 3.4 s. Phone name fits the width.
  - **Repeat visit** (gate skipped): the intro plays once the shapes are ready. **Landing on
    /about** then going Home: no intro, text visible. Reduced motion: no intro, the settled room.
  - **[manual]** The feel of the hold / burst / assemble timings; 60 fps on the low-end laptop and
    a mid-range phone during the intro.
- **Verified R.5 (headless Chromium on the Iris Xe, production build):**
  - **Mouse:** headphones → "Music's warming up"; mug → the Now card ("chunk R.5 · 28 / 79 ·
    Coffee today 3 · Last commit 2 h ago"), Esc removes it; plant → "You watered the plant ·
    secret 1 of 5", `secrets` = ["plant"], a second click shows nothing; lamp → light theme with
    the "Light theme" alert, the reveal circle grows from the bulb (screenshot); T → back to dark,
    the circle from the theme button.
  - **Keyboard:** Tab reaches "♪ Music: Opens the music player." (Enter → the alert) and
    "T Lights: …" (Enter → light theme).
  - **Phone (390 x 844, touch, safe area 47 / 34 emulated):** tap the envelope → sheet "06 Contact ·
    Say hi · Open Contact · Or tap the envelope again" 34 px above the bottom with the white pin
    tag; tap empty space → closed; tap again → `/contact`; the sheet's button → `/work`; tap the
    plant → the achievement. Screenshot matches the phone board.
  - **No WebGL:** six cards, the hint row hidden, the Work card → `/work`.
  - **Reduced motion:** the new page enters at `data-page="in"` with a 0.2 s opacity transition.
  - **Frames:** idle / switch / rapid p50 6.1 ms, 0 over 20 ms. The theme reveal has one 25–42 ms
    frame (the View Transition snapshot). The **first** Now card open after a load has one ~80 ms
    frame (later opens 9–12 ms): the same cold first-use cost as the first island alert (10.4
    follow-up).
  - **[manual]** The reveal in **Safari 18+** (View Transitions) and **Firefox** (crossfade unless
    it has the API); the phone flow on a real iPhone and Android (home indicator, tap feel); the
    leaf by eye; copy review.
- **Verified R.4 (headless Chromium on the Iris Xe, production build):**
  - **Hover** on the laptop: card "03 Work · Case studies and side projects · Project 1–3 ·
    Click, or 3 · /work" open, island "01 Home → 03 Work ↵", cursor state `view`; others dim to
    20%, tags fade. Moving away clears it. Screenshots match the hover frame.
  - **Keyboard:** Tab goes through the nav, then the room links "02 About: Who's behind this",
    "03 Work: …"; each focused object looks hovered (card, island peek); Esc blurs and clears.
  - **Open / Back:** About and Work open at once (`/about`, `/work`), the object grows into the
    page's shape while the rest bursts and re-forms; Back returns to `/` and runs it in reverse.
    Frames during the morph max 18 ms; after it 6.5 ms. Idle / switch / rapid p50 6.1 ms, 0 frames
    over 20 ms. CLS 0 across hover, focus and open.
  - **Testing note:** a `page.screenshot` taken during a client navigation can return a stale or
    white frame in headless; wait ~300 ms or check with rAF timings.
  - **[manual]** The feel of the 180 / 240 ms highlight, the burst size and the card placement;
    VoiceOver / NVDA reading the room links.
- **Verified R.3 (headless Chromium on the Iris Xe, dev and production builds):**
  - **Compute:** the room takes 54–71 ms in total, but its longest single task is 20–25 ms; all
    10 shapes 124–145 ms in total (60k points each now).
  - **Frames, before (R.2, 40k) -> after (60k + reflection):** 1280 x 720 idle on Home p50 6.1 / p95
    6.2 -> 6.1 / 6.2; page switch and rapid switching unchanged (p50 6.1, p95 6.2, max ~12 ms).
    Stress, 1920 x 1080 at device scale 2 (canvas 3360 px wide): Home 156–164 fps vs About
    154–166 fps over three runs (one Home run had p95 24 ms that didn't repeat).
  - **Screenshots:** desktop matches the Home frame (all nine objects readable, code with an amber
    cursor on the laptop, steam over the mug, an amber pool under the lamp, faint cone, desk edge
    line, soft reflections). Light theme: lamp off, desk faint. Phone (390 x 844): three rows, no
    lamp, clear of the chip row. Resizing 1280 -> 390 -> 1280 morphs between layouts with no
    reload. About (sphere) is unaffected (no tilt).
  - First-load JS on `/` 206.4 KB (unchanged).
  - **[manual]** 60 fps on your laptop and **at least 50 fps on a mid-range phone** (headless can't
    show GPU limits: frames stayed at the 6.1 ms floor even at 3360 px); every object's readability
    by eye; the phone layout on a real phone.
- **Verified R.2 (headless Chromium on the Iris Xe, production build; Firefox and Safari are manual):**
  - **Frames, before -> after** (1280 x 720, two runs each): idle p50 6.1 / p95 6.2 -> 6.1 / 6.2-6.3;
    one page switch 6.1 / 6.2-6.3 -> 6.1 / 6.2-6.3 (max 12.4); rapid switching (8 pages, one every
    ~350 ms, through every shape) 6.1 / 6.2 -> 6.1 / 6.2-6.3, 0 frames over 20 ms after (1 of 2 runs
    before had one 26 ms frame).
  - **Theme toggle:** the first toggle after a load costs one 90–97 ms frame **in both builds**
    (pre-existing cold path, not the canvas: see follow-up), later toggles 12–18 ms max in both.
    Screenshots at 0 / 120 / 240 / 480 ms: the clear colour and particles slide from dark to light
    with no pop.
  - **Morphs:** About → Work filmstrip (300 / 550 / 800 / 1300 ms) dissolves the sphere into the
    laptop smoothly; Work → Skills → Work reverses without a pop and settles on the laptop.
  - **Scatter routes:** `/work/some-case`, `/nope` and a push to `/credits` show the faint scatter
    (0.6); Contact → `/credits` fades and morphs together.
  - **Reduced motion:** a route change draws one correct frame (controller, scatter).
  - **Not verified:** the page-scroll parallax by eye (`/dev` shows only the faint scatter; no long
    page with a shape exists until Phase 4).
  - First-load JS on `/` 206.4 KB (+0.1 KB).
  - **[manual]** The theme toggle in **Firefox and Safari** (no pop, no flash); the 0.9 s morph by
    feel; the parallax on `/work` once it's long (4.x).
  - **Follow-up (10.4):** the first theme toggle per page load has a ~90 ms frame (both before and
    after R.2; the profile points at app JS and Framer's projection, e.g. the island alert's first
    layout), and so does the first Now card (R.5). Profile the island's first morph in the
    performance pass.
- **Verified R.1 (headless Chromium on the Iris Xe, production build with the /dev flag):**
  - **Reload** of `/`, `/about`, `/work`, `/skills`, `/arcade`, `/contact`: `data-page` and the static
    shell's label are right at DOMContentLoaded, and the live island matches (e.g. "Navigation: 03
    Work"). `/work/some-case` → Work, `/arcade/slice` → Arcade, `/dev` and `/nope` → "Menu".
  - **ScrollTrigger.getAll()** (exposed in a throwaway QA build): 0 on every page except `/dev`
    (8, its own reveal / count-up demos).
  - **Navigation:** key 2 → `/about`, island link → `/work`, Back → `/about`, Back → `/`, Forward →
    `/about`, wordmark → `/`; `data-mounts` stayed 1 throughout.
  - **Keys:** ignored with the ? overlay open, with Ctrl, while typing in an input, and off Home
    (3 on `/contact` stays); 6 on Home opens `/contact`.
  - **Scroll memory:** `/dev` at 1080 → island About (lands at 0) → Back → 1080; no `/` entry saved.
  - **No scroll on Home:** scrollHeight = viewport at 1440 × 900 and 390 × 844. Screenshots match
    the boards' intro and hint row. Console: only the favicon 404 (and the 404 test URLs).
  - First-load JS on `/` 206.3 KB (+0.3 KB).
  - **[manual]** Reload and Back / Forward on a real phone; the Home intro at your screen sizes.
- **4.x Marquee:** §8 lists the only loops (status dot, now-playing bars, terminal cursor). `Marquee` exists
  (1.3), but using it on a page needs Nasheet's OK first.
- **4.x pages:** compose chapters from `components/cards/*` inside `BentoItem`s and pass
  `className="h-full"` to each card. All card copy comes from props: wire them to `content/` in
  4.1 and delete nothing from `components/dev/fixtures.ts` (it stays as the /dev fixture).
  ProfileCard's time is static text; a live local clock (updating once a minute) is a 4.x
  follow-up. Add brand icons as one file each in `components/media/icons/` (Simple Icons paths,
  CC0) for each platform in `content/socials.ts`.
- **Bundle:** the card kit isn't on `/` yet. When 4.x puts it there, re-measure: SkillsCard
  brings AnimatePresence, and StatCard brings the count-up hook. There's only about 3 KB of
  headroom.
- **6.1 / 8.x wiring:** (NowPlayingCard is live since 5.5) TerminalCard (`onOpen` opens the drawer) and ARCard (`state` from `ar.status`, `onToggle` flips
  `ar.enabled`) all take static props for now.
- **2.2 gate over the canvas:** the canvas is opaque now (3.5), so "make the gate's background
  transparent over it at 35%" means the gate's own bg at 35% over the canvas; delete `GateScatter`
  then (4.2).
  A styled `app/not-found.tsx` belongs to 4.x / 10.x.
Open TODO(content) items:
- **Music (5.1): licensed tracks.** Replace the six local-only tracks in `content/music.ts` with music
  you can stream, fill each `license`, and commit the files on purpose (they're gitignored now).
  A deploy build fails until then.
- `content/preload.ts`: add the hero photo (`kind: "image"`) once it exists (track 1's first chunk
  is in since 5.1).
- `public/models/*.glb`: record each model's source and licence for `/credits` (11.2). Weights = their size in KB as the Network tab shows it.
- `public/sfx/SND01_sine/`: Nasheet says it's open source. Record the exact source and licence
  name for `/credits` (11.2).
- `content/copy.ts` `home` (R.1) — "Open to work" and "Designer and frontend developer." come from
  the Home board: Nasheet to confirm the wording.
- `content/copy.ts` — the island alert lines for theme, sound and mode ("Light theme · T to switch
  back" is the board's; "Dark theme", "Sound on/off", "Hand/Mouse mode" follow its pattern) and
  the nav's accessible names ("Navigation", "Pointer", "Open the menu"): Nasheet to review.
- `content/profile.ts` — tagline, bio, offScreen, photos (files in `public/photos/`); confirm title
  and the "Open to work" label.
- `content/projects.ts` — three placeholder projects (`placeholder: true`, not counted in stats)
  until the real ones; each real one needs a cover in `public/`, and a case study in
  `content/case-studies/<slug>.mdx` if `hasCaseStudy`.
- `content/skills.ts` — real areas (name, summary), skills with level 1–5 and years, what you're
  learning (with progress if you want), tools, and "Where I used it" (project slugs). Review
  `copy.skills` (lede, legend lines). `content/socials.ts` — done (GitHub, LinkedIn, Instagram;
  the Instagram icon comes with 4.7).
- `content/copy.ts` `contact.timeNote` (4.7) — the time card's line, in your words (placeholder
  now). `contact.success` uses the frame's "I'll reply within a day." (approved). Review the rest
  of `copy.contact` (lede, card lines, form errors).
- `content/profile.ts` `resumeUpdated` (4.7) — e.g. "Nov 2026", shown on the resume card when set.
- `content/copy.ts` `errors` / `empty` (4.1) — review the lines.
- About (5.5): `copy.about.nowPlaying` for review ("Paused" isn't from the frame).
- About (4.3): confirm `profile.degree` ("Final-year B.Tech, Computer Engineering") and
  `profile.tagline` (both from the About frame); `profile.interests` (12 placeholders); photo
  captions come with `profile.photos` (`copy.about.photoCaptions` are placeholders); the About
  copy in `copy.about` (lede, AR lines, terminal peek) for review.
- Work (4.4): real projects with covers and short WebM previews (`public/projects/`); the Work copy
  in `copy.work` (lede, empty line) for review. The frame's mock covers are placeholders only.
- Case studies (4.5): your write-ups in `content/case-studies/<slug>.mdx` (set `hasCaseStudy` and
  `team` on the project); delete the sample `project-1.mdx` and the placeholder before / after SVGs
  when the real ones exist; review `copy.caseStudy`.
Known issues:
- An unknown `/work/<slug>` shows the not-found page (noindex) with status **200**, not 404:
  `dynamicParams = false` is rejected with `cacheComponents`, and `notFound()` runs after the shell
  streamed. Revisit with the styled not-found page (4.x / 10.x).
  Add `app/icon.*` with the brand assets (11.2 at the latest).
- The browser-automation skill's runner wants Chromium build 1248, but only 1243 is in
  `%LOCALAPPDATA%\ms-playwright`. For 1.1 a small patchright runner with `executablePath` pointed
  at 1243 was used. Headless Chromium prefers light, so pages open in the light theme.
- `npm run analyze` builds with `--webpack`, because `@next/bundle-analyzer` only hooks into webpack.
  Production builds use Turbopack, so the reported sizes are close but not exact. The Turbopack-native
  `next analyze` needs no package, if exact numbers are wanted later.
- In this Bash tool, a heredoc whose body contains an apostrophe (`Couldn't`, `2.2's`) can fail to
  parse ("unexpected EOF while looking for matching `'`") and nothing runs. Write such files with the
  Write tool instead.
- Git converts files to CRLF on Windows checkout. A `.gitattributes` with `* text=auto eol=lf` is
  proposed but not approved yet.

Decisions so far (don't re-ask):
- **SF Pro license:** Nasheet knows Apple's license only covers UI mock-ups for Apple platforms,
  and chose to self-host SF Pro anyway. Don't raise it again.
- **Font files:** `public/fonts/sf-{pro-text,pro-display,mono}-{400,500,600,700}.woff2`, subset to
  Latin, Latin-1, Latin Ext-A, punctuation, currency, arrows, maths, box-drawing and geometric shapes.
  `public/fonts/og/SF-Pro-Display-Bold.otf` is a subset OTF for OG images (next/og can't read WOFF2;
  its GSUB table was removed in 4.8 for Satori).
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
  `shadow-lift/overlay` (lighter in light mode; since 1.5 through `--lift-shadow` / `--overlay-shadow`), `z-canvas/content/persistent/overlay/toast/cursor`,
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
- **Card (1.2):** `components/ui/Card.tsx` (client) has `variant` glass (default) / solid / media,
  plus `as`, `href` (`next/link`, implies interactive) and `interactive`. Padding is 24 px except on
  media, which wraps its children in an `overflow-hidden rounded-[inherit]` div, so the card
  itself never clips; it can't, because the lift shadow sits outside it. Interactive cards render an
  `aria-hidden` `.card-spot` layer. The card rules in `globals.css` are **unlayered on purpose**: the
  hover border must beat the `glass` utility's border, and a `@layer components` rule loses to
  utilities. Only transform and opacity animate: lift is `translate: 0 -2px`, the shadow is
  `::after` fading in, and the spotlight is a 480 px gradient circle on `.card-spot::before` moved
  with `translate: var(--x) var(--y)`. `pointermove` writes `--x/--y` with `style.setProperty`
  (mouse pointers only). Hover rules sit under `(hover: hover) and (pointer: fine)`, so touch is
  handled in CSS. Reduced motion keeps the border, shadow and spotlight and drops the lift.
  `data-state="hover"` forces the hover look (for /dev).
- **Glass:** use the `glass` utility for every glass surface: fill, `blur(--blur-glass)`, 1 px
  `border-default` and `inset 0 1px 0 var(--glass-highlight)`. `--glass-highlight` is per theme
  (dark `rgba(244,247,246,.06)`, light `rgba(255,255,255,.7)`).
- **Bento (1.2):** `BentoGrid` + `BentoItem` (separate files, one component per file). Columns are
  1 on phones, 6 from `md` (48rem) and 12 from `lg` (64rem), with a 16 px gap and
  `grid-auto-rows: minmax(160px, auto)`. `col={{ md, lg }}` counts in that breakpoint's own columns
  (phones are always full width). A missing one is derived in proportion (md 3 → lg 6); with
  neither, the item is full width. `row={{ base, md, lg }}` inherits upwards. Resolved spans go
  inline as `--col-md/--col-lg/--row-*`, and the `.bento` / `.bento-item` rules in `@layer
  components` read them. No class names are generated at runtime. No `dense` packing, so DOM
  order equals reading order.
- **Testing note:** patchright's `page.evaluate` runs in an isolated world (no page globals), and
  `addInitScript` didn't apply. To count React commits, inject a fake
  `__REACT_DEVTOOLS_GLOBAL_HOOK__` into the HTML with `page.route` and have it write its count
  to a `data-` attribute on `<html>`.
- **Verified 1.2 (headless Chromium, production build with the /dev flag):** the grid has 12 / 6 / 1
  columns at 1440 / 768 / 390 px, with no horizontal overflow, and the sample's rows fill
  completely at 1440 and 768. Over 120 pointer moves across an interactive card there were
  **0 React commits** (a chip click in the same run registered 1). `--x/--y` track the pointer.
  Frames: p95 6.3 ms, none over 20 ms (headless, unthrottled). On hover: `translate 0 -2px`,
  border `#7A8B88`, spotlight and shadow at opacity 1. Reduced motion: no translate, border still
  changes. Touch context: the hover media query doesn't match, there's no translate, the spotlight
  stays at 0 and `--x` is never written.
- **Text motion (1.3):** `components/motion/` holds RevealText, ScrambleText and Marquee, and
  `lib/hooks/useCountUp.ts` holds the count-up. Every effect skips straight to its final state under
  reduced motion, and every one renders its final text on the server (fine without JS and for SEO).
  - **RevealText** (client): `SplitText.create` inside `useGSAP` with `mask` and, for lines,
    `autoSplit` (re-splits on resize and font load and keeps the tween's progress), `aria: "auto"`,
    and `onSplit` returning `gsap.from(yPercent: 100)` (0.7 s, `power4.out`, stagger 0.04, delay prop)
    with ScrollTrigger `top 85%` once. `revertOnUpdate` plus the context reverts the split. The
    element is keyed by its text, so React replaces it instead of patching split DOM; that's why
    children must be a plain string. CSS hides `[data-reveal="pending"]` under
    `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`, and `onSplit` flips
    it to `ready`. Accepted risk: if the JS bundle fails to load, that text stays hidden.
  - **GSAP easing:** GSAP can't read our CSS `cubic-bezier` without CustomEase (not registered), so
    GSAP tweens use `power4.out` / `power2.out`, which are close to `--ease-out`.
  - **useCountUp:** `const ref = useCountUp<HTMLSpanElement>(value, { duration, decimals })`. Render
    `{formatCount(value, decimals)}` as the element's only child and add `tabular-nums`. On mount it
    locks `min-width` to the final value's width (an inline element becomes `inline-block`), then
    tweens from 0 with ScrollTrigger `top 90%` once.
  - **`lib/motion/writeText.ts`:** writes into React's own text node (`nodeValue`), so React's
    reference survives. Per-frame text effects use it instead of state.
  - **ScrambleText:** hand-rolled on one GSAP tween (no ScrambleTextPlugin, to save about 3 KB
    on every page). The first 25% is all noise, then characters resolve left to right, with glyphs
    swapping every 40 ms. It's SF Mono with `whitespace-pre`, so the width is constant. The real
    text is in an `sr-only` copy and the animated span is `aria-hidden`. `trigger="view"` (default,
    ScrollTrigger once) or `"mount"` (plays on every `text` change, for the terminal).
  - **Marquee** (server component, no JS): the content is rendered twice (the copy is
    `aria-hidden` and `inert`), and a CSS `@keyframes marquee` moves the track to `-50%`. Linear on
    purpose. Duration and gap are CSS variables. It pauses on `:hover` / `:focus-within`, fades
    at the edges with `mask-image`, and has no animation under reduced motion. The content must
    be at least as wide as the marquee.
- **Verified 1.3 (headless Chromium, production build with the /dev flag):** RevealText splits into
  3 masked lines at 1440 and re-splits to 6 at 390, every line ends at `translate(0, 0)`, CLS during
  the reveal is 0, and the container's size doesn't change. Unmounting leaves `#reveal-demo` empty
  (0 elements, 0 HTML), and remounting splits again. Count-up reads 0 before view, then
  0 → 12 → 21 → 24 → 26 (and 1,280 / 98.6). The width is locked, and the text beside it stays at the
  same x. Scramble resolves left to right in about 600 ms at a constant width; `trigger="mount"`
  replays on a text change. The marquee moves, pauses on hover, and has an inert, aria-hidden copy.
  Reduced motion: no split (text visible), final numbers, no scramble, marquee animation `none`.
  Testing note: the effects fire once on view, so check each one on a fresh load, or a neighbour
  that scrolled into view earlier will already have played.
- **Card kit (1.4):** ten cards in `components/cards/`, plus the shared `CardEyebrow` and
  `IconTile`. The design reference is component sheet 2 (`stuff/reference/`).
  - **Server-safe** (no hooks): Profile, Social, NowPlaying, Text. **Client:** Stat (count-up),
    Photo (tilt), Skills (state), CTA, AR, Terminal (handlers).
  - **Clickable cards with `onClick`** (CTACard button form, TerminalCard) use the stretched-button
    pattern: the real `<button>` (the arrow, or the "Open the terminal" row) gets
    `after:absolute after:inset-0 after:rounded-card`, so the whole card is clickable and the
    focus ring is drawn on `::after` around the card. The button itself must stay unpositioned.
    `href` cards use `Card href`, which names the link by its visible text (label in name).
  - **SkillsCard:** the counter and arrows are IconButtons, and they disable at the ends (no wrap).
    The body is a focusable `role="group"` `aria-roledescription="carousel"` that takes ←/→. Touch
    and pen swipes (≥ 40 px) are hand-rolled with pointer events (Framer drag isn't in
    `domAnimation`) on a `touch-pan-y` area. `AnimatePresence mode="popLayout"` slides 24 px
    with a direction. The area title is the only `aria-live` region. Pills are static `li`s
    (no Tag primitive).
  - **PhotoCard:** `.photo-tilt` (unlayered, after the card rules) sets
    `perspective(900px) rotateX/Y(var(--rx/--ry))`. Pointer move (mouse only) writes the variables
    and `data-tilting` (fast follow); leave resets them, and a 600 ms overshoot curve springs it
    back. Tilt is off under reduced motion or `(hover: none)`.
  - **Loops:** `.np-bar` keyframes (scaleY) run only under `[data-playing]`, and `.terminal-cursor`
    blinks with `steps(1)`. Both stop under reduced motion. The amber cover's bars use
    `text-overlay-scrim/80`, the one token that's dark in both themes (amber needs dark marks).
  - **TerminalCard panel** follows the theme (`bg-bg-base` inset); 6.1 decides the terminal's
    light look. The preview is `aria-hidden`, and the row button carries the name.
  - **Card change:** `Card` now accepts `target` and `rel` (link form only), for SocialCard's
    new tab.
  - **ARCard blocked help** is a wrapping text link (`next/link`), not a Button, because Buttons
    are `whitespace-nowrap` and overflowed a 3-column card. The ARCard header row wraps, so the
    status chip drops below the tile when space is tight.
  - **Brand icons:** `components/media/icons/GitHubIcon.tsx` and `LinkedInIcon.tsx` (Simple Icons,
    CC0), because lucide 1.x has no brand icons.
- **Fixed in 1.4 (a 1.3 bug):** ScrambleText used `whitespace-pre`, so long lines couldn't wrap and
  the page scrolled sideways at 390 px. It's now `whitespace-pre-wrap`. Glyphs are monospace and
  spaces stay spaces, so the wrap points don't move while scrambling.
- **Verified 1.4 (headless Chromium, production build with the /dev flag):**
  - **Keyboard:** Tab reaches all 11 interactive stops in the kit (Skills next and carousel, 2
    social links, CTA button and link, terminal row, AR buttons, help link), each with a 2 px ring
    (stretched buttons on `::after`). Enter fires the CTA `onClick`, terminal `onOpen` and AR
    `onToggle`.
  - **Skills:** → / ← change the area and the "n / N" counter, it stops at 3 / 3 with Next
    disabled, a 100 px touch swipe goes to the next area, and only one page is in the DOM
    afterwards.
  - **Links:** both social links are `_blank` with `noopener noreferrer`.
  - **Photo tilt:** about 4.7° at 80% of the card's width and height, and it springs back to 0.
  - **Loops and reduced motion:** the bars run while playing and the cursor blinks; reduced
    motion stops both and the tilt is `none`.
  - **Layout:** at 1440 / 768 / 390, in both themes, there's no page overflow, and no element
    sits outside its card.
- **Overlays (1.5, rebuilt against the board):** the design is
  `stuff/reference/Overlays (chunk 1.5)@2x.png`. `components/overlay/` holds Sheet, Modal, Drawer
  and Toast (`Toaster`), plus the shared `OverlayRoot`, `OverlayHeader`, `usePanelMotion`,
  and `ToasterLoader`. The content inside each overlay is the caller's.
  - **OverlayRoot:** portals into `<body>` (only after mount), wraps the layer in
    `AnimatePresence`, and draws a `bg-overlay-scrim/40` backdrop. A backdrop click closes it
    unless `dismissOnBackdrop={false}`.
    - The focus trap is active only while `useIsPresent()` is true, so focus returns the moment
      closing starts, and the leaving layer is `inert`.
    - `lockScroll()` runs on mount and `unlockScroll()` after the exit finishes.
    - Esc closes only the topmost overlay.
    - Safety net: on unmount, if focus fell to `<body>`, it goes back to the opener.
  - **Panels:** `role="dialog"`, `aria-modal`, `aria-labelledby` the title. Surface/solid
    (never glass), radius 24, 1 px `border-default`, `shadow-overlay`.
    - `OverlayHeader` takes `eyebrow`, `description` (+ id, for `aria-describedby`), `leading`
      (icon), `trailing` (extra controls before the close IconButton) and `titleClassName`.
    - Inner scroll areas get `data-lenis-prevent` and `overscroll-contain`.
  - **Motion:** `usePanelMotion(hidden, shown)` gives the soft spring, or under reduced motion a
    plain fade with no slide or scale (the board's rule).
  - **Shared props:** `open`, `onClose`, `title`, `closeLabel`, `children`, `className`
    (`OverlayProps`, exported from Modal.tsx).
  - **Sheet** (`eyebrow?`, `footer?`): a header with a divider, a scrolling `p-6` body, and a
    sticky footer with a top divider.
    - **Desktop (768 px and up):** 480 wide (`w-120`), inset 12 on the top, right and bottom,
      radius on all corners, sliding in from `x: calc(100% + 12px)`.
    - **Phone:** a full-width bottom sheet (90 `dvh` max, top corners round) dragged by its handle
      (`useDragControls`, `dragListener={false}`). It dismisses past 120 px or 500 px/s and
      snaps back otherwise. Footer children stretch (`flex-1`).
    - Drag needs `domMax`, which the app-wide `MotionProvider` loads after hydration (since 2.4;
      1.5 had a nested `LazyMotion` with `sheetFeatures.ts`).
  - **Modal** (`description?`, `footer?`, `dismissOnBackdrop` default **false**, because modals
    are confirmations): 440 wide (`w-110`), centred, scale 0.96 -> 1 with a fade. Header (title,
    description, close), optional body, then actions right-aligned.
  - **Drawer** (`icon?`, `escHint?`): full width minus 12 px insets, 12 px from the top, 300 tall
    (`h-75`).
    - The header has the icon and a subhead title on the left, and the `escHint` word, an Esc
      Kbd and close on the right; the hint hides below `sm`.
    - A decorative bottom handle marks it as "resizable later". 6.1 puts the terminal in it.
  - **useFocusTrap(ref, active, initialFocus?)** (`lib/hooks/`): focuses `initialFocus`, else the
    first focusable element, else the container. Tab and Shift+Tab wrap, and focus that escapes
    is pulled back. On deactivation it restores the previous focus. A module stack makes only
    the topmost trap act; `isTopmostTrap(el)` routes Esc. `getFocusable(root)` is exported.
  - **Toasts:** `lib/toast.ts` is an external store, called as
    `toast(message, { kind, action, duration })`.
    - **Kinds:** `success` (default, teal check), `info` (speech bubble) and `error` (red x).
    - **Actions:** `action: { label, onClick }` (Undo, Retry) runs `onClick`, then dismisses.
    - Limit 3 (the oldest drops), 3 s each, and `dismissToast(id)` removes one. It works before
      the Toaster loads (it queues).
    - **Toaster:** a polite `role="status"` region, 360 x 48 toasts (`max-w-90`, `h-12`),
      bottom-right (`md:right-4 md:w-90`) or bottom-centre on phones. It sits
      `var(--toast-offset, 16px)` above the bottom and safe area.
    - **Deck:** newest in front; older toasts peek behind (8-10 px up, smaller, 50% / 25% opacity).
      Hover or focus-within spreads them into a column and pauses every timer (refs, no state).
      DOM order is newest first, so Tab reaches the front toast first.
    - **Focus handoff:** before a toast removes itself from under the focused button, focus
      moves to the neighbouring toast's first button, or blurs. Chrome fires no blur when a
      focused element is removed, so without this the stack stayed "focused", spread out and
      paused forever. Leaving toasts are `inert`.
    - `ToasterLoader` mounts it in `app/layout.tsx` through `next/dynamic` with `ssr: false`.
  - **lockScroll():** sets `overflow: hidden` on `<html>`, pads it by the measured scrollbar width,
    sets `--scrollbar-gap` (cleared on unlock), and stops Lenis. `setLenis` keeps a newly created
    instance stopped while a lock is active.
- **Shadow tokens fixed in 1.5 (a 0.3 bug):** Tailwind v4 copies a literal shadow value into the
  utility (`.shadow-overlay{--tw-shadow:0 24px 64px ...}`), so the light-theme overrides of
  `--shadow-lift` / `--shadow-overlay` never applied. Both are now `@theme inline` aliases of plain
  per-theme variables, `--lift-shadow` and `--overlay-shadow`:
  - **Dark:** lift `0 8px 24px -8px` at 50%, overlay `0 24px 64px` at 45% black (board).
  - **Light:** the same shapes at 18% of `#121716`.
  - In raw CSS, read `var(--lift-shadow)` / `var(--overlay-shadow)`; `--shadow-*` isn't emitted
    as a variable any more. Do the same for any future per-theme shadow.
- **Verified 1.5 (headless Chromium, production build with the /dev flag), against the board:**
  - **Geometry:**
    - **Sheet:** 480 x 876 at 12 / 12 / 12 insets.
    - **Modal:** 440 wide, centred (500 / 500).
    - **Drawer:** 12 / 12 / 12 insets, 300 tall.
    - **All three:** radius 24 on every corner, a 1 px border, `rgb(18 23 22)` surface, and a
      `0 24px 64px` 45% black shadow (light: 18%).
  - **Keyboard:** each overlay focuses its close button first. Tab and Shift+Tab never leave it.
    The page stays at the same y under the wheel while the sheet body scrolls (`scrollTop` 525).
  - **Nesting and backdrop:** sheet -> modal nests. A backdrop click does **not** close the
    modal; Esc does, with focus back to "Read the full case study". A backdrop click closes the
    sheet, with focus back to "Open sheet" and the lock released. Modal and drawer Esc return
    focus to their buttons.
  - **Toasts:**
    - 360 x 48 at right 16; on a 390 px phone they span 16 / 16, centred.
    - Collapsed tops are 836 / 828 / 821 (opacity 1 / 0.5 / 0.25); hovered they spread to
      836 / 780 / 724 and all three stay past 3.4 s, then they're gone 3.6 s after leaving.
    - Kind icons are success teal, error danger and info secondary. Undo runs and adds
      "Sound is on".
    - **Keyboard:** Enter on Retry moves focus to the next toast's Undo, dismissing the last
      focused toast collapses the stack, and timers resume (a fresh toast leaves on time).
  - **Reduced motion:** the sheet's transform stays `none` while its opacity fades.
  - **Phone:** a bottom sheet (top 84, 760 tall) whose drag-dismiss returns focus to the opener.
  - **Not testable headless:** the scrollbar gap is 0 there (scrollbars are hidden), so the
    Windows padding compensation needs checking by hand.
  - First-load JS on `/` is 198.7 KB (unchanged by the rebuild; the Toaster loads after hydration).
- **Media (1.6):** `components/media/` holds Img, LoopVideo, Avatar, `iconSize.ts` and the brand icons.
  - **Img** (client): props `src` (static import or URL), `alt`, `width`, `height` (required),
    `blurDataURL?`, `sizes?`, `priority?`, `className` (frame), `imgClassName`.
    - **Frame:** `.img-frame` holds the aspect ratio from width / height, so nothing shifts. Its
      `::before` paints the blurDataURL (`--img-blur`), CSS-blurred.
    - **Fade:** the image fades 0 -> 1 over 300 ms once `data-loaded` is set. That flag is written
      by `onLoad`, or on mount when `img.complete` (cached before hydration), with no re-render.
    - **No blur source:** the frame shows `surface-glass`. Without JS, `@media (scripting: none)`
      shows the image.
    - `next/image` runs with `placeholder="empty"`: its own blur can't be used, because fading
      the image would fade the blur with it.
  - **next.config.ts:** `images.formats: ["image/avif", "image/webp"]` (§6). Verified: `/_next/image`
    serves AVIF to Chromium.
  - **LoopVideo** (client): `muted playsInline loop preload="none"` plus `poster`, `sources[]`, and
    `width` / `height` (aspect ratio).
    - **Playback:** one IntersectionObserver (threshold 0.25) plus a `visibilitychange` listener
      play it only while it's on screen and the tab is visible. `play()` rejections are swallowed.
    - **Never autoplays** under reduced motion or `navigator.connection.saveData`; the poster
      stays and nothing downloads.
    - It's `aria-hidden` unless given a `label`. No state, no frame loop, and full cleanup on unmount.
  - **Avatar:** round; sm / md / lg = 40 / 56 / 72; a photo through Img, or initials in accent on
    surface/solid. `name` is optional: give it when the name isn't visible next to the avatar
    (alt text, or a hidden label); omit it and the avatar is decorative. ProfileCard now uses
    `Avatar` (decorative), and its `photo` prop is `{ src, blurDataURL? }`.
  - **Dev placeholders:**
    - `components/dev/media/sample-{wide,square}.jpg` were generated with System.Drawing.
    - `public/dev/loop.webm` (43 KB, 640 x 360, VP9, 1.98 s seamless loop) and
      `loop-poster.jpg` were recorded from a canvas with MediaRecorder in headless Chromium,
      because ffmpeg isn't installed.
  - **Fix to 0.6's TypeSpecimen:** its measured metadata line filled in after mount and shifted
    the page (CLS 0.026 on `/dev`). It now reserves four lines (`min-h-13`).
  - **Testing notes:**
    - Chromium build 1243 was replaced by 1248 on 2026-11-20 (the scratch runner now picks
      whichever `chromium-*` is installed).
    - In headless mode, bringing another tab to the front doesn't change `visibilityState`.
      Simulate it from an injected main-world script instead: override `document.visibilityState`
      and dispatch `visibilitychange`.
- **Verified 1.6 (headless Chromium, production build with the /dev flag):**
  - **Images:** with every `/_next/image` delayed 1.5 s, the frames already have their final size
    (309 x 174 for 16:9, 309 x 309 square) and show the blur (or the plain surface for the
    URL source) with the image at opacity 0. After loading, all 6 frames are `data-loaded` at
    opacity 1. The format served is `image/avif`.
  - **Video:**
    - Before scrolling, both videos are paused at `readyState` 0 (nothing downloaded).
    - With video 1 in view it plays and loops (time wrapped from 1.49 s to 0.06 s), while video 2
      stays at `readyState` 0.
    - A simulated hidden tab pauses video 1, and it resumes when visible.
    - Scrolled to video 2, that one plays and video 1 (off screen) pauses.
    - With reduced motion, neither plays and nothing downloads.
  - **Layout shift on `/dev`:** 0 in three separate runs (plain load + full scroll; + the video
    sequence; + 1.5 s-delayed images). One long combined run that also simulated tab visibility
    from an injected script measured 0.00004 (text nodes), and it couldn't be reproduced.
- **Cursor (1.7), current design "Orbit"** (`stuff/reference/Cursor — Orbit (chunks 1.7, 8.3)@2x.png`).
  History, so nobody re-litigates it: the first build (dot + ring) and the second (spark +
  selection box, later removed from controls at Nasheet's request) were both replaced by Orbit,
  on Nasheet's newest board. `Cursor (chunks 1.7, 8.3)@2x.png` in `stuff/reference/` is the
  superseded spark/box board.
  - **Files and mounting:** `components/cursor/Cursor.tsx`, mounted once through `CursorLoader`
    (`next/dynamic`, `ssr: false`) in `app/layout.tsx`.
  - **Elements:** one 6 px dot (on the pointer through `gsap.quickSetter`, so it never lags), a
    pool of 14 specks of 3 px (every third amber, `data-amber`; glow = a box-shadow in their own
    colour at `--cursor-glow-mix`, 55% dark / 28% light), a 2 x 24 caret and a view pill.
  - **One loop:** all specks are moved by a single `gsap.ticker` callback, which writes
    `translate3d` / `scale` per speck. Each speck eases toward its target with
    `1 - exp(-dt / tau)`, the same effect as the board's per-speck `quickTo` without 28 tweens.
    The callback runs only while the cursor is visible and the tab is in front.
  - **Rest:** three specks orbit at 13 px, advancing 90° a second (one turn every 4 s). Their lags
    cycle 0.08 / 0.14 / 0.20 s (tau = lag / 2), so moving pulls them into a short stream.
  - **orbit:** set by `data-cursor="orbit"` (Button, IconButton, Chip, interactive Card; Button
    links) **and any `a[href]`**. The dot fades, and `clamp(round(perimeter / 32), 8, 14)` specks
    move 7 px outside the element's rounded outline (radius = its `border-top-left-radius` + 7)
    with tau 0.07 (about 250 ms). They drift along it at 20 px/s, and the ring is re-measured
    every tick, so it follows magnetic drift and scrolling.
  - **Pressed (on a ring):** 2 px from the edge (tau 0.035), specks at 4 px (x4/3), all turned
    accent, with a stronger glow.
  - **text** (`data-cursor="text"`, inputs, textareas): the caret, with amber specks 2 and 5 at
    its ends (±12 px); the rest are hidden.
  - **view** (`data-cursor="view"` + `data-cursor-label`): a pill **beside** the pointer (its
    left edge 16 px to the right, vertically centred; `quickTo` 0.12 s), with the specks ringing
    the pill 7 px out. (Revised 1.7 text; the first Orbit build centred it.)
  - **Ring size:** the revised 1.7 text says "14 specks spread around the element", while the
    Cursor board's Magnetic tile gives a small IconButton "its ring of 8 specks". Kept as built:
    one speck per ~32 px of outline, between 8 and 14, so normal controls get 14 and small ones 8.
  - **Minifier gotcha:** the build minifier dropped a literal `translate: -50% -50%` that sat next
    to `transform` in `.cursor-pill`. Put offsets inside `transform` instead (now
    `translate(16px, -50%) scale(...)`). The `translate:` rules that use `var()` (magnetic,
    card lift, spotlight) survive.
  - **Off:** it renders nothing unless `(hover: hover) and (pointer: fine)` and motion is allowed.
    It hides (and gives the system cursor back) when the pointer leaves the window, on blur, and
    while the tab is hidden.
- **Magnetic (1.7):** `useMagnetic(ref, { radius = 60, max = 8, strength = 0.3 }, enabled)`.
  - One shared window `pointermove` serves every registered element. Within `radius` px of the
    element's edge it drifts `clamp(offset x 0.3, ±8)`, and it springs back with
    `elastic.out(1, 0.5)` on leave.
  - It tweens `--mx` / `--my`, which `.magnetic { translate: ... }` applies. That's the separate
    `translate` property, never `transform` (Framer owns that for the press), so the two libraries
    never share a property.
  - Mouse only; off on touch and with reduced motion.
  - **Defaults:** IconButton `magnetic` true; Button `magnetic` = primary only, off while disabled
    or loading. `mergeRefs()` in `lib/utils.ts` combines the internal ref with a caller's ref.
- **UI sounds (1.7):** `lib/sfx.ts` is a tiny stub: `initSfx()` and `sfx(name)`.
  - **initSfx():** creates the shared AudioContext synchronously (`lib/audio/context.ts`,
    `ensureAudioContext()`; call it only in a user gesture). It then imports
    `lib/audio/sfxEngine.ts`, which fetches and decodes every mapped sound once.
  - **sfx(name):** does nothing until init has run or when `ui.soundEnabled` is false, so silent
    visitors download no engine and no files.
  - **Playback:** through a master gain (0.4), throttled per sound name (60 ms, so a hover tick
    never swallows the click), with a random ±3% `playbackRate`. Several files under one name
    pick one at random (hover = `tap_01`-`05`).
  - **Wiring:** a `sound` prop (default true) on Button (hover + click), Chip (hover + `toggleOn` /
    `toggleOff` by the new state) and interactive Card (hover + click). Hover sounds are mouse
    only (`pointerType`).
  - **Files:** `public/sfx/SND01_sine/` (28 mono 44.1 kHz 16-bit WAVs, peak about -5 dBFS).
- **Typing sound (1.7 follow-up, Nasheet asked for it):** `sfx("type")` picks one of
  `type_01`-`type_05` (10 ms each) at random, at a per-sound gain of 0.6 under the 0.4 master.
  Typing is the most repetitive sound, so it's the quietest.
  - Throttles are now per sound: 60 ms for hover, click and toggles, but **30 ms for `type`**, so
    quick typists don't lose ticks.
  - `onTypingSound(e)` is the opt-in keydown handler. It plays for characters, Space, Backspace,
    Delete and Enter. It skips held-down repeats, Ctrl / Cmd / Alt shortcuts, lone modifiers,
    arrows and IME composition.
  - On `/dev`, only the sample input in the cursor section opts in.
  - **Verified:** silent mode means 0 plays and 0 files. Sound on fetches the five type files
    (13 sounds in total, once). A keydown / play log of "hello world" at 60 ms shows 11 keys and
    11 ticks, each within 1 ms. Backspace and Enter tick; Shift, ArrowLeft, Ctrl+A and Ctrl+C
    don't. 20 keys in 330 ms give 9 ticks (the 30 ms throttle). Sound off gives 0.
- **Testing notes (1.7):** to check audio headlessly, inject a main-world script that wraps
  `AudioBufferSourceNode.prototype.start` and the `AudioContext` constructor and reports through
  `data-*`. When moving the mouse with `steps`, the pointer crosses neighbours and fires their
  hover sounds; jump straight to the target when counting sounds.
- **Verified 1.7 (headless Chromium, production build with the /dev flag):**
  - **Cursor (Orbit):**
    - **Rest:** the dot is exactly on the pointer, with three specks at 12.4-12.9 px (one amber)
      turning 91-92° a second. Right after a fast move the specks trail 245-269 px behind.
    - **Hover:** a secondary Button gives 14 specks (4 amber), 6.7-7.1 px outside its rounded
      edge, drifting about 10.5 px in 0.5 s (20 px/s); the dot is at opacity 0.
    - **Pressed:** exactly 2.0 px from the edge, scale 1.33, every speck accent; on release
      ~7 px, scale 1, amber back.
    - **Magnetic IconButton:** 8 specks, 6.9-7.0 px out while it has drifted 5.7 px.
    - **Text:** the caret with two amber specks at exactly (0, ±12).
    - **View:** the pill's left edge is 16 px right of the pointer (858 vs 842) and its centre is
      level with it, with 12 specks 6.8-7.0 px around it.
    - **Other:** a plain `<a>` gives orbit; a disabled Button gives default. Leaving the window
      hides it. No cursor on touch or with reduced motion.
    - Screenshots match the board.
  - **Magnetic:** at 40 px outside, `--mx` = 8px (the cap), `translate: 8px`, and GSAP never writes
    `style.transform`. On leave it springs back to 0px. Primary buttons are `.magnetic`; secondary
    ones aren't.
  - **Window leave:** the cursor hides and `has-cursor` is removed.
  - **Touch context and reduced motion:** no cursor element and no `has-cursor`.
  - **Sound:**
    - Silent by default: hover and clicks on Buttons and a Chip make 0 plays, create no
      AudioContext and fetch 0 sound files.
    - "Sound on": the context is created and the 8 mapped WAVs are fetched exactly once.
    - Jumping straight to a Button gives 1 hover and 1 click; a Chip gives 1 hover and 1 toggle;
      `sound={false}` gives 0 and 0. Two hovers inside 60 ms give 1. Rates were 0.970-1.016.
    - Sound off again: 0 plays.
  - **Bundle:** first-load JS on `/` is 199.2 KB (198.7 before; the cursor itself loads after
    hydration).
- **Preloader (2.1):** `content/preload.ts` (the manifest, typed `PreloadEntry`) and `lib/preload.ts`.
  - **Entry kinds:**
    - `fonts`: `document.fonts.ready`, weight 258, the four preloaded SF Pro Text files.
    - `url`: a fetch, with an optional byte `range` and `when: "sound"`, which is included only if
      localStorage `sound` = "1" or the `soundChosen` option says so.
    - `image`: resolves the **same optimized `/_next/image` URL the page will request** via
      `getImageProps` (same width / height / `sizes`), picking the smallest srcset candidate at
      least `innerWidth x vw x devicePixelRatio` wide. That warms the cache the page actually uses.
  - **`preload(manifest, { onProgress, timeoutMs = 8000, soundChosen })`:** fetches everything in
    parallel and reads each body as a stream (`received / Content-Length`, clamped to 1). It
    reports `{ loadedWeight, totalWeight, progress, items }`.
    - A failed asset (404, blocked) counts as finished, with `status: "failed"` and the error.
    - It returns `{ ready, done }`. `ready` resolves when everything is done **or** after the
      timeout (`timedOut: true`); `done` resolves when everything has really finished.
  - **`createEasedProgress(onFrame, tau = 0.2)`:** runs on `gsap.ticker`. The shown value eases
    toward the real one, never passes it, never goes backwards, and snaps the last 0.1%. Call
    `stop()` when the gate is gone.
  - **Fonts are one step:** `document.fonts.ready` resolves at once, so the fonts' weight lands
    in a single jump of the real value (the eased display smooths it). Re-fetching the fonts
    with `fetch()` could download them twice, because a `<link rel=preload as=font>` isn't
    reused by fetch. Revisit only if the gate's bar visibly jumps on a first visit.
  - **/dev "Preloader" section:** a dev manifest of the placeholder media. URL entries get
    `?run=N` cache-busters; the image URLs are fixed, so they come from cache after the first run.
- **Verified 2.1 (headless Chromium, production build with the /dev flag):**
  - **Throttled at 50 KB/s + 150 ms latency, cache off:** ready at 1,453 ms. The real value took
    12 distinct steps (largest 5%). The shown value never exceeded the real one and never went
    back.
  - **Bytes vs the CDP network log:** video 41.8 KB received vs 42.1 KB encoded (headers), poster
    6.1 vs 6.4, images 5.9 / 6.7 vs 6.3 / 7.1. Images were fetched at the same `w=640` URL the
    `/dev` `Img` uses.
  - **Hanging video** (never answered): "Let in after the 8 s timeout at 8005 ms", with that row
    still loading in the background.
  - **404:** the row is "failed (HTTP 404)" and the bar completes ("Ready at 32 ms").
- **Entry gate (2.2, loading screen only; homepage still undecided):** boards
  `stuff/reference/Loading screen — desktop 1440@2x.png`, `— mobile 390@2x.png` and `— states, lines,
  spec@2x.png`.
  - **Mounting:** `components/gate/EntryGate.tsx` is mounted in `app/layout.tsx` (server-rendered,
    so it paints with the HTML). `GateScript` in `<head>` sets `html[data-gate="skip"]` before
    paint when localStorage `entered` = "1" (repeat visit); `?gate` in the URL forces it. CSS
    hides `.entry-gate` for `skip` and `done`. `/dev` has a "Replay the gate" link.
  - **Layout:** `bg-bg-base`, `z-gate` (new token 65: above toasts, below the cursor).
    - **Top:** the name (two dots, teal and amber) top-left; `GateClock` (city · HH:MM zone, from
      `content/profile.ts`, minute-aligned updates, hidden below md) top-right.
    - **Centre (Nasheet's change after the first build; the board had them bottom-left):** the
      counter (`text-stat-1`, now **responsive: 64 px below md, 72 px from md**, `tabular-nums`)
      and, under it, the line row (`OrbitSpinner` + the loading line in SF Mono 13,
      `font-mono text-footnote`, text/secondary), centred as one block in the space between
      the top row and the bottom.
    - **Bottom:** the percentage and a 1 px hairline (`.gate-fill`, scaleX; glows at 100%).
    - **Spacing:** 48 px margins on desktop; 24 px sides and the hairline 44 px from the bottom
      on phones.
  - **Particles:** `GateScatter`, a static, seeded SVG (150 dots, about 1 in 6 amber) at 35%, as a
    stand-in until the WebGL canvas (3.x).
  - **Behaviour:**
    - The counter, percentage and hairline are written straight to the DOM from
      `createEasedProgress`.
    - Lines: `content/loadingLines.ts` (24 from the board). "Brewing…" is the server-rendered
      opener, then the rest are shuffled, **every 0.8 s** (Nasheet: "update frequently"; the board
      said 1.6 s), never repeating, and the last is always `readyLine` ("Ready."). Swaps stop once
      the shown value passes 95%, so no line flashes past just before "Ready.".
    - **Minimum 3.2 s on screen:** `createEasedProgress(onFrame, { minDurationMs: 3200 })` caps
      the shown value at elapsed / 3.2 s (it still never passes the real value). A fast load
      therefore shows "Brewing…" plus about four lines; the gate is gone about 5.3 s after
      hydration (4.7 s with reduced motion).
    - At 100% (`ready` resolved and the shown value reaches 1; a timeout also runs the counter to
      100) it holds 300 ms, then exits with a GSAP timeline: the counter scales to 0.92 and fades
      (0.35 s, the counter and line together, from their centre), the rest fades, and the overlay
      `yPercent: -100` (0.55 s from 0.25 s), about 0.8 s in total. Reduced motion uses a 200 ms opacity fade instead, the spinner doesn't spin and
      lines fade in.
    - At the end it saves `entered`, sets `html[data-gate=done]`, releases `lockScroll`, sets
      `ui.entered = true` and unmounts.
    - A sr-only `role="status"` says "Loading" then "Ready."; the visual layer is `aria-hidden`.
  - **Bundle split:** `GateLine` (ScrambleText) loads via `next/dynamic` (`ssr: false`, with the
    first line as the server fallback). `lib/preload.ts` is imported inside the effect, and
    `getImageProps` loads only for `image` entries.
  - **Out of scope on purpose:** the hero (particles forming the name), the nav's sound pulse /
    tooltip, the "Tap for sound" chip. See the carry-overs.
  - **Counter before hydration:** with only fonts in the manifest, the counter sits at 000 until
    the JS has loaded, then finishes quickly (the fonts start loading from `<head>`). It will
    track real work once the hero photo, model and track chunk join the manifest.
- **Verified 2.2 (headless Chromium, production build):**
  - **First visit:** the gate is in the server HTML. Throttled to 60 KB/s + 150 ms, the counter
    only rose, ended on "Ready." and the gate removed itself, with `entered` = "1",
    `data-gate=done` and the scroll lock released. **No AudioContext was ever created.**
  - **Repeat visit:** `data-gate=skip` and `display: none` already at DOMContentLoaded (no flash).
  - **Lines with fonts made to take 5 s:** "Brewing…" at 25 ms, then new shuffled lines at 1.7 /
    3.3 / 4.9 s, then "Ready." at 6.5 s. The wipe started 560 ms after "Ready." and the gate was
    gone 1,119 ms after it (the 300 ms hold plus the ~0.8 s exit).
  - **Reduced motion:** an opacity fade, no transform wipe, and the spinner animation is `none`.
  - **Layout:** phone counter 64 px at left 24 px, hairline 44 px from the bottom, clock hidden;
    desktop counter 72 px at 48 px, hairline 48 px from the bottom, 1344 px wide.
  - **Bundle:** first-load JS on `/` was 212.7 KB before the split and is 198.7 KB after it
    (199.2 before 2.2).
  - **After centring, 0.8 s lines and the 3.2 s minimum (unthrottled first visits):**
    - **Lines:** desktop, phone and reduced motion each showed "Brewing…" plus four shuffled
      lines at about 0.9 / 1.7 / 2.5 / 3.3 s, then "Ready." at about 4.1 s. The last line sat
      ~0.8 s before "Ready." (no flash), and the counter only rose.
    - **Centring:** the counter and line centres are exactly at the viewport centre (720 of
      1440, 195 of 390).
    - **Unchanged:** repeat visits skip before paint, no AudioContext, phone counter 64 px.
    - First-load JS on `/` is still 198.7 KB.
- **Root layout (2.3):** the `<body>` order is StoreHydrator, SmoothScroll, then inside MotionProvider:
  ToasterLoader, `CanvasLoader`, EntryGate, `<div id="app">` (Nav slot comment for 2.4,
  `<main class="relative z-content">`, `PersistentLayer`), CursorLoader.
  - **The layout owns `<main>`.** Pages render only their content (no `<main>` of their own).
  - **Canvas:** `canvas/CanvasRoot.tsx` is an empty fixed `z-canvas` div (`data-canvas`,
    `aria-hidden`), loaded by `components/layer/CanvasLoader.tsx` with `next/dynamic` (`ssr: false`).
    3.1 puts the R3F scene there.
  - **PersistentLayer** (`components/layer/`, a server component): fixed `inset-0 z-persistent`,
    `pointer-events-none`, with each corner opting back in. `.layer-corner-left/right` in `globals.css`
    use `--layer-inset-bottom/left/right`: `max(16px, env(safe-area-inset-*))`, and the right side
    adds `var(--scrollbar-gap, 0px)`. Toasts use the same side insets.
  - **Placeholder:** `PlaceholderPill` is a non-interactive glass pill (`h-10`, `rounded-chip`,
    subhead). The only one is "Ask" (`copy.layer.ask`), bottom-right.
  - **Viewport:** `export const viewport = { viewportFit: "cover" }` in `app/layout.tsx`. Every new
    fixed element pads itself with `env(safe-area-inset-*)` (reuse the `--layer-inset-*` variables).
  - **Inert:** `OverlayRoot` keeps a module-level count of open overlays and toggles `inert` on
    `#app` while any is open. The effect is declared **before** `useFocusTrap`, so `inert` is
    released before the trap's cleanup focuses the opener (focus on an inert element is ignored).
    Overlays, toasts, the gate and the cursor are outside `#app`.
  - **Mount counter:** `MountCounter` bumps a module-level count on mount, writes it to
    `data-mounts` on the layer, and `console.debug`s it in dev (StrictMode makes dev start at 2).
- **Nav (2.4):** boards `stuff/reference/Navigation (chunk 2.4)@2x.png` and `The island — nav + live
  activities (2.4 and later)@2x.png`. Everything is in `components/nav/`.
  - **Loading:** `Nav` (server) renders `<header id="site-nav">` with the static **`NavShell`** (pure
    HTML, no JS: wordmark, Mouse selected, the idle island at "01 Home", three circles) and
    `NavLoader`, which loads the live **`NavBar`** with `next/dynamic` (`ssr: false`). NavBar's
    `useLayoutEffect` sets `data-live` on the header, and CSS hides `.nav-shell` in the same frame.
    **Keep NavShell in step with NavBar / Island idle / ModeSwitch.** (A client `loading:` fallback
    was tried first: it pulled tailwind-merge into first-load JS.)
  - **Layout:** `NavRow` is shared by both: left group, the island absolutely centred, right group.
    Top inset `--nav-inset-top` = `max(20px, env(safe-area-inset-top))`; sides use the 2.3
    `--layer-inset-*`. Pills and circles are 44 px below lg and 48 px from lg (`navStyles.ts`).
    **Desktop is lg (64rem) and up**, because wordmark + switch + open island + circles need ~1000 px;
    below lg it's the phone row (logo circle, compact island, sound circle).
  - **Pieces:** `Wordmark` (+ `LogoDots`), `ModeSwitch` (two `aria-pressed` buttons in a
    `role="group"`, the selected pill slides with a per-instance `layoutId`; `compact` in the menu),
    `NavCircles` (terminal, theme), `SoundButton`, `TapForSound`, `EqBars`, `ChapterLink`.
    Current items are solid `text-primary` pills with `bg-base` text.
  - **Island** (`Island.tsx` + `lib/island.ts`): one `m.div layout` whose border radius is set per
    shape (22 / 24 / 26 / 28), morphing on `{ type: "spring", duration: 0.35, bounce: 0.15 }`, with
    the content in `AnimatePresence mode="popLayout"` cross-fading (0.2 s). Reduced motion: no
    morph, a 0.15 s fade. Shapes: idle, nav (links), live (lead + small chapter + trail), split
    (live + a 44 px circle for the second activity), alert, expanded. Priority: alert › expanded ›
    nav hover › live › idle.
    - **Nav links** open on mouse hover (only with `(hover: hover) and (pointer: fine)` at lg) or when
      the island's centre button gets keyboard focus, which then moves focus to the current link
      (`aria-current="location"`). They retract 400 ms after the pointer leaves, never while focus is
      inside. The current pill is `layoutId="island-current"`.
    - **Below lg or on touch,** the centre opens the phone menu (`ui.menuOpen`).
    - **Expanded:** a click on an activity's lead / trail; Esc (when no overlay is open) or a
      pointerdown outside collapses it.
    - **Alerts:** `island.alert({ icon, tone, text, detail })`, 2.5 s, icon names map to lucide in
      `IslandAlert.tsx`; announced by a polite `aria-live` paragraph in the island.
    - **The six dots:** `m.span layout` per dot, the current one `w-4` teal (moved by transform).
  - **Toasts (decision):** `toast()` sends success and info **without an action** to
    `island.alert` (returns -1). Errors and anything with an action (Retry, Undo) stay in the 1.5
    corner stack.
  - **Shortcuts** (`lib/shortcuts.ts`): one `SHORTCUTS` array (`` ` `` `/` `M` `T` `A` `?` `Esc`),
    each with the Kbd key, label and action, plus the shared actions `toggleSound`, `toggleTheme`
    and `setHandMode` (each raises an island alert). `handleShortcut` skips modifier combos, IME,
    repeats, and typing targets (text inputs, textareas, selects, contenteditable); Esc defers to
    open overlays. It's mounted by `ShortcutsLoader` → `ShortcutsProvider` (lazy).
  - **? overlay:** `ShortcutsOverlay` (lazy, `NavOverlays` mounts it on first open) is the 1.5 Modal
    at `w-180` with `KeyboardDrawing` (lit keys: Esc, `` ` ``, T, A, M, /) and the list from
    `SHORTCUTS`. Backdrop click closes it.
  - **Phone menu:** `MobileMenu` (lazy) is a full-screen dialog on `OverlayRoot`
    (`bg-bg-base/70` + glass blur), numbered links in `text-large-title` with the
    `content/chapters.ts` subtitles, staggered 40 ms, the current one a light pill; then
    ModeSwitch + circles and "Get in touch" (Button). On `/` a link closes the menu and glides after
    the lock is released (`whenUnlocked`); elsewhere it `router.push`es `/#id`.
  - **Auto-hide:** `NavAutoHide` (passive scroll listener, no state) toggles `data-hidden` on
    `#site-nav` after 120 px down (min 4 px delta) and clears it on any scroll up or focus inside.
    It never hides while the nav is hovered or focused, the menu / ? overlay / any scroll lock is
    active, or the island shows an alert or a card. CSS: `translateY(-100%)`, or opacity 0 under
    reduced motion.
  - **Sound hints:** first visit (`html[data-gate=done]` when `ui.entered` turns true, sound off):
    0.9 s later the sound circle gets `data-pulse` (one CSS ring, `.sound-pulse`) and its tooltip is
    forced open (`Tooltip forceOpen`) for 4 s. Repeat visit with `sound` = "1" and no AudioContext:
    "Tap for sound" shows; **the first pointerdown or keydown anywhere** calls `initSfx()` (the
    saved choice was "on") and removes it. (The plan said only the pill would turn sound on; any
    first gesture does, so the sound state and the circle never disagree.)
  - **Chapter tracking:** 2.4 had `useChapterTracker()` (an IntersectionObserver in NavBar). 3.3
    replaced it with `ChapterSection`'s ScrollTrigger, now the only writer of `scroll.chapter`.
  - **Store:** `ui.menuOpen` / `setMenuOpen` added (`shortcutsOpen` already existed).
  - **Framer:** `motionFeatures.ts` now loads `domMax` (layout + drag) for the whole app, still
    after hydration; `sheetFeatures.ts` and the Sheet's nested `LazyMotion` are gone.
  - **`/dev`:** a "Nav island" section fires alerts, pushes a fake music activity (live → expanded
    player → split with a fake AR activity) and opens the ? overlay. The dev header now sticks at
    `top-22` and sections use `scroll-mt-72`, below the nav.
  - **Tooltip:** new `align="end"` and `forceOpen` props.
- **Page transitions (2.5):** `app/template.tsx`, `components/nav/TransitionLink.tsx`,
  `lib/motion/pageTransition.ts`, `lib/motion/scrollMemory.ts`, and the `.page` rules in `globals.css`.
  - **Exit:** `navigate(router, href)` records the current scroll position, sets the `leaving` flag
    (a tiny external store), and pushes after 300 ms with `{ scroll: false }`. The template's
    wrapper gets `data-leaving` (CSS: opacity 0, `translateY(-12px)`, 300 ms ease-out). Under
    reduced motion it pushes straight away. A popstate during the exit cancels the push.
  - **Enter:** the new template's layout effect places the page, sets `data-page="from"` (opacity
    0, +12 px, no transition) and switches to `"in"` on the next frame. The first page of a visit
    doesn't animate. Reduced motion: the `.page` rules are all off.
  - **Why CSS, not Framer:** see §3; the motion is the same.
  - **TransitionLink:** a `next/link` (prefetch kept) whose click calls `navigate()`; modified
    clicks, other targets, other origins and same-path links fall through. `ChapterLink` uses it
    off `/`, and the phone menu calls `navigate()` for chapters on other routes.
  - **Placement** (`placeNewPage(path, traversal)`): Back / Forward → the saved position; a
    `#hash` → that section (its top measured without the wrapper's transform); otherwise 0. All
    with Lenis `scrollTo(y, { immediate: true, force: true })` (`force`: the phone menu may still
    hold the lock), then `ScrollTrigger.refresh()` on the next frame.
  - **Back / Forward detection:** `navigate()` marks a push (`takePushed()`); a route mount without
    the mark is a traversal. A popstate flag was tried first and failed: React 19 renders a
    traversal synchronously before any of our popstate listeners runs (even in capture).
  - **Scroll memory:** `history.scrollRestoration = "manual"`; one passive scroll listener files
    `scrollY` under the route the template set with `setScrollPath(pathname)` (not
    `location.pathname`: Next updates the URL after the new page's layout effect, so the reset to 0
    was filed under the old route). Kept in memory and in `sessionStorage` (`scroll-memory`).
- **Verified 2.5 (headless Chromium, production build with the /dev flag):**
  - **Back:** `/` scrolled to 2400 → `/dev` (starts at 0) → Back returns to exactly 2400 with the
    island at 04 Skills; Forward returns `/dev` to its 1200.
  - **Exit and enter, frame by frame** (wordmark on `/dev` → `/#home`): the old page fades
    1 → 0 while moving 0 → −11 px over ~300 ms; the new page's first frame is opacity 0 at +12 px
    and it reaches 1 / 0 about 230 ms later. No frame shows either page at full opacity in the
    wrong place (no flash). It lands at `/#home`, scroll 0.
  - **Chapter links from `/dev`:** the island's Work link lands with `#work` exactly at the top;
    the phone menu's Skills link lands `#skills` at 0 with the menu closed and the lock released.
  - **Persistent layer:** the same document (marker kept), `data-mounts` = 1, the Ask pill at
    16 / 16 after every navigation.
  - **Reduced motion:** every sampled frame is at opacity 1 with no offset (an instant swap).
  - **[manual]** The feel of the 300 ms exit + enter on real devices, and Back from a real case
    study once 4.5 exists.
- **Particle scene (3.1):** `canvas/CanvasRoot.tsx` (fixed `inset-0 z-canvas`, `pointer-events-none`,
  WebGL probe), `canvas/Scene.tsx`, `canvas/FrameDriver.tsx`, `canvas/particles/Particles.tsx`,
  `canvas/shaders/{particles.vert,particles.frag,noise}.glsl` and `types/glsl.d.ts`.
  - **Packages:** `three` 0.187, `@react-three/fiber` 9.8, `@react-three/drei` 10.7; dev
    `@types/three`, `raw-loader` 4.
  - **GLSL imports:** Turbopack rule `*.glsl` → `raw-loader`, `as: "*.js"`; webpack (`npm run
    analyze`) gets `type: "asset/source"` in `next.config.ts`. `noise.glsl` (Ashima 3D simplex, MIT)
    is prepended to the vertex shader as a string in `Particles.tsx` (no `#include` loader).
  - **Canvas:** `dpr={[1, 1.75]}`, `antialias: false`, `alpha: true`, `powerPreference:
    "high-performance"`, camera FOV 35 at z = 6 (near 0.1, far 50).
  - **Geometry:** no `position` attribute; `aFrom`, `aTo` (vec3) and `aRandom` (vec4: delay, size
    0.5–1.5, seed, spare), all sized for `MAX_PARTICLES` = 40k, drawing `DEFAULT_PARTICLES` = 30k.
    A fixed bounding sphere (radius 5) and `frustumCulled={false}`, because three can't compute
    bounds without `position`. The cloud is seeded (mulberry32), so it's the same every visit.
  - **Shaders:** per-particle progress `clamp((uMorph - delay·0.4) / 0.6)` smoothstepped; drift is
    three simplex lookups × 0.14 at `uTime · 0.06`; `gl_PointSize = uSize (16) · size · uPixelRatio /
    -z`. The fragment is a soft disc (`smoothstep`, alpha²), seed > 0.83 is amber (about 1 in 6),
    ending in `#include <colorspace_fragment>`. Additive blending, `depthWrite: false`.
  - **Uniforms:** all 13 from §9.2 plus `uPixelRatio` and `uSize`; unused ones are commented with
    their chunk in the vertex shader.
- **Verified 3.1 (headless Chromium on the real GPU, Intel Iris Xe via ANGLE/D3D11, production build):**
  - **One draw call:** a `drawArrays` probe saw exactly one call per frame, `POINTS` with 30,000.
  - **Frames:** p50 6.1 ms, p95 6.2 ms over 3 s at 1280 × 720 (headless isn't vsync-capped, so
    ~165 fps). Pixels change between samples 1 s apart (drifting).
  - **Hidden tab** (faked `visibilitychange`): 0 draws; ~165 a second again when shown.
  - **Reduced motion:** exactly 1 draw after load, none over the next 2 s, 1 more on resize.
  - **Layer:** `position: fixed`, `z-index: 0`, `pointer-events: none`, canvas 1280 × 720 at DPR 1.
  - **Console:** production and dev (`/` then `/dev`) show only the known favicon 404; no three or
    R3F warnings.
  - **JS heap:** 17.2 MB after load, 12.7 MB a minute later (nothing allocated per frame).
  - **Bundle:** first-load JS on `/` 204.3 KB (204.4 before); the webpack analyze build also
    inlines the shaders.
  - Screenshots in both themes: the cloud fills the view behind the nav and text, about 1 in 6 amber.
  - **[manual]** 60 fps with the Performance panel recording on a mid-range Android phone and the
    low-end laptop; GPU memory flat over 5 minutes (Chrome Task Manager → "GPU memory" column, or
    the Performance panel's memory track). Headless can't read GPU memory.
- **Shape library (3.2):** `canvas/shapes/` holds `constants.ts` (`MAX_PARTICLES` 40k,
  `DEFAULT_PARTICLES` 30k, `SHAPE_BOX` 4 × 2.4 × 2.4, `SCATTER_BOX` 7 × 4.2 × 3; `Particles.tsx`
  re-exports the counts), `random.ts` (mulberry32 + `seedFrom(id)`: each shape has its own fixed
  seed), `math.ts`, `fromText.ts`, `fromModel.ts`, `normalize.ts` and `registry.ts`.
  - **Chapter → shape:** `content/chapters.ts` gives each chapter a `shape` (`ShapeSpec`, plain data).
    Today: Home the room (`/models/room.glb`, R.3), About `/models/sphere.glb`, Work
    `/models/laptop.glb`, Skills `/models/rings.glb` (both GLBs added by Nasheet after 4.1; the maths
    sphere and ring are no longer mapped), Arcade `/models/controller.glb`, Contact
    `/models/envelope.glb`; `fallbackShape` (scatter) for other routes. The name, grid, sphere and
    ring maths shapes still exist (the name is the intro's). All GLBs are in the gate's preload.
  - **normalize(points, rand, box):** centres, scales uniformly to fit the box (a flat dimension
    doesn't limit the scale), then Fisher–Yates shuffles whole points.
  - **fromText:** `loadTextFont()` waits for SF Pro Display 700 (`document.fonts.load`, family read
    from `--font-sf-display`), then draws on a 1024 × 256 `OffscreenCanvas`, fitting 94% of the width,
    samples pixels with alpha > 128, ±6 px Z jitter (~0.05 world units).
  - **fromModel:** `fetchModel(url)` then `fromModel(buffer, rand)` (the chunk's `fromModel(url)`
    is split so network time stays outside the timing). `GLTFLoader.parseAsync`, every mesh merged
    into one non-indexed position-only geometry in world space, fitted to `SHAPE_BOX` first (so the
    ±0.012 jitter is in world units), 55% on `EdgesGeometry(geo, 25)` segments picked by length
    (cumulative table + binary search), 45% via `MeshSurfaceSampler`. `@types/three` 0.187 lacks
    `setRandomGenerator`, so it's called through a narrow cast.
  - **Registry:** `scatterShape()` is synchronous (the canvas starts from it). `loadShapes()` (once,
    started by `Particles` on mount, i.e. while the gate is up) computes the rest in order, one
    `requestIdleCallback` each (`setTimeout` 16 ms on Safari), with font / model fetches awaited
    before the timed part. A failing shape logs an error and is skipped. In dev it logs
    `[shapes] …` and writes the same line to `html[data-shapes]` (headless consoles skip info).
  - **Preload:** the three GLBs are `url` entries in `content/preload.ts` (13 / 52 / 4 KB), so the
    gate warms the cache; the registry's fetch is then a revalidation.
  - **Dev `]`:** `canvas/dev/ShapeCycler.tsx`, rendered only when `NODE_ENV === "development"`
    (absent from the production build), cycles every ready shape (through `morphTo` since 3.3) and
    writes `html[data-shape]`. It ignores typing targets and modifier combos. Under reduced motion
    the morph isn't drawn (the frame driver renders only on resize).
  - **Drift change (vertex shader):** 3.1's drift fed each particle's seed into the noise, so
    neighbours wandered apart and thin strokes (the name) smeared. It's now one smooth field shared
    by neighbours (amplitude 0.14) plus a tiny per-particle wobble (0.008). Outlines stay crisp.
- **Verified 3.2 (headless Chromium on the Iris Xe):**
  - **Timing (dev build):** 8 shapes, compute **82.4 ms** in total (home 29.7, about 3.8, work 16.1,
    skills 5.3, arcade 17.1, contact 5.9, grid 4.5; scatter is synchronous at mount), 196 ms wall
    including idle waits and fetches. No single shape near 50 ms.
  - **Readability at 30k (screenshots, dark):** the name reads "Nasheet Khan" with crisp strokes;
    the controller shows its D-pad, four face buttons, two centre buttons and the grips; the envelope
    its flap V, border and seal; the laptop its screen frame and deck; sphere, ring and the 12 × 7
    grid are clean.
  - **Production:** the gate still completes (5.1 s with its 3.2 s minimum), all three GLBs load,
    the canvas renders, `]` does nothing, and no dev attributes are written. Console: only the
    favicon 404.
  - **Bundle:** first-load JS on `/` 204.6 KB (+0.3 KB: the shape data in `content/chapters.ts`).
  - **[manual]** Judge each shape at real size on your screens (and how the name sits once 4.2's
    NameCard exists); the timing on the low-end laptop.
- **Scroll morph (3.3):** `components/chapters/ChapterSection.tsx`, `canvas/ScrollMorph.tsx`,
  `canvas/particles/morph.ts`, `canvas/frame.ts`; `app/page.tsx` uses ChapterSection;
  `lib/hooks/useChapterTracker.ts` is deleted.
  - **ChapterSection** (client): `<section id data-chapter={index}>` with a ScrollTrigger
    `top center` → `bottom center`; `onEnter` / `onEnterBack` set `scroll.chapter` (only on change),
    `onUpdate` writes `scroll.progress` while it's the current chapter. `useGSAP` reverts it. It
    deliberately doesn't use `cn()` (tailwind-merge would join first-load JS).
  - **ScrollMorph** (inside the canvas): `useStore.subscribe` on `scroll.chapter` → that chapter's
    shape on `/`, scatter elsewhere. `pathname` comes from `CanvasRoot` (read outside `<Canvas>`).
    A shape that isn't ready yet is applied when `loadShapes()` resolves.
  - **morphTo:** calls in one task are coalesced to the last (a fling crossing every chapter in one
    ScrollTrigger update does one morph), applied on a microtask. Retargeting the same shape is a
    no-op. A running morph is frozen on the CPU (the shader's exact per-particle formula) into
    `aFrom`; then `aTo` = shape, `uMorph` 0 → 1 over 1.2 s, `power3.inOut`.
  - **Reduced motion:** `morphTo(…, { instant: true })` swaps both attributes and calls
    `requestFrame()` (`canvas/frame.ts`), which FrameDriver wires to `advance(0)` only under
    reduced motion.
  - **Scroll response:** `Particles` smooths Lenis's `progress` (native scroll without Lenis) into
    `uScroll` and the mesh's rotation, and `scroll.progress` into a vertical parallax.
- **Verified 3.3 (headless Chromium on the Iris Xe):**
  - **No pops (dev build, a temporary CPU probe, since removed, that recomputed 2,000 sample
    particles' blended positions every frame):** largest single-frame move 0.195 world units on a
    slow chapter-by-chapter scroll (a normal morph step), 0.195 over 15 wheel flings reversing
    mid-morph, 0.218 over Home / End jumps crossing every chapter in one frame; 0 frames over 0.5.
  - **Frames (production, 1280 × 720):** p50 6.1 / p95 6.3 ms during flings and idle. `/dev` without
    morphs: 0 frames over 20 ms. `/`: 4 fresh runs, the first had two ~42 ms frames (one as the nav
    auto-hid for the first time), the next three had none; no long tasks or long animation frames
    were recorded in any run.
  - **Reduced motion:** 2 draws at load, 0 while idle, exactly 1 per chapter change.
  - **Island** follows the sections (02 About, 06 Contact, 01 Home after Home). Another route shows
    the scatter.
  - **Bundle:** first-load JS on `/` 205.0 KB (+0.4 KB: ChapterSection).
  - **[manual]** The fling feel and 60 fps on the mid-range Android and the low-end laptop (any
    hitch on the first chapter change?); the rotation / parallax amounts by feel.
- **Pointer (3.4):** `canvas/particles/pointer.ts` (`createPointerTracker()`), the pointer block in
  `particles.vert.glsl`, wired in `Particles.tsx` (listeners in an effect, `update(camera, delta)` in
  `useFrame`). No React state, no store: a ref, like the scroll values.
  - **Input:** `pointermove` on window (mouse and pen always; touch only while down), touch
    `pointerdown` re-snaps to the new finger; `pointerup` / `pointercancel`, leaving the document and
    window `blur` just stop feeding moves.
  - **Per frame:** a camera ray through the pointer, intersected with z = 0; a frame-rate-independent
    lerp (0.15 per 60 fps frame); velocity smoothed with τ 0.1 s; strength eases (τ 0.08 s) toward
    `min(1, 0.35 + 0.15 × speed)` while moving (an event in the last 60 ms) and decays with τ 0.2 s
    (about 5% after 600 ms) once still. dt is clamped to 0.1 s.
  - **Shader:** done in world space (after `modelMatrix`), so the scroll rotation doesn't skew it.
    The pointer ray is evaluated at each particle's depth (`cameraPosition` → `uPointer`), so the
    effect sits under the cursor at any depth. **New uniforms `uPointerVelocity`** (vec2) **and
    `uRipples`** (vec4[4]), not in §9.2's list. `uPointerRadius` is **0.45** (0.8 first; Nasheet:
    "it happens too much, it's very large").
  - **Look (revised after Nasheet's feedback, "it creates a circle"):** the first version pushed
    everything inside a smoothstep disc outward by 0.4, which left an empty hole with a bright rim:
    a hard circle. Now:
    - **Lens push** `d × 1.6 × fall`: zero at the centre, strongest at ~0.7 σ, so particles thin
      smoothly toward the cursor (a dimple, not a hole). Keep the factor under ~2.2, or neighbours
      cross and a rim comes back.
    - **Gaussian falloff,** σ = 0.55 × radius, wobbled ±25% by slow noise (`snoise(xy × 1.6,
      t × 0.25)`), and a per-particle grain of 0.75–1.25 (`aRandom.w`), so the edge is organic.
    - **Wake:** behind the motion the field stretches by up to 2× (1 + 0.25 × speed), like a
      finger drawn through water.
    - **Swirl:** tangent × cross(dir, velocity) × 0.05, velocity clamped to 4 units/s.
    - **Depth:** a 0.15 bulge toward the camera.
    - `BASE_STRENGTH` (pointer.ts) went from 0.35 to 0.5 to suit the softer push.
  - **Click ripple (Nasheet picked it from glow / ripple / hold-to-gather / sparkle trail):** a
    primary-button `pointerdown` (mouse click or tap) queues a ripple; `update()` projects it onto
    z = 0 and puts it in one of `RIPPLE_SLOTS` (4, oldest reused) as `(x, y, age s, amplitude)`;
    a slot retires after 1.6 s. In the shader each ripple is a ring running out at 2 units/s
    (Gaussian band, variance 0.05, its radius wobbled ±0.07 by the parting's noise), fading with
    `exp(-age × 1.8)` and easing in over 0.12 s so a click never pops. It pushes particles out by
    0.22 and toward the camera by 0.15, and lights them up by growing the points (×(1 + 1.2 × glow))
    and their alpha (+0.6 × glow, capped at 1). Overlapping ripples are capped at one full ripple
    in total.
  - **Reduced motion:** nothing renders continuously, so the pointer has no visible effect.
- **Verified 3.4 (headless Chromium, dev server, About sphere), after the revisions:** a slow move
  (~250 px/s) thins the particles softly in a small area around the cursor with no hole or rim; a
  fast flick (~3,000 px/s) leaves an elongated, irregular wake; 1.2 s after stopping, the sphere is
  closed again. A click: at 0.3 s a soft, slightly uneven bright ring is halfway out; by 0.7 s it
  has passed the edge; at 1.8 s the sphere is settled. Three clicks 120 ms apart pulse the sphere's
  edge outward once, then settle. No
  console errors. Typecheck, lint and build pass; first-load JS on `/` unchanged at 205.0 KB.
  - **[manual]** The feel (radius 0.45, lens 1.6, wake 0.25, swirl 0.05, the 600 ms decay, and the
    ripple's speed 2.0, push 0.22 / lift 0.15 and fade 1.8 are constants in `pointer.ts` and the
    shader), touch on a real phone (it competes with scrolling: the browser
    cancels the pointer once a pan starts), and frame rate while moving on the low-end devices.
- **Theme, colour and moods (3.5):** `canvas/particles/colors.ts`, `canvas/particles/mood.ts`, the
  `Mood` type and per-chapter `mood` in `content/chapters.ts`, and changes to `morph.ts`,
  `ScrollMorph.tsx`, `Particles.tsx`, `CanvasRoot.tsx` and both shaders.
  - **Opaque canvas (Nasheet's change to the plan):** `alpha: false`; `scene.background` is a
    `Color` (`<primitive object={colors.bg} attach="background" />`) cleared every frame to
    `--color-bg-base`. A WebGL canvas is premultiplied, and the dark look writes colour with alpha 0,
    which is undefined when composited over the page; opaque, it only matters in the framebuffer.
  - **Blend:** `CustomBlending`, `ONE` / `ONE_MINUS_SRC_ALPHA`. The fragment shader converts to the
    output colour space, then writes `rgb x a` and alpha `a x uTheme`: additive in dark (uTheme 0),
    normal "over" in light (1), sliding between them with no switch.
  - **Theme:** `watchTheme(material, bg)` (MutationObserver on `data-theme`) tweens `uColorA`,
    `uColorB`, `uTheme` and the clear colour over 0.4 s (`power2.out`); reduced motion swaps and
    calls `requestFrame()`. Light: colour x 0.7 (`LIGHT_SHADE`), `LIGHT_ALPHA` 1.0 (a knob).
  - **Colour mix:** `vMix = smoothstep(0.8, 0.88, aRandom.z + 0.12 x noise)`, so about 1 in 6 is
    amber, gathered in soft patches that drift. (One extra `snoise` per vertex.) Note: `patch` is a
    reserved word in GLSL ES 3.00; using it as a name compiled to nothing (no particles, no console
    error in headless).
  - **Mood:** `{ size, drift, spread }` multipliers. `liveMood` (module object) is tweened by
    `moodTo` with the morph's duration and `power3.inOut` (`MORPH_DURATION`, `MORPH_EASE` from
    `morph.ts`); `Particles` copies it into `uSize` (16 x size), `uSpread` (drift amplitude) and
    integrates `uDriftTime += delta x drift` (so speed changes never jump the drift). Moods: Home
    0.9 / 0.6 / 0.5 (crisp name), About 1.1 / 1 / 1.2, Work 1 / 0.8 / 0.7, Skills 1 / 1.3 / 1, Arcade
    1.1 / 1.6 / 1.1, Contact 0.95 / 0.7 / 0.8; `fallbackMood` 0.85 / 0.35 / 1.3.
  - **Other routes:** superseded by R.2 (`RouteMorph`: one 0.9 s morph, and `uFade` 0.6 on the
    scatter routes). The first route of a visit starts at its fade with no tween (in dev,
    StrictMode's second effect run tweens it once).
- **Verified 3.5 (headless Chromium on the Iris Xe, production build):**
  - **Frames (1280 x 720), before -> after:** idle p50 6.1 / p95 6.2-6.3 -> 6.1 / 6.2 ms in both themes.
    Morphing into each of the 6 chapters in both themes, the 0.4 s theme tween and the 2.5 s route
    calm-down: p50 6.1 / p95 6.2 everywhere. Single-frame spikes (24-54 ms) appeared only right
    after `scrollIntoView` jumps, in 3 of 12 chapter samples (3.3 saw the same); one 103 ms frame in
    the first idle run didn't repeat (max 12.1 ms on the rerun).
  - **Screenshots:** every chapter in both themes. Dark: teal glow with drifting amber patches; light:
    darker teal ink with amber flecks, shapes clear (name, sphere, laptop, controller, envelope).
    150 ms into dark -> light, the background is mid-grey with the particles in between (no pop).
    After `router.push` to another route: fading at 0.4 s, a loose faint scatter at 3 s; a theme
    switch there also tweens.
  - **Reduced motion:** the theme swap and the route state each draw one correct frame.
  - Console: only the known favicon 404 (and the 404 of the test route). First-load JS on `/`
    205.5 KB (+0.5 KB: the moods in `content/chapters.ts`).
  - **[manual]** Both themes on every chapter on your screens; the mood numbers and the 2.4 s calm
    by feel; the theme tween in **Safari** (smooth, no flash); 60 fps on the mid-range Android and
    the low-end laptop.
- **Quality tiers and fallbacks (3.6):** `lib/quality.ts`, `canvas/CanvasRoot.tsx`,
  `canvas/Scene.tsx`, `Particles.tsx` (`pointScale` prop), `components/ui/CanvasFallback.tsx`,
  `components/layer/CanvasLoader.tsx`, `.canvas-fallback` in `globals.css`.
  - **Tiers:** `TIERS` = high 40k / DPR 1.75 / points x1, medium 24k / 1.5 / x1.1, low 12k / 1.0 /
    x1.2 (the size boost keeps thin tiers solid). Nasheet chose 12k for low, so §6 now says 12k–40k.
    `pickTier()`: ≤2 cores or ≤2 GB → low; touch, ≤4 cores, ≤4 GB or a screen's short side < 500 px
    → medium; else high (`deviceMemory` is Chromium only; missing = not counted). The tier lives in
    `CanvasRoot`'s state and shows as `data-quality` on the canvas layer.
  - **Step down:** `<PerformanceMonitor onDecline>` (drei defaults: 10 samples of 250 ms, 75% below
    the bound; bounds 40 fps on ≤100 Hz screens, 60 fps above) → `stepDown`, never up, so no
    flip-flopping. `dpr={[1, tier.dpr]}` is a range, so a DPR-1 screen never renders above 1.
    The monitor samples in `useFrame`, so it works with FrameDriver's `advance()`.
  - **Reduced motion (decision):** kept FrameDriver's on-request frames (`requestFrame()` →
    `advance(0)`), which is what `frameloop="demand"` would do, and the per-chapter still frames
    (the canvas keeps matching the page) instead of the hero shape only. The monitor sees no frames
    there, so the tier never drops.
  - **Fallback:** two static radial gradients (teal centre, smaller amber) mixed into `bg/base` with
    `color-mix()`, from the theme tokens, so it follows the theme with no JS. `CanvasLoader` uses
    `useSyncExternalStore` (server / hydration → nothing), so there's no hydration mismatch.
- **Verified 3.6 (headless Chromium on the Iris Xe, production build):**
  - **Start tier** on this laptop: high (40k). Idle p50 6.1 / p95 6.2 ms, the same as 30k in 3.5.
  - **6x CPU throttle (CDP):** the tier stayed high at ~165 fps: per-frame JS is tiny and the GPU
    isn't throttled, so it isn't slow and shouldn't drop. A morph under 6x: p50 6.1 / p95 12.1.
  - **Forced slow frames** (a 22 ms busy rAF, ~38 fps): high → medium at ~4 s → low at ~6 s, then
    stays low. At device scale 2 the canvas went 2240 → 1920 → 1280 px wide (DPR 1.75 → 1.5 → 1).
  - **WebGL off** (`--disable-webgl --disable-3d-apis`): `data-canvas="fallback"`, the gradient in both
    themes (screenshots), ~977 KB less raw JS fetched (no three / R3F), the island follows scroll
    ("03 Work"), `T` switches the theme. Console: only the favicon 404.
  - First-load JS on `/` 206.0 KB (+0.5 KB: the WebGL check and fallback in the loader).
  - **[manual]** DevTools 6x CPU on your low-end laptop (60 Hz, so the bound is 40 fps): does the
    tier drop if it stutters, and does it feel smooth after; the tier a real phone picks
    (`data-quality` on the canvas layer); Firefox with `webgl.disabled` = true.
- **Verified 2.4 (headless Chromium, production build with the /dev flag):**
  - **Keyboard:** Tab goes wordmark → Mouse → Hand → (island opens) 01 Home [current] → About …
    Contact → Terminal → Theme → Sound; the island returns to idle when focus leaves.
  - **Shortcuts:** `T` switches the theme and shows "Light theme · T to switch back" in the island;
    `M` toggles the sound circle's `aria-pressed`; `A` moves the switch to Hand; `` ` `` toggles the
    terminal circle; `/` is handled (`defaultPrevented`), an unmapped key isn't; `?` opens the
    720 px "Keyboard" modal with all 7 shortcuts and 6 lit keys, and Esc closes it. Typing `tma`?`
    into a text input only types (no theme change, no dialog).
  - **Scroll:** the island reads 03 Work / 04 Skills / 06 Contact as sections cross the middle; the
    row hides after 120 px down and returns on a wheel up; an alert keeps it shown, and it hides
    again after the alert ends.
  - **Hover:** opens the links; still open 250 ms after leaving, idle at 700 ms. In light theme the
    island stays `rgb(9, 11, 11)`.
  - **Island on /dev:** live → expanded → Esc → split (circle present) → expand + click outside →
    live; a success toast becomes an alert ("Email copied") and leaves after 2.5 s; an error with
    Retry stays a corner toast; "Stop all" → idle. The live region reads
    "Dark theme. T to switch back".
  - **Sound hints:** first visit: the pulse and "Sound is off M" tooltip appear 0.95 s after the
    gate is done and are gone 4 s later; not on the repeat visit. `sound` = "1": "Tap for sound"
    shows, and one click elsewhere removes it with the circle pressed.
  - **Reduced motion:** hover still opens; the hidden row has `transform: none`, opacity 0.
  - **Phone (390):** the row is logo, "Navigation: 01 Home", Sound; tapping the island opens the
    menu (6 links, Home current, `#app` inert), the controls fit one line, Esc closes it; tapping
    About closes it, sets `#about` and glides there (section top 0, island "02 About").
  - **Screenshots** match both boards (idle, open, alert, ? overlay, expanded player, split, phone
    row and menu, light theme). No console errors except the favicon 404.
  - **Bundle:** see the Bundle carry-over (203.3 KB).
  - **[manual]** Feel of the morphs and the 400 ms retract on a real trackpad; the phone menu on a
    real iPhone (safe areas); the copy flagged in Open TODO(content).
- **Verified 2.3 (headless Chromium, production build with the /dev flag):**
  - **No remounts:** client navigation / → /dev → / → /dev (`window.next.router.push`) kept the
    same document and the same layer node, with `data-mounts` = 1 throughout. (An unknown URL
    gets a full page load from Next, so the count starts again at 1 there, as expected.)
  - **Positions:** at 1440 x 900 the Ask pill sits 16 px from the bottom and right. With
    `Emulation.setSafeAreaInsetsOverride`, portrait 390 x 844 (top 47, bottom 34) puts it at
    bottom 34, right 16; landscape 844 x 390 (left/right 47, bottom 21) at right 47, bottom 21.
    No horizontal overflow. (Revised 2.3: the Player pill was removed; music is in the nav.)
  - **Inert:** opening the sheet sets `inert` on `#app` with focus inside the dialog; Esc removes it
    and focus returns to "Open sheet".
  - **Toasts** sit 72 px from the bottom (above the 40 px Ask pill), right 16.
  - **Bundle:** first-load JS on `/` +0.1 KB (198.3 → 198.4 KB by summing the gzipped module
    scripts in the HTML; the analyzer method gave 198.7 for 2.2).
  - **[manual]** A real iPhone (notch and home indicator) is still to check; the safe areas were
    emulated.
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
