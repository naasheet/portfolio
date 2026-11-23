/*
 * The One Euro filter (Casiez, Roussel & Vogel, CHI 2012), 8.3. A low-pass filter whose cutoff
 * rises with speed: a still hand gets heavy smoothing (no jitter), a fast one gets little (no
 * lag). One instance per axis. Start values from the build plan; tune by feel on a real webcam.
 */
export type OneEuroOptions = {
  /** Hz. Lower = steadier when still, more lag. */
  minCutoff: number;
  /** How quickly the cutoff rises with speed. Higher = less lag when moving fast. */
  beta: number;
  /** Hz, for the speed estimate itself. */
  dCutoff: number;
};

export const ONE_EURO_DEFAULTS: OneEuroOptions = {
  minCutoff: 1.0,
  beta: 0.007,
  dCutoff: 1.0,
};

const alpha = (cutoff: number, dt: number) => {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
};

export type OneEuroFilter = {
  /** Filters `value` sampled at `timeS` (seconds). */
  filter(value: number, timeS: number): number;
  reset(): void;
};

export function createOneEuro(
  options: OneEuroOptions = ONE_EURO_DEFAULTS,
): OneEuroFilter {
  let prev: number | null = null;
  let prevD = 0;
  let prevT = 0;
  return {
    filter(value, timeS) {
      if (prev === null) {
        prev = value;
        prevD = 0;
        prevT = timeS;
        return value;
      }
      const dt = timeS - prevT;
      // Same timestamp (or clock going backwards): nothing new to filter.
      if (dt <= 0) return prev;
      prevT = timeS;
      const d = (value - prev) / dt;
      const dHat = prevD + alpha(options.dCutoff, dt) * (d - prevD);
      prevD = dHat;
      const cutoff = options.minCutoff + options.beta * Math.abs(dHat);
      prev = prev + alpha(cutoff, dt) * (value - prev);
      return prev;
    },
    reset() {
      prev = null;
      prevD = 0;
    },
  };
}
