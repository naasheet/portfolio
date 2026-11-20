import { PlaceholderPill } from "@/components/layer/PlaceholderPill";
import { copy } from "@/content/copy";

/** Bottom-left of the persistent layer. Chunk 5.2 replaces it with the mini-player. */
export function MiniPlayerSlot() {
  return <PlaceholderPill label={copy.layer.player} />;
}
