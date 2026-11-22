"use client";

import { Terminal as TerminalIcon } from "lucide-react";
import { terminalCopy } from "@/content/terminal";
import { Drawer } from "@/components/overlay/Drawer";
import { useStore } from "@/lib/store";
import { Terminal } from "./Terminal";

const t = terminalCopy.terminal;
const close = () => useStore.getState().ui.setTerminalOpen(false);

/**
 * The terminal's drawer (6.1; Overlays board, Drawer): the 1.5 Drawer on the island's
 * near-black surface in both themes, 55 % of the screen tall from md (phones keep 300 px; the
 * full-page /terminal is 6.6). Driven by ui.terminalOpen (` and the nav's terminal circle). The
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
    >
      <Terminal />
    </Drawer>
  );
}
