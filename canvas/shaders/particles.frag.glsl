// Particle fragment shader: a soft round point (CLAUDE.md §9.2, theme and moods in 3.5).
//
// Blending is ONE / ONE_MINUS_SRC_ALPHA (CustomBlending in canvas/particles/Particles.tsx), and
// the output is premultiplied: rgb = colour x a, alpha = a x uTheme. In dark (uTheme 0) alpha is
// 0, so the points add up (glow on near-black); in light (uTheme 1) it's normal "over" blending,
// because additive washes out on a light background. The theme tween slides between the two
// without a pop. The canvas is opaque (alpha: false) and clears to bg/base every frame, so the
// alpha written here only matters inside the framebuffer: the same result in every browser.

uniform vec3 uColorA;  // canvas/particle-a (teal)
uniform vec3 uColorB;  // canvas/particle-b (amber)
uniform float uTheme;  // 0 dark, 1 light
uniform float uFade;   // 0 homepage, 1 other routes: the particles fade toward the background

varying float vMix;
varying float vAlpha;

// Light theme: darker, so the points read as ink on paper, not glare. (Alpha is kept as a knob.)
const float LIGHT_SHADE = 0.7;
const float LIGHT_ALPHA = 1.0;
// Other routes keep about 40% of the particles' strength.
const float FADE_KEEP = 0.4;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);

  vec3 color = mix(uColorA, uColorB, vMix) * mix(1.0, LIGHT_SHADE, uTheme);
  float alpha = a * a * vAlpha
    * mix(1.0, LIGHT_ALPHA, uTheme)
    * mix(1.0, FADE_KEEP, uFade);

  // Convert to the output colour space first, then premultiply.
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb * alpha, alpha * uTheme);
}
