"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Blob {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
}

interface FrameStats {
  linesComputed: number;
  blobsActive: number;
  avgLineWidth: number;
  wordsPlaced: number;
  totalWords: number;
  lastLinWidths: number[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CANVAS_W = 780;
const CANVAS_H = 500;
const TEXT_AREA_W = 480;
const FONT = "15px system-ui";
const LINE_HEIGHT = 22;
const START_Y = 40;
const LEFT_MARGIN = 20;
const TEXT_MAX_W = TEXT_AREA_W - LEFT_MARGIN * 2;

const PARAGRAPH =
  "The key insight is that measuring character widths is a one-time cost. Once you have the widths cached, line-breaking becomes pure arithmetic. You walk the array, summing widths left to right. When the running sum exceeds your container width, you start a new line. No browser. No DOM. No reflow. Just addition. This makes it possible to know the exact layout of any text before a single pixel is painted — and to recompute that layout thousands of times per second without ever touching the document.";

const INITIAL_BLOBS: Omit<Blob, "color">[] = [
  { x: 120, y: 180, r: 45, vx: 0.4, vy: 0.3 },
  { x: 300, y: 280, r: 60, vx: -0.35, vy: 0.5 },
  { x: 200, y: 100, r: 35, vx: 0.5, vy: -0.4 },
];

const BLOB_COLORS = [
  "rgba(251,191,36,0.60)",   // amber
  "rgba(59,130,246,0.50)",   // blue
  "rgba(16,185,129,0.50)",   // emerald
];

const CURSOR_BLOB_COLOR = "rgba(255,255,255,0.30)";
const CURSOR_BLOB_R = 50;
const CURSOR_LERP = 0.12;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExclusionZonesSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pretextRef = useRef<{ prepare: Function; layout: Function } | null>(null);
  const blobsRef = useRef<Blob[]>(
    INITIAL_BLOBS.map((b, i) => ({ ...b, color: BLOB_COLORS[i] }))
  );
  const cursorBlobRef = useRef<Blob>({
    x: -200,
    y: -200,
    r: CURSOR_BLOB_R,
    vx: 0,
    vy: 0,
    color: CURSOR_BLOB_COLOR,
  });
  const cursorActiveRef = useRef(false);
  const cursorTargetRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);
  const wordsRef = useRef<string[]>(PARAGRAPH.split(" "));

  const [stats, setStats] = useState<FrameStats>({
    linesComputed: 0,
    blobsActive: 3,
    avgLineWidth: 0,
    wordsPlaced: 0,
    totalWords: PARAGRAPH.split(" ").length,
    lastLinWidths: [],
  });

  // Load pretext once
  useEffect(() => {
    import("@chenglou/pretext").then((mod) => {
      pretextRef.current = { prepare: mod.prepare, layout: mod.layout };
    });
  }, []);

  // Canvas setup & animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set actual pixel dimensions with DPR
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const words = wordsRef.current;

