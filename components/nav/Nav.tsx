import { NavLoader } from "./NavLoader";
import { NavShell } from "./NavShell";

/**
 * The nav row (Navigation board, 2.4): separate glass pills floating 20 px from the top (or
 * below the notch). Mounted once in app/layout.tsx. The server renders the static NavShell
 * (no JS); NavLoader loads the live NavBar after hydration, which sets data-live here so CSS
 * hides the shell in the same frame. NavAutoHide toggles data-hidden on this element.
 */
export function Nav() {
  return (
    <header
      id="site-nav"
      className="site-nav pointer-events-none fixed inset-x-0 top-0 z-persistent"
    >
      <div className="nav-shell">
        <NavShell />
      </div>
      <NavLoader />
    </header>
  );
}
