"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog.",
  "Text layout was the last unsolved problem in UI engineering.",
  "No DOM, no reflow, no getBoundingClientRect.",
  "Pure TypeScript. Pure speed.",
  "Supporting Korean, Arabic, Japanese, and every emoji your heart desires 🎉",
  "Sub-millisecond layout calculations.",
  "Virtualize 100,000 text items with a single linear pass.",
  "The future of interfaces is not CSS.",
  "Prepare once, layout infinitely.",
  "Perfect for canvas, WebGL, and native rendering.",
  "Line wrapping math, finally solved in userland.",
  "Build the UI you've always wanted.",
  "RTL? CJK? Mixed scripts? Handled.",
  "Scroll at 120fps. Always.",
  "Your textarea deserves to auto-grow correctly.",
  "Magazine layouts. Masonry grids. Chat bubbles. All the same primitive.",
  "Variable fonts, soft hyphens, tabs — all supported.",
  "CSS was never meant to do this.",
  "Now you can build interfaces that feel like native apps.",
  "Cheng Lou shipped something important.",
];

function generateItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length],
    color: `hsl(${(i * 23) % 360}, 15%, ${12 + (i % 5)}%)`,
  }));
}

interface Item {
  id: number;
  text: string;
  color: string;
  height: number;
  top: number;
  col: number;
}

const COL_WIDTH = 200;
const COLS = 4;
const GAP = 10;
const ITEM_COUNT = 200;
const FONT_SIZE = 13;
const LINE_HEIGHT = FONT_SIZE * 1.5;
const PADDING = 24;

export default function MasonrySection() {
  const [items, setItems] = useState<Item[]>([]);
  const [totalHeight, setTotalHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const VIEWPORT_HEIGHT = 460;

  const buildLayout = useCallback(async () => {
    const rawItems = generateItems(ITEM_COUNT);

    let layoutFn: (text: string, maxW: number) => number;

    try {
      const { prepare, layout } = await import("@chenglou/pretext");
      layoutFn = (text, maxW) => {
        const prepared = prepare(text, `${FONT_SIZE}px Arial`);
        const result = layout(prepared, maxW, LINE_HEIGHT);
        return Math.round(result.height) + PADDING;
      };
    } catch {
      layoutFn = (text, maxW) => {
        const chars = text.length;
        const charsPerLine = Math.floor(maxW / (FONT_SIZE * 0.55));
        const lines = Math.ceil(chars / charsPerLine);
        return lines * LINE_HEIGHT + PADDING;
      };
    }

    const colHeights = Array(COLS).fill(0) as number[];
    const laid: Item[] = rawItems.map((raw) => {
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      const itemHeight = layoutFn(raw.text, COL_WIDTH - PADDING);
      const top = colHeights[shortestCol];
      colHeights[shortestCol] += itemHeight + GAP;
      return {
        ...raw,
        height: itemHeight,
        top,
        col: shortestCol,
      };
    });

    setItems(laid);
    setTotalHeight(Math.max(...colHeights));
    setIsReady(true);
  }, []);

  useEffect(() => {
    buildLayout();
  }, [buildLayout]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  const visibleItems = items.filter((item) => {
    return item.top + item.height > scrollY - 50 && item.top < scrollY + VIEWPORT_HEIGHT + 50;
  });

  const totalWidth = COLS * COL_WIDTH + (COLS - 1) * GAP;

  return (
    <section className="py-32 px-6 bg-black border-t border-white/10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="mono text-xs text-white/30 mb-4 uppercase tracking-widest">
            Demo 03 — Virtual Masonry
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            {ITEM_COUNT.toLocaleString()} items.
            <br />
            <span className="text-white/30">One pass to measure all.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl">
            All {ITEM_COUNT} card heights were calculated before a single pixel was
            rendered. Scroll position maps to visible items with zero DOM
            measurements — just arithmetic.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-6 mb-8"
        >
          {[
            { label: "Total cards", value: ITEM_COUNT },
            { label: "DOM elements", value: isReady ? visibleItems.length : "—" },
            { label: "Columns", value: COLS },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
              <div className="mono text-xl font-bold text-white">{value}</div>
              <div className="mono text-xs text-white/30 mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Masonry viewport */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="border border-white/10 rounded-2xl overflow-hidden"
        >
          <div
            ref={containerRef}
            className="overflow-y-scroll"
            style={{ height: VIEWPORT_HEIGHT }}
            onScroll={handleScroll}
          >
            {!isReady && (
              <div className="h-full flex items-center justify-center text-white/30 mono text-sm">
                Measuring {ITEM_COUNT} items with pretext...
              </div>
            )}
            {isReady && (
              <div
                className="relative"
                style={{ height: totalHeight, width: totalWidth, margin: "0 auto" }}
              >
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="absolute rounded-lg p-3 overflow-hidden"
                    style={{
                      left: item.col * (COL_WIDTH + GAP),
                      top: item.top,
                      width: COL_WIDTH,
                      height: item.height,
                      backgroundColor: item.color,
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="text-white/70 leading-relaxed" style={{ fontSize: FONT_SIZE }}>
                      {item.text}
                    </div>
                    <div className="mono text-[10px] text-white/20 mt-1 absolute bottom-2 right-2">
                      #{item.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <p className="mono text-xs text-white/20 mt-3 text-center">
          Only {visibleItems.length} of {ITEM_COUNT} DOM nodes active · scroll to see virtualization
        </p>
      </div>
    </section>
  );
}
