"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TelemetryChartProps {
  data?: { label: string; value: number }[];
  className?: string;
}

export function TelemetryChart({
  data = [
    { label: "Mon", value: 34 },
    { label: "Tue", value: 52 },
    { label: "Wed", value: 45 },
    { label: "Thu", value: 78 },
    { label: "Fri", value: 65 },
    { label: "Sat", value: 89 },
    { label: "Sun", value: 94 },
  ],
  className,
}: TelemetryChartProps) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 100);
  const height = 140;
  const width = 480;
  const padding = 24;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
    const y = height - padding - (d.value / maxValue) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className={cn("relative w-full overflow-hidden select-none", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y = height - padding - pct * (height - 2 * padding);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              className="text-slate-100 dark:text-white/[0.04]"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Filled gradient area */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Glowing stroke line */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="filter drop-shadow-[0_2px_8px_rgba(225,29,72,0.5)]"
        />

        {/* Interactive Data points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 6 : 4}
              className={cn(
                "fill-white dark:fill-[#0c0d12] stroke-red-600 dark:stroke-rose-400 stroke-2 transition-all cursor-pointer",
                hoveredIdx === idx && "stroke-[3px] filter drop-shadow-[0_0_8px_rgba(225,29,72,0.9)]"
              )}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {/* Label */}
            <text
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              className="font-mono text-[10px] fill-slate-400 dark:fill-slate-500"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover Tooltip */}
      {hoveredIdx !== null && (
        <div
          className="absolute -top-2 rounded-lg bg-slate-900 text-white px-2.5 py-1 text-[10px] font-medium shadow-xl pointer-events-none -translate-x-1/2 border border-white/20 animate-fade-in"
          style={{ left: `${(points[hoveredIdx].x / width) * 100}%` }}
        >
          {data[hoveredIdx].label}: {data[hoveredIdx].value} actions
        </div>
      )}
    </div>
  );
}

export function RadialGauge({
  percentage,
  label,
  sublabel,
  size = 120,
}: {
  percentage: number;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-white/[0.06] fill-none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#radialCrimson)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="radialCrimson" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            {percentage}%
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
        {label}
      </p>
      {sublabel && (
        <p className="text-[10px] text-slate-400 font-mono text-center">{sublabel}</p>
      )}
    </div>
  );
}

