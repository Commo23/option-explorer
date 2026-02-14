import type { OptionsRow } from './options-api';

interface CacheEntry {
  data: OptionsRow[];
  timestamp: number;
  strikes: number[];
}

const TTL = 30 * 60 * 1000; // 30 min cache

class ScrapeCache {
  private cache = new Map<string, CacheEntry>();

  private key(ticker: string, strike?: number | null): string {
    return strike != null ? `${ticker}::${strike}` : ticker;
  }

  get(ticker: string, strike?: number | null): CacheEntry | null {
    const entry = this.cache.get(this.key(ticker, strike));
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TTL) {
      this.cache.delete(this.key(ticker, strike));
      return null;
    }
    return entry;
  }

  set(ticker: string, strike: number | null | undefined, data: OptionsRow[], strikes: number[] = []): void {
    this.cache.set(this.key(ticker, strike), {
      data,
      strikes,
      timestamp: Date.now(),
    });
  }

  /** Get all cached strike data for a ticker */
  getAllStrikeData(ticker: string): Map<number, OptionsRow[]> {
    const result = new Map<number, OptionsRow[]>();
    for (const [key, entry] of this.cache.entries()) {
      if (!key.startsWith(`${ticker}::`)) continue;
      if (Date.now() - entry.timestamp > TTL) continue;
      const strike = parseFloat(key.split('::')[1]);
      if (!isNaN(strike) && entry.data.length > 0) {
        result.set(strike, entry.data);
      }
    }
    return result;
  }

  /** Count cached strikes for a ticker */
  cachedStrikeCount(ticker: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${ticker}::`)) count++;
    }
    return count;
  }

  clear(ticker?: string): void {
    if (!ticker) {
      this.cache.clear();
      return;
    }
    for (const key of [...this.cache.keys()]) {
      if (key.startsWith(ticker)) this.cache.delete(key);
    }
  }
}

export const scrapeCache = new ScrapeCache();
