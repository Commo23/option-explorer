import { useMemo, useEffect, useRef } from 'react';
import type { VolSurface, VolType } from '@/lib/vol-surface';

declare global {
  interface Window {
    Plotly: any;
  }
}

interface VolSurface3DProps {
  surface: VolSurface;
  volType: VolType;
}

export function VolSurface3D({ surface, volType }: VolSurface3DProps) {
  const divRef = useRef<HTMLDivElement>(null);

  const grid = volType === 'call' ? surface.gridCall
    : volType === 'put' ? surface.gridPut
    : surface.gridMid;

  const plotData = useMemo(() => {
    const z = grid.map(row => row.map(v => v ?? undefined));
    return [{
      type: 'surface',
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
      hovertemplate: 'Strike: %{y}<br>Jours: %{x}<br>Vol: %{z:.2f}%<extra></extra>',
    }];
  }, [surface, grid]);

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
      camera: { eye: { x: 1.8, y: -1.8, z: 1.2 } },
    },
  }), [volType]);

  useEffect(() => {
    if (!divRef.current || !window.Plotly) return;
    window.Plotly.react(divRef.current, plotData, layout, {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
    });
  }, [plotData, layout]);

  if (surface.strikes.length < 2 || surface.maturities.length < 2) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Pas assez de données pour le graphique 3D (min 2 strikes × 2 maturités).
      </div>
    );
  }

  if (typeof window !== 'undefined' && !window.Plotly) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground font-mono">Chargement de Plotly...</span>
      </div>
    );
  }

  return <div ref={divRef} className="w-full" />;
}
