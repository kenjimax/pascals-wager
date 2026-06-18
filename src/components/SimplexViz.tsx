"use client";
import { useRef, useEffect } from "react";
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
  const n = worldviews.length;

  const visible = n === 2 || n === 3;

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (n === 2) {
      drawLine(ctx, w, h, worldviews, matrix, probs);
    } else if (n === 3) {
      drawTriangle(ctx, w, h, worldviews, matrix, probs);
    }
  }, [visible, worldviews, matrix, probs, n]);

  if (!visible) return null;

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-cp-text-dim">
        {n === 2 ? "Probability line" : "Probability simplex"}: shaded by which action is EU-optimal.
        Your current credence is marked.
      </div>
      <canvas
        ref={canvasRef}
        width={n === 2 ? 400 : 300}
        height={n === 2 ? 60 : 260}
        className="border border-cp-cyan/10 w-full max-w-md"
        aria-label={`${n === 2 ? "Probability line" : "Probability simplex"} visualization`}
      />
      <div className="flex gap-3 text-[9px]">
        {worldviews.map((wv, i) => (
          <span key={wv.id} style={{ color: COLORS[i % COLORS.length] }}>
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
  const steps = Math.min(w, 200);
  const barH = 30;
  const y0 = 15;

  for (let i = 0; i < steps; i++) {
    const p0 = i / (steps - 1);
    const p = [p0, 1 - p0];
    const opt = getOptimalAction(p, matrix);
    ctx.fillStyle = COLORS[opt % COLORS.length] + "80";
    ctx.fillRect((i / steps) * w, y0, w / steps + 1, barH);
  }

  ctx.strokeStyle = "rgba(0,240,255,0.2)";
  ctx.strokeRect(0, y0, w, barH);

  const xCurrent = probs[0] * w;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(xCurrent - 1, y0 - 3, 2, barH + 6);

  ctx.fillStyle = "#8b93b4";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(worldviews[0]?.name ?? "A", 4, h - 4);
  ctx.textAlign = "right";
  ctx.fillText(worldviews[1]?.name ?? "B", w - 4, h - 4);
}

function drawTriangle(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  worldviews: Worldview[], matrix: PayoffCell[][], probs: number[]
) {
  const margin = 30;
  const triW = w - 2 * margin;
  const triH = (triW * Math.sqrt(3)) / 2;
  const cx = w / 2;
  const topY = (h - triH) / 2;

  const v0 = [cx, topY];
  const v1 = [margin, topY + triH];
  const v2 = [w - margin, topY + triH];

  const baryToXY = (p: number[]): [number, number] => {
    const x = p[0] * v0[0] + p[1] * v1[0] + p[2] * v2[0];
    const y = p[0] * v0[1] + p[1] * v1[1] + p[2] * v2[1];
    return [x, y];
  };

  const res = 50;

  for (let i = 0; i <= res; i++) {
    for (let j = 0; j <= res - i; j++) {
      const k = res - i - j;
      const p = [i / res, j / res, k / res];
      const opt = getOptimalAction(p, matrix);
      const [x, y] = baryToXY(p);
      ctx.fillStyle = COLORS[opt % COLORS.length] + "60";
      ctx.fillRect(x - w / res / 2, y - w / res / 2, w / res + 1, w / res + 1);
    }
  }

  ctx.strokeStyle = "rgba(0,240,255,0.3)";
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

  ctx.fillStyle = "#8b93b4";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(worldviews[0]?.name ?? "A", v0[0], v0[1] - 6);
  ctx.textAlign = "right";
  ctx.fillText(worldviews[1]?.name ?? "B", v1[0] - 4, v1[1] + 14);
  ctx.textAlign = "left";
  ctx.fillText(worldviews[2]?.name ?? "C", v2[0] + 4, v2[1] + 14);
}
