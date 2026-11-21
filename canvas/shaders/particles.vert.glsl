// Particle vertex shader (CLAUDE.md §9.2). noise.glsl is prepended at build time.
// Every §9.2 uniform is declared now; the ones marked "later" are unused until their chunk.

uniform float uTime;
uniform float uMorph;            // 0 -> 1 between aFrom and aTo (3.3 tweens it)
uniform float uScroll;           // later (3.3)
uniform vec2 uPointer;           // later (3.4)
uniform float uPointerRadius;    // later (3.4)
uniform float uPointerStrength;  // later (3.4)
uniform float uBass;             // later (5.4)
uniform float uMid;              // later (5.4)
uniform float uHigh;             // later (5.4)
uniform float uPulse;            // later (5.4 / 7.x)
uniform float uTheme;            // later (3.5): 0 dark, 1 light
uniform float uPixelRatio;
uniform float uSize;             // base point size in CSS px at depth 1

attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec4 aRandom;          // x: morph delay, y: size, z: seed, w: spare

varying float vSeed;
varying float vAlpha;

void main() {
  // Each particle's own morph progress: later delays start later, all end by uMorph = 1.
  float delay = aRandom.x * 0.4;
  float progress = clamp((uMorph - delay) / (1.0 - 0.4), 0.0, 1.0);
  progress = progress * progress * (3.0 - 2.0 * progress);
  vec3 pos = mix(aFrom, aTo, progress);

  // Slow drift: one smooth noise field, so neighbours move together and outlines stay crisp
  // (3.2: per-particle seeds in the field smeared thin strokes), plus a tiny per-particle wobble.
  float t = uTime * 0.06;
  vec3 q = pos * 0.35;
  pos += vec3(
    snoise(q + vec3(t, 0.0, 0.0)),
    snoise(q + vec3(0.0, t, 3.7)),
    snoise(q + vec3(7.1, 0.0, t))
  ) * 0.14;
  float phase = aRandom.z * 6.2831 + uTime * 0.8;
  pos += vec3(sin(phase), cos(phase * 1.3), sin(phase * 0.7)) * 0.008;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size by depth and pixel ratio (perspective: nearer is bigger).
  gl_PointSize = uSize * aRandom.y * uPixelRatio / -mvPosition.z;

  vSeed = aRandom.z;
  vAlpha = 0.55 + 0.45 * aRandom.y / 1.5;
}
