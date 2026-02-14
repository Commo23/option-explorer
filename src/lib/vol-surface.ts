import type { OptionsRow } from './options-api';

/** A single cleaned vol data point */
export interface VolPoint {
  strike: number;
  daysToExpiry: number;
  expiration: string;
  callMidIV: number | null;
  putMidIV: number | null;
  midIV: number; // best available mid IV (call preferred, fallback put)
}

/** The full vol surface: a grid of cleaned vol points */
export interface VolSurface {
  points: VolPoint[];
  strikes: number[];
  maturities: number[]; // days to expiry, sorted
  maturityLabels: string[]; // expiration labels matching maturities
  grid: (number | null)[][]; // grid[strikeIdx][maturityIdx] = vol
}

/** Parse a French/English date string to days from now */
export function parseDaysToExpiry(expStr: string): number | null {
  if (!expStr || expStr.trim() === '') return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Try standard Date parse first
  const direct = new Date(expStr);
  if (!isNaN(direct.getTime())) {
    const diff = Math.round((direct.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }

  // French month mapping
  const frMonths: Record<string, number> = {
    'janv': 0, 'jan': 0, 'févr': 1, 'fév': 1, 'feb': 1,
    'mars': 2, 'mar': 2, 'avr': 3, 'apr': 3,
    'mai': 4, 'may': 4, 'juin': 5, 'jun': 5,
    'juil': 6, 'jul': 6, 'août': 7, 'aug': 7,
    'sept': 8, 'sep': 8, 'oct': 9,
    'nov': 10, 'déc': 11, 'dec': 11,
  };

  // Match "12 févr. 2026" or "Feb 12, 2026" etc.
  const frMatch = expStr.match(/(\d{1,2})\s+(\w+)\.?\s+(\d{4})/);
  if (frMatch) {
    const day = parseInt(frMatch[1]);
    const monthKey = frMatch[2].toLowerCase().replace('.', '');
    const year = parseInt(frMatch[3]);
    const month = frMonths[monthKey];
    if (month !== undefined) {
      const d = new Date(year, month, day);
      const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : null;
    }
  }

  // English "Feb 12, 2026"
  const enMatch = expStr.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (enMatch) {
    const monthKey = enMatch[1].toLowerCase().substring(0, 3);
    const day = parseInt(enMatch[2]);
    const year = parseInt(enMatch[3]);
    const month = frMonths[monthKey];
    if (month !== undefined) {
      const d = new Date(year, month, day);
      const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : null;
    }
  }

  return null;
}

/** Check if a vol value is valid and logical */
function isValidVol(v: number | null): v is number {
  if (v === null || v === undefined || isNaN(v)) return false;
  // Vol should be between 0.1% and 500%
  return v > 0.1 && v < 500;
}

/** Clean and extract vol points from scraped data for a given strike */
export function cleanVolData(data: OptionsRow[], strike: number): VolPoint[] {
  const points: VolPoint[] = [];

  for (const row of data) {
    const days = parseDaysToExpiry(row.expiration);
    if (days === null || days <= 0) continue;

    // Compute mid IVs
    const callMid = (isValidVol(row.callBidIV) && isValidVol(row.callAskIV))
      ? (row.callBidIV! + row.callAskIV!) / 2
      : isValidVol(row.callAskIV) ? row.callAskIV
      : isValidVol(row.callBidIV) ? row.callBidIV
      : null;

    const putMid = (isValidVol(row.putBidIV) && isValidVol(row.putAskIV))
      ? (row.putBidIV! + row.putAskIV!) / 2
      : isValidVol(row.putAskIV) ? row.putAskIV
      : isValidVol(row.putBidIV) ? row.putBidIV
      : null;

    // Validate: bid IV should be <= ask IV
    if (row.callBidIV !== null && row.callAskIV !== null && row.callBidIV > row.callAskIV * 1.1) {
      continue; // inconsistent data
    }
    if (row.putBidIV !== null && row.putAskIV !== null && row.putBidIV > row.putAskIV * 1.1) {
      continue;
    }

    // Best mid: prefer call, fallback put
    const midIV = callMid ?? putMid;
    if (midIV === null) continue;

    points.push({
      strike,
      daysToExpiry: days,
      expiration: row.expiration,
      callMidIV: callMid,
      putMidIV: putMid,
      midIV,
    });
  }

  // Sort by days to expiry
  points.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  return points;
}

/** Build a vol surface from multiple strike scrapes */
export function buildVolSurface(
  strikeData: Map<number, OptionsRow[]>
): VolSurface {
  // Clean all data
  const allPoints: VolPoint[] = [];
  for (const [strike, rows] of strikeData) {
    allPoints.push(...cleanVolData(rows, strike));
  }

  // Get unique sorted strikes and maturities
  const strikes = [...new Set(allPoints.map(p => p.strike))].sort((a, b) => a - b);
  const maturitySet = new Map<number, string>();
  for (const p of allPoints) {
    if (!maturitySet.has(p.daysToExpiry)) {
      maturitySet.set(p.daysToExpiry, p.expiration);
    }
  }
  const maturities = [...maturitySet.keys()].sort((a, b) => a - b);
  const maturityLabels = maturities.map(m => maturitySet.get(m) || `${m}j`);

  // Build grid
  const grid: (number | null)[][] = strikes.map(s => {
    return maturities.map(m => {
      const pt = allPoints.find(p => p.strike === s && p.daysToExpiry === m);
      return pt ? pt.midIV : null;
    });
  });

  return { points: allPoints, strikes, maturities, maturityLabels, grid };
}

/** Build a simple vol surface from a single strike (term structure) */
export function buildTermStructure(
  data: OptionsRow[],
  strike: number
): VolSurface {
  const map = new Map<number, OptionsRow[]>();
  map.set(strike, data);
  return buildVolSurface(map);
}

/** Bilinear interpolation on the vol surface */
export function interpolateVol(
  surface: VolSurface,
  strike: number,
  daysToExpiry: number
): number | null {
  const { strikes, maturities, grid } = surface;

  if (strikes.length === 0 || maturities.length === 0) return null;

  // Find bounding indices for strike
  const si = findBounds(strikes, strike);
  // Find bounding indices for maturity
  const mi = findBounds(maturities, daysToExpiry);

  if (si === null || mi === null) return null;

  const [s0, s1] = si;
  const [m0, m1] = mi;

  // Get the 4 corner values
  const v00 = grid[s0]?.[m0];
  const v01 = grid[s0]?.[m1];
  const v10 = grid[s1]?.[m0];
  const v11 = grid[s1]?.[m1];

  // If exact match (same indices)
  if (s0 === s1 && m0 === m1) return v00;

  // If only one axis interpolation needed
  if (s0 === s1) {
    if (v00 === null || v01 === null) return v00 ?? v01;
    const t = (daysToExpiry - maturities[m0]) / (maturities[m1] - maturities[m0]);
    return v00 + t * (v01 - v00);
  }
  if (m0 === m1) {
    if (v00 === null || v10 === null) return v00 ?? v10;
    const t = (strike - strikes[s0]) / (strikes[s1] - strikes[s0]);
    return v00 + t * (v10 - v00);
  }

  // Full bilinear
  const validCorners = [v00, v01, v10, v11].filter(v => v !== null) as number[];
  if (validCorners.length === 0) return null;
  if (validCorners.length < 4) {
    // Not enough data for full bilinear, return average of available
    return validCorners.reduce((a, b) => a + b, 0) / validCorners.length;
  }

  const ts = (strike - strikes[s0]) / (strikes[s1] - strikes[s0]);
  const tm = (daysToExpiry - maturities[m0]) / (maturities[m1] - maturities[m0]);

  const top = v00! * (1 - ts) + v10! * ts;
  const bot = v01! * (1 - ts) + v11! * ts;
  return top * (1 - tm) + bot * tm;
}

/** Find bounding indices [lo, hi] for value in sorted array. Clamps to edges. */
function findBounds(arr: number[], value: number): [number, number] | null {
  if (arr.length === 0) return null;
  if (value <= arr[0]) return [0, 0];
  if (value >= arr[arr.length - 1]) return [arr.length - 1, arr.length - 1];

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] <= value && value <= arr[i + 1]) {
      return [i, i + 1];
    }
  }
  return [arr.length - 1, arr.length - 1];
}
