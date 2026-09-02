'use client';

import React from 'react';
import { useLanguage } from '../../lib/language-context';

interface PricePoint {
  date: string;
  modalPrice: number;
  arrivalQuantity?: number;
}

interface PriceChartProps {
  data: PricePoint[];
  cropName: string;
}

export function PriceChart({ data, cropName }: PriceChartProps) {
  const { t, tCrop } = useLanguage();
  const localizedCrop = tCrop(cropName) || cropName;

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 text-xs text-amber-600">
        {t.noPriceHistory} {localizedCrop}
      </div>
    );
  }

  const prices = data.map((d) => d.modalPrice);
  const minPrice = Math.min(...prices) * 0.96;
  const maxPrice = Math.max(...prices) * 1.04;
  const range = maxPrice - minPrice || 1;

  const width = 600;
  const height = 180;
  const padding = 30;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((d.modalPrice - minPrice) / range) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full bg-white p-4 md:p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {t.mandiPriceTrendTitle} ({localizedCrop})
        </span>
        <span className="text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
          {t.latestPriceLabel}: ₹{data[data.length - 1]?.modalPrice?.toLocaleString('en-IN')}/{t.commonQuintal}
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
          <defs>
            <linearGradient id="goldenPriceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#fde68a"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#fef3c7"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Fill Area */}
          <path d={areaD} fill="url(#goldenPriceGradient)" />

          {/* Stroke Line */}
          <path d={pathD} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
              <text
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="9"
                fill="#92400e"
                fontWeight="bold"
              >
                {new Date(p.date).toLocaleDateString('en-IN', { weekday: 'narrow', day: 'numeric' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
