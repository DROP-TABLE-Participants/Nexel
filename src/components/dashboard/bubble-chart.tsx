"use client";

import { useEffect, useRef, useState } from "react";

interface Context {
  name: string;
  value: number;
  color: string;
  active?: boolean;
}

interface PlacedCircle extends Context {
  x: number;
  y: number;
  r: number;
}

const SIZE = 280;
const GAP = 4;

function packCircles(data: Context[]): PlacedCircle[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, d) => s + d.value, 0);

  // Area-proportional radii, scaled to fit the container
  const circles: PlacedCircle[] = sorted.map((d) => ({
    ...d,
    r: Math.sqrt(d.value / total) * SIZE * 0.28,
    x: 0,
    y: 0,
  }));

  // Place first at origin
  circles[0].x = 0;
  circles[0].y = 0;

  for (let i = 1; i < circles.length; i++) {
    const c = circles[i];
    let placed = false;

    for (let j = 0; j < i && !placed; j++) {
      const ref = circles[j];
      const targetDist = ref.r + c.r + GAP;

      for (let angleDeg = 0; angleDeg < 360; angleDeg += 5) {
        const rad = (angleDeg * Math.PI) / 180;
        const cx = ref.x + targetDist * Math.cos(rad);
        const cy = ref.y + targetDist * Math.sin(rad);

        let overlaps = false;
        for (let k = 0; k < i; k++) {
          if (Math.hypot(cx - circles[k].x, cy - circles[k].y) < circles[k].r + c.r + GAP - 1) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          c.x = cx;
          c.y = cy;
          placed = true;
          break;
        }
      }
    }
  }

  // Center the pack in the viewBox
  const xs = circles.map((c) => c.x);
  const ys = circles.map((c) => c.y);
  const minX = Math.min(...circles.map((c) => c.x - c.r));
  const maxX = Math.max(...circles.map((c) => c.x + c.r));
  const minY = Math.min(...circles.map((c) => c.y - c.r));
  const maxY = Math.max(...circles.map((c) => c.y + c.r));
  const packW = maxX - minX;
  const packH = maxY - minY;
  const offsetX = (SIZE - packW) / 2 - minX;
  const offsetY = (SIZE - packH) / 2 - minY;

  return circles.map((c) => ({ ...c, x: c.x + offsetX, y: c.y + offsetY }));
}

interface BubbleChartProps {
  contexts: Context[];
}

export function BubbleChart({ contexts }: BubbleChartProps) {
  const circles = packCircles(contexts);
  const [hovered, setHovered] = useState<string | null>(null);
  const total = contexts.reduce((s, c) => s + c.value, 0);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto" style={{ maxHeight: 260 }}>
        {circles.map((c) => {
          const isHovered = hovered === c.name;
          const pct = Math.round((c.value / total) * 100);
          const showLabel = c.r > 28;
          return (
            <g
              key={c.name}
              onMouseEnter={() => setHovered(c.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              <circle
                cx={c.x}
                cy={c.y}
                r={c.r}
                fill={c.active === false ? "#18181b" : c.color}
                fillOpacity={c.active === false ? 0.05 : isHovered ? 0.4 : 0.3}
                stroke={c.active === false ? "#18181b" : c.color}
                strokeOpacity={c.active === false ? 0.15 : 0.6}
                strokeWidth={1.5}
                style={{ transition: "all 0.2s ease" }}
              />
              {showLabel && c.active !== false && (
                <>
                  <text
                    x={c.x}
                    y={c.y - 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={c.r > 45 ? 11 : 9}
                    fontWeight="500"
                    fill={c.color}
                    style={{ userSelect: "none" }}
                  >
                    {c.name}
                  </text>
                  <text
                    x={c.x}
                    y={c.y + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={c.r > 45 ? 13 : 10}
                    fontWeight="700"
                    fill={c.color}
                    style={{ userSelect: "none" }}
                  >
                    {pct}%
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend — only active */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
        {circles.filter((c) => c.active !== false).map((c) => (
          <div key={c.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-xs text-[var(--muted-foreground)]">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
