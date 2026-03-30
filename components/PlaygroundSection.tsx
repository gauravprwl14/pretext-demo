"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TextMetrics {
  lineCount: number;
  height: number;
  width: number;
  measuredAt: number;
}

const DEFAULT_TEXT =
  "Hello world! This is pretext measuring your text without touching the DOM. No getBoundingClientRect, no reflow, no layout thrashing — just pure math at the speed of JavaScript.";

export default function PlaygroundSection() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [maxWidth, setMaxWidth] = useState(340);
  const [fontSize, setFontSize] = useState(16);
  const [metrics, setMetrics] = useState<TextMetrics | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [cursorMode, setCursorMode] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const preparedRef = useRef<unknown>(null);
  const workerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(
    async (w?: number) => {
      const width = w ?? maxWidth;
      if (!text.trim()) return;
      setMeasuring(true);
      const start = performance.now();
      try {
        const { prepare, layout } = await import("@chenglou/pretext");
        const fontSpec = `${fontSize}px Arial`;
        const lineHeight = fontSize * 1.5;
        // Only re-prepare when text or font changes
        if (!preparedRef.current) {
          preparedRef.current = prepare(text, fontSpec);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = layout(preparedRef.current as any, width, lineHeight);
        const elapsed = performance.now() - start;
        setMetrics({ lineCount: result.lineCount, height: Math.round(result.height), width, measuredAt: elapsed });
      } catch {
        const lines = Math.ceil((text.length * fontSize * 0.55) / width);
        const lineHeight = fontSize * 1.5;
        setMetrics({ lineCount: lines, height: Math.round(lines * lineHeight), width, measuredAt: 0 });
      } finally {
        setMeasuring(false);
      }
    },
    [text, maxWidth, fontSize]
  );

  // Re-prepare when text or font size changes
  useEffect(() => {
    preparedRef.current = null;
    if (workerRef.current) clearTimeout(workerRef.current);
    workerRef.current = setTimeout(() => measure(), 150);
    return () => { if (workerRef.current) clearTimeout(workerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, fontSize]);

  // Re-layout (instant) when width changes
  useEffect(() => {
    if (preparedRef.current) {
      measure(maxWidth);
    } else {
      if (workerRef.current) clearTimeout(workerRef.current);
      workerRef.current = setTimeout(() => measure(maxWidth), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxWidth]);

  // ── Drag handle ──────────────────────────────────────────────────────
  const dragRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const newW = Math.max(100, Math.min(600, e.clientX - rect.left));
    setMaxWidth(Math.round(newW));
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  }, [handleDragMove]);

  // ── Cursor mode: mouse X = container width ──────────────────────────
  const handlePreviewMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cursorMode || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newW = Math.max(100, Math.min(rect.width - 20, x));
    setMaxWidth(Math.round(newW));
  }, [cursorMode]);

  return (
    <section className="py-32 px-6 bg-black border-t border-white/10">
      <div className="max-w-5xl mx-auto">
        {/* Section identity */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px bg-white/20" />
          <span className="mono text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            Developer Tool — measure anything
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
            Type text. Drag the handle.
            <br />
            <span className="text-white/30">Watch pretext measure it live.</span>
          </h2>
          <p className="text-white/60 mt-4 max-w-xl">
            This is a <strong className="text-white">developer scratchpad</strong> — paste any text, adjust
            width and font size, enable cursor mode to control width with your
            mouse. Every number comes from{" "}
            <code className="mono text-white/80">layout()</code>, not the DOM.
            Compare this to the <strong className="text-white">Comparison section</strong> above where you saw the cost, and the{" "}
            <strong className="text-white">Use Cases below</strong> where you see it applied.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Text input */}
            <div>
              <label className="mono text-xs text-white/40 uppercase tracking-widest block mb-2">
                Input Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-white/30 transition-colors placeholder-white/20"
                placeholder="Type something..."
              />
            </div>

            {/* Max width slider */}
            <div>
              <label className="mono text-xs text-white/40 uppercase tracking-widest block mb-2">
                Container Width: <span className="text-white">{maxWidth}px</span>
              </label>
              <input
                type="range"
                min={100}
                max={600}
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            {/* Font size slider */}
            <div>
              <label className="mono text-xs text-white/40 uppercase tracking-widest block mb-2">
                Font Size: <span className="text-white">{fontSize}px</span>
              </label>
              <input
                type="range"
                min={10}
                max={32}
                value={fontSize}
                onChange={(e) => { setFontSize(Number(e.target.value)); preparedRef.current = null; }}
                className="w-full accent-white"
              />
            </div>

            {/* Cursor mode toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCursorMode((m) => !m)}
                className={`px-4 py-2 rounded-lg border text-xs mono transition-all ${
                  cursorMode
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10"
                }`}
              >
                {cursorMode ? "● cursor mode on" : "○ cursor mode"}
              </button>
              {cursorMode && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mono text-xs text-white/30"
                >
                  move mouse over preview →
                </motion.span>
              )}
            </div>

            {/* Metrics card */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="mono text-xs text-white/30 uppercase tracking-widest mb-3">
                Pretext Output
              </div>
              <AnimatePresence mode="wait">
                {metrics ? (
                  <motion.div
                    key={`${metrics.lineCount}-${metrics.height}-${metrics.width}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      { label: "Lines", value: metrics.lineCount },
                      { label: "Height", value: `${metrics.height}px` },
                      { label: "Width", value: `${metrics.width}px` },
                      { label: "layout() time", value: metrics.measuredAt < 0.01 ? "<0.01ms" : `${metrics.measuredAt.toFixed(3)}ms` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/5 rounded p-2.5">
                        <div className="mono text-[10px] text-white/30 mb-1">{label}</div>
                        <div className="mono text-base font-bold text-white">{value}</div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-white/20 mono text-sm">measuring...</div>
                )}
              </AnimatePresence>
              {measuring && (
                <div className="mono text-[10px] text-white/20 mt-2 flex items-center gap-1">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity }}>●</motion.span>
                  preparing text...
                </div>
              )}
            </div>
          </motion.div>

          {/* Preview with drag handle */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white/5 border border-white/10 rounded-lg p-5">
              <div className="mono text-xs text-white/30 uppercase tracking-widest mb-4">
                Visual Preview
                {cursorMode && (
                  <span className="ml-2 text-white/20">— move cursor to resize</span>
                )}
              </div>

              <div
                ref={previewRef}
                className={`relative overflow-visible min-h-[120px] ${cursorMode ? "cursor-col-resize" : ""}`}
                onMouseMove={handlePreviewMouseMove}
              >
                {/* Width indicator bar */}
                <div className="absolute -top-3 left-0 flex items-center" style={{ width: maxWidth }}>
                  <div className="h-px flex-1 bg-white/20" />
                  <span className="mono text-[10px] text-white/30 px-1">{maxWidth}px</span>
                </div>

                {/* Text box */}
                <div
                  className="relative border border-dashed border-white/20 rounded p-3 transition-none"
                  style={{ width: maxWidth, maxWidth: "100%" }}
                >
                  <div
                    className="text-white/80 leading-relaxed break-words"
                    style={{ fontSize: Math.min(fontSize, 20), lineHeight: 1.5 }}
                  >
                    {text || "Type something..."}
                  </div>

                  {/* Line separator overlays */}
                  {metrics && Array.from({ length: metrics.lineCount - 1 }, (_, i) => (
                    <motion.div
                      key={`${i}-${metrics.lineCount}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute left-0 right-0 border-t border-dashed border-white/10 pointer-events-none"
                      style={{ top: (i + 1) * Math.min(fontSize, 20) * 1.5 + 12 }}
                    />
                  ))}

                  {/* Height label */}
                  {metrics && (
                    <div className="absolute -right-8 top-0 flex flex-col items-center h-full">
                      <div className="w-px flex-1 bg-white/15" />
                      <span className="mono text-[9px] text-white/25 px-1 rotate-90 whitespace-nowrap">
                        {metrics.height}px
                      </span>
                      <div className="w-px flex-1 bg-white/15" />
                    </div>
                  )}
                </div>

                {/* Drag handle */}
                <div
                  ref={dragRef}
                  onMouseDown={handleDragStart}
                  className="absolute top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center group"
                  style={{ left: Math.min(maxWidth, previewRef.current?.clientWidth ?? maxWidth) }}
                >
                  <div className="w-0.5 h-8 bg-white/20 group-hover:bg-white/50 rounded transition-colors" />
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="mono text-[9px] text-white/40 bg-black border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap">
                      drag to resize
                    </div>
                  </div>
                </div>

                {/* Confirmation badge */}
                {metrics && (
                  <motion.div
                    key={`badge-${metrics.lineCount}-${metrics.width}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-10 flex gap-2 flex-wrap"
                  >
                    <span className="mono text-[10px] px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">
                      no DOM touched
                    </span>
                    <span className="mono text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 text-white/40 rounded-full">
                      {metrics.lineCount} line{metrics.lineCount !== 1 ? "s" : ""}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
