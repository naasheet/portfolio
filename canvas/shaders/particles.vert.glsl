// Particle vertex shader (CLAUDE.md §9.2). noise.glsl is prepended at build time.
// Every §9.2 uniform is declared now; the ones marked "later" are unused until their chunk.

uniform float uTime;
uniform float uMorph;            // 0 -> 1 between aFrom and aTo (3.3 tweens it)
uniform float uScroll;           // later (3.3)
uniform vec2 uPointer;           // pointer on the z = 0 plane, world units (3.4; AR in 8.5)
uniform float uPointerRadius;    // world units at z = 0
uniform float uPointerStrength;  // 0–1, rises while moving, decays when still
uniform vec2 uPointerVelocity;   // world units / s, for the swirl
uniform vec4 uRipples[4];        // click ripples: x, y (z = 0 plane), age s, amplitude (0 = off)
uniform float uBass;             // later (5.4)
uniform float uMid;              // later (5.4)
uniform float uHigh;             // later (5.4)
uniform float uPulse;            // later (5.4 / 7.x)
uniform float uTheme;            // 0 dark, 1 light
uniform vec3 uColorA;            // canvas/particle-a (teal)
uniform vec3 uColorB;            // canvas/particle-b (amber)
uniform float uPixelRatio;
uniform float uSize;             // point size in CSS px at depth 1 (base 16 x the mood's size)
uniform float uDriftTime;        // drift clock: seconds x the mood's drift speed (3.5)
uniform float uSpread;           // the mood's spread: how far points drift from their shape

// The room (R.3). aRoom is fixed per particle (canvas/shapes/room.ts) and only read while
// uRoom > 0, so on every other shape the particles behave as object -1.
uniform float uRoom;             // 0 -> 1 as the room assembles (tweened with the morph)
uniform float uPhone;            // 0 desktop, 1 phone layout (no lamp: its points are dust)
uniform float uLamp;             // 1 lamp on (dark theme), 0 off (light theme)
uniform float uDeskY;            // the desk plane's height, shape units (reflections flip here)
uniform vec4 uPool;              // light pool: centre xyz, radius
uniform vec4 uSteam;             // steam: origin xyz, rise height

attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec4 aRandom;          // x: morph delay, y: size, z: seed, w: spare
// x: object (0-8, content/room.ts order; -1 none), y: kind, z: tint, w: extra.
// Kinds (ROOM_KIND in room.ts): 0 object, 1 screen code, 2 cursor, 3 dust, 4 front edge,
// 5 light pool, 6 light cone, 7 mote, 8 steam. Tint: 0 own colour, 1 teal, 2 amber, 3 grey.
// Extra: the steam's wisp (0-2); for other kinds 1 = becomes dust on phones.
attribute vec4 aRoom;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Each particle's own morph progress: later delays start later, all end by uMorph = 1.
  float delay = aRandom.x * 0.4;
  float progress = clamp((uMorph - delay) / (1.0 - 0.4), 0.0, 1.0);
  progress = progress * progress * (3.0 - 2.0 * progress);
  vec3 pos = mix(aFrom, aTo, progress);

  float isRoom = uRoom * step(-0.5, aRoom.y);
  int kind = int(floor(aRoom.y + 0.5));

  // Steam (R.3): three wisps rise from the mug, curl and fade with height, always moving.
  float steamFade = 1.0;
  if (kind == 8 && isRoom > 0.0) {
    float s = uSteam.w / 0.95; // shape units per model unit (content/room.ts steam.height)
    float wisp = aRoom.w;
    float h = fract(aRandom.z * 7.31 + uTime * 0.16 + wisp * 0.37);
    float curl = uTime * 1.1 + wisp * 2.1 + h * 5.0;
    vec3 steam = uSteam.xyz + vec3(
      (wisp - 1.0) * 0.16 * s + sin(curl) * 0.14 * s * h + (aRandom.w - 0.5) * 0.05 * s,
      h * uSteam.w,
      cos(curl * 0.8) * 0.06 * s * h + (aRandom.x - 0.5) * 0.04 * s
    );
    pos = mix(pos, steam, isRoom);
    steamFade = smoothstep(0.0, 0.12, h) * (1.0 - h);
  }

  // Slow drift: one smooth noise field, so neighbours move together and outlines stay crisp
  // (3.2: per-particle seeds in the field smeared thin strokes), plus a tiny per-particle wobble.
  // The mood (3.5) sets the speed (uDriftTime runs at its drift rate) and the reach (uSpread).
  float t = uDriftTime * 0.06;
  vec3 q = pos * 0.35;

  // Colour (3.5): about one particle in six is amber, but the cut is shifted by a slow noise
  // field, so amber gathers in soft patches that drift across the shape.
  float cluster = snoise(q * 1.4 + vec3(0.0, 0.0, t * 0.5));
  vec3 color = mix(uColorA, uColorB, smoothstep(0.8, 0.88, aRandom.z + cluster * 0.12));

  // Room colour, size and strength per kind (R.3).
  vec3 roomColor = color;
  float roomAlpha = 1.0;
  float roomSize = 1.0;
  vec3 grey = mix(vec3(0.86), vec3(0.42), uTheme);
  if (aRoom.z > 0.5) roomColor = aRoom.z < 1.5 ? uColorA : (aRoom.z < 2.5 ? uColorB : grey);
  float lamp = uLamp * (1.0 - uPhone);
  if (kind == 1) { roomSize = 0.95; }
  else if (kind == 2) { roomSize = 0.9; }
  else if (kind == 3) { roomAlpha = 0.3; roomSize = 0.55; }
  else if (kind == 4) { roomAlpha = 0.7; roomSize = 0.65; }
  else if (kind == 5) { roomAlpha = 0.85 * lamp; roomSize = 0.75; }
  else if (kind == 6) { roomAlpha = 0.12 * lamp; roomSize = 0.7; }
  else if (kind == 7) { roomAlpha = 0.45; roomSize = 0.8; }
  else if (kind == 8) { roomAlpha = 0.6 * steamFade; roomSize = 1.1; }
  // Warm light: objects, dust and motes near the pool take on the lamp's amber.
  if (kind == 0 || kind == 3 || kind == 4 || kind == 7) {
    vec2 pd = pos.xz - uPool.xz;
    float warm = uPool.w > 0.0 ? exp(-dot(pd, pd) / (uPool.w * uPool.w)) : 0.0;
    roomColor = mix(roomColor, uColorB, warm * lamp * 0.7);
  }
  // Phones have no lamp: its points, the pool and the cone become desk dust.
  float toDust = kind != 8 && aRoom.w > 0.5 ? uPhone : 0.0;
  roomColor = mix(roomColor, color, toDust);
  roomAlpha = mix(roomAlpha, 0.3, toDust);
  roomSize = mix(roomSize, 0.55, toDust);

  vColor = mix(color, roomColor, isRoom);
  float alphaScale = mix(1.0, roomAlpha, isRoom);
  float sizeScale = mix(1.0, roomSize, isRoom);

  pos += vec3(
    snoise(q + vec3(t, 0.0, 0.0)),
    snoise(q + vec3(0.0, t, 3.7)),
    snoise(q + vec3(7.1, 0.0, t))
  ) * 0.14 * uSpread;
  float phase = aRandom.z * 6.2831 + uDriftTime * 0.8;
  pos += vec3(sin(phase), cos(phase * 1.3), sin(phase * 0.7)) * 0.008 * uSpread;

#ifdef REFLECT
  // Reflection pass (R.3, Home only): the same points flipped about the desk, faint, fading with
  // height. Only the objects, the code and the steam reflect (the desk's own dust doesn't).
  float above = max(pos.y - uDeskY, 0.0);
  pos.y = uDeskY - (pos.y - uDeskY);
  float reflective = kind <= 2 || kind == 8 ? 1.0 : 0.0;
  alphaScale *= 0.16 * exp(-above * 1.8) * reflective * isRoom;
