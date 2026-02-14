import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OptionsRow } from '@/lib/options-api';
import {
  buildVolSurface,
  buildTermStructure,
  interpolateVol,
  cleanVolData,
  dateStringToDays,
  type VolSurface,
  type VolType,
} from '@/lib/vol-surface';
import { Search, Layers, Loader2 } from 'lucide-react';

interface VolSurfacePanelProps {
  data: OptionsRow[];
  strike: number | null;
  surfaceData: Map<number, OptionsRow[]>;
  availableStrikes: number[];
  onBuildSurface: () => void;
  isBuildingSurface: boolean;
  buildProgress: { current: number; total: number } | null;
}

function volColor(vol: number | null): string {
  if (vol === null) return '';
  if (vol < 15) return 'text-emerald-400';
  if (vol < 25) return 'text-emerald-300';
  if (vol < 35) return 'text-vol';
  if (vol < 50) return 'text-orange-400';
  return 'text-red-400';
}

function volBgClass(vol: number | null): string {
  if (vol === null) return 'bg-muted/30';
  if (vol < 15) return 'bg-emerald-500/10';
  if (vol < 25) return 'bg-emerald-500/5';
  if (vol < 35) return 'bg-yellow-500/10';
  if (vol < 50) return 'bg-orange-500/10';
  return 'bg-red-500/15';
}

