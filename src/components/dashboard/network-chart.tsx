"use client";

import { useEffect, useRef } from "react";

export interface Context {
  name: string;
  value: number;
  active: boolean;
  parent?: string;
}

const CAT_POSITIONS = [
  { x: 0.50, y: 0.40 },
  { x: 0.75, y: 0.22 },
  { x: 0.80, y: 0.62 },
  { x: 0.58, y: 0.80 },
  { x: 0.30, y: 0.72 },
  { x: 0.15, y: 0.50 },
  { x: 0.27, y: 0.22 },
];

const CAT_EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 2], [1, 3], [1, 4], [1, 6],
  [2, 4], [2, 5],
  [3, 4],
  [4, 5], [4, 6],
  [5, 6],
];

const ACCENT: [number, number, number] = [99, 56, 254];
const MUTED:  [number, number, number] = [113, 113, 122];

function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

type SimNode = {
  name: string;
  active: boolean;
  r: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  rgb: [number, number, number];
  speed: number;
  amp: number;
  phase: number;
  phaseY: number;
  fixed: boolean;
  parentIdx: number;
  bornAt: number; // wall-clock ms (performance.now)
};

function packNodes(nodes: SimNode[], W: number, H: number, iterations = 150) {
  const catCount = nodes.filter((n) => n.fixed).length;
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i], nj = nodes[j];
        const dx = nj.baseX - ni.baseX;
        const dy = nj.baseY - ni.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const minDist = ni.r + nj.r + 1;
        if (dist < minDist) {
          const overlap = (minDist - dist) / dist * 0.5;
          const fx = dx * overlap, fy = dy * overlap;
          if (!ni.fixed) { ni.baseX -= fx; ni.baseY -= fy; }
          if (!nj.fixed) { nj.baseX += fx; nj.baseY += fy; }
        }
      }
    }
    for (let i = catCount; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.parentIdx < 0) continue;
      const p = nodes[n.parentIdx];
      const dx = p.baseX - n.baseX;
      const dy = p.baseY - n.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const target = p.r + n.r + 1;
      if (dist > target) {
        const pull = (dist - target) / dist * 0.25;
        n.baseX += dx * pull;
        n.baseY += dy * pull;
      }
      n.baseX = Math.max(n.r + 4, Math.min(W - n.r - 4, n.baseX));
      n.baseY = Math.max(n.r + 4, Math.min(H - n.r - 4, n.baseY));
    }
  }
}

