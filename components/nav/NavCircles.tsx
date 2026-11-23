"use client";

import { Moon, Sun, SquareTerminal } from "lucide-react";
import { copy } from "@/content/copy";
import { IconButton } from "@/components/ui/IconButton";
import { Kbd } from "@/components/ui/Kbd";
import { Tooltip } from "@/components/ui/Tooltip";
import { openTerminal, toggleTheme } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { navCircle } from "./navStyles";

/**
 * Terminal and theme circles, each with its Kbd tooltip. The sound circle is separate. On phones
 * the terminal circle opens the full-page /terminal (6.6, openTerminal).
 */
export function NavCircles() {
  const terminalOpen = useStore((s) => s.ui.terminalOpen);
  const light = useStore((s) => s.theme.mode === "light");

  return (
    <>
      <Tooltip
        side="bottom"
        align="end"
        content={
          <>
            {copy.nav.terminal}
            <Kbd>`</Kbd>
          </>
        }
      >
        <IconButton
          aria-label={copy.nav.terminal}
          pressed={terminalOpen}
          onClick={openTerminal}
          icon={<SquareTerminal />}
          className={navCircle}
        />
      </Tooltip>
      <Tooltip
        side="bottom"
        align="end"
        content={
          <>
            {copy.nav.theme}
            <Kbd>T</Kbd>
          </>
        }
      >
        <IconButton
          aria-label={copy.nav.theme}
          data-theme-button
          onClick={() => toggleTheme()}
          icon={light ? <Moon /> : <Sun />}
          className={navCircle}
        />
      </Tooltip>
    </>
  );
}
