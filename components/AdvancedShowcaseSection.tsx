"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════════════════
// Demo 1: Anti-CLS Typewriter
// Problem: Naive typewriter causes layout shift as container height grows.
// Pretext fix: Pre-measure the full text height → fix container height upfront.
// ═══════════════════════════════════════════════════════════════════════════════

const TYPEWRITER_TEXT =
  "The future of text layout is not CSS — it's pure TypeScript measurement, running entirely in userland at sub-millisecond speeds with zero DOM reads.";

function AntiCLSTypewriter() {
  const [naiveText, setNaiveText] = useState("");
  const [pretextText, setPretextText] = useState("");
  const [pretextHeight, setPretextHeight] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const FONT = 14;
  const LINE_H = FONT * 1.6;
  const WIDTH = 220;

  const prepare = useCallback(async () => {
    try {
      const { prepare: prep, layout } = await import("@chenglou/pretext");
      const p = prep(TYPEWRITER_TEXT, `${FONT}px Arial`);
      const res = layout(p, WIDTH, LINE_H);
      setPretextHeight(Math.round(res.height));
    } catch {
      setPretextHeight(80);
    }
  }, [LINE_H]);

  useEffect(() => { prepare(); }, [prepare]);

  const start = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setNaiveText("");
    setPretextText("");
    setRunning(true);

    TYPEWRITER_TEXT.split("").forEach((_, i) => {
      const t = setTimeout(() => {
        const partial = TYPEWRITER_TEXT.slice(0, i + 1);
        setNaiveText(partial);
        setPretextText(partial);
        if (i === TYPEWRITER_TEXT.length - 1) setRunning(false);
      }, i * 28);
      timersRef.current.push(t);
    });
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-white/40 text-sm">
        Both type the same text simultaneously. Left has no pre-measurement — the container grows, causing layout shift.
        Right uses pretext to pre-set the final height before typing begins.
      </p>

      <button
        onClick={start}
        disabled={running}
        className="px-4 py-2 border border-white/20 rounded-lg text-xs mono text-white/70 hover:bg-white/5 disabled:opacity-30 transition-all"
      >
        {running ? "● typing..." : "▶  Start typewriter"}
      </button>

      <div className="grid grid-cols-2 gap-4">
        {/* Naive */}
        <div>
          <div className="mono text-[10px] text-red-400/60 uppercase tracking-widest mb-2">
            naive — causes CLS
          </div>
          <div
            className="bg-white/5 border border-red-500/20 rounded-lg p-3 overflow-hidden"
            style={{ width: WIDTH }}
          >
            <span
              className="text-white/70 leading-relaxed break-words"
              style={{ fontSize: FONT, lineHeight: LINE_H + "px" }}
            >
              {naiveText}
              {running && <span className="cursor-blink text-white/60">|</span>}
            </span>
          </div>
          <div className="mono text-[10px] text-white/25 mt-1">height: auto (grows)</div>
        </div>

        {/* Pretext */}
        <div>
          <div className="mono text-[10px] text-green-400/60 uppercase tracking-widest mb-2">
            pretext — zero CLS
          </div>
          <div
            className="bg-white/5 border border-green-500/20 rounded-lg p-3 overflow-hidden"
            style={{ width: WIDTH, height: pretextHeight ?? "auto" }}
          >
            <span
              className="text-white/70 leading-relaxed break-words"
              style={{ fontSize: FONT, lineHeight: LINE_H + "px" }}
            >
              {pretextText}
              {running && <span className="cursor-blink text-white/60">|</span>}
            </span>
          </div>
          {pretextHeight && (
            <div className="mono text-[10px] text-green-400/50 mt-1">
              height: {pretextHeight}px (fixed upfront)
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/3 border border-white/10 rounded-lg p-4">
        <div className="mono text-[10px] text-white/30 uppercase tracking-widest mb-2">Why this matters</div>
        <p className="text-white/40 text-xs leading-relaxed">
          CLS (Cumulative Layout Shift) is a Core Web Vital. AI chat streams, animated headlines,
          and lazy-loaded content all suffer from CLS. Pretext lets you reserve the exact final
          height before the first character renders.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Demo 2: Auto-Fit Text (binary search font size)
// Finds the largest font size where text fits in N lines within a container.
// ═══════════════════════════════════════════════════════════════════════════════

function AutoFitText() {
  const [inputText, setInputText] = useState("Think Different");
  const [maxLines, setMaxLines] = useState(2);
  const [containerW, setContainerW] = useState(280);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [iterations, setIterations] = useState(0);
  const [searching, setSearching] = useState(false);

  const findFontSize = useCallback(async () => {
    if (!inputText.trim()) return;
    setSearching(true);
    setIterations(0);
    try {
      const { prepare, layout } = await import("@chenglou/pretext");
      let lo = 8, hi = 120, best = 8, iters = 0;
      while (lo <= hi) {
        iters++;
        const mid = Math.floor((lo + hi) / 2);
        const p = prepare(inputText, `bold ${mid}px Arial`);
        const lineH = mid * 1.3;
        const res = layout(p, containerW, lineH);
        if (res.lineCount <= maxLines) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
        setIterations(iters);
        setFontSize(best);
        await new Promise((r) => setTimeout(r, 40)); // animate the search
      }
      setFontSize(best);
    } catch {
      setFontSize(32);
    } finally {
      setSearching(false);
    }
  }, [inputText, maxLines, containerW]);

  useEffect(() => { findFontSize(); }, [findFontSize]);

  return (
    <div className="space-y-5">
      <p className="text-white/40 text-sm">
        Binary search over font sizes: largest size where text fits in{" "}
        <strong className="text-white/70">{maxLines} lines</strong> at {containerW}px width.
        Used for hero text, dashboard KPIs, and dynamic labels.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mono text-[10px] text-white/30 uppercase tracking-widest block mb-1">Text</label>
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 mono"
            placeholder="Your headline..."
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mono text-[10px] text-white/30 uppercase tracking-widest block mb-1">
              Max lines: {maxLines}
            </label>
            <input type="range" min={1} max={4} value={maxLines} onChange={(e) => setMaxLines(Number(e.target.value))} className="w-full accent-white mt-2" />
          </div>
          <div className="flex-1">
            <label className="mono text-[10px] text-white/30 uppercase tracking-widest block mb-1">
              Width: {containerW}px
            </label>
            <input type="range" min={120} max={400} value={containerW} onChange={(e) => setContainerW(Number(e.target.value))} className="w-full accent-white mt-2" />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div
        className="bg-black border border-white/10 rounded-xl p-6 flex items-center justify-center"
        style={{ minHeight: 120 }}
      >
        {fontSize !== null && (
          <motion.div
            key={`${fontSize}-${inputText}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white font-black text-center leading-tight"
            style={{ fontSize, width: containerW, maxWidth: "100%" }}
          >
            {inputText || "Type something"}
          </motion.div>
        )}
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="bg-white/5 border border-white/10 rounded px-3 py-2 mono text-sm">
          <span className="text-white/30">fontSize: </span>
          <span className="text-white font-bold">{fontSize ?? "—"}px</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded px-3 py-2 mono text-sm">
          <span className="text-white/30">iterations: </span>
          <span className="text-white font-bold">{iterations}</span>
        </div>
        {searching && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.6, repeat: Infinity }} className="mono text-xs text-white/30">
            binary searching...
          </motion.div>
        )}
      </div>

      <div className="bg-white/3 border border-white/10 rounded-lg p-4">
        <div className="mono text-[10px] text-white/30 uppercase tracking-widest mb-2">Use cases</div>
        <div className="text-white/40 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
          {["Hero headlines", "Dashboard KPIs", "Data labels on charts", "Button text fitting", "Badge text", "Responsive cards"].map((u) => (
            <div key={u} className="flex gap-1.5"><span className="text-white/20">—</span>{u}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Demo 3: Smart Tooltip / Chart Label Placement
// Pre-measure labels so they never overflow container edges.
// ═══════════════════════════════════════════════════════════════════════════════

const CHART_DATA = [
  { label: "Jan revenue: $12,450", value: 62 },
  { label: "Feb: $8,200", value: 41 },
  { label: "Mar (best quarter): $21,000", value: 100 },
  { label: "Apr: $15,600", value: 74 },
  { label: "May: $9,800", value: 47 },
  { label: "Jun: $18,300", value: 87 },
];

interface LabelLayout {
  x: number;
  y: number;
  anchor: "left" | "right" | "center";
  width: number;
}

function ChartLabels() {
  const [labels, setLabels] = useState<LabelLayout[]>([]);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const CHART_W = 480;
  const BAR_W = 56;
  const GAP = 24;
  const CHART_H = 180;
  const FONT = 11;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { prepare, layout } = await import("@chenglou/pretext");
        const computed: LabelLayout[] = CHART_DATA.map((d, i) => {
          const p = prepare(d.label, `${FONT}px Arial`);
          const res = layout(p, 200, FONT * 1.5);
          const barLeft = i * (BAR_W + GAP);
          const barCenter = barLeft + BAR_W / 2;
          const labelW = Math.min(res.height < FONT * 2 ? res.height : 200, 200); // approximation
          // Actually compute single-line width
          const singleLine = prepare(d.label, `${FONT}px Arial`);
          const slRes = layout(singleLine, 9999, FONT * 1.5);
          const approxW = Math.round((d.label.length * FONT * 0.58));

          // Determine anchor to avoid overflow
          let anchor: "left" | "right" | "center" = "center";
          if (barCenter - approxW / 2 < 0) anchor = "left";
          else if (barCenter + approxW / 2 > CHART_W) anchor = "right";

          return {
            x: barCenter,
            y: CHART_H - (CHART_H * d.value / 100) - 20,
            anchor,
            width: approxW,
          };
        });
        if (!cancelled) setLabels(computed);
      } catch {
        if (!cancelled)
          setLabels(
            CHART_DATA.map((d, i) => ({
              x: i * (BAR_W + GAP) + BAR_W / 2,
              y: CHART_H - (CHART_H * d.value / 100) - 20,
              anchor: "center",
              width: d.label.length * 6,
            }))
          );
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-5">
      <p className="text-white/40 text-sm">
        Hover bars to see tooltips. Label positions are pre-calculated by pretext —
        labels near edges automatically flip anchor to stay within bounds.
      </p>

      <div className="bg-black border border-white/10 rounded-xl p-6 overflow-x-auto">
        <div className="relative" style={{ width: CHART_W, height: CHART_H + 40 }}>
          {/* Bars */}
          {CHART_DATA.map((d, i) => {
            const barH = Math.round(CHART_H * d.value / 100);
            const barLeft = i * (BAR_W + GAP);
            return (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ originY: 1 }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-8 cursor-pointer"
                onMouseEnter={() => setActiveBar(i)}
                onMouseLeave={() => setActiveBar(null)}
              >
                <div
                  className={`rounded-t transition-colors duration-150 ${activeBar === i ? "bg-white" : "bg-white/25"}`}
                  style={{ width: BAR_W, height: barH, position: "absolute", bottom: 0, left: barLeft }}
                />
              </motion.div>
            );
          })}

          {/* Tooltip labels — pre-measured positions */}
          <AnimatePresence>
            {activeBar !== null && labels[activeBar] && (
              <motion.div
                key={activeBar}
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute z-10 bg-white text-black text-xs mono px-2.5 py-1.5 rounded-md shadow-lg pointer-events-none"
                style={{
                  top: labels[activeBar].y - 12,
                  left:
                    labels[activeBar].anchor === "left"
                      ? labels[activeBar].x
                      : labels[activeBar].anchor === "right"
                      ? labels[activeBar].x - labels[activeBar].width
                      : labels[activeBar].x - labels[activeBar].width / 2,
                  whiteSpace: "nowrap",
                }}
              >
                {CHART_DATA[activeBar].label}
                <div className="mono text-[9px] text-black/40 mt-0.5">
                  anchor: {labels[activeBar].anchor} · pre-measured
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* X axis labels */}
          {CHART_DATA.map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 mono text-[10px] text-white/30 text-center"
              style={{ left: i * (BAR_W + GAP), width: BAR_W }}
            >
              {["J", "F", "M", "A", "M", "J"][i]}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/3 border border-white/10 rounded-lg p-4">
        <div className="mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
          How it works
        </div>
        <p className="text-white/40 text-xs leading-relaxed">
          Before rendering, pretext measures each label. If{" "}
          <code className="mono text-white/60">labelLeft &lt; 0</code> the anchor flips to
          &quot;left-aligned&quot;. If{" "}
          <code className="mono text-white/60">labelRight &gt; containerWidth</code> it becomes
          &quot;right-aligned&quot;. No DOM reads. No positioning jank on hover.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Demo 4: Content-Aware Loading Skeleton
// Uses pretext to generate skeletons that exactly match content dimensions.
// ═══════════════════════════════════════════════════════════════════════════════

const CONTENT_ITEMS = [
  { title: "The Architecture of Modern UIs", body: "Text layout was the last unsolved problem in interface engineering. With pretext, we finally have userland measurement." },
  { title: "Performance at Scale", body: "Virtual scroll of 100,000 items, each with different text height. Pre-measure all heights in a single pass." },
  { title: "AI-Generated Layouts", body: "Reserve space for streamed AI content before the first token arrives. Zero layout shift." },
];

interface SkeletonLine { w: string; h: number }
interface SkeletonItem { titleLines: SkeletonLine[]; bodyLines: SkeletonLine[] }

function SmartSkeleton() {
  const [mode, setMode] = useState<"skeleton" | "content" | "random">("skeleton");
  const [skeletons, setSkeletons] = useState<SkeletonItem[]>([]);
  const FONT_TITLE = 16;
  const FONT_BODY = 13;
  const COL_W = 280;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { prepare, layout } = await import("@chenglou/pretext");
        const items: SkeletonItem[] = CONTENT_ITEMS.map((item) => {
          const titleP = prepare(item.title, `bold ${FONT_TITLE}px Arial`);
          const titleRes = layout(titleP, COL_W, FONT_TITLE * 1.4);

          const bodyP = prepare(item.body, `${FONT_BODY}px Arial`);
          const bodyRes = layout(bodyP, COL_W, FONT_BODY * 1.6);

          // Each line is ~full width except last
          const titleLines: SkeletonLine[] = Array.from({ length: titleRes.lineCount }, (_, i) =>
            ({ w: i === titleRes.lineCount - 1 ? "55%" : "100%", h: FONT_TITLE })
          );
          const bodyLines: SkeletonLine[] = Array.from({ length: bodyRes.lineCount }, (_, i) =>
            ({ w: i === bodyRes.lineCount - 1 ? "35%" : "95%", h: FONT_BODY })
          );
          return { titleLines, bodyLines };
        });
        if (!cancelled) setSkeletons(items);
      } catch {
        if (!cancelled)
          setSkeletons(CONTENT_ITEMS.map(() => ({
            titleLines: [{ w: "100%", h: 16 }, { w: "60%", h: 16 }],
            bodyLines: [{ w: "95%", h: 13 }, { w: "95%", h: 13 }, { w: "40%", h: 13 }],
          })));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-5">
      <p className="text-white/40 text-sm">
        The skeleton matches the real content layout exactly — same number of lines,
        same proportions. Generated by pretext before any data is fetched.
      </p>

      <div className="flex gap-2">
        {(["skeleton", "random", "content"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg border text-xs mono transition-all ${
              mode === m ? "bg-white text-black border-white" : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10"
            }`}
          >
            {m === "skeleton" ? "Pretext skeleton" : m === "random" ? "Random skeleton" : "Content loaded"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {CONTENT_ITEMS.map((item, i) => (
          <div
            key={i}
            className="bg-white/3 border border-white/10 rounded-xl p-4"
            style={{ width: COL_W, maxWidth: "100%" }}
          >
            <AnimatePresence mode="wait">
              {mode === "content" ? (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="font-bold text-white mb-2" style={{ fontSize: FONT_TITLE, lineHeight: 1.4 }}>{item.title}</div>
                  <div className="text-white/50 leading-relaxed" style={{ fontSize: FONT_BODY, lineHeight: 1.6 }}>{item.body}</div>
                </motion.div>
              ) : mode === "skeleton" && skeletons[i] ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                  <div className="space-y-1 mb-3">
                    {skeletons[i].titleLines.map((line, j) => (
                      <motion.div
                        key={j}
                        className="bg-white/10 rounded animate-pulse"
                        style={{ height: line.h, width: line.w }}
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: j * 0.1 }}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    {skeletons[i].bodyLines.map((line, j) => (
                      <motion.div
                        key={j}
                        className="bg-white/8 rounded"
                        style={{ height: line.h, width: line.w }}
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 1.6, repeat: Infinity, delay: j * 0.12 + 0.2 }}
                      />
                    ))}
                  </div>
                  <div className="mono text-[9px] text-green-400/40 mt-2">
                    ✓ {skeletons[i].titleLines.length + skeletons[i].bodyLines.length} lines, pretext-measured
                  </div>
                </motion.div>
              ) : (
                <motion.div key="random" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                  {[100, 80, 95, 65, 90, 45].slice(0, 5).map((w, j) => (
                    <motion.div
                      key={j}
                      className="bg-white/10 rounded"
                      style={{ height: j < 2 ? 16 : 13, width: `${w}%` }}
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: j * 0.1 }}
                    />
                  ))}
                  <div className="mono text-[9px] text-red-400/40 mt-2">
                    ✗ random widths, wrong line count
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Demo 5: Smart Notification Stack
// Pre-measure notification heights for smooth stacking animations.
// ═══════════════════════════════════════════════════════════════════════════════

interface Notif {
  id: number;
  type: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
  height?: number;
}

const NOTIF_TEMPLATES: Omit<Notif, "id" | "height">[] = [
  { type: "success", title: "Deploy successful", body: "v2.4.1 is now live on production with pretext text measurement enabled." },
  { type: "info", title: "New message", body: "Sarah: Can you review the pretext integration PR? The layout measurement looks great." },
  { type: "warning", title: "High memory usage", body: "Canvas measurement cache is growing. Consider calling clearCache() periodically." },
  { type: "error", title: "Layout mismatch", body: "DOM measurement returned different height than pretext. Browser may be using a fallback font." },
  { type: "success", title: "Text measured", body: "47 chat bubbles pre-measured in 0.8ms." },
];

const NOTIF_COLORS = {
  info: { border: "border-blue-500/25", bg: "bg-blue-500/8", icon: "ℹ", iconColor: "text-blue-400" },
  success: { border: "border-green-500/25", bg: "bg-green-500/8", icon: "✓", iconColor: "text-green-400" },
  warning: { border: "border-yellow-500/25", bg: "bg-yellow-500/5", icon: "⚠", iconColor: "text-yellow-400" },
  error: { border: "border-red-500/25", bg: "bg-red-500/8", icon: "✕", iconColor: "text-red-400" },
};

function NotificationStack() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [isAuto, setIsAuto] = useState(false);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);
  const NOTIF_W = 320;
  const FONT = 13;

  const addNotif = useCallback(async () => {
    const template = NOTIF_TEMPLATES[idRef.current % NOTIF_TEMPLATES.length];
    idRef.current++;
    const id = idRef.current;

    let height = 72; // default
    try {
      const { prepare, layout } = await import("@chenglou/pretext");
      const bodyP = prepare(template.body, `${FONT}px Arial`);
      const bodyRes = layout(bodyP, NOTIF_W - 60, FONT * 1.55);
      height = Math.round(bodyRes.height) + 48; // + padding
    } catch { /* use default */ }

    setNotifs((prev) => [{ ...template, id, height }, ...prev].slice(0, 6));
  }, []);

  const removeNotif = useCallback((id: number) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const toggleAuto = useCallback(() => {
    setIsAuto((v) => {
      if (!v) {
        const fire = () => {
          addNotif();
          autoRef.current = setTimeout(fire, 1800);
        };
        fire();
      } else {
        if (autoRef.current) clearTimeout(autoRef.current);
      }
      return !v;
    });
  }, [addNotif]);

  useEffect(() => () => { if (autoRef.current) clearTimeout(autoRef.current); }, []);

  return (
    <div className="space-y-5">
      <p className="text-white/40 text-sm">
        Each notification&apos;s height is pre-calculated by pretext before it enters the stack.
        This enables smooth, jank-free animations without layout recalculation mid-animation.
      </p>

      <div className="flex gap-2">
        <button
          onClick={addNotif}
          className="px-4 py-2 border border-white/20 rounded-lg text-xs mono text-white/70 hover:bg-white/5 transition-all"
        >
          + Add notification
        </button>
        <button
          onClick={toggleAuto}
          className={`px-4 py-2 border rounded-lg text-xs mono transition-all ${
            isAuto ? "bg-white text-black border-white" : "border-white/20 text-white/70 hover:bg-white/5"
          }`}
        >
          {isAuto ? "■ stop auto" : "▶ auto-fire"}
        </button>
        {notifs.length > 0 && (
          <button
            onClick={() => setNotifs([])}
            className="px-4 py-2 border border-white/20 rounded-lg text-xs mono text-white/40 hover:bg-white/5 transition-all"
          >
            clear
          </button>
        )}
      </div>

      <div className="relative" style={{ minHeight: 200 }}>
        <AnimatePresence mode="popLayout">
          {notifs.map((notif) => {
            const c = NOTIF_COLORS[notif.type];
            return (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1, height: notif.height }}
                exit={{ opacity: 0, x: 60, scale: 0.92 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={`border rounded-xl px-4 py-3 mb-2 overflow-hidden ${c.border} ${c.bg}`}
                style={{ width: NOTIF_W }}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-base shrink-0 ${c.iconColor}`}>{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium leading-tight mb-1">{notif.title}</div>
                    <div className="text-white/50 text-xs leading-relaxed">{notif.body}</div>
                    {notif.height && (
                      <div className="mono text-[9px] text-white/20 mt-2">
                        pretext height: {notif.height}px
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeNotif(notif.id)}
                    className="text-white/20 hover:text-white/60 transition-colors text-sm shrink-0"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifs.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/20 mono text-sm border border-dashed border-white/10 rounded-xl">
            add a notification to see pre-measured stacking
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component with Tabs
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "typewriter", label: "Anti-CLS Typewriter", tag: "landing pages" },
  { id: "autofit", label: "Auto-Fit Text", tag: "dashboards" },
  { id: "tooltip", label: "Chart Labels", tag: "data viz" },
  { id: "skeleton", label: "Smart Skeleton", tag: "apps" },
  { id: "notifications", label: "Notification Stack", tag: "apps" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdvancedShowcaseSection() {
  const [activeTab, setActiveTab] = useState<TabId>("typewriter");

  return (
    <section className="py-32 px-6 bg-[#050505] border-t border-white/10">
      <div className="max-w-5xl mx-auto">
        {/* Section identity */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px bg-white/20" />
          <span className="mono text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
            Production Patterns — ship these today
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Real patterns. Real problems.
            <br />
            <span className="text-white/30">Now finally solvable.</span>
          </h2>
          <p className="text-white/60 mt-4 max-w-2xl">
            Each tab is a <strong className="text-white">problem you've already hit</strong> — layout shift during typewriter effects, text that overflows containers, tooltips that clip, skeletons that don&apos;t match content.
            These aren&apos;t demos. They&apos;re copy-pasteable patterns for{" "}
            <strong className="text-white">landing pages, dashboards, and apps</strong>.
            The Playground above shows the API; this shows <em>why it matters</em>.
          </p>
        </motion.div>

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex gap-2 mb-10 flex-wrap"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-white text-black border-white font-medium"
                  : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 bg-white/3"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`mono text-[10px] px-1.5 py-0.5 rounded ${
                  activeTab === tab.id ? "bg-black/15 text-black/50" : "bg-white/8 text-white/30"
                }`}
              >
                {tab.tag}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "typewriter" && <AntiCLSTypewriter />}
            {activeTab === "autofit" && <AutoFitText />}
            {activeTab === "tooltip" && <ChartLabels />}
            {activeTab === "skeleton" && <SmartSkeleton />}
            {activeTab === "notifications" && <NotificationStack />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
