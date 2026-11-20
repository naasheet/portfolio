import type { Metadata, Viewport } from "next";
import { CursorLoader } from "@/components/cursor/CursorLoader";
import { EntryGate } from "@/components/gate/EntryGate";
import { GateScript } from "@/components/gate/GateScript";
import { CanvasLoader } from "@/components/layer/CanvasLoader";
import { Nav } from "@/components/nav/Nav";
import { PersistentLayer } from "@/components/layer/PersistentLayer";
import { ToasterLoader } from "@/components/overlay/ToasterLoader";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { ShortcutsLoader } from "@/components/providers/ShortcutsLoader";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { StoreHydrator } from "@/components/providers/StoreHydrator";
import { ThemeScript } from "@/components/ui/ThemeScript";
import { fontVariables } from "./fonts";
import "./globals.css";

// TODO(content): move title and description into content/ (chunk 4.1 / 4.8).
export const metadata: Metadata = {
  title: "Nasheet",
  description: "Nasheet's portfolio.",
};

// Let the page run under the notch and home indicator; fixed UI pads itself with
// env(safe-area-inset-*) (see the persistent layer rules in globals.css).
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // ThemeScript sets data-theme before hydration, so React must not warn about it.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <GateScript />
      </head>
      <body>
        <StoreHydrator />
        <SmoothScroll />
        <ShortcutsLoader />
        <MotionProvider>
          <ToasterLoader />
          <CanvasLoader />
          <EntryGate />
          {/* Everything an open overlay makes inert (OverlayRoot sets inert on #app). */}
          <div id="app">
            <Nav />
            <main className="relative z-content">{children}</main>
            <PersistentLayer />
          </div>
          <CursorLoader />
        </MotionProvider>
      </body>
    </html>
  );
}
