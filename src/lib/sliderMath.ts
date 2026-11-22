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
