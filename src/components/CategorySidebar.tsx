import { useState } from 'react';
import { Zap, TrendingUp, Wheat, Gem, DollarSign } from 'lucide-react';
import { CATEGORIES, type TickerInfo } from '@/lib/options-api';

const categoryIcons: Record<string, React.ReactNode> = {
  'Énergie': <Zap className="h-4 w-4" />,
  'Agriculture': <Wheat className="h-4 w-4" />,
  'Métaux': <Gem className="h-4 w-4" />,
  'Devises': <DollarSign className="h-4 w-4" />,
};

interface CategorySidebarProps {
  selectedCategory: string;
  selectedTicker: TickerInfo | null;
  onCategoryChange: (cat: string) => void;
  onTickerChange: (ticker: TickerInfo) => void;
}

export function CategorySidebar({
  selectedCategory,
  selectedTicker,
  onCategoryChange,
  onTickerChange,
}: CategorySidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-foreground">Options Scanner</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">TradingView Data</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {Object.keys(CATEGORIES).map((category) => (
          <div key={category} className="mb-1">
            <button
              onClick={() => onCategoryChange(category)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              {categoryIcons[category]}
              {category}
            </button>

            {selectedCategory === category && (
              <div className="ml-4 mt-1 space-y-0.5 animate-fade-in">
                {CATEGORIES[category].map((ticker) => (
                  <button
                    key={ticker.symbol}
                    onClick={() => onTickerChange(ticker)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                      selectedTicker?.symbol === ticker.symbol
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    <span className="font-semibold">{ticker.symbol}</span>
                    <span className="text-[10px] opacity-60">{ticker.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
