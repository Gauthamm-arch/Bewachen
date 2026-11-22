// Pure helpers for the sliders (kept separate so they are easy to test).

/** How far (0-1) a slide-to-confirm knob must travel before it counts. */
export const COMPLETE_THRESHOLD = 0.85;

export function shouldComplete(x: number, max: number, threshold = COMPLETE_THRESHOLD): boolean {
  return max > 0 && x >= max * threshold;
}

/** Snap positions for a slider with `stations` stops. Index 0 is "home". */
export function stationPositions(travel: number, stations: number): number[] {
  return Array.from({ length: stations + 1 }, (_, i) => (travel * i) / stations);
}

/** Index of the snap position closest to x. 0 means "home" (no selection). */
export function nearestIndex(x: number, positions: number[]): number {
  let best = 0;
  for (let i = 1; i < positions.length; i++) {
    if (Math.abs(positions[i] - x) < Math.abs(positions[best] - x)) best = i;
  }
  return best;
}

// -------------------------------------------------------------
// Multi-directional / T-shaped slider helpers
// -------------------------------------------------------------

export type Direction = "up" | "right" | "down";
export type Axis = "x" | "y" | null;

/**
 * Determine primary axis from gesture delta offset.
 * Deadzone threshold prevents accidental diagonal locking.
 */
export function pickAxis(dx: number, dy: number, threshold = 6): Axis {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < threshold && absY < threshold) return null;
  return absX >= absY ? "x" : "y";
}

/**
 * Check if slider reached triggering threshold for a given direction.
 * Index 0 / null means home (no selection).
 */
export function chosenDirection(
  x: number,
  y: number,
  tx: number,
  ty: number,
  threshold = COMPLETE_THRESHOLD
): Direction | null {
  if (tx > 0 && x >= tx * threshold) {
    return "right";
  }
  if (ty > 0 && y <= -ty * threshold) {
    return "up";
  }
  if (ty > 0 && y >= ty * threshold) {
    return "down";
  }
  return null;
}
