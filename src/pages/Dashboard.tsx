import { useState } from 'react';
import { CategorySidebar } from '@/components/CategorySidebar';
import { OptionsTable } from '@/components/OptionsTable';
import { VolSurfacePanel } from '@/components/VolSurfacePanel';
import { Toolbar } from '@/components/Toolbar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CATEGORIES,
  type TickerInfo,
  type OptionsRow,
  scrapeOptionsChain,
  buildTradingViewUrl,
  parseOptionsTable,
  extractStrikes,
} from '@/lib/options-api';
import { scrapeCache } from '@/lib/scrape-cache';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('Énergie');
  const [selectedTicker, setSelectedTicker] = useState<TickerInfo | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [availableStrikes, setAvailableStrikes] = useState<number[]>([]);
  const [optionsData, setOptionsData] = useState<OptionsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Multi-strike surface data
  const [surfaceData, setSurfaceData] = useState<Map<number, OptionsRow[]>>(new Map());
  const [isBuildingSurface, setIsBuildingSurface] = useState(false);
  const [buildProgress, setBuildProgress] = useState<{ current: number; total: number } | null>(null);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedTicker(null);
    setOptionsData([]);
    setSelectedStrike(null);
    setAvailableStrikes([]);
    setSurfaceData(new Map());
  };

  const handleTickerChange = (ticker: TickerInfo) => {
    setSelectedTicker(ticker);
    setOptionsData([]);
    setSelectedStrike(null);
    setAvailableStrikes([]);
    setSurfaceData(new Map());

    // Restore cached surface data if available
    const cached = scrapeCache.getAllStrikeData(ticker.tvSymbol);
    if (cached.size > 0) {
      setSurfaceData(cached);
      toast({ title: 'Cache', description: `${cached.size} strikes restaurés depuis le cache.` });
    }
  };

  const handleStrikeChange = (strike: number | null) => {
    setSelectedStrike(strike);
    if (strike !== null && selectedTicker) {
      doScrape(selectedTicker, strike);
    }
  };

  const doScrape = async (ticker: TickerInfo, strike?: number | null) => {
    // Check cache first
    const cached = scrapeCache.get(ticker.tvSymbol, strike);
    if (cached) {
      setOptionsData(cached.data);
      if (cached.strikes.length > 0) setAvailableStrikes(cached.strikes);
      toast({ title: 'Cache', description: `${cached.data.length} maturités (cache)` });
      return;
    }

    setIsLoading(true);
    try {
      const url = buildTradingViewUrl(ticker.tvSymbol, strike ?? undefined);
      const result = await scrapeOptionsChain(url);

      if (result.success) {
        const markdown = result.data?.data?.markdown || result.data?.markdown || '';
        const html = result.data?.data?.html || result.data?.html || '';

        const strikes = extractStrikes(markdown, html);
        if (strikes.length > 0) setAvailableStrikes(strikes);

        const parsed = parseOptionsTable(markdown);

        if (parsed.length > 0) {
          setOptionsData(parsed);
          scrapeCache.set(ticker.tvSymbol, strike, parsed, strikes);
          toast({ title: 'Succès', description: `${parsed.length} maturités récupérées` });
        } else {
          const demo = generateDemoData();
          setOptionsData(demo);
          if (strikes.length === 0) setAvailableStrikes(generateDemoStrikes());
          toast({ title: 'Données démo', description: 'Table non trouvée, données démo.' });
        }
      } else {
        const demo = generateDemoData();
        setOptionsData(demo);
        if (availableStrikes.length === 0) setAvailableStrikes(generateDemoStrikes());
        toast({ title: 'Données démo', description: result.error || 'Erreur de scraping.' });
      }
    } catch (error) {
      console.error('Scrape error:', error);
      const demo = generateDemoData();
      setOptionsData(demo);
      if (availableStrikes.length === 0) setAvailableStrikes(generateDemoStrikes());
      toast({ title: 'Données démo', description: 'Erreur réseau, données démo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrape = () => {
    if (!selectedTicker) return;
    doScrape(selectedTicker, selectedStrike);
  };

  const handleBuildSurface = async (selectedStrikes: number[]) => {
    if (!selectedTicker || selectedStrikes.length === 0) return;

    setIsBuildingSurface(true);
    const newSurfaceData = new Map<number, OptionsRow[]>();
    const total = selectedStrikes.length;
    let skipped = 0;

    toast({
      title: 'Construction de la nappe',
      description: `Scraping de ${total} strikes en cours...`,
    });

    for (let i = 0; i < total; i++) {
      const strike = selectedStrikes[i];
      setBuildProgress({ current: i + 1, total });

      // Check cache first
      const cached = scrapeCache.get(selectedTicker.tvSymbol, strike);
      if (cached && cached.data.length > 0) {
        newSurfaceData.set(strike, cached.data);
        skipped++;
        continue;
      }

      try {
        const url = buildTradingViewUrl(selectedTicker.tvSymbol, strike);
        const result = await scrapeOptionsChain(url);

        if (result.success) {
          const markdown = result.data?.data?.markdown || result.data?.markdown || '';
          const parsed = parseOptionsTable(markdown);
          if (parsed.length > 0) {
            newSurfaceData.set(strike, parsed);
            scrapeCache.set(selectedTicker.tvSymbol, strike, parsed);
          }
        }
      } catch (error) {
        console.error(`Error scraping strike ${strike}:`, error);
      }

      if (i < total - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setSurfaceData(newSurfaceData);
    setBuildProgress(null);
    setIsBuildingSurface(false);

    toast({
      title: 'Nappe construite',
      description: `${newSurfaceData.size}/${total} strikes OK (${skipped} depuis le cache).`,
    });
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
        <Tabs defaultValue="chain" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2 w-fit bg-secondary">
            <TabsTrigger value="chain" className="text-xs font-mono">Chaîne d'options</TabsTrigger>
            <TabsTrigger value="volsurface" className="text-xs font-mono">Nappe de Vol</TabsTrigger>
          </TabsList>
          <TabsContent value="chain" className="flex-1 overflow-hidden mt-0">
            <OptionsTable
              data={optionsData}
              strike={selectedStrike}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="volsurface" className="flex-1 overflow-auto mt-0">
            <VolSurfacePanel
              data={optionsData}
              strike={selectedStrike}
              surfaceData={surfaceData}
              availableStrikes={availableStrikes}
              onBuildSurface={handleBuildSurface}
              isBuildingSurface={isBuildingSurface}
              buildProgress={buildProgress}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function generateDemoStrikes(): number[] {
  const base = 70;
  return Array.from({ length: 15 }, (_, i) => base + i * 2.5);
}

function generateDemoData(): OptionsRow[] {
  const months = [
    '12 févr. 2026', '13 févr. 2026', '17 févr. 2026', '24 févr. 2026',
    '26 mars 2026', '27 avr. 2026', '26 mai 2026', '25 juin 2026',
    '28 juil. 2026', '26 août 2026', '24 sept. 2026', '27 oct. 2026',
    '24 nov. 2026', '28 déc. 2026', '26 janv. 2027', '24 mars 2027',
  ];

  return months.map((exp, i) => {
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
