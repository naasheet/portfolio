import type { HandPose } from "@/content/ar";
import { FINGERTIPS, HAND_CONNECTIONS } from "@/features/ar/landmarks";
import { cn } from "@/lib/utils";

/**
 * The three gestures as drawn on the AR board: MediaPipe's 21-point skeleton, teal bones, white
 * joints, and amber on the fingertips that matter. 100 × 100 view box, wrist at the bottom.
 */
const POSES: Record<HandPose, readonly (readonly [number, number])[]> = {
  point: [
    [52, 88],
    [42, 82],
    [34, 76],
    [30, 70],
    [36, 66],
    [46, 62],
    [44, 48],
    [43, 36],
    [42, 24],
    [54, 60],
    [58, 62],
    [60, 68],
    [58, 72],
    [62, 62],
    [66, 64],
    [67, 70],
    [65, 74],
    [68, 66],
    [72, 68],
    [72, 73],
    [70, 76],
  ],
  pinch: [
    [54, 88],
    [44, 80],
    [36, 72],
    [32, 62],
    [34, 53],
    [46, 60],
    [40, 52],
    [36, 50],
    [35, 53],
    [54, 58],
    [58, 60],
    [60, 66],
    [58, 70],
    [62, 60],
    [66, 62],
    [67, 68],
    [65, 72],
    [68, 64],
    [72, 66],
    [72, 71],
    [70, 74],
  ],
  palm: [
    [52, 90],
    [42, 84],
    [34, 78],
    [26, 72],
    [19, 66],
    [42, 62],
    [39, 48],
    [37, 38],
    [36, 28],
    [50, 60],
    [50, 44],
    [50, 33],
    [50, 22],
    [58, 61],
    [60, 46],
    [61, 36],
    [62, 27],
    [65, 65],
    [69, 54],
    [71, 46],
    [73, 38],
  ],
};

/** Which fingertips glow amber in each pose. */
const LIT: Record<HandPose, readonly number[]> = {
  point: [8],
  pinch: [4, 8],
  palm: FINGERTIPS,
};

export function HandSkeleton({
  pose,
  className,
}: {
  pose: HandPose;
  className?: string;
}) {
  const points = POSES[pose];
  const lit = LIT[pose];
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={cn("size-full", className)}
    >
      <g
        className="stroke-accent-primary"
        strokeWidth={2.2}
        strokeLinecap="round"
      >
        {HAND_CONNECTIONS.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={points[a]![0]}
            y1={points[a]![1]}
            x2={points[b]![0]}
            y2={points[b]![1]}
          />
        ))}
      </g>
      {points.map(([x, y], i) =>
        lit.includes(i) ? (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4.2}
            className="fill-accent-secondary"
          />
        ) : (
          <circle key={i} cx={x} cy={y} r={2.6} className="fill-island-text" />
        ),
      )}
    </svg>
  );
}
