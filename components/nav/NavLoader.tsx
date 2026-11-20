"use client";

import dynamic from "next/dynamic";

// The live nav (Framer layout, tooltips, the island) loads right after hydration, so it stays
// out of first-load JS on `/`. Until then the server-rendered NavShell stands in; NavBar hides
// it before its first paint.
const NavBar = dynamic(() => import("./NavBar"), { ssr: false });

export function NavLoader() {
  return <NavBar />;
}
