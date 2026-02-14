import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { VolSurface, VolType } from '@/lib/vol-surface';

interface VolSurface3DProps {
  surface: VolSurface;
  volType: VolType;
}

export function VolSurface3D({ surface, volType }: VolSurface3DProps) {
  const plotData = useMemo(() => {
    const grid = volType === 'call' ? surface.gridCall
      : volType === 'put' ? surface.gridPut
      : surface.gridMid;

    // z[strikeIdx][maturityIdx] → need to transpose for plotly (z[y][x])
    // x = maturities (days), y = strikes, z = vol values
    const z = grid.map(row =>
      row.map(v => v ?? undefined)
    );

    return [{
      type: 'surface' as const,
      x: surface.maturities,
      y: surface.strikes,
      z,
      colorscale: [
        [0, '#059669'],
        [0.25, '#10b981'],
        [0.5, '#eab308'],
        [0.75, '#f97316'],
        [1, '#ef4444'],
      ],
      contours: {
        z: { show: true, usecolormap: true, highlightcolor: '#fff', project: { z: false } },
      },
      hovertemplate:
        'Strike: %{y}<br>Jours: %{x}<br>Vol: %{z:.2f}%<extra></extra>',
    }];
  }, [surface, volType]);

  const layout = useMemo(() => ({
    autosize: true,
    height: 450,
    margin: { l: 10, r: 10, t: 30, b: 10 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'monospace', size: 10, color: '#94a3b8' },
    scene: {
      xaxis: {
        title: { text: 'Jours à l\'échéance', font: { size: 10 } },
        gridcolor: '#334155',
        zerolinecolor: '#334155',
        backgroundcolor: 'rgba(0,0,0,0)',
      },
      yaxis: {
        title: { text: 'Strike', font: { size: 10 } },
        gridcolor: '#334155',
        zerolinecolor: '#334155',
        backgroundcolor: 'rgba(0,0,0,0)',
      },
      zaxis: {
        title: { text: `Vol ${volType.toUpperCase()} (%)`, font: { size: 10 } },
        gridcolor: '#334155',
        zerolinecolor: '#334155',
        backgroundcolor: 'rgba(0,0,0,0)',
      },
      bgcolor: 'rgba(15,23,42,0.8)',
      camera: {
        eye: { x: 1.8, y: -1.8, z: 1.2 },
      },
    },
  }), [volType]);

  if (surface.strikes.length < 2 || surface.maturities.length < 2) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Pas assez de données pour le graphique 3D (min 2 strikes × 2 maturités).
      </div>
    );
  }

  return (
    <Plot
      data={plotData as any}
      layout={layout as any}
      config={{ responsive: true, displayModeBar: true, displaylogo: false }}
      className="w-full"
    />
  );
}
