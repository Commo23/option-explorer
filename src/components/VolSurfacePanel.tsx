import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { interpolateGrid } from '@/lib/vol-interpolate';
import { VolSurface3D } from '@/components/VolSurface3D';
import { Search, Layers, Loader2, TrendingUp, BarChart3 } from 'lucide-react';

interface VolSurfacePanelProps {
  data: OptionsRow[];
  strike: number | null;
  surfaceData: Map<number, OptionsRow[]>;
  availableStrikes: number[];
  onBuildSurface: (selectedStrikes: number[]) => void;
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
  const [chartVolType, setChartVolType] = useState<VolType>('mid');
  const [interpolateMissing, setInterpolateMissing] = useState(false);

  // Strike range selection
  const [strikeMin, setStrikeMin] = useState<string>('all-min');
  const [strikeMax, setStrikeMax] = useState<string>('all-max');

  const selectedStrikes = useMemo(() => {
    const min = (strikeMin && strikeMin !== 'all-min') ? parseFloat(strikeMin) : -Infinity;
    const max = (strikeMax && strikeMax !== 'all-max') ? parseFloat(strikeMax) : Infinity;
    return availableStrikes.filter(s => s >= min && s <= max);
  }, [availableStrikes, strikeMin, strikeMax]);

  const surface: VolSurface | null = useMemo(() => {
    let raw: VolSurface | null = null;
    if (surfaceData.size > 1) {
      raw = buildVolSurface(surfaceData);
    } else if (data.length > 0 && strike !== null) {
      raw = buildTermStructure(data, strike);
    }
    if (!raw) return null;
    if (!interpolateMissing) return raw;

    return {
      ...raw,
      gridCall: interpolateGrid(raw.gridCall, raw.strikes, raw.maturities),
      gridPut: interpolateGrid(raw.gridPut, raw.strikes, raw.maturities),
      gridMid: interpolateGrid(raw.gridMid, raw.strikes, raw.maturities),
    };
  }, [data, strike, surfaceData, interpolateMissing]);

  const hasFullSurface = surfaceData.size > 1;

  const handleInterpolate = () => {
    setQueryError('');
    setInterpolatedVol(null);

    if (!surface) {
      setQueryError('Pas de surface disponible. Construisez la nappe d\'abord.');
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
      setQueryError('Interpolation impossible — pas assez de données autour de ce point');
    } else {
      setInterpolatedVol(vol);
    }
  };

  // Find nearest points for context
  const interpolationContext = useMemo(() => {
    if (!surface || interpolatedVol === null) return null;
    const s = parseFloat(queryStrike);
    const days = dateStringToDays(queryDate);
    if (isNaN(s) || days === null) return null;

    const nearStrikes = surface.strikes
      .map(st => ({ strike: st, dist: Math.abs(st - s) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2);

    const nearMats = surface.maturities
      .map(m => ({ days: m, dist: Math.abs(m - days) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2);

    return { nearStrikes, nearMats, queryDays: days };
  }, [surface, interpolatedVol, queryStrike, queryDate]);

  return (
    <div className="p-3 space-y-4 overflow-auto">
      {/* CTA: Build full surface */}
      <Card className="border-primary/30 bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Construire la nappe de volatilité
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Sélectionnez l'intervalle de strikes à scraper, puis lancez la construction.
                Les données sont mises en cache pour éviter les scrapes redondants.
              </p>
              {hasFullSurface && surface && (
                <p className="text-[10px] text-primary mt-1 font-mono">
                  ✓ Surface construite: {surface.strikes.length} strikes × {surface.maturities.length} maturités = {surface.points.length} points
                </p>
              )}
            </div>
          </div>

          {/* Strike range selectors */}
          {availableStrikes.length > 0 && (
            <div className="flex items-end gap-2 flex-wrap">
              <div className="w-36">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  Strike min
                </label>
                <Select value={strikeMin} onValueChange={setStrikeMin}>
                  <SelectTrigger className="h-8 text-xs font-mono bg-secondary border-border">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all-min" className="text-xs font-mono">— Tous (min)</SelectItem>
                    {availableStrikes.map((s) => (
                      <SelectItem key={s} value={s.toString()} className="text-xs font-mono">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  Strike max
                </label>
                <Select value={strikeMax} onValueChange={setStrikeMax}>
                  <SelectTrigger className="h-8 text-xs font-mono bg-secondary border-border">
                    <SelectValue placeholder="Max" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all-max" className="text-xs font-mono">— Tous (max)</SelectItem>
                    {availableStrikes.map((s) => (
                      <SelectItem key={s} value={s.toString()} className="text-xs font-mono">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono h-8 flex items-center">
                {selectedStrikes.length} / {availableStrikes.length} strikes
              </Badge>
              <Button
                onClick={() => onBuildSurface(selectedStrikes)}
                disabled={isBuildingSurface || selectedStrikes.length === 0}
                className="gap-2 shrink-0 h-8"
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
          )}
        </CardContent>
      </Card>

      {/* 3D Surface Chart */}
      {hasFullSurface && surface && surface.strikes.length >= 2 && (
        <Card className="border-border bg-card">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                Surface 3D
                <Badge variant="outline" className="text-[10px] font-mono">
                  {surface.strikes.length} × {surface.maturities.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox
                    checked={interpolateMissing}
                    onCheckedChange={(v) => setInterpolateMissing(!!v)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">Interpoler</span>
                </label>
                <Select value={chartVolType} onValueChange={(v) => setChartVolType(v as VolType)}>
                  <SelectTrigger className="h-7 w-20 text-[10px] font-mono bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call" className="text-xs font-mono">Call</SelectItem>
                    <SelectItem value="put" className="text-xs font-mono">Put</SelectItem>
                    <SelectItem value="mid" className="text-xs font-mono">Mid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <VolSurface3D surface={surface} volType={chartVolType} />
          </CardContent>
        </Card>
      )}

      {/* Interpolation query */}
      <Card className="border-border bg-card">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-primary" />
            Interpoler la volatilité
            {surface && (
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                {surface.points.length} points de données
              </Badge>
            )}
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
              <TrendingUp className="h-3 w-3" />
              Interpoler
            </Button>
          </div>

          {/* Result card */}
          {interpolatedVol !== null && (
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  Vol {queryType.toUpperCase()} interpolée
                </span>
                <span className={`text-2xl font-mono font-bold ${volColor(interpolatedVol)}`}>
                  {interpolatedVol.toFixed(2)}%
                </span>
              </div>
              {interpolationContext && (
                <div className="text-[10px] text-muted-foreground font-mono space-y-0.5 border-t border-border/50 pt-2">
                  <p>
                    Strike demandé: <span className="text-foreground">{queryStrike}</span> — Bornes: [{interpolationContext.nearStrikes.map(s => s.strike).join(', ')}]
                  </p>
                  <p>
                    Maturité: <span className="text-foreground">{interpolationContext.queryDays}j</span> — Bornes: [{interpolationContext.nearMats.map(m => m.days + 'j').join(', ')}]
                  </p>
                  <p className="text-primary/70">
                    Méthode: interpolation bilinéaire sur la grille {surface?.strikes.length}×{surface?.maturities.length}
                  </p>
                </div>
              )}
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
