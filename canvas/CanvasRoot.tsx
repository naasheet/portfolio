/**
 * The living canvas (CLAUDE.md §2). Chunk 2.3 mounts an empty placeholder; 3.1 puts the R3F
 * scene here. Loaded through components/layer/CanvasLoader with next/dynamic (ssr: false).
 */
export function CanvasRoot() {
  return (
    <div
      aria-hidden
      data-canvas
      className="pointer-events-none fixed inset-0 z-canvas"
    />
  );
}
