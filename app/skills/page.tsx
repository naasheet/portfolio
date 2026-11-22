import { Skills } from "@/components/skills/Skills";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("skills");

/** The Skills page (4.6). */
export default function SkillsPage() {
  return <Skills />;
}
