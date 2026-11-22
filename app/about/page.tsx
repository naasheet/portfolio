import { About } from "@/components/about/About";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("about");

/** The About page (4.3). */
export default function AboutPage() {
  return <About />;
}
