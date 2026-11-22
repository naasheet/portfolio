import type { Metadata } from "next";
import { NotFound } from "@/components/layer/NotFound";
import { copy } from "@/content/copy";

// Next adds the noindex robots tag to not-found pages itself.
export const metadata: Metadata = {
  title: copy.notFound.code,
};

/** Any unknown URL (4.8). Next serves it with status 404. */
export default function NotFoundPage() {
  return <NotFound />;
}
