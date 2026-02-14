import { supabase } from '@/integrations/supabase/client';

export interface OptionsRow {
  expiration: string;
  callBidIV: number | null;
  callAskIV: number | null;
  callIntrinsic: number | null;
  callTimeValue: number | null;
  callRho: number | null;
  callVega: number | null;
  callTheta: number | null;
  callGamma: number | null;
  callDelta: number | null;
  callPrice: number | null;
  callAsk: number | null;
  callBid: number | null;
  callVolume: number | null;
  putVolume: number | null;
  putBid: number | null;
  putAsk: number | null;
  putPrice: number | null;
  putDelta: number | null;
  putGamma: number | null;
  putTheta: number | null;
  putVega: number | null;
  putRho: number | null;
  putTimeValue: number | null;
  putIntrinsic: number | null;
  putAskIV: number | null;
  putBidIV: number | null;
}

export interface TickerInfo {
  symbol: string;
  name: string;
  exchange: string;
  tvSymbol: string;
}

export interface CategoryTickers {
  [category: string]: TickerInfo[];
}

export const CATEGORIES: CategoryTickers = {
  'Énergie': [
    { symbol: 'CL', name: 'Crude Oil WTI', exchange: 'NYMEX', tvSymbol: 'NYMEX-CL1!' },
    { symbol: 'BRN', name: 'Brent Crude', exchange: 'NYMEX', tvSymbol: 'NYMEX-BRN1!' },
    { symbol: 'NG', name: 'Natural Gas', exchange: 'NYMEX', tvSymbol: 'NYMEX-NG1!' },
    { symbol: 'RB', name: 'RBOB Gasoline', exchange: 'NYMEX', tvSymbol: 'NYMEX-RB1!' },
    { symbol: 'HO', name: 'Heating Oil', exchange: 'NYMEX', tvSymbol: 'NYMEX-HO1!' },
    { symbol: 'NG', name: 'Henry Hub NG (Last Day)', exchange: 'NYMEX', tvSymbol: 'NYMEX-HH1!' },
    { symbol: 'MCL', name: 'Micro Crude Oil', exchange: 'NYMEX', tvSymbol: 'NYMEX-MCL1!' },
    { symbol: 'QG', name: 'E-mini Natural Gas', exchange: 'NYMEX', tvSymbol: 'NYMEX-QG1!' },
    { symbol: 'QM', name: 'E-mini Crude Oil', exchange: 'NYMEX', tvSymbol: 'NYMEX-QM1!' },
  ],
  'Agriculture': [
    { symbol: 'ZC', name: 'Corn', exchange: 'CBOT', tvSymbol: 'CBOT-ZC1!' },
    { symbol: 'ZW', name: 'Wheat (Chicago)', exchange: 'CBOT', tvSymbol: 'CBOT-ZW1!' },
    { symbol: 'KE', name: 'Wheat (Kansas)', exchange: 'CBOT', tvSymbol: 'CBOT-KE1!' },
    { symbol: 'ZS', name: 'Soybeans', exchange: 'CBOT', tvSymbol: 'CBOT-ZS1!' },
    { symbol: 'ZM', name: 'Soybean Meal', exchange: 'CBOT', tvSymbol: 'CBOT-ZM1!' },
    { symbol: 'ZL', name: 'Soybean Oil', exchange: 'CBOT', tvSymbol: 'CBOT-ZL1!' },
    { symbol: 'ZR', name: 'Rough Rice', exchange: 'CBOT', tvSymbol: 'CBOT-ZR1!' },
    { symbol: 'ZO', name: 'Oats', exchange: 'CBOT', tvSymbol: 'CBOT-ZO1!' },
    { symbol: 'KC', name: 'Coffee', exchange: 'NYMEX', tvSymbol: 'NYMEX-KC1!' },
    { symbol: 'CT', name: 'Cotton', exchange: 'NYMEX', tvSymbol: 'NYMEX-CT1!' },
    { symbol: 'SB', name: 'Sugar #11', exchange: 'NYMEX', tvSymbol: 'NYMEX-SB1!' },
    { symbol: 'CC', name: 'Cocoa', exchange: 'NYMEX', tvSymbol: 'NYMEX-CC1!' },
    { symbol: 'OJ', name: 'Orange Juice', exchange: 'NYMEX', tvSymbol: 'NYMEX-OJ1!' },
    { symbol: 'LBS', name: 'Lumber', exchange: 'CME', tvSymbol: 'CME-LBS1!' },
    { symbol: 'LE', name: 'Live Cattle', exchange: 'CME', tvSymbol: 'CME-LE1!' },
    { symbol: 'HE', name: 'Lean Hogs', exchange: 'CME', tvSymbol: 'CME-HE1!' },
    { symbol: 'GF', name: 'Feeder Cattle', exchange: 'CME', tvSymbol: 'CME-GF1!' },
  ],
  'Métaux': [
    { symbol: 'GC', name: 'Gold', exchange: 'COMEX', tvSymbol: 'COMEX-GC1!' },
    { symbol: 'SI', name: 'Silver', exchange: 'COMEX', tvSymbol: 'COMEX-SI1!' },
    { symbol: 'HG', name: 'Copper', exchange: 'COMEX', tvSymbol: 'COMEX-HG1!' },
    { symbol: 'PL', name: 'Platinum', exchange: 'NYMEX', tvSymbol: 'NYMEX-PL1!' },
    { symbol: 'PA', name: 'Palladium', exchange: 'NYMEX', tvSymbol: 'NYMEX-PA1!' },
    { symbol: 'MGC', name: 'Micro Gold', exchange: 'COMEX', tvSymbol: 'COMEX-MGC1!' },
    { symbol: 'SIL', name: 'Micro Silver', exchange: 'COMEX', tvSymbol: 'COMEX-SIL1!' },
    { symbol: 'ALI', name: 'Aluminum', exchange: 'COMEX', tvSymbol: 'COMEX-ALI1!' },
  ],
  'Devises': [
    { symbol: '6E', name: 'Euro FX', exchange: 'CME', tvSymbol: 'CME-6E1!' },
    { symbol: '6B', name: 'British Pound', exchange: 'CME', tvSymbol: 'CME-6B1!' },
    { symbol: '6J', name: 'Japanese Yen', exchange: 'CME', tvSymbol: 'CME-6J1!' },
    { symbol: '6A', name: 'Australian Dollar', exchange: 'CME', tvSymbol: 'CME-6A1!' },
    { symbol: '6C', name: 'Canadian Dollar', exchange: 'CME', tvSymbol: 'CME-6C1!' },
    { symbol: '6S', name: 'Swiss Franc', exchange: 'CME', tvSymbol: 'CME-6S1!' },
    { symbol: '6N', name: 'New Zealand Dollar', exchange: 'CME', tvSymbol: 'CME-6N1!' },
    { symbol: '6M', name: 'Mexican Peso', exchange: 'CME', tvSymbol: 'CME-6M1!' },
    { symbol: 'DX', name: 'US Dollar Index', exchange: 'NYBOT', tvSymbol: 'NYBOT-DX1!' },
  ],
};

