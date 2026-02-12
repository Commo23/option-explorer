import { useState, useMemo } from 'react';
import { CategorySidebar } from '@/components/CategorySidebar';
import { OptionsTable } from '@/components/OptionsTable';
import { Toolbar } from '@/components/Toolbar';
import { CATEGORIES, type TickerInfo, type OptionsData, scrapeOptionsChain, buildTradingViewUrl, parseOptionsFromMarkdown } from '@/lib/options-api';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('Énergie');
  const [selectedTicker, setSelectedTicker] = useState<TickerInfo | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [optionsData, setOptionsData] = useState<OptionsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const strikes = useMemo(() => {
    const unique = [...new Set(optionsData.map((d) => d.strike))];
    return unique.sort((a, b) => a - b);
  }, [optionsData]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedTicker(null);
    setOptionsData([]);
    setSelectedStrike(null);
  };

  const handleTickerChange = (ticker: TickerInfo) => {
    setSelectedTicker(ticker);
    setOptionsData([]);
    setSelectedStrike(null);
  };

  const handleScrape = async () => {
    if (!selectedTicker) return;

    setIsLoading(true);
    try {
      const url = buildTradingViewUrl(selectedTicker.tvSymbol, selectedStrike ?? undefined);
      const result = await scrapeOptionsChain(url);

      if (result.success) {
        const markdown = result.data?.data?.markdown || result.data?.markdown || '';
        const parsed = parseOptionsFromMarkdown(markdown);

        if (parsed.length > 0) {
          setOptionsData(parsed);
          toast({ title: 'Succès', description: `${parsed.length} options récupérées` });
        } else {
          // Use demo data as fallback for display
          setOptionsData(generateDemoData(selectedTicker));
          toast({
            title: 'Données démo',
            description: 'Données scrapées non parsables, affichage de données démo.',
          });
        }
      } else {
        setOptionsData(generateDemoData(selectedTicker));
        toast({
          title: 'Données démo',
          description: result.error || 'Erreur de scraping, affichage de données démo.',
        });
      }
    } catch (error) {
      console.error('Scrape error:', error);
      setOptionsData(generateDemoData(selectedTicker));
      toast({
        title: 'Données démo',
        description: 'Erreur réseau, affichage de données démo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background terminal-grid">
      <CategorySidebar
        selectedCategory={selectedCategory}
        selectedTicker={selectedTicker}
        onCategoryChange={handleCategoryChange}
        onTickerChange={handleTickerChange}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Toolbar
          ticker={selectedTicker}
          strikes={strikes}
          selectedStrike={selectedStrike}
          onStrikeChange={setSelectedStrike}
          onScrape={handleScrape}
          isLoading={isLoading}
          dataCount={optionsData.length}
        />
        <OptionsTable
          data={optionsData}
          selectedStrike={selectedStrike}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

function generateDemoData(ticker: TickerInfo): OptionsData[] {
  const basePrice = getBasePrice(ticker.symbol);
  const strikes: OptionsData[] = [];
  for (let i = -10; i <= 10; i++) {
    const step = getStepSize(ticker.symbol);
    const strike = Math.round((basePrice + i * step) * 100) / 100;
    const distance = Math.abs(i);
    const callIV = 20 + distance * 1.5 + Math.random() * 5;
    const putIV = 22 + distance * 1.8 + Math.random() * 5;
    const callPrice = Math.max(0.01, (basePrice - strike) * 0.8 + callIV * 0.05);
    const putPrice = Math.max(0.01, (strike - basePrice) * 0.8 + putIV * 0.05);

    strikes.push({
      strike,
      callBid: Math.round(callPrice * 95) / 100,
      callAsk: Math.round(callPrice * 105) / 100,
      callLast: Math.round(callPrice * 100) / 100,
      callVolume: Math.floor(Math.random() * 5000),
      callOI: Math.floor(Math.random() * 20000),
      callIV: Math.round(callIV * 10) / 10,
      putBid: Math.round(putPrice * 95) / 100,
      putAsk: Math.round(putPrice * 105) / 100,
      putLast: Math.round(putPrice * 100) / 100,
      putVolume: Math.floor(Math.random() * 5000),
      putOI: Math.floor(Math.random() * 20000),
      putIV: Math.round(putIV * 10) / 10,
    });
  }
  return strikes;
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    CL: 72.50, NG: 3.20, RB: 2.35, HO: 2.65,
    ZC: 450, ZW: 560, ZS: 1050, KC: 195, CT: 78,
    GC: 2040, SI: 24.50, HG: 3.85, PL: 920,
    '6E': 1.0850, '6B': 1.2650, '6J': 0.0067, '6A': 0.6550, '6C': 0.7380,
  };
  return prices[symbol] || 100;
}

function getStepSize(symbol: string): number {
  const steps: Record<string, number> = {
    CL: 1, NG: 0.05, RB: 0.05, HO: 0.05,
    ZC: 5, ZW: 5, ZS: 10, KC: 2.5, CT: 1,
    GC: 10, SI: 0.50, HG: 0.05, PL: 10,
    '6E': 0.005, '6B': 0.005, '6J': 0.0001, '6A': 0.005, '6C': 0.005,
  };
  return steps[symbol] || 1;
}

export default Dashboard;
