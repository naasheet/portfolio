import { statSync } from "node:fs";
import { join } from "node:path";
import { Contact } from "@/components/contact/Contact";
import { profile } from "@/content/profile";

/** The resume's size in KB, read once at build time (the resume card's "PDF · 180 KB"). */
function resumeKb(): number | null {
  try {
    return Math.round(
      statSync(join(process.cwd(), "public", profile.resume)).size / 1024,
    );
  } catch {
    return null;
  }
}

/** The Contact page (4.7). The form posts to /api/contact. */
export default function ContactPage() {
  return <Contact resumeKb={resumeKb()} />;
}
