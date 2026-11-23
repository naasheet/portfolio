/*
 * The one shortcut map (2.4) and the actions behind the nav's controls, so a key and its button
 * always do the same thing. components/providers/ShortcutsProvider.tsx mounts the listener once;
 * the ? overlay lists SHORTCUTS. Keys are ignored while the visitor is typing.
 *
 * AR, the terminal and the chat only flip store flags here; their features read the flags.
 */
import { chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { storage } from "./browser";
import { island } from "./island";
import { navigate, type PushRouter } from "./motion/pageTransition";
import { startMusic } from "./music";
import { initSfx } from "./sfx";
import { useStore } from "./store";
import { revealTheme, type RevealOrigin } from "./theme";

// --- Shared actions --------------------------------------------------------------------------

/** Sound on / off. Turning it on creates the AudioContext, so call it inside a user gesture. */
export function toggleSound(): void {
  const on = !useStore.getState().ui.soundEnabled;
  useStore.getState().ui.setSoundEnabled(on);
  if (on) {
    void initSfx();
    // Music (5.1): the first time, track 1 fades in; afterwards it resumes. Turning sound off
    // pauses it through lib/music.ts's store subscription.
    void startMusic();
  }
  island.alert({
    icon: on ? "volume" : "mute",
    tone: "neutral",
    text: on ? copy.alerts.soundOn : copy.alerts.soundOff,
    detail: copy.alerts.switchBack("M"),
  });
}

/** The nav's theme button, where T's reveal starts (R.5); null when it isn't on screen. */
function themeButtonOrigin(): RevealOrigin | null {
  // The nav and the phone menu each have one; take the one on screen.
  for (const el of document.querySelectorAll("[data-theme-button]")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }
  return null;
}

/**
 * Switch the theme with the reveal (R.5) from `origin`: the lamp's bulb when the lamp is
 * clicked, otherwise the nav's theme button (the button and T).
 */
export function toggleTheme(origin?: RevealOrigin | null): void {
  const { theme } = useStore.getState();
  // With View Transitions the switch itself runs a moment later, so decide the alert now.
  const light = theme.mode !== "light";
  revealTheme(() => theme.toggleMode(), origin ?? themeButtonOrigin());
  island.alert({
    icon: light ? "sun" : "moon",
    tone: "neutral",
    text: light ? copy.alerts.lightTheme : copy.alerts.darkTheme,
    detail: copy.alerts.switchBack("T"),
  });
}

/** Phones and tablets (no hover, coarse pointer): Hand mode is a laptop thing (AR board, 8.1). */
const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";
/** features/ar/camera.ts's key: set once the visitor has allowed the camera. */
const AR_ALLOWED_KEY = "ar-allowed";

/**
 * Mouse | Hand (the switch, A, the About card, `ar on`). Hand (8.1): on a phone it says it's best
 * on a laptop; with no camera it says so; otherwise the explainer asks for the camera, or, once
 * the visitor has allowed it before, Hand turns on straight away. ar.enabled only turns true
 * from here or the explainer's Allow; components/ar/ARLayer.tsx starts the camera from it and
 * raises the "Hand mode" alert once it's live. Mouse stops the camera at once.
 */
export function setHandMode(hand: boolean): void {
  const { ar } = useStore.getState();
  if (!hand) {
    ar.setExplainerOpen(false);
    if (!ar.enabled) return;
    ar.setEnabled(false);
    island.alert({
      icon: "mouse",
      tone: "neutral",
      text: copy.alerts.mouseMode,
      detail: copy.alerts.switchBack("A"),
    });
    return;
  }
  if (ar.enabled) return;
  if (window.matchMedia(TOUCH_QUERY).matches) {
    island.alert({
      icon: "hand",
      tone: "neutral",
      text: copy.alerts.bestOnLaptop,
      detail: copy.alerts.bestOnLaptopDetail,
      long: true,
    });
    return;
  }
  if (ar.camera === "none") {
    island.alert({
      icon: "hand",
      tone: "neutral",
      text: copy.alerts.noCamera,
      detail: copy.alerts.noCameraDetail,
      long: true,
    });
    return;
  }
  if (storage.get(AR_ALLOWED_KEY) === "1") ar.setEnabled(true);
  else ar.setExplainerOpen(true);
}

/** Close the most recent thing that's open and isn't an overlay (overlays handle Esc). */
function closeWhatsOpen(): boolean {
  const { ui } = useStore.getState();
  if (ui.chatOpen) ui.setChatOpen(false);
  else if (ui.terminalOpen) ui.setTerminalOpen(false);
  else if (island.isExpanded()) island.collapse();
  else return false;
  return true;
}

/** The app router, for shortcuts that change page. Set by ShortcutsProvider. */
let router: PushRouter | null = null;
export function setShortcutRouter(next: PushRouter | null): void {
  router = next;
}

/** The full-page terminal (6.6): phones get it instead of the drawer. */
export const TERMINAL_ROUTE = "/terminal";
/** Phones: below md, the same breakpoint as the room's phone layout. */
const PHONE_QUERY = "(max-width: 47.99rem)";
/** Set when openTerminal() pushed /terminal, so leaving it can go Back instead of Home. */
let terminalReturn = false;

/**
 * The terminal button and ` (6.6): on a phone, the full-page terminal; already there, its input
 * takes focus; otherwise the drawer opens or closes as before.
 */
export function openTerminal(): void {
  const { ui } = useStore.getState();
  if (window.location.pathname === TERMINAL_ROUTE) {
    document
      .querySelector<HTMLInputElement>("[data-terminal-page] input[data-autofocus]")
      ?.focus();
    return;
  }
  if (!ui.terminalOpen && router && window.matchMedia(PHONE_QUERY).matches) {
    ui.setMenuOpen(false);
    terminalReturn = true;
    navigate(router, TERMINAL_ROUTE);
    return;
  }
  ui.toggleTerminal();
}

/** Leave /terminal (its Back button and `exit`): Back if we pushed it, else Home. */
export function leaveTerminal(to: PushRouter): void {
  if (terminalReturn) {
    terminalReturn = false;
    window.history.back();
    return;
  }
  navigate(to, "/");
}

/** Something sits over the page: the terminal, the chat, the phone menu, any overlay. */
function somethingOpen(): boolean {
  const { ui } = useStore.getState();
  return (
    ui.terminalOpen ||
    ui.chatOpen ||
    ui.menuOpen ||
    ui.shortcutsOpen ||
    document.querySelector("[data-overlay]") !== null
  );
}

/**
 * Home only (R.1): 2–6 open About to Contact, the pages' own numbers. Not while something
 * is open over the page (typing and modifier keys are already skipped by handleShortcut).
 */
function openPageByNumber(key: string): boolean {
  if (!router || useStore.getState().page.id !== "home" || somethingOpen())
    return false;
  const page = chapters[Number(key) - 1];
  if (!page || page.id === "home") return false;
  // Same as clicking the object in the room (R.4): push at once, the morph is the transition.
  navigate(router, page.route, { immediate: true });
  return true;
}

// --- The map ---------------------------------------------------------------------------------

/** "Everywhere" or "Home" (keys that only work there): the ? overlay's two groups. */
export type ShortcutGroup = "everywhere" | "home";

export type Shortcut = {
  id:
    | "terminal"
    | "shortcuts"
    | "theme"
    | "sound"
    | "ar"
    | "escape"
    | "pages";
  group: ShortcutGroup;
  /** What the Kbd shows. */
  key: string;
  /** Keys lit on the ? overlay's keyboard drawing, when not just `key`. */
  lit?: readonly string[];
  /** KeyboardEvent.key values that trigger it (letters match either case). */
  match: readonly string[];
  label: string;
  /** Returns false when it didn't act (the event is then left alone). */
  run: (key: string) => boolean | void;
};

/*
 * No "/" (chat) until Phase 7, which now comes after Phase 9: add it back then, as
 * { id: "chat", key: "/", match: ["/"], label: copy.shortcuts.chat, run: toggleChat } (and
 * "chat" in the id union). The ? overlay lists this array, so it drops out there too.
 */
export const SHORTCUTS: readonly Shortcut[] = [
  {
    id: "terminal",
    group: "everywhere",
    key: "`",
    match: ["`"],
    label: copy.shortcuts.terminal,
    run: openTerminal,
  },
  {
    id: "sound",
    group: "everywhere",
    key: "M",
    match: ["m", "M"],
    label: copy.shortcuts.sound,
    run: toggleSound,
  },
  {
    id: "theme",
    group: "everywhere",
    key: "T",
    match: ["t", "T"],
    label: copy.shortcuts.theme,
    run: () => toggleTheme(),
  },
  {
    id: "ar",
    group: "everywhere",
    key: "A",
    match: ["a", "A"],
    label: copy.shortcuts.ar,
    run: () => setHandMode(!useStore.getState().ar.enabled),
  },
  {
    id: "shortcuts",
    group: "everywhere",
    key: "?",
    match: ["?"],
    label: copy.shortcuts.shortcuts,
    run: () => useStore.getState().ui.toggleShortcuts(),
  },
  {
    id: "escape",
    group: "everywhere",
    key: "Esc",
    match: ["Escape"],
    label: copy.shortcuts.escape,
    run: closeWhatsOpen,
  },
  {
    id: "pages",
    group: "home",
    key: "2–6",
    lit: ["2", "3", "4", "5", "6"],
    match: ["2", "3", "4", "5", "6"],
    label: copy.shortcuts.pages,
    run: openPageByNumber,
  },
];

/** The visitor is typing: inputs (not buttons or checkboxes), textareas, selects, contenteditable. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) {
    return ![
      "button",
      "checkbox",
      "radio",
      "range",
      "color",
      "file",
      "submit",
      "reset",
      "image",
    ].includes(target.type);
  }
  return false;
}

/** The document keydown handler. */
export function handleShortcut(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.isComposing || isTypingTarget(e.target)) return;
  const shortcut = SHORTCUTS.find((s) => s.match.includes(e.key));
  if (!shortcut) return;
  // Esc belongs to the open overlay first (OverlayRoot); only act when none is open.
  if (shortcut.id === "escape" && document.querySelector("[data-overlay]"))
    return;
  if (e.repeat) return;
  const acted = shortcut.run(e.key);
  if (acted !== false) e.preventDefault();
}
