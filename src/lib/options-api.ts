import { supabase } from '@/integrations/supabase/client';

export interface OptionsData {
  strike: number;
  callBid: number | null;
  callAsk: number | null;
  callLast: number | null;
  callVolume: number | null;
  callOI: number | null;
  callIV: number | null;
  putBid: number | null;
  putAsk: number | null;
  putLast: number | null;
  putVolume: number | null;
  putOI: number | null;
  putIV: number | null;
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
    { symbol: 'CL', name: 'Crude Oil', exchange: 'NYMEX', tvSymbol: 'NYMEX-CL1!' },
    { symbol: 'NG', name: 'Natural Gas', exchange: 'NYMEX', tvSymbol: 'NYMEX-NG1!' },
    { symbol: 'RB', name: 'RBOB Gasoline', exchange: 'NYMEX', tvSymbol: 'NYMEX-RB1!' },
    { symbol: 'HO', name: 'Heating Oil', exchange: 'NYMEX', tvSymbol: 'NYMEX-HO1!' },
  ],
  'Agriculture': [
    { symbol: 'ZC', name: 'Corn', exchange: 'CBOT', tvSymbol: 'CBOT-ZC1!' },
    { symbol: 'ZW', name: 'Wheat', exchange: 'CBOT', tvSymbol: 'CBOT-ZW1!' },
    { symbol: 'ZS', name: 'Soybeans', exchange: 'CBOT', tvSymbol: 'CBOT-ZS1!' },
    { symbol: 'KC', name: 'Coffee', exchange: 'NYMEX', tvSymbol: 'NYMEX-KC1!' },
    { symbol: 'CT', name: 'Cotton', exchange: 'NYMEX', tvSymbol: 'NYMEX-CT1!' },
  ],
  'Métaux': [
    { symbol: 'GC', name: 'Gold', exchange: 'COMEX', tvSymbol: 'COMEX-GC1!' },
    { symbol: 'SI', name: 'Silver', exchange: 'COMEX', tvSymbol: 'COMEX-SI1!' },
    { symbol: 'HG', name: 'Copper', exchange: 'COMEX', tvSymbol: 'COMEX-HG1!' },
    { symbol: 'PL', name: 'Platinum', exchange: 'NYMEX', tvSymbol: 'NYMEX-PL1!' },
  ],
  'Devises': [
    { symbol: '6E', name: 'Euro FX', exchange: 'CME', tvSymbol: 'CME-6E1!' },
    { symbol: '6B', name: 'British Pound', exchange: 'CME', tvSymbol: 'CME-6B1!' },
    { symbol: '6J', name: 'Japanese Yen', exchange: 'CME', tvSymbol: 'CME-6J1!' },
    { symbol: '6A', name: 'Australian Dollar', exchange: 'CME', tvSymbol: 'CME-6A1!' },
    { symbol: '6C', name: 'Canadian Dollar', exchange: 'CME', tvSymbol: 'CME-6C1!' },
  ],
};

export function parseOptionsFromMarkdown(markdown: string): OptionsData[] {
  const lines = markdown.split('\n');
  const options: OptionsData[] = [];

  for (const line of lines) {
    // Try to find tabular data patterns with numbers
    const numbers = line.match(/[\d.]+/g);
    if (numbers && numbers.length >= 5) {
      // Heuristic: lines with many numbers are likely options data rows
      const strike = parseFloat(numbers[0]);
      if (!isNaN(strike) && strike > 0) {
        options.push({
          strike,
          callBid: numbers[1] ? parseFloat(numbers[1]) : null,
          callAsk: numbers[2] ? parseFloat(numbers[2]) : null,
          callLast: numbers[3] ? parseFloat(numbers[3]) : null,
          callVolume: numbers[4] ? parseInt(numbers[4]) : null,
          callOI: numbers[5] ? parseInt(numbers[5]) : null,
          callIV: numbers[6] ? parseFloat(numbers[6]) : null,
          putBid: numbers[7] ? parseFloat(numbers[7]) : null,
          putAsk: numbers[8] ? parseFloat(numbers[8]) : null,
          putLast: numbers[9] ? parseFloat(numbers[9]) : null,
          putVolume: numbers[10] ? parseInt(numbers[10]) : null,
          putOI: numbers[11] ? parseInt(numbers[11]) : null,
          putIV: numbers[12] ? parseFloat(numbers[12]) : null,
        });
      }
    }
  }

  return options;
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
  const base = `https://fr.tradingview.com/options/chain/${tvSymbol}/?view=strikes`;
  if (strike) {
    return `${base}&strike=${strike}`;
  }
  return base;
}
