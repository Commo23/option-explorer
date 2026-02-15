/**
 * Grid interpolation utilities for filling missing values in a vol surface.
 * Uses bilinear / nearest-neighbor interpolation to produce a continuous surface.
 */

/** Interpolate all null cells in a grid[strikeIdx][maturityIdx] using neighbor values */
export function interpolateGrid(
  grid: (number | null)[][],
  strikes: number[],
  maturities: number[]
): (number | null)[][] {
  const nS = strikes.length;
  const nM = maturities.length;
  if (nS === 0 || nM === 0) return grid;

  // Deep copy
  const out: (number | null)[][] = grid.map(row => [...row]);

  for (let si = 0; si < nS; si++) {
    for (let mi = 0; mi < nM; mi++) {
      if (out[si][mi] !== null) continue;

      const val = bilinearFill(grid, strikes, maturities, si, mi);
      if (val !== null) {
        out[si][mi] = val;
      }
    }
  }

  return out;
}

/** Try bilinear interpolation from the 4 nearest known neighbors along strike & maturity axes */
function bilinearFill(
  grid: (number | null)[][],
  strikes: number[],
  maturities: number[],
  si: number,
  mi: number
): number | null {
  // Find nearest known values in each direction along strike axis
  const above = findNearest(grid, si, mi, -1, 0); // lower strike index
  const below = findNearest(grid, si, mi, 1, 0);  // higher strike index
  // Along maturity axis
  const left = findNearest(grid, si, mi, 0, -1);   // shorter maturity
  const right = findNearest(grid, si, mi, 0, 1);    // longer maturity

  const neighbors: { val: number; weight: number }[] = [];

  if (above) {
    const dist = Math.abs(strikes[si] - strikes[above.idx]);
    neighbors.push({ val: above.val, weight: dist > 0 ? 1 / dist : 1000 });
  }
  if (below) {
    const dist = Math.abs(strikes[si] - strikes[below.idx]);
    neighbors.push({ val: below.val, weight: dist > 0 ? 1 / dist : 1000 });
  }
  if (left) {
    const dist = Math.abs(maturities[mi] - maturities[left.idx]);
    neighbors.push({ val: left.val, weight: dist > 0 ? 1 / dist : 1000 });
  }
  if (right) {
    const dist = Math.abs(maturities[mi] - maturities[right.idx]);
    neighbors.push({ val: right.val, weight: dist > 0 ? 1 / dist : 1000 });
  }

  if (neighbors.length === 0) return null;

  // Inverse-distance weighted average
  const totalWeight = neighbors.reduce((s, n) => s + n.weight, 0);
  return neighbors.reduce((s, n) => s + n.val * n.weight, 0) / totalWeight;
}

/** Walk along one axis to find the nearest non-null value */
function findNearest(
  grid: (number | null)[][],
  si: number,
  mi: number,
  dsi: number,
  dmi: number
): { val: number; idx: number } | null {
  let s = si + dsi;
  let m = mi + dmi;

  while (s >= 0 && s < grid.length && m >= 0 && m < grid[0].length) {
    const v = grid[s][m];
    if (v !== null) {
      return { val: v, idx: dsi !== 0 ? s : m };
    }
    s += dsi;
    m += dmi;
  }

  return null;
}
