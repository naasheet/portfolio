import { Color, type ShaderMaterial } from "three";
import { gsap } from "@/lib/motion/gsap";
import { getTheme } from "@/lib/theme";
import { requestFrame } from "../frame";

/** The canvas's theme change, matched to the UI's 400 ms (CLAUDE.md §8). */
const THEME_DURATION = 0.4;

export type CanvasColors = {
  /** canvas/particle-a (`uColorA`). */
  a: Color;
  /** canvas/particle-b (`uColorB`). */
  b: Color;
  /** bg/base: the canvas is opaque and clears to it every frame (scene.background). */
  bg: Color;
  /**
   * `uTheme`: 0 dark, 1 light. One blend for both (ONE / ONE_MINUS_SRC_ALPHA, premultiplied):
   * alpha = a x uTheme, so dark adds light and light paints over, and the tween has no pop.
   */
  theme: number;
};

function readColor(style: CSSStyleDeclaration, name: string, fallback: string) {
  return new Color(style.getPropertyValue(name).trim() || fallback);
}

/** The theme's canvas colours, read from the CSS variables on <html> (app/globals.css). */
export function readCanvasColors(): CanvasColors {
  const style = getComputedStyle(document.documentElement);
  return {
    a: readColor(style, "--color-canvas-particle-a", "white"),
    b: readColor(style, "--color-canvas-particle-b", "white"),
    bg: readColor(style, "--color-bg-base", "black"),
    theme: getTheme() === "light" ? 1 : 0,
  };
}

/**
 * Follow the theme (3.5): watches `data-theme` on <html> and tweens `uColorA`, `uColorB`,
 * `uTheme` (and the room's `uLamp`, R.3) and the clear colour (`background`, which is scene.background) to the new theme's
 * values over 400 ms. Reduced motion swaps them and asks for one frame. Returns the cleanup.
 */
export function watchTheme(
  material: ShaderMaterial,
  background: Color,
): () => void {
  const u = material.uniforms;
  const a = u.uColorA?.value as Color | undefined;
  const b = u.uColorB?.value as Color | undefined;
  const theme = u.uTheme;
  if (!a || !b || !theme) return () => {};

  let tween: gsap.core.Tween | null = null;
  const apply = () => {
    const target = readCanvasColors();
    const from = {
      a: a.clone(),
      b: b.clone(),
      bg: background.clone(),
      theme: theme.value as number,
    };
    tween?.kill();
    tween = null;
    const set = (t: number) => {
      a.lerpColors(from.a, target.a, t);
      b.lerpColors(from.b, target.b, t);
      background.lerpColors(from.bg, target.bg, t);
      theme.value = from.theme + (target.theme - from.theme) * t;
      // The room's lamp is on in dark, off in light (Home board: "light theme = lamp off").
      if (u.uLamp) u.uLamp.value = 1 - (theme.value as number);
    };
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // A theme reveal (R.5, lib/theme.ts) captures one still of the new theme: switch at once.
    const revealing = document.documentElement.dataset.themeReveal !== undefined;
    if (reduced || revealing) {
      set(1);
      requestFrame();
      return;
    }
    const progress = { t: 0 };
    tween = gsap.to(progress, {
      t: 1,
      duration: THEME_DURATION,
      ease: "power2.out",
      onUpdate: () => set(progress.t),
      onComplete: () => {
        tween = null;
      },
    });
  };

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    observer.disconnect();
    tween?.kill();
  };
}
