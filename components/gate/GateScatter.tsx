/**
 * The particle field in its scatter state, as a static stand-in until the WebGL canvas exists
 * (3.x): dots at fixed, seeded positions (the same on the server and the client, so it hydrates
 * cleanly and paints with the HTML). Teal with about one in six amber; the gate shows it at 35%.
 * Once the canvas is live, the gate turns transparent over it and this goes.
 */

const COUNT = 150;
const W = 1440;
const H = 900;

/** mulberry32: a tiny seeded PRNG, so every render produces the same dots. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(2_2);
const DOTS = Array.from({ length: COUNT }, () => ({
  x: Math.round(rand() * W),
  y: Math.round(rand() * H),
  r: +(0.8 + rand() * 1.1).toFixed(1),
  o: +(0.35 + rand() * 0.65).toFixed(2),
  amber: rand() < 0.16,
}));

export function GateScatter() {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full opacity-35"
    >
      {DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          opacity={d.o}
          className={d.amber ? "fill-accent-secondary" : "fill-accent-primary"}
        />
      ))}
    </svg>
  );
}
