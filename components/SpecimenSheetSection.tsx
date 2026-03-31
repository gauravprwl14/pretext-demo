"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

const FONT_SIZES = [10, 14, 18, 24, 32, 48, 64] as const;
const SPECIMEN_TEXT =
  "Whereas the party of the first part agrees to provide services in exchange for reasonable compensation, both parties acknowledge the terms herein.";

interface SizeLines {
  size: number;
  lines: string[];
  lastWords: Set<string>;
}

interface BreakPoint {
  word: string;
  charIndex: number;
  sizeCount: number;
  sizes: number[];
}

function computeBreakPoints(sizeLines: SizeLines[]): BreakPoint[] {
  // For each size, find the last word of each line (excluding the final line)
  // Map from last-word → which sizes have a break after it
  const breakMap = new Map<string, number[]>();

  for (const { size, lines } of sizeLines) {
    // For each non-final line, the "break word" is the last word on that line
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trimEnd();
      const lastSpaceIdx = line.lastIndexOf(" ");
      const lastWord =
        lastSpaceIdx >= 0 ? line.slice(lastSpaceIdx + 1) : line;
      const key = lastWord.toLowerCase().replace(/[^a-z]/g, "");
      if (!key) continue;
      if (!breakMap.has(key)) breakMap.set(key, []);
      const existing = breakMap.get(key)!;
      if (!existing.includes(size)) existing.push(size);
    }
  }

  const result: BreakPoint[] = [];
  breakMap.forEach((sizes, word) => {
    if (sizes.length >= 2) {
      // Find approximate char index in original text
      const charIndex = SPECIMEN_TEXT.toLowerCase().indexOf(word);
      result.push({ word, charIndex, sizeCount: sizes.length, sizes });
    }
  });

  result.sort((a, b) => a.charIndex - b.charIndex);
  return result;
}

