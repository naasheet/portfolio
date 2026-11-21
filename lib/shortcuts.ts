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
import { initSfx } from "./sfx";
import { useStore } from "./store";

// --- Shared actions --------------------------------------------------------------------------

/** Sound on / off. Turning it on creates the AudioContext, so call it inside a user gesture. */
export function toggleSound(): void {
  const on = !useStore.getState().ui.soundEnabled;
  useStore.getState().ui.setSoundEnabled(on);
  if (on) void initSfx();
  island.alert({
    icon: on ? "volume" : "mute",
    tone: "neutral",
    text: on ? copy.alerts.soundOn : copy.alerts.soundOff,
    detail: copy.alerts.switchBack("M"),
  });
}

export function toggleTheme(): void {
  const { theme } = useStore.getState();
  theme.toggleMode();
  const light = useStore.getState().theme.mode === "light";
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
    run: () => useStore.getState().ui.toggleTerminal(),
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
    run: toggleTheme,
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
