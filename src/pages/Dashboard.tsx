import { useState } from 'react';
import { CategorySidebar } from '@/components/CategorySidebar';
import { OptionsTable } from '@/components/OptionsTable';
import { Toolbar } from '@/components/Toolbar';
import {
  CATEGORIES,
  type TickerInfo,
  type OptionsRow,
  scrapeOptionsChain,
  buildTradingViewUrl,
  parseOptionsTable,
  extractStrikes,
} from '@/lib/options-api';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('Énergie');
  const [selectedTicker, setSelectedTicker] = useState<TickerInfo | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [availableStrikes, setAvailableStrikes] = useState<number[]>([]);
  const [optionsData, setOptionsData] = useState<OptionsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedTicker(null);
    setOptionsData([]);
    setSelectedStrike(null);
    setAvailableStrikes([]);
  };

  const handleTickerChange = (ticker: TickerInfo) => {
    setSelectedTicker(ticker);
    setOptionsData([]);
    setSelectedStrike(null);
    setAvailableStrikes([]);
  };

  const handleStrikeChange = (strike: number | null) => {
    setSelectedStrike(strike);
    // Auto-scrape when strike changes
    if (strike !== null && selectedTicker) {
      doScrape(selectedTicker, strike);
    }
  };

  const doScrape = async (ticker: TickerInfo, strike?: number | null) => {
    setIsLoading(true);
    try {
      const url = buildTradingViewUrl(ticker.tvSymbol, strike ?? undefined);
      console.log('Scraping URL:', url);
      const result = await scrapeOptionsChain(url);

      if (result.success) {
        const markdown = result.data?.data?.markdown || result.data?.markdown || '';
        const html = result.data?.data?.html || result.data?.html || '';

        // Extract strikes from the page (use HTML for reliable extraction)
        const strikes = extractStrikes(markdown, html);
        if (strikes.length > 0) {
          setAvailableStrikes(strikes);
        }

        // Parse options table
        const parsed = parseOptionsTable(markdown);

        if (parsed.length > 0) {
          setOptionsData(parsed);
          toast({ title: 'Succès', description: `${parsed.length} maturités récupérées` });
        } else {
          setOptionsData(generateDemoData());
          toast({
            title: 'Données démo',
            description: 'Table non trouvée dans le scraping, affichage de données démo.',
          });
        }
      } else {
        setOptionsData(generateDemoData());
        toast({
          title: 'Données démo',
          description: result.error || 'Erreur de scraping, affichage de données démo.',
        });
      }
    } catch (error) {
      console.error('Scrape error:', error);
      setOptionsData(generateDemoData());
      toast({
        title: 'Données démo',
        description: 'Erreur réseau, affichage de données démo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrape = () => {
    if (!selectedTicker) return;
    doScrape(selectedTicker, selectedStrike);
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
          strikes={availableStrikes}
          selectedStrike={selectedStrike}
          onStrikeChange={handleStrikeChange}
          onScrape={handleScrape}
          isLoading={isLoading}
          dataCount={optionsData.length}
        />
        <OptionsTable
          data={optionsData}
          strike={selectedStrike}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

function generateDemoData(): OptionsRow[] {
  const months = [
    '12 févr. 2026', '13 févr. 2026', '17 févr. 2026', '24 févr. 2026',
    '26 mars 2026', '27 avr. 2026', '26 mai 2026', '25 juin 2026',
    '28 juil. 2026', '26 août 2026', '24 sept. 2026', '27 oct. 2026',
    '24 nov. 2026', '28 déc. 2026', '26 janv. 2027', '24 mars 2027',
  ];

  return months.map((exp, i) => {
    const daysOut = (i + 1) * 15;
    const callIV = 30 + Math.random() * 20;
    const putIV = 32 + Math.random() * 20;
    const callPrice = 2 + Math.random() * 10 + i * 0.5;
    const putPrice = 2 + Math.random() * 10 + i * 0.5;

    return {
      expiration: exp,
      callBidIV: callIV - 5,
      callAskIV: callIV + 5,
      callIntrinsic: Math.random() * 2,
      callTimeValue: callPrice * 0.8,
      callRho: 0.01 * (i + 1),
      callVega: 0.05 + i * 0.02,
      callTheta: -(0.5 + Math.random()),
      callGamma: 0.05 - i * 0.002,
      callDelta: 0.55 + Math.random() * 0.1,
      callPrice,
      callAsk: callPrice * 1.05,
      callBid: callPrice * 0.95,
      callVolume: Math.floor(Math.random() * 100),
      putVolume: Math.floor(Math.random() * 100),
      putBid: putPrice * 0.95,
      putAsk: putPrice * 1.05,
      putPrice,
      putDelta: -(0.45 + Math.random() * 0.1),
      putGamma: 0.05 - i * 0.002,
      putTheta: -(0.5 + Math.random()),
      putVega: 0.05 + i * 0.02,
      putRho: -(0.01 * (i + 1)),
      putTimeValue: putPrice * 0.8,
      putIntrinsic: Math.random() * 0.5,
      putAskIV: putIV + 5,
      putBidIV: putIV - 5,
    };
  });
}

export default Dashboard;
