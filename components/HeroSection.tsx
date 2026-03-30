"use client";

import { motion, useScroll, useTransform, animate, useMotionValue } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";

const HERO_SAMPLE =
  "Pretext measures this text without touching the DOM — no reflow, no getBoundingClientRect, just pure arithmetic at the speed of JavaScript.";

const HERO_WORDS = ["THE", "FUTURE", "OF", "TEXT", "LAYOUT", "IS", "NOT", "CSS"];

interface MeasureResult {
  lineCount: number;
  height: number;
  ms: number;
}

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const preparedRef = useRef<unknown>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const [containerWidth, setContainerWidth] = useState(420);
  const [measureResult, setMeasureResult] = useState<MeasureResult | null>(null);
  const [ready, setReady] = useState(false);
  const [mouseActive, setMouseActive] = useState(false);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const FONT_SIZE = 15;
  const LINE_HEIGHT = FONT_SIZE * 1.6;

  // Prepare once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { prepare } = await import("@chenglou/pretext");
        const p = prepare(HERO_SAMPLE, `${FONT_SIZE}px Arial`);
        if (!cancelled) {
          preparedRef.current = p;
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // layout() is instant — runs on every mouse move
  const recalculate = useCallback(
    async (width: number) => {
      if (!preparedRef.current) return;
      try {
        const { layout } = await import("@chenglou/pretext");
        const t0 = performance.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = layout(preparedRef.current as any, width, LINE_HEIGHT);
        const ms = performance.now() - t0;
        setMeasureResult({ lineCount: result.lineCount, height: Math.round(result.height), ms });
      } catch {
        const lines = Math.ceil((HERO_SAMPLE.length * FONT_SIZE * 0.5) / width);
        setMeasureResult({ lineCount: lines, height: Math.round(lines * LINE_HEIGHT), ms: 0 });
      }
    },
    [LINE_HEIGHT]
  );

  useEffect(() => {
    if (ready) recalculate(containerWidth);
  }, [ready, containerWidth, recalculate]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!demoRef.current) return;
      const rect = demoRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0.1, Math.min(1, x / rect.width));
      const newWidth = Math.round(160 + pct * 380);
      setContainerWidth(newWidth);
      setCursorX(x);
    },
    []
  );

  const handleMouseEnter = useCallback(() => setMouseActive(true), []);
  const handleMouseLeave = useCallback(() => { setMouseActive(false); setCursorX(null); }, []);

  // Build line-separator positions
  const linePositions =
    measureResult
      ? Array.from({ length: measureResult.lineCount - 1 }, (_, i) => (i + 1) * LINE_HEIGHT)
      : [];

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Glow */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 65%)" }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div style={{ y, opacity }} className="relative z-10 px-6 max-w-6xl w-full">
        {/* Package badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <span className="mono text-xs px-4 py-2 border border-white/20 rounded-full text-white/40 bg-white/5 backdrop-blur select-all">
            npm install @chenglou/pretext
          </span>
        </motion.div>

        {/* Headline */}
        <div className="text-center mb-6 leading-none">
          {HERO_WORDS.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block mr-[0.22em] last:mr-0 font-black tracking-tight text-white"
              style={{ fontSize: "clamp(1.4rem,3.5vw,4rem)" }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-center text-white/45 text-lg max-w-xl mx-auto mt-6 leading-relaxed"
        >
          Fast, accurate text measurement in pure TypeScript.
          Layout pages without DOM measurements or reflow.
        </motion.p>

        {/* ── Interactive Measurement Demo ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mt-14 max-w-3xl mx-auto"
        >
          {/* Demo label with animated arrows */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <motion.span
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="mono text-white/60 text-sm font-semibold tracking-wider"
            >
              ←
            </motion.span>
            <span className="mono text-white/70 text-sm uppercase tracking-widest font-semibold">
              Move your mouse here
            </span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="mono text-white/60 text-sm font-semibold tracking-wider"
            >
              →
            </motion.span>
          </div>

          <div
            ref={demoRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative select-none cursor-crosshair rounded-2xl p-6 overflow-hidden border"
            style={{
              minHeight: 220,
              background: mouseActive
                ? "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(255,255,255,0.03) 100%)"
                : "rgba(255,255,255,0.03)",
              borderColor: mouseActive ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.12)",
              transition: "background 0.4s ease, border-color 0.4s ease",
            }}
          >
            {/* DEMO badge */}
            <div className="absolute top-3 right-3 z-20">
              <span className="mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-300 uppercase">
                DEMO
              </span>
            </div>

            {/* Mouse-track indicator bar */}
            <motion.div
              className="absolute top-0 left-0 h-full pointer-events-none"
              animate={{ width: `${((containerWidth - 160) / 380) * 100}%` }}
              transition={{ duration: 0, ease: "linear" }}
              style={{
                background: mouseActive
                  ? "linear-gradient(90deg, rgba(59,130,246,0.10) 0%, transparent 100%)"
                  : "rgba(255,255,255,0.02)",
              }}
            />

            {/* Animated crosshair cursor tracker */}
            {mouseActive && cursorX !== null && (
              <motion.div
                className="absolute top-0 bottom-0 pointer-events-none z-10"
                style={{ left: cursorX - 1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-[2px] h-full bg-blue-400/40" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-blue-400/70 bg-blue-500/20"
                  style={{ left: 1 }}
                />
              </motion.div>
            )}

            {/* Measured text container */}
            <div className="relative mx-auto" style={{ width: containerWidth, maxWidth: "100%" }}>
              {/* Width bracket */}
              <div className="absolute -top-5 left-0 right-0 flex items-center gap-1">
                <div className="h-px flex-1 bg-white/20" />
                <span className="mono text-[10px] text-white/40 px-1">{containerWidth}px</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>
              <div className="absolute -top-5 left-0 w-px h-3 bg-white/20" />
              <div className="absolute -top-5 right-0 w-px h-3 bg-white/20" />

              {/* Text */}
              <div
                className="text-white/90 leading-relaxed relative"
                style={{ fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT + "px" }}
              >
                {HERO_SAMPLE}

                {/* Line separators (from pretext lineCount) */}
                {linePositions.map((pos, i) => (
                  <motion.div
                    key={`${pos}-${i}`}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="absolute left-0 right-0 border-t border-dashed border-white/15 pointer-events-none"
                    style={{ top: pos }}
                  />
                ))}

                {/* Height bracket (right side) */}
                {measureResult && (
                  <motion.div
                    key={measureResult.height}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -right-10 top-0 flex flex-col items-center"
                    style={{ height: measureResult.height }}
                  >
                    <div className="w-px flex-1 bg-white/20" />
                    <span
                      className="mono text-[9px] text-white/30 px-1"
                      style={{ writingMode: "vertical-rl" }}
                    >
                      {measureResult.height}px
                    </span>
                    <div className="w-px flex-1 bg-white/20" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Measurement data badges */}
            {measureResult && (
              <motion.div
                key={`${measureResult.lineCount}-${measureResult.height}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="flex gap-3 mt-8 flex-wrap justify-center"
              >
                {[
                  { label: "lines", val: measureResult.lineCount },
                  { label: "height", val: `${measureResult.height}px` },
                  { label: "width", val: `${containerWidth}px` },
                  { label: "layout()", val: `${(measureResult.ms * 1000).toFixed(1)}µs` },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1"
                  >
                    <span className="mono text-white/40 text-sm">{label}:</span>
                    <span className="mono text-white text-sm font-medium">{val}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="mono text-green-400 text-sm">no DOM touched</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="flex justify-center gap-12 mt-12"
        >
          {[
            { value: "~500×", label: "faster than DOM" },
            { value: "<4kb", label: "gzipped" },
            { value: "100+", label: "languages" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-white/35 mt-1 mono">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="flex justify-center mt-12"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/25 text-xs mono flex flex-col items-center gap-2"
          >
            scroll to explore
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
              <rect x="5.5" y="0.5" width="3" height="4" rx="1.5" fill="currentColor" opacity="0.5" />
              <path d="M7 9L3 13L7 17L11 13L7 9Z" fill="currentColor" opacity="0.3" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
