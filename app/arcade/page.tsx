import { PagePlaceholder } from "@/components/chapters/PagePlaceholder";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("arcade");

// TODO(4.x): the real Arcade page replaces the placeholder.
export default function ArcadePage() {
  return <PagePlaceholder id="arcade" />;
}