export default function SpecimenSheetSection() {
  const [containerWidth, setContainerWidth] = useState(400);
  const [sizeLines, setSizeLines] = useState<SizeLines[]>([]);
  const [breakPoints, setBreakPoints] = useState<BreakPoint[]>([]);
  const [totalLines, setTotalLines] = useState(0);
  const [reflowTime, setReflowTime] = useState(0);
  const [hoveredSize, setHoveredSize] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const specimenRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const preparedCache = useRef<Map<number, unknown>>(new Map());
  const reflowScheduled = useRef(false);

  // Reflow all sizes synchronously
  const reflow = useCallback(
    async (width: number) => {
      if (reflowScheduled.current) return;
      reflowScheduled.current = true;

      const t0 = performance.now();
      try {
        const { prepareWithSegments, layoutWithLines } = await import(
          "@chenglou/pretext"
        );

        const results: SizeLines[] = [];
        let total = 0;

        for (const size of FONT_SIZES) {
          const fontSpec = `${size}px system-ui`;
          const lineHeight = size * 1.3;

          // Cache prepared text per font size
          if (!preparedCache.current.has(size)) {
            preparedCache.current.set(
              size,
              prepareWithSegments(SPECIMEN_TEXT, fontSpec)
            );
          }

          const prepared = preparedCache.current.get(size);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { lines: linesData } = layoutWithLines(prepared as any, width, lineHeight);
          const lines = linesData.map((l: { text: string }) => l.text);
          total += lines.length;

          const lastWords = new Set<string>();
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trimEnd();
            const parts = line.split(" ");
            const lw = parts[parts.length - 1]
              .toLowerCase()
              .replace(/[^a-z]/g, "");
            if (lw) lastWords.add(lw);
          }

          results.push({ size, lines, lastWords });
        }

        const elapsed = performance.now() - t0;
        setSizeLines(results);
        setTotalLines(total);
        setReflowTime(elapsed);
        setBreakPoints(computeBreakPoints(results));
      } catch (err) {
        console.error("Pretext error:", err);
        // Fallback: estimate lines
        const results: SizeLines[] = FONT_SIZES.map((size) => {
          const charsPerLine = Math.floor(width / (size * 0.5));
          const words = SPECIMEN_TEXT.split(" ");
          const lines: string[] = [];
          let current = "";
          for (const word of words) {
            if ((current + " " + word).trim().length > charsPerLine) {
              if (current) lines.push(current);
              current = word;
            } else {
              current = current ? current + " " + word : word;
            }
          }
          if (current) lines.push(current);
          return { size, lines, lastWords: new Set() };
        });
        setSizeLines(results);
        setTotalLines(results.reduce((s, r) => s + r.lines.length, 0));
        setReflowTime(0);
        setBreakPoints([]);
      } finally {
        reflowScheduled.current = false;
      }
    },
    []
  );

  // Initial reflow
  useEffect(() => {
    reflow(containerWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflow when width changes
  useEffect(() => {
    reflow(containerWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth]);

  // Drag handle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = containerWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [containerWidth]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.max(
        120,
        Math.min(700, dragStartWidth.current + delta)
      );
      setContainerWidth(Math.round(newWidth));
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Mouse interaction on specimen
  const handleSpecimenMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!specimenRef.current) return;
      const rect = specimenRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    },
    []
  );

  const handleSpecimenMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  const sharedBreakCount = breakPoints.filter((bp) => bp.sizeCount === 7).length;

  return (
    <section className="py-24 px-6 bg-black border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] tracking-widest text-white/25 uppercase mb-2">
            Experiment · Specimen
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1">
            Live Specimen Sheet
          </h2>
          <p className="text-white/35 text-sm">
            Drag the measure handle. All 7 sizes reflow simultaneously. Watch
            where their line breaks align — and where they diverge.
          </p>
        </div>

        {/* Main specimen container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
        >
          {/* Width ruler at top */}
          <div className="flex items-center px-4 pt-3 pb-2 border-b border-white/[0.04]">
            <div className="w-12 shrink-0" />
            <div className="relative h-4 flex-1">
              {/* Width indicator */}
              <div
                className="absolute top-0 h-full border-r border-amber-400/40 flex items-center"
                style={{ width: containerWidth }}
              >
                <div className="absolute right-0 translate-x-full pl-1">
                  <span className="text-[9px] text-amber-400/60 font-mono">
                    {containerWidth}px
                  </span>
                </div>
                {/* Ruler ticks */}
                {Array.from({ length: Math.floor(containerWidth / 50) }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-2 border-r border-white/10"
                    style={{ left: (i + 1) * 50 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Specimen rows */}
          <div
            ref={specimenRef}
            className="relative px-4"
            onMouseMove={handleSpecimenMouseMove}
            onMouseLeave={handleSpecimenMouseLeave}
          >
            {/* Mouse X vertical line */}
            {mouseX !== null && mouseX >= 48 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-white/10 pointer-events-none z-10"
                style={{ left: mouseX + 16 /* offset for px-4 */ }}
              />
            )}

            {/* Break alignment overlays */}
            {breakPoints.map((bp, i) => {
              if (bp.charIndex < 0) return null;
              // Estimate X position based on character proportion in the text
              const pct = bp.charIndex / SPECIMEN_TEXT.length;
              const x = pct * containerWidth + 48; // 48px label width
              const isStrong = bp.sizeCount >= 5;
              const isMedium = bp.sizeCount >= 3;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 pointer-events-none z-5"
                  style={{ left: x + 16 /* px-4 */ }}
                >
                  <div
                    className={`w-px h-full ${
                      isStrong
                        ? "bg-amber-400/60"
                        : isMedium
                        ? "bg-amber-400/30"
                        : "bg-amber-400/15"
                    }`}
                  />
                  {isStrong && (
                    <div className="absolute top-1 left-1">
                      <span className="text-[8px] text-amber-400/50 font-mono whitespace-nowrap">
                        {bp.sizeCount}×
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {sizeLines.map(({ size, lines }) => {
              const isHovered = hoveredSize === size;
              const lineHeight = size * 1.3;
              return (
                <div
                  key={size}
                  className={`flex items-start gap-4 py-3 border-b border-white/[0.04] transition-opacity duration-150 ${
                    hoveredSize !== null && !isHovered
                      ? "opacity-30"
                      : "opacity-100"
                  }`}
                  onMouseEnter={() => setHoveredSize(size)}
                  onMouseLeave={() => setHoveredSize(null)}
                >
                  {/* Size label */}
                  <span className="text-[10px] text-white/25 w-10 shrink-0 pt-1 font-mono text-right">
                    {size}px
                  </span>

                  {/* Text block with right-edge indicator */}
                  <div className="relative">
                    <div style={{ maxWidth: containerWidth }}>
                      {lines.map((line, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: size,
                            lineHeight: lineHeight + "px",
                            whiteSpace: "nowrap",
                            color: isHovered
                              ? "rgba(255,255,255,0.9)"
                              : "rgba(255,255,255,0.65)",
                            transition: "color 0.1s",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>

                    {/* Right-edge indicator at containerWidth */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-white/10 pointer-events-none"
                      style={{ left: containerWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drag handle — amber vertical line */}
          <div
            ref={containerRef}
            className="absolute top-0 bottom-0 z-20 flex items-center justify-center group cursor-col-resize"
            style={{ left: containerWidth + 48 + 16 /* label width + px-4 */ }}
            onMouseDown={handleMouseDown}
          >
            {/* Amber line */}
            <div className="w-px h-full bg-amber-400/50 group-hover:bg-amber-400/80 transition-colors" />

            {/* Grip handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
              <div className="w-3 h-5 rounded-sm bg-amber-400/20 group-hover:bg-amber-400/40 border border-amber-400/40 group-hover:border-amber-400/70 flex flex-col items-center justify-center gap-0.5 transition-all">
                <div className="w-0.5 h-0.5 rounded-full bg-amber-400/70" />
                <div className="w-0.5 h-0.5 rounded-full bg-amber-400/70" />
                <div className="w-0.5 h-0.5 rounded-full bg-amber-400/70" />
              </div>
              {/* Width label */}
              <div className="mt-1 px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded text-[9px] text-amber-400/80 font-mono whitespace-nowrap">
                {containerWidth}px
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          <StatChip label="sizes" value="7" />
          <StatChip label="measure" value={`${containerWidth}px`} />
          <StatChip
            label="shared break points"
            value={`${sharedBreakCount} (all 7)`}
            highlight={sharedBreakCount > 0}
          />
          <StatChip label="alignment zones" value={`${breakPoints.length}`} />
          <StatChip label="total lines" value={`${totalLines}`} />
          <StatChip
            label="reflow time"
            value={
              reflowTime < 1
                ? "<1ms (pretext)"
                : `${reflowTime.toFixed(1)}ms (pretext)`
            }
            accent
          />
        </motion.div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-[10px] text-white/25 font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-px h-3 bg-amber-400/60" />
            <span>5–7 sizes share break</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-px h-3 bg-amber-400/30" />
            <span>3–4 sizes share break</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-px h-3 bg-amber-400/15" />
            <span>2 sizes share break</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatChip({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-white/25 font-mono">{label}:</span>
      <span
        className={`text-[10px] font-mono font-medium ${
          accent
            ? "text-amber-400/70"
            : highlight
            ? "text-amber-400/60"
            : "text-white/50"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