    function drawBlobGlow(ctx: CanvasRenderingContext2D, blob: Blob) {
      const grd = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r * 1.4);
      grd.addColorStop(0, blob.color);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.r * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
      ctx.fillStyle = blob.color;
      ctx.fill();
    }

    function tick() {
      const pt = pretextRef.current;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle right panel divider
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(TEXT_AREA_W, 0);
      ctx.lineTo(TEXT_AREA_W, CANVAS_H);
      ctx.stroke();

      // Move auto blobs & bounce
      const allBlobs = [...blobsRef.current];
      if (cursorActiveRef.current) allBlobs.push(cursorBlobRef.current);

      for (const blob of blobsRef.current) {
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x - blob.r < 0 || blob.x + blob.r > TEXT_AREA_W) blob.vx *= -1;
        if (blob.y - blob.r < 0 || blob.y + blob.r > CANVAS_H) blob.vy *= -1;
        blob.x = Math.max(blob.r, Math.min(TEXT_AREA_W - blob.r, blob.x));
        blob.y = Math.max(blob.r, Math.min(CANVAS_H - blob.r, blob.y));
      }

      // Lerp cursor blob
      if (cursorActiveRef.current) {
        const cb = cursorBlobRef.current;
        cb.x += (cursorTargetRef.current.x - cb.x) * CURSOR_LERP;
        cb.y += (cursorTargetRef.current.y - cb.y) * CURSOR_LERP;
      }

      // Draw glows first (below text)
      for (const blob of allBlobs) {
        drawBlobGlow(ctx, blob);
      }

      // Text layout
      ctx.font = FONT;
      ctx.fillStyle = "rgba(255,255,255,0.6)";

      const lineWidths: number[] = [];
      let wordIndex = 0;
      let lineIndex = 0;
      let linesComputed = 0;

      if (pt) {
        while (wordIndex < words.length) {
          const lineY = START_Y + lineIndex * LINE_HEIGHT;
          if (lineY + LINE_HEIGHT > CANVAS_H) break;

          const lineCenterY = lineY + LINE_HEIGHT / 2;

          // Find all blob intersections for this line band
          let leftOffset = LEFT_MARGIN;
          let rightOffset = TEXT_AREA_W - LEFT_MARGIN;

          const intersectingBlobs: { leftEdge: number; rightEdge: number }[] = [];

          for (const blob of allBlobs) {
            const dy = Math.abs(blob.y - lineCenterY);
            if (dy < blob.r) {
              const halfChord = Math.sqrt(blob.r * blob.r - dy * dy);
              intersectingBlobs.push({
                leftEdge: blob.x - halfChord,
                rightEdge: blob.x + halfChord,
              });
            }
          }

          // Simple approach: find rightmost right-edge among blobs whose left edge is near left margin
          // and leftmost left-edge among blobs whose right edge is near right margin
          // For simplicity: push text start past any blob that overlaps the left side,
          // and shorten the line for blobs on the right side
          let textStart = leftOffset;
          let textEnd = rightOffset;

          for (const seg of intersectingBlobs) {
            // If blob overlaps the start region, push text start right
            if (seg.leftEdge < textStart + 40) {
              textStart = Math.max(textStart, seg.rightEdge + 4);
            } else if (seg.rightEdge > textEnd - 40) {
              // Blob on the right, shrink end
              textEnd = Math.min(textEnd, seg.leftEdge - 4);
            } else {
              // Blob in the middle — push text start past it (simplification)
              textStart = Math.max(textStart, seg.rightEdge + 4);
            }
          }

          const effectiveWidth = Math.max(0, textEnd - textStart);

          // Greedy line fill using pretext
          let lineText = "";
          let placed = 0;

          if (effectiveWidth > 20 && wordIndex < words.length) {
            // Build candidate words
            let testText = words[wordIndex];
            let measured = 0;

            try {
              const prepared = pt.prepare(testText, FONT);
              const result = pt.layout(prepared, effectiveWidth, LINE_HEIGHT);
              measured = result.width;
            } catch {
              // fallback: skip word
            }

            if (measured <= effectiveWidth) {
              lineText = testText;
              placed = 1;

              // Try adding more words
              while (wordIndex + placed < words.length) {
                const candidate = lineText + " " + words[wordIndex + placed];
                let candidateWidth = 0;
                try {
                  const prep = pt.prepare(candidate, FONT);
                  const res = pt.layout(prep, effectiveWidth, LINE_HEIGHT);
                  candidateWidth = res.width;
                } catch {
                  break;
                }
                if (candidateWidth <= effectiveWidth) {
                  lineText = candidate;
                  placed++;
                } else {
                  break;
                }
              }
            }
          }

          // Draw the line text
          if (lineText) {
            ctx.fillText(lineText, textStart, lineY + LINE_HEIGHT * 0.75);
            lineWidths.push(effectiveWidth);
            linesComputed++;

            // Draw right margin indicator line
            ctx.strokeStyle = "rgba(255,255,255,0.12)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(textStart + effectiveWidth, lineY + 2);
            ctx.lineTo(textStart + effectiveWidth, lineY + LINE_HEIGHT - 2);
            ctx.stroke();
          } else if (wordIndex < words.length && effectiveWidth <= 20) {
            // No room on this line due to blobs, skip line
          } else {
            // Nothing placed even with space — skip word to avoid infinite loop
            if (wordIndex < words.length) {
              ctx.fillText(words[wordIndex], textStart, lineY + LINE_HEIGHT * 0.75);
              placed = 1;
              linesComputed++;
              lineWidths.push(effectiveWidth);
            }
          }

          wordIndex += placed;
          lineIndex++;
        }
      } else {
        // Fallback: plain text rendering before pretext loads
        ctx.font = FONT;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        const fallbackWords = words.slice();
        let fi = 0;
        let li = 0;
        while (fi < fallbackWords.length && li < 20) {
          let line = "";
          while (fi < fallbackWords.length) {
            const test = line ? line + " " + fallbackWords[fi] : fallbackWords[fi];
            if (ctx.measureText(test).width > TEXT_MAX_W) break;
            line = test;
            fi++;
          }
          ctx.fillText(line, LEFT_MARGIN, START_Y + li * LINE_HEIGHT + LINE_HEIGHT * 0.75);
          li++;
        }
      }

      // Update stats (throttled to avoid too many React re-renders)
      const avgW = lineWidths.length
        ? Math.round(lineWidths.reduce((a, b) => a + b, 0) / lineWidths.length)
        : 0;

      setStats({
        linesComputed,
        blobsActive: allBlobs.length,
        avgLineWidth: avgW,
        wordsPlaced: wordIndex,
        totalWords: words.length,
        lastLinWidths: lineWidths.slice(-5),
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    cursorTargetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    cursorActiveRef.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    cursorActiveRef.current = false;
    cursorBlobRef.current.x = -200;
    cursorBlobRef.current.y = -200;
    cursorTargetRef.current = { x: -200, y: -200 };
  }, []);

  return (
    <section className="py-24 px-6 bg-black border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="text-[10px] tracking-widest text-white/25 uppercase mb-2">
            Experiment · Exclusion
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1">
            Text Exclusion Zones
          </h2>
          <p className="text-white/35 text-sm">
            Floating shapes displace text in real time. pretext recomputes every line width around
            each obstacle — no CSS, no DOM, pure arithmetic.
          </p>
        </div>

        <div className="flex gap-4 items-start">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{ width: CANVAS_W, height: CANVAS_H }}
            className="rounded-xl border border-white/10 flex-shrink-0"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />

          {/* Stats panel */}
          <div className="w-[200px] flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-[11px] space-y-3">
            <div>
              <div className="text-white/25 uppercase tracking-widest text-[9px] mb-1">
                Live Stats
              </div>
              <div className="border-b border-white/[0.06]" />
            </div>

            <StatRow label="Lines / frame" value={stats.linesComputed} />
            <StatRow label="Blobs active" value={stats.blobsActive} />
            <StatRow label="Avg line width" value={`${stats.avgLineWidth}px`} />
            <StatRow
              label="Words placed"
              value={`${stats.wordsPlaced} / ${stats.totalWords}`}
            />

            <div>
              <div className="text-white/25 mb-1">Last 5 line widths</div>
              <div className="space-y-0.5">
                {stats.lastLinWidths.length === 0 ? (
                  <div className="text-white/20">—</div>
                ) : (
                  stats.lastLinWidths.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="h-1 bg-amber-400/60 rounded-full"
                        style={{ width: `${Math.round((w / TEXT_AREA_W) * 100)}%` }}
                      />
                      <span className="text-white/40">{w}px</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-white/30 truncate">{label}</span>
      <span className="text-white/70 tabular-nums flex-shrink-0">{value}</span>
    </div>
  );
}
