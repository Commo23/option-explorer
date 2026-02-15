import { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { VolSurface, VolType } from '@/lib/vol-surface';

interface VolSurface3DProps {
  surface: VolSurface;
  volType: VolType;
}

function volToColor(vol: number): string {
  if (vol < 15) return '#059669';
  if (vol < 25) return '#10b981';
  if (vol < 35) return '#eab308';
  if (vol < 50) return '#f97316';
  return '#ef4444';
}

interface HeatPoint {
  strike: number;
  days: number;
  vol: number;
  expLabel: string;
}

export function VolSurface3D({ surface, volType }: VolSurface3DProps) {
  const [viewMode, setViewMode] = useState<'heatmap' | 'smile'>('heatmap');
  const [selectedMatIdx, setSelectedMatIdx] = useState<number>(0);

  const grid = volType === 'call' ? surface.gridCall
    : volType === 'put' ? surface.gridPut
    : surface.gridMid;

  // Heatmap scatter data
  const heatData = useMemo(() => {
    const pts: HeatPoint[] = [];
    for (let si = 0; si < surface.strikes.length; si++) {
      for (let mi = 0; mi < surface.maturities.length; mi++) {
        const v = grid[si]?.[mi];
        if (v !== null && v !== undefined) {
          pts.push({
            strike: surface.strikes[si],
            days: surface.maturities[mi],
            vol: v,
            expLabel: surface.maturityLabels[mi] || `${surface.maturities[mi]}j`,
          });
        }
      }
    }
    return pts;
  }, [surface, grid]);

  // Smile data for selected maturity
  const smileData = useMemo(() => {
    return surface.strikes.map((s, si) => {
      const v = grid[si]?.[selectedMatIdx];
      return { strike: s, vol: v ?? 0, hasData: v !== null && v !== undefined };
    }).filter(d => d.hasData);
  }, [surface, grid, selectedMatIdx]);

  if (surface.strikes.length < 2 || surface.maturities.length < 2) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Pas assez de données pour le graphique (min 2 strikes × 2 maturités).
      </div>
    );
  }

  const volRange = heatData.length > 0
    ? [Math.min(...heatData.map(d => d.vol)), Math.max(...heatData.map(d => d.vol))]
    : [0, 100];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'heatmap' | 'smile')}>
          <SelectTrigger className="h-7 w-32 text-[10px] font-mono bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="heatmap" className="text-xs font-mono">Heatmap</SelectItem>
            <SelectItem value="smile" className="text-xs font-mono">Smile</SelectItem>
          </SelectContent>
        </Select>
        {viewMode === 'smile' && (
          <Select value={selectedMatIdx.toString()} onValueChange={(v) => setSelectedMatIdx(parseInt(v))}>
            <SelectTrigger className="h-7 w-40 text-[10px] font-mono bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {surface.maturityLabels.map((label, i) => (
                <SelectItem key={i} value={i.toString()} className="text-xs font-mono">
                  {label} ({surface.maturities[i]}j)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {viewMode === 'heatmap' ? (
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
            <XAxis
              type="number"
              dataKey="days"
              name="Jours"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }}
              label={{ value: 'Jours à l\'échéance', position: 'bottom', offset: 15, style: { fontSize: 10, fill: '#94a3b8' } }}
            />
            <YAxis
              type="number"
              dataKey="strike"
              name="Strike"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }}
              label={{ value: 'Strike', angle: -90, position: 'insideLeft', offset: -35, style: { fontSize: 10, fill: '#94a3b8' } }}
            />
            <ZAxis type="number" dataKey="vol" range={[40, 400]} name="Vol" />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload as HeatPoint;
                return (
                  <div className="bg-card border border-border rounded p-2 text-xs font-mono shadow-lg">
                    <p className="text-foreground font-semibold">Vol: <span style={{ color: volToColor(d.vol) }}>{d.vol.toFixed(2)}%</span></p>
                    <p className="text-muted-foreground">Strike: {d.strike}</p>
                    <p className="text-muted-foreground">{d.expLabel} ({d.days}j)</p>
                  </div>
                );
              }}
            />
            <Scatter data={heatData}>
              {heatData.map((entry, i) => (
                <Cell key={i} fill={volToColor(entry.vol)} fillOpacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
            <XAxis
              type="number"
              dataKey="strike"
              name="Strike"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }}
              label={{ value: 'Strike', position: 'bottom', offset: 15, style: { fontSize: 10, fill: '#94a3b8' } }}
            />
            <YAxis
              type="number"
              dataKey="vol"
              name="Vol"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }}
              label={{ value: `Vol ${volType.toUpperCase()} (%)`, angle: -90, position: 'insideLeft', offset: -35, style: { fontSize: 10, fill: '#94a3b8' } }}
              domain={[volRange[0] * 0.9, volRange[1] * 1.1]}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload as { strike: number; vol: number };
                return (
                  <div className="bg-card border border-border rounded p-2 text-xs font-mono shadow-lg">
                    <p className="text-foreground font-semibold">Vol: <span style={{ color: volToColor(d.vol) }}>{d.vol.toFixed(2)}%</span></p>
                    <p className="text-muted-foreground">Strike: {d.strike}</p>
                  </div>
                );
              }}
            />
            <Scatter data={smileData} line={{ stroke: 'hsl(142 60% 45%)', strokeWidth: 2 }} lineType="fitting">
              {smileData.map((entry, i) => (
                <Cell key={i} fill={volToColor(entry.vol)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )}

      {/* Color legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#059669' }} /> &lt;15%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} /> 15-25%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }} /> 25-35%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }} /> 35-50%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} /> &gt;50%</span>
      </div>
    </div>
  );
}
