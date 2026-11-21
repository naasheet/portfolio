// Particle fragment shader: a soft round point. Additive blending, no depth writes
// (set on the material in canvas/particles/Particles.tsx).

uniform vec3 uColorA;  // canvas/particle-a (teal)
uniform vec3 uColorB;  // canvas/particle-b (amber)

varying float vSeed;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);

  // About one particle in six is amber, like the gate's stand-in scatter.
  vec3 color = vSeed > 0.83 ? uColorB : uColorA;

  gl_FragColor = vec4(color, a * a * vAlpha);
  #include <colorspace_fragment>
}
