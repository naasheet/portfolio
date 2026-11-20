import type { Metadata } from "next";
import { ToasterLoader } from "@/components/overlay/ToasterLoader";
import { MotionProvider } from "@/components/providers/MotionProvider";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // ThemeScript sets data-theme before hydration, so React must not warn about it.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <StoreHydrator />
        <SmoothScroll />
        <MotionProvider>
          {children}
          <ToasterLoader />
        </MotionProvider>
      </body>
    </html>
  );
}
