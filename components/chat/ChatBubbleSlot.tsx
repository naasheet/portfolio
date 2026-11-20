import { PlaceholderPill } from "@/components/layer/PlaceholderPill";
import { copy } from "@/content/copy";

/** Bottom-right of the persistent layer. Chunk 7.4 replaces it with the Ask bubble. */
export function ChatBubbleSlot() {
  return <PlaceholderPill label={copy.layer.ask} />;
}
