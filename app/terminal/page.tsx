import type { Metadata } from "next";
import { terminalCopy } from "@/content/terminal";
import { profile } from "@/content/profile";
import { TerminalPage } from "@/components/terminal/TerminalPage";
import { baseOpenGraph, baseTwitter } from "@/lib/seo";

const title = terminalCopy.terminal.title;
const description = terminalCopy.terminal.page.description;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terminal" },
  openGraph: {
    ...baseOpenGraph,
    title: `${title} · ${profile.name}`,
    description,
    url: "/terminal",
  },
  twitter: { ...baseTwitter, title: `${title} · ${profile.name}`, description },
};

/** The full-page terminal (6.6): where phones open it; the drawer stays on larger screens. */
export default function Page() {
  return <TerminalPage />;
}
