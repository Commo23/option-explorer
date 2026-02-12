import type { OptionsRow } from '@/lib/options-api';

interface OptionsTableProps {
  data: OptionsRow[];
  strike: number | null;
  isLoading: boolean;
}

function fmt(v: number | null, decimals = 2): string {
  if (v === null || v === undefined) return '—';
  return v.toFixed(decimals);
}

function fmtInt(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString();
}

export function OptionsTable({ data, strike, isLoading }: OptionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Scraping des données...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Sélectionnez un ticker et lancez le scan</p>
          <p className="text-xs mt-1 opacity-60">Les données seront scrapées depuis TradingView (vue par strike)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {strike !== null && (
        <div className="px-3 py-1.5 bg-accent/20 border-b border-border text-xs font-mono text-muted-foreground">
          Strike sélectionné: <span className="text-primary font-bold">{strike}</span> — {data.length} maturités
        </div>
      )}
      <table className="w-full text-xs font-mono">
        <thead className="sticky top-0 z-10">
          <tr className="bg-card border-b border-border">
            <th colSpan={10} className="text-center py-2 text-call border-b border-border font-semibold tracking-wider text-[11px]">
              CALLS
            </th>
            <th className="py-2 text-center text-foreground font-bold border-x border-border bg-accent/30 text-[11px]">
              EXPIRATION
            </th>
            <th colSpan={10} className="text-center py-2 text-put border-b border-border font-semibold tracking-wider text-[11px]">
              PUTS
            </th>
          </tr>
          <tr className="bg-card/80 text-muted-foreground text-[10px]">
            <th className="py-1.5 px-1.5 text-right">BidIV</th>
            <th className="py-1.5 px-1.5 text-right">AskIV</th>
            <th className="py-1.5 px-1.5 text-right">Delta</th>
            <th className="py-1.5 px-1.5 text-right">Gamma</th>
            <th className="py-1.5 px-1.5 text-right">Theta</th>
            <th className="py-1.5 px-1.5 text-right">Vega</th>
            <th className="py-1.5 px-1.5 text-right">Prix</th>
            <th className="py-1.5 px-1.5 text-right">Ask</th>
            <th className="py-1.5 px-1.5 text-right">Bid</th>
            <th className="py-1.5 px-1.5 text-right">Vol</th>
            <th className="py-1.5 px-1.5 text-center font-bold text-foreground bg-accent/30 border-x border-border">Date</th>
            <th className="py-1.5 px-1.5 text-left">Vol</th>
            <th className="py-1.5 px-1.5 text-left">Bid</th>
            <th className="py-1.5 px-1.5 text-left">Ask</th>
            <th className="py-1.5 px-1.5 text-left">Prix</th>
            <th className="py-1.5 px-1.5 text-left">Vega</th>
            <th className="py-1.5 px-1.5 text-left">Theta</th>
            <th className="py-1.5 px-1.5 text-left">Gamma</th>
            <th className="py-1.5 px-1.5 text-left">Delta</th>
            <th className="py-1.5 px-1.5 text-left">BidIV</th>
            <th className="py-1.5 px-1.5 text-left">AskIV</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={`${row.expiration}-${i}`}
              className="border-b border-border/50 hover:bg-accent/20 transition-colors"
            >
              <td className="py-1.5 px-1.5 text-right text-vol">{fmt(row.callBidIV, 1)}</td>
              <td className="py-1.5 px-1.5 text-right text-vol">{fmt(row.callAskIV, 1)}</td>
              <td className="py-1.5 px-1.5 text-right text-call">{fmt(row.callDelta, 3)}</td>
              <td className="py-1.5 px-1.5 text-right text-muted-foreground">{fmt(row.callGamma, 3)}</td>
              <td className="py-1.5 px-1.5 text-right text-muted-foreground">{fmt(row.callTheta, 2)}</td>
              <td className="py-1.5 px-1.5 text-right text-muted-foreground">{fmt(row.callVega, 2)}</td>
              <td className="py-1.5 px-1.5 text-right text-call font-semibold">{fmt(row.callPrice, 3)}</td>
              <td className="py-1.5 px-1.5 text-right text-muted-foreground">{fmt(row.callAsk, 3)}</td>
              <td className="py-1.5 px-1.5 text-right text-call">{fmt(row.callBid, 3)}</td>
              <td className="py-1.5 px-1.5 text-right text-muted-foreground">{fmtInt(row.callVolume)}</td>
              <td className="py-1.5 px-1.5 text-center font-semibold text-foreground bg-accent/20 border-x border-border text-[10px]">
                {row.expiration}
              </td>
              <td className="py-1.5 px-1.5 text-left text-muted-foreground">{fmtInt(row.putVolume)}</td>
              <td className="py-1.5 px-1.5 text-left text-put">{fmt(row.putBid, 3)}</td>
              <td className="py-1.5 px-1.5 text-left text-muted-foreground">{fmt(row.putAsk, 3)}</td>
              <td className="py-1.5 px-1.5 text-left text-put font-semibold">{fmt(row.putPrice, 3)}</td>
              <td className="py-1.5 px-1.5 text-left text-muted-foreground">{fmt(row.putVega, 2)}</td>
              <td className="py-1.5 px-1.5 text-left text-muted-foreground">{fmt(row.putTheta, 2)}</td>
              <td className="py-1.5 px-1.5 text-left text-muted-foreground">{fmt(row.putGamma, 3)}</td>
              <td className="py-1.5 px-1.5 text-left text-put">{fmt(row.putDelta, 3)}</td>
              <td className="py-1.5 px-1.5 text-left text-vol">{fmt(row.putBidIV, 1)}</td>
              <td className="py-1.5 px-1.5 text-left text-vol">{fmt(row.putAskIV, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
