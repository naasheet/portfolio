/*
 * Scroll memory (2.5). Remembers each route's last scroll position (in memory and
 * sessionStorage, so a reload keeps it for Back) and decides where a new page starts:
 * Back / Forward → the saved position; a `#hash` → that section; anything else (every link)
 * → the top. Home (`/`) has none: it never scrolls (R.1). The browser's own restoration is
 * off (`history.scrollRestoration = "manual"`).
 */
import { ScrollTrigger } from "./gsap";
import { getLenis, scrollTo } from "./lenis";

const STORAGE_KEY = "scroll-memory";

let positions: Record<string, number> | null = null;
let started = false;
/** The route whose page is on screen (set by the template, not read from location: Next
 * updates the URL after the new page's layout effect, so location still names the old route
 * while the new page is being placed). */
let currentPath: string | null = null;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function load(): Record<string, number> {
  if (positions) return positions;
  positions = {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "number") positions[k] = v;
      }
    }
  } catch {
    // Blocked storage: memory only.
  }
  return positions;
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(load()));
    } catch {
      // Blocked storage: memory only.
    }
  }, 200);
}

/** Routes with no scroll memory: Home holds only the room and never scrolls (R.1). */
const NO_MEMORY = new Set(["/"]);

/** Record `y` for `path`. */
export function rememberScroll(path: string, y: number): void {
  if (NO_MEMORY.has(path)) return;
  load()[path] = Math.max(0, Math.round(y));
  persist();
}

export function savedScroll(path: string): number | undefined {
  if (NO_MEMORY.has(path)) return undefined;
  return load()[path];
}

/** The template calls this with its route before placing the page. */
export function setScrollPath(path: string): void {
  currentPath = path;
}

/**
 * Start once (the template calls it on every mount; later calls do nothing). Positions are
 * filed under the route on screen (setScrollPath), so a route change can't file one page's
 * position under another.
 */
export function startScrollMemory(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.history.scrollRestoration = "manual";
  window.addEventListener(
    "scroll",
    () => {
      if (currentPath) rememberScroll(currentPath, window.scrollY);
    },
    { passive: true },
  );
}

/** The element's page y, ignoring the page wrapper's transition offset (`.page` transform). */
function sectionTop(el: HTMLElement): number {
  const wrapper = el.closest<HTMLElement>(".page");
  const transform = wrapper ? getComputedStyle(wrapper).transform : "none";
  const offset = transform === "none" ? 0 : new DOMMatrix(transform).m42;
  return el.getBoundingClientRect().top + window.scrollY - offset;
}

/**
 * Place a freshly mounted page. `force` makes Lenis move even while an overlay (the phone menu
 * closing) still holds it stopped.
 */
export function placeNewPage(path: string, popNavigation: boolean): void {
  const saved = popNavigation ? savedScroll(path) : undefined;
  const hash = decodeURIComponent(window.location.hash.slice(1));
  const target = hash ? document.getElementById(hash) : null;

  let y = 0;
  if (saved !== undefined) y = saved;
  else if (target) y = sectionTop(target);
  // Lenis still holds the previous page's scroll limit (its ResizeObserver runs later), and an
  // immediate scrollTo clamps to it: Back from a short page to a long one would land at 0.
  getLenis()?.resize();
  scrollTo(y, { immediate: true, force: true });

  // Any page's own triggers (text reveals, count-ups) follow the new layout.
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
