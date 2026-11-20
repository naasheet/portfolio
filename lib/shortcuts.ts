/*
 * The one shortcut map (2.4) and the actions behind the nav's controls, so a key and its button
 * always do the same thing. components/providers/ShortcutsProvider.tsx mounts the listener once;
 * the ? overlay lists SHORTCUTS. Keys are ignored while the visitor is typing.
 *
 * AR, the terminal and the chat only flip store flags here; their features read the flags.
 */
import { copy } from "@/content/copy";
import { island } from "./island";
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

// --- The map ---------------------------------------------------------------------------------

export type Shortcut = {
  id: "terminal" | "chat" | "shortcuts" | "theme" | "sound" | "ar" | "escape";
  /** What the Kbd shows. */
  key: string;
  /** KeyboardEvent.key values that trigger it (letters match either case). */
  match: readonly string[];
  label: string;
  /** Returns false when it didn't act (the event is then left alone). */
  run: () => boolean | void;
};

export const SHORTCUTS: readonly Shortcut[] = [
  {
    id: "terminal",
    key: "`",
    match: ["`"],
    label: copy.shortcuts.terminal,
    run: () => useStore.getState().ui.toggleTerminal(),
  },
  {
    id: "chat",
    key: "/",
    match: ["/"],
    label: copy.shortcuts.chat,
    run: () => useStore.getState().ui.toggleChat(),
  },
  {
    id: "sound",
    key: "M",
    match: ["m", "M"],
    label: copy.shortcuts.sound,
    run: toggleSound,
  },
  {
    id: "theme",
    key: "T",
    match: ["t", "T"],
    label: copy.shortcuts.theme,
    run: toggleTheme,
  },
  {
    id: "ar",
    key: "A",
    match: ["a", "A"],
    label: copy.shortcuts.ar,
    run: () => setHandMode(!useStore.getState().ar.enabled),
  },
  {
    id: "shortcuts",
    key: "?",
    match: ["?"],
    label: copy.shortcuts.shortcuts,
    run: () => useStore.getState().ui.toggleShortcuts(),
  },
  {
    id: "escape",
    key: "Esc",
    match: ["Escape"],
    label: copy.shortcuts.escape,
    run: closeWhatsOpen,
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
  const acted = shortcut.run();
  if (acted !== false) e.preventDefault();
}
