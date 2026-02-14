import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OptionsRow } from '@/lib/options-api';
import {
  buildTermStructure,
  interpolateVol,
  cleanVolData,
  type VolSurface,
} from '@/lib/vol-surface';
import { Search } from 'lucide-react';

interface VolSurfacePanelProps {
  data: OptionsRow[];
  strike: number | null;
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

export function VolSurfacePanel({ data, strike }: VolSurfacePanelProps) {
  const [queryStrike, setQueryStrike] = useState('');
  const [queryDays, setQueryDays] = useState('');
  const [interpolatedVol, setInterpolatedVol] = useState<number | null>(null);
  const [queryError, setQueryError] = useState('');

  // Build term structure from current data
  const surface: VolSurface | null = useMemo(() => {
    if (!data.length || strike === null) return null;
    return buildTermStructure(data, strike);
  }, [data, strike]);

  // Cleaned points for display
  const cleanedPoints = useMemo(() => {
    if (!data.length || strike === null) return [];
    return cleanVolData(data, strike);
  }, [data, strike]);

  const handleInterpolate = () => {
    setQueryError('');
    setInterpolatedVol(null);

    if (!surface) {
      setQueryError('Pas de surface disponible');
      return;
    }

    const s = parseFloat(queryStrike);
    const d = parseFloat(queryDays);

    if (isNaN(s) || isNaN(d) || d <= 0) {
      setQueryError('Strike et jours doivent être des nombres valides');
      return;
    }

    const vol = interpolateVol(surface, s, d);
    if (vol === null) {
      setQueryError('Interpolation impossible avec les données disponibles');
    } else {
      setInterpolatedVol(vol);
    }
  };

  if (!data.length || strike === null) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Scannez un ticker avec un strike pour construire la nappe de vol.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 overflow-auto">
      {/* Interpolation query */}
      <Card className="border-border bg-card">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-primary" />
            Interpoler la volatilité
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
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
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                Jours à l'échéance
              </label>
              <Input
                type="number"
                step="1"
                value={queryDays}
                onChange={(e) => setQueryDays(e.target.value)}
                placeholder="30"
                className="h-8 text-xs font-mono bg-secondary border-border"
              />
            </div>
            <Button
              size="sm"
              onClick={handleInterpolate}
              className="h-8 text-xs gap-1"
            >
              Interpoler
            </Button>
          </div>
          {interpolatedVol !== null && (
            <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20">
              <span className="text-[10px] text-muted-foreground font-mono">Vol interpolée:</span>
              <span className={`ml-2 text-lg font-mono font-bold ${volColor(interpolatedVol)}`}>
                {interpolatedVol.toFixed(2)}%
              </span>
            </div>
          )}
          {queryError && (
            <p className="mt-2 text-[10px] text-destructive font-mono">{queryError}</p>
          )}
        </CardContent>
      </Card>

      {/* Term structure display */}
      <Card className="border-border bg-card">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            Nappe de volatilité
            <Badge variant="outline" className="text-[10px] font-mono">
              Strike {strike}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              {cleanedPoints.length} points valides
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {cleanedPoints.length === 0 ? (
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
                  {cleanedPoints.map((pt, i) => {
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
    </div>
  );
}
