import { ARLayerSlot } from "@/components/ar/ARLayerSlot";
import { ChatBubbleSlot } from "@/components/chat/ChatBubbleSlot";
import { MiniPlayerSlot } from "@/components/player/MiniPlayerSlot";
import { TerminalDrawerSlot } from "@/components/terminal/TerminalDrawerSlot";
import { MountCounter } from "./MountCounter";

/**
 * Everything that must survive navigation (CLAUDE.md §5.5), mounted once in app/layout.tsx.
 * The layer itself ignores the pointer; each control opts back in. Corners are padded by the
 * safe area (viewport-fit=cover), and the right side by --scrollbar-gap, so nothing jumps
 * when an overlay locks scrolling.
 */
export function PersistentLayer() {
  return (
    <div
      data-persistent-layer
      className="pointer-events-none fixed inset-0 z-persistent"
    >
      <MountCounter />
      <div className="layer-corner-left pointer-events-auto absolute">
        <MiniPlayerSlot />
      </div>
      <div className="layer-corner-right pointer-events-auto absolute">
        <ChatBubbleSlot />
      </div>
      <TerminalDrawerSlot />
      <ARLayerSlot />
    </div>
  );
}
