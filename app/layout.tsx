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
import { copy } from "@/content/copy";
import { profile } from "@/content/profile";
import { baseOpenGraph, baseTwitter } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { fontVariables } from "./fonts";
import "./globals.css";

// Site-wide metadata (4.1, 4.8). Pages set their own title (through the template) and
// description; app/opengraph-image.tsx is the share image for every route.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: copy.meta.title(profile.name, profile.title),
    template: copy.meta.template(profile.name),
  },
  description: profile.tagline,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  openGraph: {
    ...baseOpenGraph,
    title: copy.meta.title(profile.name, profile.title),
    description: profile.tagline,
    url: "/",
  },
  twitter: {
    ...baseTwitter,
    title: copy.meta.title(profile.name, profile.title),
    description: profile.tagline,
  },
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
