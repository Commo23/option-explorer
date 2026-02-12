import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { TickerInfo } from '@/lib/options-api';

interface ToolbarProps {
  ticker: TickerInfo | null;
  strikes: number[];
  selectedStrike: number | null;
  onStrikeChange: (strike: number | null) => void;
  onScrape: () => void;
  isLoading: boolean;
  dataCount: number;
}

export function Toolbar({
  ticker,
  strikes,
  selectedStrike,
  onStrikeChange,
  onScrape,
  isLoading,
  dataCount,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
      <div className="flex items-center gap-2 flex-1">
        {ticker ? (
          <>
            <span className="font-mono font-bold text-primary text-lg">{ticker.symbol}</span>
            <span className="text-sm text-muted-foreground">{ticker.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-mono">
              {ticker.exchange}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Sélectionnez un ticker</span>
        )}
      </div>

      {strikes.length > 0 && (
        <Select
          value={selectedStrike?.toString() ?? 'all'}
          onValueChange={(v) => onStrikeChange(v === 'all' ? null : parseFloat(v))}
        >
          <SelectTrigger className="w-40 h-8 text-xs font-mono bg-secondary border-border">
            <SelectValue placeholder="Strike" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all" className="text-xs font-mono">Tous les strikes</SelectItem>
            {strikes.map((s) => (
              <SelectItem key={s} value={s.toString()} className="text-xs font-mono">
                {s.toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        size="sm"
        onClick={onScrape}
        disabled={!ticker || isLoading}
        className="gap-1.5 h-8 text-xs"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        Scanner
      </Button>

      {dataCount > 0 && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {dataCount} lignes
        </span>
      )}
    </div>
  );
}
