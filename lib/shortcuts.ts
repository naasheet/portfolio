/*
 * The one shortcut map (2.4) and the actions behind the nav's controls, so a key and its button
 * always do the same thing. components/providers/ShortcutsProvider.tsx mounts the listener once;
 * the ? overlay lists SHORTCUTS. Keys are ignored while the visitor is typing.
 *
 * AR, the terminal and the chat only flip store flags here; their features read the flags.
 */
import { chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
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

/** Mouse | Hand. Hand = AR on (the camera and gestures arrive in phase 8). */
export function setHandMode(hand: boolean): void {
  const { ar } = useStore.getState();
  if (ar.enabled === hand) return;
  ar.setEnabled(hand);
  island.alert({
    icon: hand ? "hand" : "mouse",
    tone: "neutral",
    text: hand ? copy.alerts.handMode : copy.alerts.mouseMode,
    detail: copy.alerts.switchBack("A"),
  });
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
    | "chat"
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
    id: "chat",
    group: "everywhere",
    key: "/",
    match: ["/"],
    label: copy.shortcuts.chat,
    run: () => useStore.getState().ui.toggleChat(),
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
