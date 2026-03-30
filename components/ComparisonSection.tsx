"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_TEXT = "Type here to see the difference...";

// Simulate DOM reflow cost: busy-waits for 3–5ms to mimic getBoundingClientRect thrash
function simulateDOMReflow(): number {
  const duration = 3 + Math.random() * 2; // 3–5ms
  const start = performance.now();
  // eslint-disable-next-line no-empty
  while (performance.now() - start < duration) {}
  return performance.now() - start;
}

const COMPARISON_ROWS = [
  { label: "Per measurement", dom: "~5ms", pretext: "~0.001ms" },
  { label: "100 items", dom: "~500ms", pretext: "~0.1ms" },
  { label: "Blocks thread", dom: "Yes", pretext: "No" },
  { label: "Triggers reflow", dom: "Yes", pretext: "No" },
  { label: "Works off DOM", dom: "No", pretext: "Yes" },
];

export default function ComparisonSection() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [reflowCount, setReflowCount] = useState(0);
  const [pretextCount, setPretextCount] = useState(0);
  const [cumulativeDomMs, setCumulativeDomMs] = useState(0);
  const [showReflowBadge, setShowReflowBadge] = useState(false);
  const [showPretextBadge, setShowPretextBadge] = useState(false);

  // Pretext-computed preview height
  const [pretextHeight, setPretextHeight] = useState<number>(80);
  // DOM-side preview height (fake, set after simulated reflow)
  const [domHeight, setDomHeight] = useState<number>(80);

  const domBadgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pretextBadgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preparedRef = useRef<unknown>(null);
  const textRef = useRef(text);
  textRef.current = text;

  // Derived: bar chart max for DOM side (cap visual at 200ms for sanity)
  const domBarWidth = Math.min(100, (cumulativeDomMs / 200) * 100);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setText(val);
      preparedRef.current = null; // invalidate prepared ref on text change

      // ── DOM SIDE ──────────────────────────────────────────────────
      const cost = simulateDOMReflow();
      setReflowCount((c) => c + 1);
      setCumulativeDomMs((ms) => ms + cost);
      // Fake DOM height: approximate by char count / container width
      const approxLines = Math.max(1, Math.ceil((val.length * 8.5) / 340));
      setDomHeight(approxLines * 24 + 16);

      // Flash reflow badge
      setShowReflowBadge(true);
      if (domBadgeTimer.current) clearTimeout(domBadgeTimer.current);
      domBadgeTimer.current = setTimeout(() => setShowReflowBadge(false), 300);

      // ── PRETEXT SIDE ─────────────────────────────────────────────
      try {
        const { prepare, layout } = await import("@chenglou/pretext");
        const prepared = prepare(val, "15px Arial");
        preparedRef.current = prepared;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = layout(prepared as any, 340, 24);
        setPretextHeight(Math.max(48, Math.round(result.height) + 16));
      } catch {
        const lines = Math.max(1, Math.ceil((val.length * 8.5) / 340));
        setPretextHeight(lines * 24 + 16);
      }

      setPretextCount((c) => c + 1);

      // Flash pretext badge
      setShowPretextBadge(true);
      if (pretextBadgeTimer.current) clearTimeout(pretextBadgeTimer.current);
      pretextBadgeTimer.current = setTimeout(() => setShowPretextBadge(false), 250);
    },
    []
  );

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (domBadgeTimer.current) clearTimeout(domBadgeTimer.current);
      if (pretextBadgeTimer.current) clearTimeout(pretextBadgeTimer.current);
    };
  }, []);

  const showBlockedWarning = reflowCount >= 5;

  return (
    <section
      className="py-32 px-6 border-t border-white/10"
      style={{ background: "#050505" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="mono text-xs text-white/30 mb-4 uppercase tracking-widest">
            Live Demo — Side by Side
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            See the difference
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Type the same text. Watch what happens to your browser.
          </p>
        </motion.div>

        {/* Two-panel comparison */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* ── LEFT: DOM WAY ─────────────────────────────────────────────── */}
          <div
            className="p-6 md:p-8 flex flex-col gap-5"
            style={{ background: "rgba(220,38,38,0.04)" }}
          >
            {/* Label */}
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"
                style={{ boxShadow: "0 0 8px rgba(239,68,68,0.7)" }}
              />
              <span className="mono text-xs text-white/50 uppercase tracking-widest">
                DOM Measurement
              </span>
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={handleChange}
              rows={3}
              className="w-full bg-white/5 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-white/80 resize-none outline-none focus:border-red-500/40 placeholder-white/20 transition-colors"
              placeholder="Type here..."
              style={{ fontFamily: "Arial, sans-serif" }}
            />

            {/* Preview box */}
            <motion.div
              animate={{ height: domHeight }}
              transition={{ duration: 0.15 }}
              className="w-full overflow-hidden rounded-lg border border-red-500/15 px-4 py-3 text-sm text-white/60 relative"
              style={{
                background: "rgba(220,38,38,0.05)",
                fontFamily: "Arial, sans-serif",
                fontSize: 15,
                lineHeight: "24px",
              }}
            >
              <span className="break-words">{text || " "}</span>
              {/* Reflow shimmer overlay */}
              <AnimatePresence>
                {showReflowBadge && (
                  <motion.div
                    key="shimmer"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "rgba(220,38,38,0.12)" }}
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Reflow count */}
            <div className="flex items-end justify-between">
              <div>
                <div className="mono text-xs text-red-400/60 uppercase tracking-widest mb-1">
                  Reflows triggered
                </div>
                <motion.div
                  key={reflowCount}
                  initial={{ scale: 1.25, color: "#f87171" }}
                  animate={{ scale: 1, color: "#ef4444" }}
                  transition={{ duration: 0.2 }}
                  className="text-5xl font-black tabular-nums"
                  style={{ color: "#ef4444" }}
                >
                  {reflowCount}
                </motion.div>
              </div>

              {/* Flash badge */}
              <AnimatePresence>
                {showReflowBadge && (
                  <motion.div
                    key="reflow-badge"
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="mono text-xs font-bold px-3 py-1.5 rounded-md"
                    style={{
                      background: "rgba(239,68,68,0.2)",
                      border: "1px solid rgba(239,68,68,0.5)",
                      color: "#f87171",
                    }}
                  >
                    ⚡ REFLOW!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timing label */}
            <div className="mono text-xs text-red-400/70">
              ~3–8ms per measurement
            </div>

            {/* Warning after 5 reflows */}
            <AnimatePresence>
              {showBlockedWarning && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(234,179,8,0.08)",
                    border: "1px solid rgba(234,179,8,0.25)",
                  }}
                >
                  <span className="text-yellow-400 text-xs">⚠</span>
                  <span className="mono text-xs text-yellow-400/80">
                    Main thread blocked {reflowCount} times
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cumulative cost bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="mono text-xs text-white/25 uppercase tracking-widest">
                  Cumulative cost
                </span>
                <span className="mono text-xs text-red-400">
                  {cumulativeDomMs.toFixed(1)}ms
                </span>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 8, background: "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  animate={{ width: `${domBarWidth}%` }}
                  transition={{ duration: 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #dc2626, #ef4444, #f87171)",
                    boxShadow: "0 0 8px rgba(239,68,68,0.5)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT: PRETEXT ─────────────────────────────────────────────── */}
          <div
            className="p-6 md:p-8 flex flex-col gap-5"
            style={{ background: "rgba(34,197,94,0.03)" }}
          >
            {/* Label */}
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"
                style={{ boxShadow: "0 0 8px rgba(34,197,94,0.7)" }}
              />
              <span className="mono text-xs text-white/50 uppercase tracking-widest">
                Pretext
              </span>
            </div>

            {/* Textarea — synced, read-only appearance via same state */}
            <textarea
              value={text}
              onChange={handleChange}
              rows={3}
              className="w-full bg-white/5 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-white/80 resize-none outline-none focus:border-green-500/40 placeholder-white/20 transition-colors"
              placeholder="Type here..."
              style={{ fontFamily: "Arial, sans-serif" }}
            />

            {/* Preview box */}
            <motion.div
              animate={{ height: pretextHeight }}
              transition={{ duration: 0.12 }}
              className="w-full overflow-hidden rounded-lg border border-green-500/15 px-4 py-3 text-sm text-white/60 relative"
              style={{
                background: "rgba(34,197,94,0.04)",
                fontFamily: "Arial, sans-serif",
                fontSize: 15,
                lineHeight: "24px",
              }}
            >
              <span className="break-words">{text || " "}</span>
            </motion.div>

            {/* Layout call count */}
            <div className="flex items-end justify-between">
              <div>
                <div className="mono text-xs text-green-400/60 uppercase tracking-widest mb-1">
                  Layout calls
                </div>
                <motion.div
                  key={pretextCount}
                  initial={{ scale: 1.15, color: "#4ade80" }}
                  animate={{ scale: 1, color: "#22c55e" }}
                  transition={{ duration: 0.15 }}
                  className="text-5xl font-black tabular-nums"
                  style={{ color: "#22c55e" }}
                >
                  {pretextCount}
                </motion.div>
              </div>

              {/* Flash badge */}
              <AnimatePresence>
                {showPretextBadge && (
                  <motion.div
                    key="pretext-badge"
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="mono text-xs font-bold px-3 py-1.5 rounded-md"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.4)",
                      color: "#4ade80",
                    }}
                  >
                    ✓ PRETEXT
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timing label */}
            <div className="mono text-xs text-green-400/70">
              ~0.001ms per layout
            </div>

            {/* Spacer to match warning height (always visible, invisible) */}
            <div
              className="px-3 py-2 rounded-lg invisible"
              style={{ border: "1px solid transparent" }}
            >
              <span className="mono text-xs">placeholder</span>
            </div>

            {/* Flat bar — always near zero */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="mono text-xs text-white/25 uppercase tracking-widest">
                  Cumulative cost
                </span>
                <span className="mono text-xs text-green-400">
                  {pretextCount > 0
                    ? (pretextCount * 0.001).toFixed(3)
                    : "0.000"}
                  ms
                </span>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 8, background: "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  animate={{
                    width:
                      pretextCount > 0
                        ? `${Math.min(100, (pretextCount * 0.001) / 200 * 100)}%`
                        : "0%",
                  }}
                  transition={{ duration: 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #16a34a, #22c55e, #4ade80)",
                    boxShadow: "0 0 6px rgba(34,197,94,0.4)",
                    minWidth: pretextCount > 0 ? 3 : 0,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 border border-white/10 rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          {/* Table header */}
          <div className="grid grid-cols-3 border-b border-white/10">
            <div className="px-6 py-4 mono text-xs text-white/30 uppercase tracking-widest" />
            <div className="px-6 py-4 mono text-xs text-red-400/70 uppercase tracking-widest border-l border-white/10">
              DOM
            </div>
            <div className="px-6 py-4 mono text-xs text-green-400/70 uppercase tracking-widest border-l border-white/10">
              Pretext
            </div>
          </div>

          {COMPARISON_ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
              className="grid grid-cols-3 border-b border-white/5 last:border-0"
            >
              <div className="px-6 py-4 text-sm text-white/50">{row.label}</div>
              <div
                className="px-6 py-4 mono text-sm font-medium border-l border-white/10"
                style={{
                  color:
                    row.dom === "Yes" || row.dom === "No"
                      ? row.dom === "Yes"
                        ? "#f87171"
                        : "#6b7280"
                      : "#f87171",
                }}
              >
                {row.dom}
              </div>
              <div
                className="px-6 py-4 mono text-sm font-medium border-l border-white/10"
                style={{
                  color:
                    row.pretext === "Yes" || row.pretext === "No"
                      ? row.pretext === "No"
                        ? "#4ade80"
                        : "#6b7280"
                      : "#4ade80",
                }}
              >
                {row.pretext}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
