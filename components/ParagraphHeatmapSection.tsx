"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_W = 600;
const CANVAS_H = 500;
const FONT = "15px system-ui";
const LINE_HEIGHT = 24;
const PADDING_LEFT = 16;
const PADDING_TOP = 20;

const COLOR_DENSE = { r: 59, g: 130, b: 246 };   // #3B82F6 blue
const COLOR_SPARSE = { r: 245, g: 158, b: 11 };   // #F59E0B amber

const FULL_TEXT =
  "Typography is the art and technique of arranging type to make written language legible, readable and appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths, line spacing, and letter spacing. Typography is performed by typesetters, compositors, typographers, graphic designers, art directors, manga artists, comic book artists, graffiti artists and, now, anyone who arranges words on a page.";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineStats {
  text: string;
  usedWidth: number;
  efficiency: number; // 0–1
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** t=0 → dense (blue), t=1 → sparse (amber) */
function efficiencyColor(efficiency: number): string {
  // invert: high efficiency → cool (t=0), low efficiency → warm (t=1)
  const t = 1 - Math.max(0, Math.min(1, efficiency));
  const r = Math.round(lerp(COLOR_DENSE.r, COLOR_SPARSE.r, t));
  const g = Math.round(lerp(COLOR_DENSE.g, COLOR_SPARSE.g, t));
  const b = Math.round(lerp(COLOR_DENSE.b, COLOR_SPARSE.b, t));
  return `rgb(${r},${g},${b})`;
}

// ── Canvas renderer ───────────────────────────────────────────────────────────

function drawHeatmap(
  canvas: HTMLCanvasElement,
  lines: LineStats[],
  containerWidth: number,
  mouseX: number | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Container boundary
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(PADDING_LEFT, PADDING_TOP, containerWidth, lines.length * LINE_HEIGHT + 8);
  ctx.setLineDash([]);

  ctx.font = FONT;
  ctx.textBaseline = "middle";

  lines.forEach((line, i) => {
    const y = PADDING_TOP + i * LINE_HEIGHT + LINE_HEIGHT / 2;
    const x = PADDING_LEFT;
    const lineTop = PADDING_TOP + i * LINE_HEIGHT;

    const color = efficiencyColor(line.efficiency);

    // Colored filled rect for used portion
    ctx.fillStyle = color.replace("rgb(", "rgba(").replace(")", ",0.28)");
    ctx.fillRect(x, lineTop + 2, line.usedWidth, LINE_HEIGHT - 4);

    // Red waste rect for unused portion
    const wastedX = x + line.usedWidth;
    const wastedW = containerWidth - line.usedWidth;
    if (wastedW > 0) {
      ctx.fillStyle = "rgba(239,68,68,0.07)";
      ctx.fillRect(wastedX, lineTop + 2, wastedW, LINE_HEIGHT - 4);
    }

    // Thin colored left accent bar
    ctx.fillStyle = color.replace("rgb(", "rgba(").replace(")", ",0.8)");
    ctx.fillRect(x, lineTop + 2, 2, LINE_HEIGHT - 4);

    // Text
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText(line.text, x + 6, y, containerWidth - 6);

    // Efficiency label
    const label = `${Math.round(line.efficiency * 100)}%`;
    ctx.font = "11px system-ui";
    ctx.fillStyle = color.replace("rgb(", "rgba(").replace(")", ",0.7)");
    const labelX = x + containerWidth + 6;
    if (labelX + 32 < CANVAS_W) {
      ctx.fillText(label, labelX, y);
    }
    ctx.font = FONT;
  });

  // Vertical measure line at mouse X
  if (mouseX !== null && mouseX >= PADDING_LEFT && mouseX <= PADDING_LEFT + containerWidth) {
    ctx.strokeStyle = "rgba(245,158,11,0.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mouseX, PADDING_TOP);
    ctx.lineTo(mouseX, PADDING_TOP + lines.length * LINE_HEIGHT + 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // Width label at top
    ctx.fillStyle = "rgba(245,158,11,0.8)";
    ctx.font = "10px system-ui";
    const wLabel = `${Math.round(mouseX - PADDING_LEFT)}px`;
    ctx.fillText(wLabel, mouseX + 4, PADDING_TOP - 6);
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ParagraphHeatmapSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preparedRef = useRef<unknown>(null);
  const mountedRef = useRef(false);

  const [containerWidth, setContainerWidth] = useState(380);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [lineStats, setLineStats] = useState<LineStats[]>([]);

  // ── Compute line stats with pretext + canvas measureText ──────────────────

  const computeLines = useCallback(async (cWidth: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const { prepareWithSegments, layoutWithLines } = await import("@chenglou/pretext");

      if (!preparedRef.current) {
        preparedRef.current = prepareWithSegments(FULL_TEXT, FONT);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = layoutWithLines(preparedRef.current as any, cWidth, LINE_HEIGHT);

      ctx.font = FONT;
      const stats: LineStats[] = result.lines.map((line: { text: string; width: number }) => {
        // Measure actual pixel width of this line's text
        const measured = ctx.measureText(line.text.trim()).width;
        const eff = Math.min(1, Math.max(0, measured / cWidth));
        return {
          text: line.text.trim(),
          usedWidth: measured,
          efficiency: eff,
        };
      });

      setLineStats(stats);
    } catch {
      // Fallback: split text naively if pretext not available
      ctx.font = FONT;
      const words = FULL_TEXT.split(" ");
      const lines: LineStats[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > cWidth && current) {
          const w = ctx.measureText(current).width;
          lines.push({ text: current, usedWidth: w, efficiency: Math.min(1, w / cWidth) });
          current = word;
        } else {
          current = test;
        }
      }
      if (current) {
        const w = ctx.measureText(current).width;
        lines.push({ text: current, usedWidth: w, efficiency: Math.min(1, w / cWidth) });
      }
      setLineStats(lines);
    }
  }, []);

  // Mount: prepare + initial layout
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    computeLines(containerWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw canvas whenever lineStats or containerWidth change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || lineStats.length === 0) return;
    drawHeatmap(canvas, lineStats, containerWidth, mouseX);
  }, [lineStats, containerWidth, mouseX]);

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const rawX = (e.clientX - rect.left) * scaleX;
      const newMouseX = Math.max(PADDING_LEFT, Math.min(CANVAS_W - 40, rawX));

      const newCW = Math.max(150, Math.min(CANVAS_W - 40, newMouseX - PADDING_LEFT));
      setMouseX(newMouseX);
      setContainerWidth(newCW);
      computeLines(newCW);
    },
    [computeLines]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const avgEfficiency =
    lineStats.length > 0
      ? lineStats.reduce((s, l) => s + l.efficiency, 0) / lineStats.length
      : 0;

  const densestIndex =
    lineStats.length > 0
      ? lineStats.reduce((best, l, i) => (l.efficiency > lineStats[best].efficiency ? i : best), 0)
      : -1;

  const sparsestIndex =
    lineStats.length > 0
      ? lineStats.reduce((best, l, i) => (l.efficiency < lineStats[best].efficiency ? i : best), 0)
      : -1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="py-24 px-6 bg-black border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] tracking-widest text-white/25 uppercase mb-2">
            Experiment · Density
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1">Paragraph Heatmap</h2>
          <p className="text-white/35 text-sm">
            Move your cursor to control the column width. Cool blue = dense lines, warm amber =
            wasted space. pretext makes text efficiency visible.
          </p>
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-6 items-start">
          {/* LEFT: Canvas */}
          <div className="shrink-0" style={{ width: CANVAS_W }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="block rounded-lg border border-white/[0.06] cursor-crosshair"
              style={{ width: CANVAS_W, height: CANVAS_H }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          </div>

          {/* RIGHT: Stats panel */}
          <div className="flex-1 min-w-0" style={{ minWidth: 220 }}>
            {/* Container width */}
            <div className="mb-5">
              <div className="text-[10px] tracking-widest text-white/30 uppercase mb-1">
                Container
              </div>
              <div className="text-xl font-mono font-semibold text-white">
                {containerWidth}
                <span className="text-white/30 text-sm font-normal ml-1">px</span>
              </div>
            </div>

            {/* Color scale legend */}
            <div className="mb-5">
              <div className="text-[10px] tracking-widest text-white/30 uppercase mb-2">
                Density Scale
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 rounded-full flex-1"
                  style={{
                    background:
                      "linear-gradient(to right, #3B82F6, #94a3b8, #F59E0B)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-blue-400/70">dense</span>
                <span className="text-[10px] text-amber-400/70">sparse</span>
              </div>
            </div>

            {/* Per-line stats */}
            <div className="mb-5">
              <div className="text-[10px] tracking-widest text-white/30 uppercase mb-2">
                Line Efficiency
              </div>
              <div className="space-y-1.5">
                {lineStats.map((line, i) => {
                  const pct = Math.round(line.efficiency * 100);
                  const color = efficiencyColor(line.efficiency);
                  const barFilled = Math.round((pct / 100) * 14);
                  const barEmpty = 14 - barFilled;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25 font-mono w-10 shrink-0">
                        L{i + 1}
                      </span>
                      <span
                        className="text-[11px] font-mono tracking-tight leading-none"
                        style={{ color }}
                      >
                        {"█".repeat(barFilled)}
                        <span className="text-white/10">{"░".repeat(barEmpty)}</span>
                      </span>
                      <span
                        className="text-[10px] font-mono shrink-0 w-7 text-right"
                        style={{ color }}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary stats */}
            {lineStats.length > 0 && (
              <div className="border-t border-white/[0.06] pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[11px] text-white/30">Avg efficiency</span>
                  <span className="text-[11px] font-mono text-white/60">
                    {Math.round(avgEfficiency * 100)}%
                  </span>
                </div>
                {densestIndex >= 0 && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-white/30">Densest line</span>
                    <span className="text-[11px] font-mono text-blue-400/70">
                      L{densestIndex + 1} ({Math.round(lineStats[densestIndex].efficiency * 100)}%)
                    </span>
                  </div>
                )}
                {sparsestIndex >= 0 && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-white/30">Sparsest line</span>
                    <span className="text-[11px] font-mono text-amber-400/70">
                      L{sparsestIndex + 1} ({Math.round(lineStats[sparsestIndex].efficiency * 100)}%)
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[11px] text-white/30">Lines</span>
                  <span className="text-[11px] font-mono text-white/40">
                    {lineStats.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
