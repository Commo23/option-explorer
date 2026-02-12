import type { OptionsData } from '@/lib/options-api';

interface OptionsTableProps {
  data: OptionsData[];
  selectedStrike: number | null;
  isLoading: boolean;
}

export function OptionsTable({ data, selectedStrike, isLoading }: OptionsTableProps) {
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
          <p className="text-xs mt-1 opacity-60">Les données seront scrapées depuis TradingView</p>
        </div>
      </div>
    );
  }

  const filteredData = selectedStrike
    ? data.filter((d) => d.strike === selectedStrike)
    : data;

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs font-mono">
        <thead className="sticky top-0 z-10">
          <tr className="bg-card border-b border-border">
            {/* Calls header */}
            <th colSpan={6} className="text-center py-2 text-call border-b border-border font-semibold tracking-wider text-[11px]">
              CALLS
            </th>
            <th className="py-2 text-center text-foreground font-bold border-x border-border bg-accent/30">
              STRIKE
            </th>
            {/* Puts header */}
            <th colSpan={6} className="text-center py-2 text-put border-b border-border font-semibold tracking-wider text-[11px]">
              PUTS
            </th>
          </tr>
          <tr className="bg-card/80 text-muted-foreground text-[10px]">
            <th className="py-1.5 px-2 text-right">IV%</th>
            <th className="py-1.5 px-2 text-right">OI</th>
            <th className="py-1.5 px-2 text-right">Vol</th>
            <th className="py-1.5 px-2 text-right">Last</th>
            <th className="py-1.5 px-2 text-right">Ask</th>
            <th className="py-1.5 px-2 text-right">Bid</th>
            <th className="py-1.5 px-2 text-center font-bold text-foreground bg-accent/30 border-x border-border">Price</th>
            <th className="py-1.5 px-2 text-left">Bid</th>
            <th className="py-1.5 px-2 text-left">Ask</th>
            <th className="py-1.5 px-2 text-left">Last</th>
            <th className="py-1.5 px-2 text-left">Vol</th>
            <th className="py-1.5 px-2 text-left">OI</th>
            <th className="py-1.5 px-2 text-left">IV%</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => (
            <tr
              key={`${row.strike}-${i}`}
              className={`border-b border-border/50 hover:bg-accent/20 transition-colors ${
                selectedStrike === row.strike ? 'bg-accent/30' : ''
              }`}
            >
              <td className="py-1.5 px-2 text-right text-vol">{row.callIV?.toFixed(1) ?? '—'}</td>
              <td className="py-1.5 px-2 text-right text-muted-foreground">{row.callOI ?? '—'}</td>
              <td className="py-1.5 px-2 text-right text-muted-foreground">{row.callVolume ?? '—'}</td>
              <td className="py-1.5 px-2 text-right text-call">{row.callLast?.toFixed(2) ?? '—'}</td>
              <td className="py-1.5 px-2 text-right text-muted-foreground">{row.callAsk?.toFixed(2) ?? '—'}</td>
              <td className="py-1.5 px-2 text-right text-call">{row.callBid?.toFixed(2) ?? '—'}</td>
              <td className="py-1.5 px-2 text-center font-bold text-foreground bg-accent/20 border-x border-border">
                {row.strike.toFixed(2)}
              </td>
              <td className="py-1.5 px-2 text-left text-put">{row.putBid?.toFixed(2) ?? '—'}</td>
              <td className="py-1.5 px-2 text-left text-muted-foreground">{row.putAsk?.toFixed(2) ?? '—'}</td>
              <td className="py-1.5 px-2 text-left text-put">{row.putLast?.toFixed(2) ?? '—'}</td>
              <td className="py-1.5 px-2 text-left text-muted-foreground">{row.putVolume ?? '—'}</td>
              <td className="py-1.5 px-2 text-left text-muted-foreground">{row.putOI ?? '—'}</td>
              <td className="py-1.5 px-2 text-left text-vol">{row.putIV?.toFixed(1) ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