/** Parse a number that may be in US format (dot decimal) or European format (comma decimal) */
function parseNum(s: string): number | null {
  if (!s || s.trim() === '—' || s.trim() === '' || s.trim() === '-') return null;
  let cleaned = s.replace(/[\s\u00A0]/g, '');
  cleaned = cleaned.replace('−', '-');
  // Remove % sign if present
  cleaned = cleaned.replace('%', '');

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // European format: 1.234,56 → comma is decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234.56 → dot is decimal
    cleaned = cleaned.replace(/,/g, '');
  }

  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Extract available strikes from scraped markdown and/or HTML */
export function extractStrikes(markdown: string, html?: string): number[] {
  const strikes: number[] = [];

  // Strategy 1 (BEST): Extract from HTML data-overflow-tooltip-text attributes
  // These contain the strike values displayed in the picker buttons (e.g. "0,9000", "76,330")
  if (html) {
    const tooltipMatches = html.match(/data-overflow-tooltip-text="([^"]+)"/g);
    if (tooltipMatches) {
      for (const m of tooltipMatches) {
        const valStr = m.replace('data-overflow-tooltip-text="', '').replace('"', '');
        // Only parse values that look like numbers (European format with comma or plain numbers)
        if (/^[\d\s.,]+$/.test(valStr)) {
          const val = parseNum(valStr);
          if (val !== null && val > 0) {
            strikes.push(val);
          }
        }
      }
    }
  }

  // Strategy 2: Extract from HTML itemContent spans (backup for Strategy 1)
  if (html && strikes.length === 0) {
    const itemMatches = html.match(/itemContent-[^"]*">([\d\s.,]+)<\/span>/g);
    if (itemMatches) {
      for (const m of itemMatches) {
        const valStr = m.replace(/itemContent-[^"]*">/, '').replace('</span>', '');
        const val = parseNum(valStr);
        if (val !== null && val > 0) {
          strikes.push(val);
        }
      }
    }
  }

  // Strategy 3: Look for strike values in the pre-table markdown area
  if (strikes.length === 0) {
    const tableStart = markdown.indexOf('| Calls |') !== -1
      ? markdown.indexOf('| Calls |')
      : markdown.indexOf('|');
    const preTable = tableStart > 0 ? markdown.substring(0, tableStart) : markdown;

    // Match European-format numbers (e.g. 76,330 or 1.234,56 or 0,9000)
    const euMatches = preTable.match(/\d[\d\s.]*,\d+/g);
    if (euMatches) {
      for (const m of euMatches) {
        const val = parseNum(m);
        if (val !== null && val > 0) {
          strikes.push(val);
        }
      }
    }

    // Integer strikes (e.g. 5000, 450)
    const intMatches = preTable.match(/(?<!\d)\d{2,6}(?!\d|,\d)/g);
    if (intMatches) {
      for (const m of intMatches) {
        const val = parseInt(m, 10);
        if (!isNaN(val) && val > 1 && val < 100000 && !strikes.includes(val)) {
          strikes.push(val);
        }
      }
    }
  }

  // Strategy 4: Look for "strike=" in URLs
  if (strikes.length === 0) {
    const urlMatches = markdown.match(/strike=([\d.]+)/g);
    if (urlMatches) {
      for (const m of urlMatches) {
        const val = parseFloat(m.replace('strike=', ''));
        if (!isNaN(val) && val > 0 && !strikes.includes(val)) {
          strikes.push(val);
        }
      }
    }
  }

  // Deduplicate and sort
  return [...new Set(strikes)].sort((a, b) => a - b);
}

/** Extract the current strike price from the scraped data (the one with maturity code) */
export function extractCurrentStrike(markdown: string): number | null {
  // Look for patterns like "SIK2026\n76,330" or "SIH2026 75,730"
  const matches = markdown.match(/[A-Z]{2,4}[FGHJKMNQUVXZ]\d{4}\s*\n?\s*([\d,.]+)/g);
  if (matches && matches.length > 0) {
    // Get the first match which is usually the current/near-month
    const numMatch = matches[0].match(/([\d,.]+)\s*$/);
    if (numMatch) {
      return parseNum(numMatch[1]);
    }
  }
  return null;
}

/** Parse the markdown table from TradingView par-strike view */
export function parseOptionsTable(markdown: string): OptionsRow[] {
  const rows: OptionsRow[] = [];

  // Find the data rows (skip header rows)
  const lines = markdown.split('\n');
  let inTable = false;
  let headersPassed = 0;

  for (const line of lines) {
    if (!line.startsWith('|')) continue;

    // Skip the header rows (Calls | | Puts, then column names, then separator)
    if (line.includes('Calls') && line.includes('Puts')) {
      inTable = true;
      headersPassed = 0;
      continue;
    }

    if (inTable) {
      headersPassed++;
      // Skip column names row and separator row
      if (headersPassed <= 2) continue;

      // Parse data row
      const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
      if (cells.length < 27) continue;

      // Columns order from TradingView "par strike" view:
      // Calls: [0] Bid IV%, [1] Ask IV%, [2] Valeur intr., [3] Valeur temps, [4] Rho, [5] Vega, [6] Theta, [7] Gamma, [8] Delta, [9] Prix, [10] Demande, [11] Offre, [12] Volume
      // Center: [13] Date d'expiration
      // Puts: [14] Volume, [15] Offre, [16] Demande, [17] Prix, [18] Delta, [19] Gamma, [20] Theta, [21] Vega, [22] Rho, [23] Valeur temps, [24] Valeur intr., [25] Ask IV%, [26] Bid IV%

      // Clean the expiration date (sometimes duplicated like "12 févr. 202612 févr. 2026")
      let expStr = cells[13] || '';
      // Remove duplicate dates
      const halfLen = Math.floor(expStr.length / 2);
      if (halfLen > 5 && expStr.substring(0, halfLen) === expStr.substring(halfLen)) {
        expStr = expStr.substring(0, halfLen);
      }

      rows.push({
        expiration: expStr.trim(),
        callBidIV: parseNum(cells[0]),
        callAskIV: parseNum(cells[1]),
        callIntrinsic: parseNum(cells[2]),
        callTimeValue: parseNum(cells[3]),
        callRho: parseNum(cells[4]),
        callVega: parseNum(cells[5]),
        callTheta: parseNum(cells[6]),
        callGamma: parseNum(cells[7]),
        callDelta: parseNum(cells[8]),
        callPrice: parseNum(cells[9]),
        callAsk: parseNum(cells[10]),
        callBid: parseNum(cells[11]),
        callVolume: parseNum(cells[12]),
        putVolume: parseNum(cells[14]),
        putBid: parseNum(cells[15]),
        putAsk: parseNum(cells[16]),
        putPrice: parseNum(cells[17]),
        putDelta: parseNum(cells[18]),
        putGamma: parseNum(cells[19]),
        putTheta: parseNum(cells[20]),
        putVega: parseNum(cells[21]),
        putRho: parseNum(cells[22]),
        putTimeValue: parseNum(cells[23]),
        putIntrinsic: parseNum(cells[24]),
        putAskIV: parseNum(cells[25]),
        putBidIV: parseNum(cells[26]),
      });
    }
  }

  return rows;
}

export async function scrapeOptionsChain(url: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('scrape-options', {
    body: { url },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

export function buildTradingViewUrl(tvSymbol: string, strike?: number): string {
  const base = `https://www.tradingview.com/options/chain/${tvSymbol}/?view=strikes`;
  if (strike !== undefined && strike !== null) {
    return `${base}&strike=${strike}`;
  }
  return base;
}
