"use client";
import { useRef, useEffect, useState } from "react";
import type { Worldview, PayoffCell } from "@/lib/wager";
import { computeEU, erCompare } from "@/lib/wager";

interface Props {
  worldviews: Worldview[];
  probs: number[];
  matrix: PayoffCell[][];
}

const COLORS = ["#00f0ff", "#ff003c", "#fcee09", "#39ff14", "#ff6b35", "#7b68ee"];

export function SimplexViz({ worldviews, probs, matrix }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(440);
  const n = worldviews.length;
  const visible = n === 2 || n === 3;

  // Track the available width so the canvas backing store matches its rendered
  // size (no stretch blur), and redraw on resize.
  useEffect(() => {
    if (!visible) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(220, Math.min(el.clientWidth, 480)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const cssW = width;
    const cssH = n === 2 ? 76 : Math.round(width * 0.78);

    // Backing store at device resolution, drawn in CSS pixels: sharp on retina.
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    if (n === 2) {
      drawLine(ctx, cssW, cssH, worldviews, matrix, probs);
    } else if (n === 3) {
      drawTriangle(ctx, cssW, cssH, worldviews, matrix, probs);
    }
  }, [visible, worldviews, matrix, probs, n, width]);

  if (!visible) return null;

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="text-xs font-mono text-cp-text-dim">
        {n === 2
          ? `Probability line: each end represents 100% credence in one worldview (left = ${worldviews[0]?.name ?? "A"}, right = ${worldviews[1]?.name ?? "B"}); points between are mixes that sum to 100%. Each segment is colored by which action maximizes expected utility at that credence. The white mark is your current credence.`
          : `Probability simplex: each corner represents 100% credence in one worldview (top = ${worldviews[0]?.name ?? "A"}, bottom-left = ${worldviews[1]?.name ?? "B"}, bottom-right = ${worldviews[2]?.name ?? "C"}); every interior point is a mix of credences summing to 100%. Each region is shaded by which action maximizes expected utility for credences in that region. The white dot is your current credence.`
        }
      </div>
      <canvas
        ref={canvasRef}
        className="border border-cp-cyan/10"
        aria-label={`${n === 2 ? "Probability line" : "Probability simplex"} visualization`}
      />
      <div className="flex flex-wrap gap-3 text-[0.6875rem]">
        {worldviews.map((wv, i) => (
          <span key={wv.id} className="flex items-center gap-1" style={{ color: COLORS[i % COLORS.length] }}>
            <span
              className="inline-block w-2 h-2"
              style={{ background: COLORS[i % COLORS.length] }}
              aria-hidden="true"
            />
            {wv.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function getOptimalAction(p: number[], matrix: PayoffCell[][]): number {
  const n = matrix.length;
  let bestIdx = 0;
  let bestEU = computeEU(0, p, matrix);

  for (let a = 1; a < n; a++) {
    const eu = computeEU(a, p, matrix);
    const cmp = erCompare(eu, bestEU);
    if (cmp !== null && cmp > 0) {
      bestEU = eu;
      bestIdx = a;
    }
  }
  return bestIdx;
}

function drawLine(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  worldviews: Worldview[], matrix: PayoffCell[][], probs: number[]
) {
  const steps = Math.min(Math.round(w), 240);
  const barH = 34;
  const y0 = 10;

  for (let i = 0; i < steps; i++) {
    // The left edge is 100 percent credence in worldviews[0] and the right edge
    // is 100 percent in worldviews[1], matching the end labels below and the
    // caption. p0 is the credence in worldviews[0] at this x.
    const p0 = 1 - i / (steps - 1);
    const p = [p0, 1 - p0];
    const opt = getOptimalAction(p, matrix);
    ctx.fillStyle = COLORS[opt % COLORS.length] + "90";
    ctx.fillRect((i / steps) * w, y0, w / steps + 1, barH);
  }

  ctx.strokeStyle = "rgba(0,240,255,0.25)";
  ctx.strokeRect(0.5, y0 + 0.5, w - 1, barH);

  // Place the marker so that high worldviews[0] credence sits at the left edge,
  // consistent with the shading direction and the end labels.
  const xCurrent = (1 - probs[0]) * w;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(xCurrent - 1, y0 - 3, 2, barH + 6);

  ctx.fillStyle = "#aeb6d4";
  ctx.font = "12px monospace";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText(truncate(worldviews[0]?.name ?? "A", 18), 2, h - 6);
  ctx.textAlign = "right";
  ctx.fillText(truncate(worldviews[1]?.name ?? "B", 18), w - 2, h - 6);
}

function drawTriangle(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  worldviews: Worldview[], matrix: PayoffCell[][], probs: number[]
) {
  // Reserve space at the top for the apex label and at the bottom for the two
  // base labels so none get clipped.
  const padX = 16;
  const labelTop = 18;
  const labelBottom = 22;
  const triW = w - 2 * padX;
  const triH = Math.min((triW * Math.sqrt(3)) / 2, h - labelTop - labelBottom);
  const cx = w / 2;
  const topY = labelTop;

  const v0: [number, number] = [cx, topY];
  const v1: [number, number] = [padX, topY + triH];
  const v2: [number, number] = [w - padX, topY + triH];

  const baryToXY = (p: number[]): [number, number] => [
    p[0] * v0[0] + p[1] * v1[0] + p[2] * v2[0],
    p[0] * v0[1] + p[1] * v1[1] + p[2] * v2[1],
  ];

  const res = 60;
  for (let i = 0; i <= res; i++) {
    for (let j = 0; j <= res - i; j++) {
      const k = res - i - j;
      const p = [i / res, j / res, k / res];
      const opt = getOptimalAction(p, matrix);
      const [x, y] = baryToXY(p);
      const cell = (triW / res) + 1;
      ctx.fillStyle = COLORS[opt % COLORS.length] + "70";
      ctx.fillRect(x - cell / 2, y - cell / 2, cell, cell);
    }
  }

  ctx.strokeStyle = "rgba(0,240,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(v0[0], v0[1]);
  ctx.lineTo(v1[0], v1[1]);
  ctx.lineTo(v2[0], v2[1]);
  ctx.closePath();
  ctx.stroke();

  const [px, py] = baryToXY(probs);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.stroke();

  ctx.fillStyle = "#cdd4ee";
  ctx.font = "12px monospace";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillText(truncate(worldviews[0]?.name ?? "A", 20), cx, topY - 6);
  ctx.textAlign = "left";
  ctx.fillText(truncate(worldviews[1]?.name ?? "B", 16), 0, topY + triH + 16);
  ctx.textAlign = "right";
  ctx.fillText(truncate(worldviews[2]?.name ?? "C", 16), w, topY + triH + 16);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