export function NetworkChart({ contexts }: { contexts: Context[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Cast: we guard immediately below; closures need the non-null type
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const dpr  = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    const W = cssW, H = cssH;
    const maxValue = Math.max(...contexts.map((c) => c.value));

    const catContexts  = contexts.filter((c) => !c.parent);
    const unitContexts = contexts.filter((c) =>  c.parent);
    const hasUnits     = unitContexts.length > 0;

    const catNodes: SimNode[] = catContexts.map((c, i) => {
      const pos = CAT_POSITIONS[i] ?? { x: 0.5, y: 0.5 };
      return {
        name: c.name, active: c.active,
        r:    16 + (c.value / maxValue) * 22,
        baseX: pos.x * W, baseY: pos.y * H,
        x: pos.x * W,    y: pos.y * H,
        rgb: c.active ? ACCENT : MUTED,
        speed:  0.35 + seededRand(i * 3)     * 0.3,
        amp:    4    + seededRand(i * 3 + 1) * 5,
        phase:  seededRand(i * 3 + 2)        * Math.PI * 2,
        phaseY: seededRand(i * 7)            * Math.PI * 2,
        fixed: true, parentIdx: -1, bornAt: 0,
      };
    });

    const catIndexMap = Object.fromEntries(catContexts.map((c, i) => [c.name, i]));
    const unitEdgeList: [number, number][] = [];

    const unitNodes: SimNode[] = unitContexts.map((c, ui) => {
      const parentIdx = catIndexMap[c.parent ?? ""] ?? 0;
      const parent    = catNodes[parentIdx];
      const seed      = catNodes.length + ui;
      const angle     = seededRand(seed * 13) * Math.PI * 2;
      const dist      = parent.r + 8 + seededRand(seed * 7) * 6;
      const globalIdx = catNodes.length + ui;
      unitEdgeList.push([globalIdx, parentIdx]);
      return {
        name: c.name, active: c.active,
        r:    40 + (c.active ? 3 : 0),
        baseX: parent.baseX + Math.cos(angle) * dist,
        baseY: parent.baseY + Math.sin(angle) * dist,
        x: 0, y: 0,
        rgb: c.active ? ACCENT : MUTED,
        speed:  0.28 + seededRand(seed * 5)     * 0.25,
        amp:    2    + seededRand(seed * 5 + 1) * 2.5,
        phase:  seededRand(seed * 5 + 2)        * Math.PI * 2,
        phaseY: seededRand(seed * 11)           * Math.PI * 2,
        fixed: false, parentIdx, bornAt: 0,
      };
    });

    const nodes: SimNode[] = [...catNodes, ...unitNodes];
    const edges: [number, number][] = [...CAT_EDGES, ...unitEdgeList];

    if (hasUnits) packNodes(nodes, W, H, 250);
    nodes.forEach((n) => { n.x = n.baseX; n.y = n.baseY; });

    const effectStart = performance.now();
    // Cat nodes: fully visible immediately; unit nodes: fade in
    nodes.forEach((n) => { n.bornAt = n.fixed ? effectStart - 99999 : effectStart; });

    const SCALE_MS = 400;

    // Ease-out cubic: slow finish gives spring-like pop
    function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

    function draw(now: number) {
      ctx.clearRect(0, 0, W, H);
      const t = (now - effectStart) / 1000;

      nodes.forEach((n) => {
        n.x = n.baseX + Math.sin(t * n.speed + n.phase)         * n.amp;
        n.y = n.baseY + Math.cos(t * n.speed * 0.65 + n.phaseY) * n.amp * 0.7;
      });

      edges.forEach(([ai, bi]) => {
        if (ai >= nodes.length || bi >= nodes.length) return;
        const a = nodes[ai], b = nodes[bi];
        if (!Number.isFinite(a.x) || !Number.isFinite(b.x)) return;
        const scaleA = easeOut(Math.min(1, (now - a.bornAt) / SCALE_MS));
        const scaleB = easeOut(Math.min(1, (now - b.bornAt) / SCALE_MS));
        const edgeScale = Math.min(scaleA, scaleB);
        if (edgeScale <= 0) return;
        const aA = (a.active ? 0.45 : 0.09) * edgeScale;
        const bA = (b.active ? 0.45 : 0.09) * edgeScale;
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `rgba(${a.rgb.join(",")},${aA})`);
        grad.addColorStop(1, `rgba(${b.rgb.join(",")},${bA})`);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = a.active && b.active ? 1.4 : a.active || b.active ? 0.9 : 0.5;
        ctx.stroke();
      });

      nodes.forEach((n) => {
        if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) return;
        const scale = easeOut(Math.min(1, (now - n.bornAt) / SCALE_MS));
        if (scale <= 0) return;
        const [r, g, b] = n.rgb;
        const drawR = n.r * scale; // scale radius 0 → full

        ctx.beginPath();
        ctx.arc(n.x, n.y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${n.active ? 0.18 : 0.06})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, drawR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${n.active ? 0.85 : 0.25})`;
        ctx.lineWidth = n.active ? 1.5 : 1;
        ctx.stroke();

        // Draw label clipped to circle, auto-sized to fit
        if (scale > 0.5) {
          const labelAlpha = (scale - 0.5) / 0.5;
          const maxW = drawR * 1.7; // usable diameter (slightly less than full)
          let fs = Math.max(7, drawR * 0.38);
          const weight = n.active ? 600 : 400;
          ctx.font = `${weight} ${fs}px -apple-system,BlinkMacSystemFont,sans-serif`;
          const measured = ctx.measureText(n.name).width;
          if (measured > maxW) fs = fs * (maxW / measured);
          fs = Math.max(6, fs);
          ctx.save();
          ctx.beginPath();
          ctx.arc(n.x, n.y, drawR - 1, 0, Math.PI * 2);
          ctx.clip();
          ctx.font = `${weight} ${fs}px -apple-system,BlinkMacSystemFont,sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = `rgba(${r},${g},${b},${(n.active ? 0.9 : 0.4) * labelAlpha})`;
          ctx.fillText(n.name, n.x, n.y);
          ctx.restore();
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [contexts]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: 420 }}
    />
  );
}