#endif

  // Pointer (3.4), in world space so the scroll rotation doesn't skew it. The pointer is a ray
  // from the camera; take its point at this particle's depth, so the parting sits under the
  // cursor whatever the depth.
  vec4 world = modelMatrix * vec4(pos, 1.0);
  float depth = (world.z - cameraPosition.z) / (0.0 - cameraPosition.z);
  vec2 pointerAt = cameraPosition.xy + (uPointer - cameraPosition.xy) * depth;
  vec2 d = world.xy - pointerAt;
  float dist = max(length(d), 1e-4);
  vec2 dir = d / dist;

  vec2 vel = uPointerVelocity;
  float speed = length(vel);
  if (speed > 4.0) {
    vel *= 4.0 / speed;
    speed = 4.0;
  }
  vec2 vdir = speed > 1e-3 ? vel / speed : vec2(0.0);

  // Wake: behind the motion the field stretches (up to 2x), like a finger drawn through water,
  // instead of staying a circle.
  float behind = max(-dot(d, vdir), 0.0);
  float stretch = 1.0 + speed * 0.25;
  vec2 dWake = d + vdir * behind * (1.0 - 1.0 / stretch);

  // Soft, organic edge: a Gaussian whose width wobbles with slow noise.
  float wobble = snoise(vec3(world.xy * 1.6, uTime * 0.25));
  float sigma = uPointerRadius * depth * 0.55 * (1.0 + 0.25 * wobble);
  float fall = exp(-dot(dWake, dWake) / (sigma * sigma));

  // A lens push, d * LENS * fall: zero at the centre, strongest at ~0.7 sigma (~0.3 units), so
  // particles thin smoothly toward the cursor like a dimple in water. LENS stays under ~2.2,
  // so neighbours never cross: no empty hole and no bright rim.
  const float LENS = 1.6;
  float grain = 0.75 + 0.5 * aRandom.w; // per-particle, so the edge isn't a clean line

  // Swirl: particles either side of the motion turn opposite ways.
  float side = dir.x * vel.y - dir.y * vel.x;
  vec2 tangent = vec2(-dir.y, dir.x);
  float amount = fall * uPointerStrength;
  world.xy += (d * LENS * grain + tangent * side * 0.05) * amount;
  world.z += 0.15 * amount; // a slight bulge toward the camera, for depth

  // Click ripples: a soft ring runs out from each click (2.0 units/s), pushing the particles it
  // passes outward and toward the camera and lighting them up (bigger points), then fades.
  // It eases in over 0.12 s, so a click never pops.
  float glow = 0.0;
  vec3 rippleOffset = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    vec2 c = cameraPosition.xy + (r.xy - cameraPosition.xy) * depth;
    vec2 rd = world.xy - c;
    float rdist = max(length(rd), 1e-4);
    float ring = rdist - r.z * 2.0 * depth + wobble * 0.07; // a slightly uneven ring
    float band = exp(-(ring * ring) / 0.05);
    float amp = r.w * exp(-r.z * 1.8) * smoothstep(0.0, 0.12, r.z);
    rippleOffset += vec3((rd / rdist) * 0.22, 0.15) * band * amp;
    glow += band * amp;
  }
  // Overlapping ripples (quick clicks) add up to at most one full ripple.
  float cap = 1.0 / max(glow, 1.0);
  world.xyz += rippleOffset * cap;
  glow *= cap;

  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;

  // Size by depth and pixel ratio (perspective: nearer is bigger).
  gl_PointSize = uSize * aRandom.y * sizeScale * uPixelRatio / -mvPosition.z * (1.0 + glow * 1.2);

  vAlpha = min(1.0, 0.55 + 0.45 * aRandom.y / 1.5 + glow * 0.6) * alphaScale;
}
