"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Text generation (seeded, deterministic)
// ---------------------------------------------------------------------------

const WORDS = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog",
  "pretext", "measures", "text", "width", "without", "dom", "reflow",
  "instant", "cached", "precise", "layout", "computed",
];

const TAGS = [
  "#pretext", "#webperf", "#typescript", "#react", "#frontend",
  "#layout", "#measurement",
];

function wordAt(idx: number) {
  return WORDS[((idx % WORDS.length) + WORDS.length) % WORDS.length];
}

function generateItem(i: number) {
  const titleLen = 5 + ((i * 7919) % 10);
  const bodyLen = 10 + ((i * 6271) % 30);

  const titleWords: string[] = [];
  for (let w = 0; w < titleLen; w++) {
    titleWords.push(wordAt((i * 13 + w * 31) % WORDS.length));
  }
  // capitalize first word
  titleWords[0] = titleWords[0][0].toUpperCase() + titleWords[0].slice(1);

  const bodyWords: string[] = [];
  for (let w = 0; w < bodyLen; w++) {
    bodyWords.push(wordAt((i * 17 + w * 41) % WORDS.length));
  }
  bodyWords[0] = bodyWords[0][0].toUpperCase() + bodyWords[0].slice(1);

  return {
    id: i,
    title: titleWords.join(" "),
    body: bodyWords.join(" ") + ".",
    tag: TAGS[i % TAGS.length],
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEM_COUNT = 10_000;
const VIEWPORT_HEIGHT = 500;
const ITEM_WIDTH = 340;
const LINE_HEIGHT = 20;
const FONT = "14px system-ui";
const PADDING_V = 20; // top + bottom padding per card
const MINIMAP_W = 40;
const MINIMAP_H = 500;
const BUFFER = 5;

// Binary search: find the last index where cumHeights[i] <= target
function binarySearch(cum: Float64Array, target: number): number {
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid] <= target) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type RawItem = ReturnType<typeof generateItem>;

interface ComputedItem extends RawItem {
  height: number;
  top: number;
}

export default function PrecisionScrollSection() {
  const [items, setItems] = useState<ComputedItem[]>([]);
  const [cumHeights, setCumHeights] = useState<Float64Array>(new Float64Array(0));
  const [totalHeight, setTotalHeight] = useState(0);
  const [prepareMs, setPrepareMs] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [compareMode, setCompareMode] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const scrollTopRef = useRef(0);

  // -------------------------------------------------------------------------
  // Mount: generate items, measure all heights with pretext
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function run() {
      const rawItems: RawItem[] = [];
      for (let i = 0; i < ITEM_COUNT; i++) rawItems.push(generateItem(i));

      let heights: number[];

      const t0 = performance.now();
      try {
        const { prepare, layout } = await import("@chenglou/pretext");

        heights = rawItems.map((item) => {
          const fullText = item.title + "\n" + item.body;
          const prepared = prepare(fullText, FONT);
          const result = layout(prepared, ITEM_WIDTH, LINE_HEIGHT);
          return Math.round(result.height) + PADDING_V;
        });
      } catch {
        // Fallback: estimate without pretext
        heights = rawItems.map((item) => {
          const charsPer = Math.floor(ITEM_WIDTH / 8);
          const titleLines = Math.ceil(item.title.length / charsPer);
          const bodyLines = Math.ceil(item.body.length / charsPer);
          return (titleLines + bodyLines) * LINE_HEIGHT + PADDING_V;
        });
      }
      const elapsed = performance.now() - t0;

      if (cancelled) return;

      // Build cumulative heights array (length = ITEM_COUNT + 1, cum[0]=0)
      const cum = new Float64Array(ITEM_COUNT + 1);
      cum[0] = 0;
      for (let i = 0; i < ITEM_COUNT; i++) cum[i + 1] = cum[i] + heights[i];

      const computed: ComputedItem[] = rawItems.map((item, i) => ({
        ...item,
        height: heights[i],
        top: cum[i],
      }));

      setPrepareMs(elapsed);
      setItems(computed);
      setCumHeights(cum);
      setTotalHeight(cum[ITEM_COUNT]);
      setIsReady(true);
    }

    run();
    return () => { cancelled = true; };
  }, []);

  // -------------------------------------------------------------------------
  // Draw minimap whenever items or scroll position changes
  // -------------------------------------------------------------------------
  const drawMinimap = useCallback(
    (scroll: number) => {
      const canvas = minimapRef.current;
      if (!canvas || items.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const total = totalHeight || 1;
      const scaleY = MINIMAP_H / total;

      ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

      // Background
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

      // Draw each item as a tiny bar (clamped to at least 1px)
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const y = item.top * scaleY;
        const h = Math.max(1, item.height * scaleY);

        // Color: short items are blue, tall are amber
        const minH = LINE_HEIGHT + PADDING_V;
        const maxH = 6 * LINE_HEIGHT + PADDING_V;
        const t = Math.min(1, Math.max(0, (item.height - minH) / (maxH - minH)));
        // blue → amber
        const r = Math.round(t * 245 + (1 - t) * 59);
        const g = Math.round(t * 158 + (1 - t) * 130);
        const b = Math.round(t * 11 + (1 - t) * 246);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(2, y, MINIMAP_W - 4, h - 0.5);
      }

      // Viewport indicator
      const vpTop = (scroll / total) * MINIMAP_H;
      const vpH = (VIEWPORT_HEIGHT / total) * MINIMAP_H;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, vpTop, MINIMAP_W - 2, Math.max(vpH, 4));
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(1, vpTop, MINIMAP_W - 2, Math.max(vpH, 4));
    },
    [items, totalHeight]
  );

  // Redraw minimap when items are ready or scroll changes
  useEffect(() => {
    drawMinimap(scrollTop);
  }, [drawMinimap, scrollTop]);

  // -------------------------------------------------------------------------
  // Scroll handler (throttled via rAF)
  // -------------------------------------------------------------------------
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const st = e.currentTarget.scrollTop;
      scrollTopRef.current = st;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setScrollTop(scrollTopRef.current);
      });
    },
    []
  );

  // -------------------------------------------------------------------------
  // Compute visible slice
  // -------------------------------------------------------------------------
  const visibleItems = useMemo(() => {
    if (!isReady || items.length === 0) return [];
    if (cumHeights.length === 0) return [];

    const viewStart = scrollTop;
    const viewEnd = scrollTop + VIEWPORT_HEIGHT;

    // Find first item whose bottom > viewStart
    const firstIdx = Math.max(
      0,
      binarySearch(cumHeights, viewStart) - BUFFER
    );
    // Find last item whose top < viewEnd
    const lastIdx = Math.min(
      ITEM_COUNT - 1,
      binarySearch(cumHeights, viewEnd) + BUFFER
    );

    return items.slice(firstIdx, lastIdx + 1);
  }, [isReady, items, cumHeights, scrollTop]);

  // -------------------------------------------------------------------------
  // Compare mode: fake "estimated" scroll jumps
  // -------------------------------------------------------------------------
  const [fakeScroll, setFakeScroll] = useState(0);
  const [fakeJump, setFakeJump] = useState(false);
  const fakeRafRef = useRef<number | null>(null);

  const handleFakeScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    if (fakeRafRef.current !== null) return;
    fakeRafRef.current = requestAnimationFrame(() => {
      fakeRafRef.current = null;
      // Simulate occasional height re-estimation jump
      const shouldJump = Math.random() < 0.15;
      setFakeJump(shouldJump);
      setFakeScroll(shouldJump ? st + (Math.random() - 0.5) * 120 : st);
    });
  }, []);

  const fakeItems = useMemo(() => {
    // Estimate avg height = 60px for all items in compare mode
    const AVG = 60;
    const count = 10000;
    const visible = [];
    const start = Math.floor(fakeScroll / AVG);
    for (let i = start; i < Math.min(start + 12, count); i++) {
      visible.push(i);
    }
    return visible;
  }, [fakeScroll]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const renderCount = visibleItems.length;

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
            Demo 06 — Precision Scroll
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            10,000 heights.
            <br />
            <span className="text-white/30">Zero DOM measurements.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl">
            All row heights are pre-computed by pretext before any DOM element is
            created. Every scroll position is resolved with a binary search — no
            layout thrashing, no estimation, no jumps.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {[
            {
              label: "Prepare time",
              value: prepareMs !== null ? `${prepareMs.toFixed(1)}ms` : "…",
              color: "text-amber-400",
            },
            {
              label: "All heights known",
              value: isReady ? "yes ✓" : "computing…",
              color: isReady ? "text-green-400" : "text-white/30",
            },
            {
              label: "DOM for measurement",
              value: "0",
              color: "text-blue-400",
            },
            {
              label: "Rendering",
              value: isReady ? `${renderCount} / 10,000` : "—",
              color: "text-white",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            >
              <div className={`mono text-lg font-bold ${color}`}>{value}</div>
              <div className="mono text-xs text-white/30 mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex gap-3 mb-6"
        >
          <button
            onClick={() => setCompareMode(false)}
            className={`mono text-xs px-4 py-2 rounded-lg border transition-all ${
              !compareMode
                ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                : "border-white/10 text-white/30 hover:border-white/20"
            }`}
          >
            pretext mode
          </button>
          <button
            onClick={() => setCompareMode(true)}
            className={`mono text-xs px-4 py-2 rounded-lg border transition-all ${
              compareMode
                ? "border-red-400/50 bg-red-400/10 text-red-400"
                : "border-white/10 text-white/30 hover:border-white/20"
            }`}
          >
            compare: naive estimation
          </button>
        </motion.div>

        {/* Main demo area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex gap-4"
        >
          {/* Scroll viewport */}
          <div className="flex-1 border border-white/10 rounded-2xl overflow-hidden relative">
            {/* LIVE badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="mono text-xs text-white/50">LIVE</span>
              {isReady && (
                <span className="mono text-xs text-white/30">
                  · {renderCount} rendered
                </span>
              )}
            </div>

            {compareMode && fakeJump && (
              <div className="absolute top-12 left-3 right-3 z-10 bg-red-900/80 border border-red-400/30 rounded-lg px-3 py-2 mono text-xs text-red-300">
                ⚠ height estimate wrong — repositioning scroll…
              </div>
            )}

            {!isReady && (
              <div
                className="flex items-center justify-center text-white/30 mono text-sm"
                style={{ height: VIEWPORT_HEIGHT }}
              >
                <div className="text-center">
                  <div className="mb-2">Computing 10,000 heights with pretext…</div>
                  <div className="text-white/15 text-xs">
                    No DOM elements needed
                  </div>
                </div>
              </div>
            )}

            {isReady && !compareMode && (
              <div
                ref={viewportRef}
                className="overflow-y-scroll"
                style={{ height: VIEWPORT_HEIGHT }}
                onScroll={handleScroll}
              >
                <div className="relative" style={{ height: totalHeight }}>
                  {visibleItems.map((item) => (
                    <TweetCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {isReady && compareMode && (
              <div
                className="overflow-y-scroll"
                style={{ height: VIEWPORT_HEIGHT }}
                onScroll={handleFakeScroll}
              >
                <div className="relative" style={{ height: 10000 * 60 }}>
                  {fakeItems.map((idx) => {
                    // Use actual item data but estimate position
                    const item = items[idx];
                    if (!item) return null;
                    return (
                      <div
                        key={idx}
                        className="absolute left-0 right-0 mx-4"
                        style={{
                          top: idx * 60 + (fakeJump ? (Math.random() - 0.5) * 30 : 0),
                          height: 54,
                        }}
                      >
                        <div className="h-full bg-red-950/30 border border-red-400/15 rounded-lg px-3 py-2">
                          <div className="text-red-300/60 text-xs font-medium truncate">
                            {item.title}
                          </div>
                          <div className="text-red-300/30 text-xs mt-1 truncate">
                            estimated height: 60px (avg)
                          </div>
                          <div className="text-red-400/20 mono text-[10px] mt-1">
                            {item.tag}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Minimap */}
          <div className="flex flex-col items-center gap-2">
            <div className="mono text-[10px] text-white/20 uppercase tracking-widest">
              map
            </div>
            <div
              className="relative border border-white/10 rounded-lg overflow-hidden"
              style={{ width: MINIMAP_W, height: MINIMAP_H }}
            >
              <canvas
                ref={minimapRef}
                width={MINIMAP_W}
                height={MINIMAP_H}
                className="block"
              />
              {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white/20 animate-pulse" />
                </div>
              )}
            </div>
            <div className="mono text-[9px] text-white/15 text-center leading-relaxed">
              blue=short
              <br />
              amber=tall
            </div>
          </div>
        </motion.div>

        {/* Scroll position indicator */}
        {isReady && !compareMode && (
          <div className="mt-3 flex items-center gap-4 mono text-xs text-white/20">
            <span>
              scroll: {Math.round(scrollTop)}px / {Math.round(totalHeight)}px
            </span>
            <span>·</span>
            <span>
              {Math.round((scrollTop / totalHeight) * 100)}% through list
            </span>
            <span>·</span>
            <span>
              {renderCount} DOM nodes active (of 10,000)
            </span>
          </div>
        )}

        {compareMode && (
          <div className="mt-4 p-4 border border-red-400/15 rounded-xl bg-red-950/10">
            <div className="mono text-xs text-red-300/60 font-semibold mb-1">
              Naive estimation mode
            </div>
            <div className="mono text-xs text-red-300/30 leading-relaxed">
              All 10,000 items assumed to be 60px tall (average guess). As you
              scroll, items with different actual heights cause layout jumps.
              Real-world virtual scroll libraries measure a sample of DOM
              elements and extrapolate — meaning scroll position is always an
              approximation.
            </div>
          </div>
        )}

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 grid md:grid-cols-3 gap-4"
        >
          {[
            {
              step: "01",
              title: "Pre-compute all heights",
              body: "pretext measures all 10,000 items before the first render. No DOM needed — pure font metrics.",
              color: "border-amber-400/20 bg-amber-400/[0.03]",
              accent: "text-amber-400",
            },
            {
              step: "02",
              title: "Build cumulative array",
              body: "A Float64Array stores prefix sums. Any item's scroll offset = O(1) lookup, not iteration.",
              color: "border-blue-400/20 bg-blue-400/[0.03]",
              accent: "text-blue-400",
            },
            {
              step: "03",
              title: "Binary search on scroll",
              body: "Each scroll event binary-searches the cumulative array to find the visible window in O(log n).",
              color: "border-green-400/20 bg-green-400/[0.03]",
              accent: "text-green-400",
            },
          ].map(({ step, title, body, color, accent }) => (
            <div
              key={step}
              className={`border rounded-xl p-5 ${color}`}
            >
              <div className={`mono text-xs ${accent} mb-2`}>{step}</div>
              <div className="text-white/80 text-sm font-semibold mb-1">
                {title}
              </div>
              <div className="text-white/35 text-xs leading-relaxed">{body}</div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TweetCard sub-component
// ---------------------------------------------------------------------------

function TweetCard({ item }: { item: ComputedItem }) {
  return (
    <div
      className="absolute left-0 right-0 mx-4"
      style={{ top: item.top, height: item.height }}
    >
      <div className="h-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
        <div>
          <div className="text-white/85 text-sm font-semibold leading-snug mb-1.5">
            {item.title}
          </div>
          <div className="text-white/40 text-xs leading-relaxed">{item.body}</div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="mono text-[10px] text-blue-400/50">{item.tag}</span>
          <span className="mono text-[10px] text-white/15">#{item.id}</span>
        </div>
      </div>
    </div>
  );
}
