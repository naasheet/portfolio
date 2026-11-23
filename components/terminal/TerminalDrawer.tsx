"use client";

import { Terminal as TerminalIcon } from "lucide-react";
import { terminalCopy } from "@/content/terminal";
import { Drawer } from "@/components/overlay/Drawer";
import { useStore } from "@/lib/store";
import { Terminal } from "./Terminal";

const t = terminalCopy.terminal;
const close = () => useStore.getState().ui.setTerminalOpen(false);
/** 6.6: drag the bottom handle to resize (desktop); the height is remembered. */
const RESIZE = { storageKey: "terminal-height", min: 200 };

/**
 * The terminal's drawer (6.1; Overlays board, Drawer): the 1.5 Drawer on the island's
 * near-black surface in both themes, 55 % of the screen tall from md until you drag its handle
 * (6.6, remembered). Phones open the full-page /terminal instead (openTerminal). Driven by ui.terminalOpen (` and the nav's terminal circle). The
 * focus trap focuses the input on open ([data-autofocus]) and returns focus on close.
 */
export default function TerminalDrawer() {
  const open = useStore((s) => s.ui.terminalOpen);
  return (
    <Drawer
      open={open}
      onClose={close}
      title={t.title}
      closeLabel={t.close}
      icon={<TerminalIcon />}
      escHint={t.escHint}
      surface="island"
      className="md:h-[55dvh]"
      resizable={RESIZE}
      resizeLabel={t.resize}
    >
      <Terminal />
    </Drawer>
  );
}
