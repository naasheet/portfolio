import { Work } from "@/components/work/Work";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("work");

/** The Work page (4.4). The filter lives in the URL (?stack=react) and is read on the client. */
export default function WorkPage() {
  return <Work />;
}
