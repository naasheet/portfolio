import { ARLayerSlot } from "@/components/ar/ARLayerSlot";
import { ChatBubbleSlot } from "@/components/chat/ChatBubbleSlot";
import { TerminalDrawerSlot } from "@/components/terminal/TerminalDrawerSlot";
import { MountCounter } from "./MountCounter";
import { RouteWatcher } from "./RouteWatcher";

/**
 * Everything that must survive navigation (CLAUDE.md §5.5), mounted once in app/layout.tsx.
 * The layer itself ignores the pointer; each control opts back in. The corner is padded by the
 * safe area (viewport-fit=cover) and by --scrollbar-gap, so nothing jumps when an overlay locks
 * scrolling. No music player and no AR toggle here: both live in the nav (2.4).
 */
export function PersistentLayer() {
  return (
    <div
      data-persistent-layer
      className="pointer-events-none fixed inset-0 z-persistent"
    >
      <MountCounter />
      <RouteWatcher />
      <div className="layer-corner-right pointer-events-auto absolute">
        <ChatBubbleSlot />
      </div>
      <TerminalDrawerSlot />
      <ARLayerSlot />
    </div>
  );
}
