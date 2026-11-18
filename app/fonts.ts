import localFont from "next/font/local";

/**
 * SF Pro, self-hosted (CLAUDE.md §7). Only the weights in use: 400, 500, 600, 700.
 * Text is preloaded because it paints first; Display and Mono load on first use.
 * next/font generates a size-adjusted fallback face so the swap doesn't shift layout.
 */

export const sfText = localFont({
  src: [
    {
      path: "../public/fonts/sf-pro-text-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-pro-text-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-pro-text-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-pro-text-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sf-text",
  display: "swap",
  preload: true,
});

export const sfDisplay = localFont({
  src: [
    {
      path: "../public/fonts/sf-pro-display-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-pro-display-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-pro-display-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-pro-display-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sf-display",
  display: "swap",
  preload: false,
});

export const sfMono = localFont({
  src: [
    {
      path: "../public/fonts/sf-mono-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-mono-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-mono-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/sf-mono-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sf-mono",
  display: "swap",
  preload: false,
  // Arial metrics would mis-size a monospace fallback; let ui-monospace take over instead.
  adjustFontFallback: false,
});

/** All three font variables, for the <html> element. */
export const fontVariables = [
  sfText.variable,
  sfDisplay.variable,
  sfMono.variable,
].join(" ");
