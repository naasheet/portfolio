"use client";

import { useLayoutEffect } from "react";
import { IslandMusicLoader } from "@/components/player/IslandMusicLoader";
import { Island } from "./Island";
import { ModeSwitch } from "./ModeSwitch";
import { NavAutoHide } from "./NavAutoHide";
import { NavCircles } from "./NavCircles";
import { NavOverlays } from "./NavOverlays";
import { NavRow } from "./NavRow";
import { SoundButton } from "./SoundButton";
import { TapForSound } from "./TapForSound";
import { Wordmark } from "./Wordmark";

/**
 * The live nav (Navigation board, 2.4). Loaded right after hydration by NavLoader, replacing
 * the static NavShell. Desktop (lg): wordmark and Mouse | Hand, the island, then "Tap for
 * sound" when needed and the terminal, theme and sound circles. Phones and tablets: the logo
 * circle, the compact island (tap opens the menu) and the sound circle.
 */
export default function NavBar() {
  // Before the first paint: hide the server-rendered shell (globals.css, .nav-shell).
  useLayoutEffect(() => {
    const header = document.getElementById("site-nav");
    header?.setAttribute("data-live", "");
    return () => header?.removeAttribute("data-live");
  }, []);

  return (
    <>
      <NavRow
        left={<Wordmark compact />}
        leftDesktop={
          <>
            <Wordmark />
            <ModeSwitch />
          </>
        }
        centre={<Island />}
        rightDesktop={
          <>
            <TapForSound />
            <NavCircles />
          </>
        }
        right={<SoundButton />}
      />
      <NavAutoHide />
      <NavOverlays />
      <IslandMusicLoader />
    </>
  );
}
