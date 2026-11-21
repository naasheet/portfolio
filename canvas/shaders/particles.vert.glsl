// Particle vertex shader (CLAUDE.md §9.2). noise.glsl is prepended at build time.
// Every §9.2 uniform is declared now; the ones marked "later" are unused until their chunk.

uniform float uTime;
uniform float uMorph;            // 0 -> 1 between aFrom and aTo (3.3 tweens it)
uniform float uScroll;           // later (3.3)
uniform vec2 uPointer;           // pointer on the z = 0 plane, world units (3.4; AR in 8.5)
uniform float uPointerRadius;    // world units at z = 0
uniform float uPointerStrength;  // 0–1, rises while moving, decays when still
uniform vec2 uPointerVelocity;   // world units / s, for the swirl
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

  // Pointer (3.4), in world space so the scroll rotation doesn't skew it. The pointer is a ray
  // from the camera; take its point at this particle's depth, so the parting sits under the
  // cursor whatever the depth. Push out with a smooth falloff, plus a swirl from the velocity:
  // particles left and right of the motion turn opposite ways, like water behind a finger.
  vec4 world = modelMatrix * vec4(pos, 1.0);
  float along = (world.z - cameraPosition.z) / (0.0 - cameraPosition.z);
  vec2 pointerAt = cameraPosition.xy + (uPointer - cameraPosition.xy) * along;
  vec2 d = world.xy - pointerAt;
  float dist = max(length(d), 1e-4);
  vec2 dir = d / dist;
  float fall = 1.0 - smoothstep(0.0, uPointerRadius * along, dist);
  fall *= fall;
  vec2 vel = uPointerVelocity;
  float speed = length(vel);
  if (speed > 4.0) vel *= 4.0 / speed;
  float side = dir.x * vel.y - dir.y * vel.x;
  vec2 tangent = vec2(-dir.y, dir.x);
  world.xy += (dir * 0.4 + tangent * side * 0.06) * fall * uPointerStrength;

  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;

  // Size by depth and pixel ratio (perspective: nearer is bigger).
  gl_PointSize = uSize * aRandom.y * uPixelRatio / -mvPosition.z;

  vSeed = aRandom.z;
  vAlpha = 0.55 + 0.45 * aRandom.y / 1.5;
}