export function VolSurfacePanel({
  data,
  strike,
  surfaceData,
  availableStrikes,
  onBuildSurface,
  isBuildingSurface,
  buildProgress,
}: VolSurfacePanelProps) {
  const [queryStrike, setQueryStrike] = useState('');
  const [queryDate, setQueryDate] = useState('');
  const [queryType, setQueryType] = useState<VolType>('mid');
  const [interpolatedVol, setInterpolatedVol] = useState<number | null>(null);
  const [queryError, setQueryError] = useState('');

  // Build full surface if multi-strike data exists, else term structure
  const surface: VolSurface | null = useMemo(() => {
    if (surfaceData.size > 1) {
      return buildVolSurface(surfaceData);
    }
    if (data.length > 0 && strike !== null) {
      return buildTermStructure(data, strike);
    }
    return null;
  }, [data, strike, surfaceData]);

  const hasFullSurface = surfaceData.size > 1;

  const handleInterpolate = () => {
    setQueryError('');
    setInterpolatedVol(null);

    if (!surface) {
      setQueryError('Pas de surface disponible');
      return;
    }

    const s = parseFloat(queryStrike);
    if (isNaN(s)) {
      setQueryError('Strike invalide');
      return;
    }

    const days = dateStringToDays(queryDate);
    if (days === null) {
      setQueryError('Date invalide ou passée');
      return;
    }

    const vol = interpolateVol(surface, s, days, queryType);
    if (vol === null) {
      setQueryError('Interpolation impossible avec les données disponibles');
    } else {
      setInterpolatedVol(vol);
    }
  };

  return (
    <div className="p-3 space-y-4 overflow-auto">
      {/* CTA: Build full surface */}
      <Card className="border-primary/30 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Construire la nappe de volatilité
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Scrape tous les strikes disponibles ({availableStrikes.length} strikes) pour construire une surface complète avec interpolation.
              </p>
              {hasFullSurface && surface && (
                <p className="text-[10px] text-primary mt-1 font-mono">
                  ✓ Surface construite: {surface.strikes.length} strikes × {surface.maturities.length} maturités = {surface.points.length} points
                </p>
              )}
            </div>
            <Button
              onClick={onBuildSurface}
              disabled={isBuildingSurface || availableStrikes.length === 0}
              className="gap-2 shrink-0"
              size="sm"
            >
              {isBuildingSurface ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {buildProgress
                    ? `${buildProgress.current}/${buildProgress.total}`
                    : 'Construction...'}
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" />
                  {hasFullSurface ? 'Reconstruire' : 'Construire la nappe'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interpolation query */}
      <Card className="border-border bg-card">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-primary" />
            Interpoler la volatilité
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="w-28">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                Strike
              </label>
              <Input
                type="number"
                step="any"
                value={queryStrike}
                onChange={(e) => setQueryStrike(e.target.value)}
                placeholder={strike?.toString() ?? '0'}
                className="h-8 text-xs font-mono bg-secondary border-border"
              />
            </div>
            <div className="w-40">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                Date d'échéance
              </label>
              <Input
                type="date"
                value={queryDate}
                onChange={(e) => setQueryDate(e.target.value)}
                className="h-8 text-xs font-mono bg-secondary border-border"
              />
            </div>
            <div className="w-24">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                Type
              </label>
              <Select value={queryType} onValueChange={(v) => setQueryType(v as VolType)}>
                <SelectTrigger className="h-8 text-xs font-mono bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call" className="text-xs font-mono">Call</SelectItem>
                  <SelectItem value="put" className="text-xs font-mono">Put</SelectItem>
                  <SelectItem value="mid" className="text-xs font-mono">Mid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleInterpolate}
              disabled={!surface}
              className="h-8 text-xs gap-1"
            >
              Interpoler
            </Button>
          </div>
          {interpolatedVol !== null && (
            <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20 flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground font-mono">
                Vol {queryType.toUpperCase()} interpolée:
              </span>
              <span className={`text-lg font-mono font-bold ${volColor(interpolatedVol)}`}>
                {interpolatedVol.toFixed(2)}%
              </span>
            </div>
          )}
          {queryError && (
            <p className="mt-2 text-[10px] text-destructive font-mono">{queryError}</p>
          )}
        </CardContent>
      </Card>

      {/* Surface grid (if multi-strike) */}
      {hasFullSurface && surface && surface.strikes.length > 1 && (
        <Card className="border-border bg-card">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              Grille de volatilité
              <Badge variant="outline" className="text-[10px] font-mono">
                {surface.strikes.length} × {surface.maturities.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-1.5 px-1 text-left text-muted-foreground sticky left-0 bg-card z-10">
                      Strike ↓ / Exp →
                    </th>
                    {surface.maturityLabels.map((label, i) => (
                      <th key={i} className="py-1.5 px-1 text-center text-muted-foreground whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {surface.strikes.map((s, si) => (
                    <tr key={s} className="border-b border-border/30">
                      <td className="py-1 px-1 font-semibold text-foreground sticky left-0 bg-card z-10">
                        {s}
                      </td>
                      {surface.gridMid[si].map((vol, mi) => (
                        <td
                          key={mi}
                          className={`py-1 px-1 text-center ${volBgClass(vol)} ${volColor(vol)}`}
                        >
                          {vol !== null ? vol.toFixed(1) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Term structure (single strike) */}
      {surface && (
        <Card className="border-border bg-card">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              Structure par terme
              {strike !== null && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Strike {strike}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                {cleanVolData(data, strike ?? 0).length} points
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {cleanVolData(data, strike ?? 0).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucune donnée de vol valide après nettoyage.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="py-1.5 px-2 text-left">Expiration</th>
                      <th className="py-1.5 px-2 text-right">Jours</th>
                      <th className="py-1.5 px-2 text-right">Call IV</th>
                      <th className="py-1.5 px-2 text-right">Put IV</th>
                      <th className="py-1.5 px-2 text-right">Mid IV</th>
                      <th className="py-1.5 px-2 text-right">Skew</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cleanVolData(data, strike ?? 0).map((pt, i) => {
                      const skew = (pt.callMidIV !== null && pt.putMidIV !== null)
                        ? pt.putMidIV - pt.callMidIV
                        : null;
                      return (
                        <tr
                          key={`${pt.expiration}-${i}`}
                          className={`border-b border-border/30 ${volBgClass(pt.midIV)}`}
                        >
                          <td className="py-1.5 px-2 text-foreground">{pt.expiration}</td>
                          <td className="py-1.5 px-2 text-right text-muted-foreground">{pt.daysToExpiry}</td>
                          <td className={`py-1.5 px-2 text-right ${volColor(pt.callMidIV)}`}>
                            {pt.callMidIV?.toFixed(2) ?? '—'}
                          </td>
                          <td className={`py-1.5 px-2 text-right ${volColor(pt.putMidIV)}`}>
                            {pt.putMidIV?.toFixed(2) ?? '—'}
                          </td>
                          <td className={`py-1.5 px-2 text-right font-bold ${volColor(pt.midIV)}`}>
                            {pt.midIV.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-right text-muted-foreground">
                            {skew !== null ? (skew >= 0 ? '+' : '') + skew.toFixed(2) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!surface && !isBuildingSurface && (
        <div className="text-center text-sm text-muted-foreground py-8">
          Scannez un ticker avec un strike, ou construisez la nappe complète.
        </div>
      )}
    </div>
  );
}
