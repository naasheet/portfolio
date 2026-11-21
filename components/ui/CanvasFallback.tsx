/**
 * The canvas without WebGL (CLAUDE.md §9.2, §10): a still, soft radial gradient in the theme's
 * particle colours over bg/base, in the canvas's place (fixed, behind everything). Pure CSS
 * (`.canvas-fallback` in app/globals.css), so it follows the theme with no JS.
 */
export function CanvasFallback() {
  return (
    <div
      aria-hidden
      data-canvas="fallback"
      className="canvas-fallback pointer-events-none fixed inset-0 z-canvas"
    />
  );
}
