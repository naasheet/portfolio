import type { Metadata } from "next";
import "./globals.css";

// TODO(content): move title and description into content/ (chunk 4.1 / 4.8).
export const metadata: Metadata = {
  title: "Nasheet",
  description: "Nasheet's portfolio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
