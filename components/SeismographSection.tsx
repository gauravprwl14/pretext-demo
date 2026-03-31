"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Preset texts ────────────────────────────────────────────────────────────────

const HAIKU = "old pond frog leaps in water sound";
const LEGAL =
  "WHEREAS the Party of the First Part hereinafter referred to as Licensor hereby grants to Party of Second Part";
const CODE =
  "const result = items.filter(x => x.active).map(x => x.value).reduce((a,b) => a+b, 0);";

type PresetKey = "haiku" | "legal" | "code";

const PRESETS: Record<PresetKey, { label: string; text: string; color: string }> = {
  haiku: { label: "Haiku", text: HAIKU, color: "text-blue-400" },
  legal: { label: "Legal", text: LEGAL, color: "text-red-400" },
  code: { label: "Code", text: CODE, color: "text-amber-400" },
};

// ── Canvas constants ────────────────────────────────────────────────────────────

const CANVAS_W = 700;
const CANVAS_H = 150;
const FONT = "16px monospace";
const AVG_CHAR_WIDTH = 9.6; // approximate for monospace 16px
const SCALE_FACTOR = 4.5;
const WAVEFORM_SCROLL_STEP = 3; // px per char to advance waveform

// ── Types ───────────────────────────────────────────────────────────────────────

interface WavePoint {
  x: number;
  y: number;
  isBreak: boolean;
  charWidth: number;
  char: string;
}

interface SeisStats {
  totalChars: number;
  lineBreaks: number;
  avgCharWidth: number;
  minWidth: number;
  maxWidth: number;
  currentChar: string;
  currentWidth: number;
}

// ── Seismograph canvas renderer ─────────────────────────────────────────────────

function drawSeismograph(
  canvas: HTMLCanvasElement,
  points: WavePoint[],
  flashAlpha: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const centerY = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  // Subtle horizontal grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let gy = 20; gy < h; gy += 20) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  // Center baseline
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(w, centerY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (points.length < 2) return;

  // Draw waveform — split into segments at break points for color changes
  let segStart = 0;
  for (let i = 1; i <= points.length; i++) {
    const atEnd = i === points.length;
    const atBreak = !atEnd && points[i].isBreak;

    if (atBreak || atEnd) {
      const segPoints = points.slice(segStart, i + (atEnd ? 0 : 1));
      if (segPoints.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(segPoints[0].x, segPoints[0].y);
        for (let j = 1; j < segPoints.length; j++) {
          // Smooth curve
          const cpx = (segPoints[j - 1].x + segPoints[j].x) / 2;
          ctx.quadraticCurveTo(segPoints[j - 1].x, segPoints[j - 1].y, cpx, (segPoints[j - 1].y + segPoints[j].y) / 2);
        }
        ctx.strokeStyle = points[segStart].isBreak
          ? "rgba(239,68,68,0.85)"
          : "rgba(251,191,36,0.85)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = points[segStart].isBreak
          ? "rgba(239,68,68,0.4)"
          : "rgba(251,191,36,0.3)";
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      segStart = i;
    }
  }

  // Draw vertical red flash lines at break points
  for (const pt of points) {
    if (pt.isBreak && pt.x >= 0 && pt.x <= w) {
      ctx.strokeStyle = `rgba(239,68,68,${0.3 + flashAlpha * 0.4})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(pt.x, 0);
      ctx.lineTo(pt.x, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw scan-line (playhead) at right edge
  const lastPt = points[points.length - 1];
  if (lastPt) {
    ctx.strokeStyle = "rgba(251,191,36,0.6)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(251,191,36,0.6)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(lastPt.x, 0);
    ctx.lineTo(lastPt.x, h);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw current point dot
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "rgba(251,191,36,0.8)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Stats overlay (bottom-left)
  ctx.font = "10px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.30)";
  const lastStats = points[points.length - 1];
  if (lastStats) {
    ctx.fillText(
      `char: "${lastStats.char === " " ? "SP" : lastStats.char}"  w:${lastStats.charWidth.toFixed(1)}px`,
      8,
      h - 8
    );
  }
}

// ── Main Component ──────────────────────────────────────────────────────────────

export default function SeismographSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [preset, setPreset] = useState<PresetKey>("haiku");
  const [customText, setCustomText] = useState("");
  const [speed, setSpeed] = useState(50);
  const [maxWidth, setMaxWidth] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [stats, setStats] = useState<SeisStats>({
    totalChars: 0,
    lineBreaks: 0,
    avgCharWidth: 0,
    minWidth: Infinity,
    maxWidth: 0,
    currentChar: "",
    currentWidth: 0,
  });
  const [flashAlpha, setFlashAlpha] = useState(0);

  // Playback state refs (avoid stale closures in interval)
  const pointsRef = useRef<WavePoint[]>([]);
  const charIndexRef = useRef(0);
  const runningWidthRef = useRef(0);
  const lineCountRef = useRef(0);
  const widthSumRef = useRef(0);
  const widthCountRef = useRef(0);
  const minWidthRef = useRef(Infinity);
  const maxWidthSeenRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashAlphaRef = useRef(0);
  const xCursorRef = useRef(0);

  const activeText = customText.trim() !== "" ? customText : PRESETS[preset].text;

  // Init offscreen canvas for measureText
  useEffect(() => {
    const off = document.createElement("canvas");
    const ctx = off.getContext("2d");
    if (ctx) {
      ctx.font = FONT;
      offCtxRef.current = ctx;
    }
  }, []);

  // Setup canvas DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = CANVAS_W + "px";
    canvas.style.height = CANVAS_H + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  const resetPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    charIndexRef.current = 0;
    runningWidthRef.current = 0;
    lineCountRef.current = 0;
    widthSumRef.current = 0;
    widthCountRef.current = 0;
    minWidthRef.current = Infinity;
    maxWidthSeenRef.current = 0;
    xCursorRef.current = 20;
    pointsRef.current = [];
    flashAlphaRef.current = 0;
    setFlashAlpha(0);
    setIsPlaying(false);
    setHasStarted(false);
    setStats({
      totalChars: 0,
      lineBreaks: 0,
      avgCharWidth: 0,
      minWidth: Infinity,
      maxWidth: 0,
      currentChar: "",
      currentWidth: 0,
    });
    // Clear canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        // Draw blank seismograph background
        drawSeismograph(canvas, [], 0);
      }
    }
  }, []);

  // Redraw on flashAlpha change
  useEffect(() => {
    if (canvasRef.current) {
      drawSeismograph(canvasRef.current, pointsRef.current, flashAlpha);
    }
  }, [flashAlpha]);

  const tickChar = useCallback(() => {
    const text = activeText;
    const idx = charIndexRef.current;
    if (idx >= text.length) {
      // Done
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPlaying(false);
      return;
    }

    const char = text[idx];
    const offCtx = offCtxRef.current;
    if (!offCtx) return;

    let charWidth = offCtx.measureText(char).width;

    // Space dip: reduce amplitude
    if (char === " ") charWidth = charWidth * 0.5;

    // Punctuation spike
    const isPunct = /[.,;:!?(){}\[\]<>\/\\|"'`~@#$%^&*+=_\-]/.test(char);
    if (isPunct) charWidth = charWidth * 1.8;

    runningWidthRef.current += charWidth;
    widthSumRef.current += charWidth;
    widthCountRef.current += 1;

    if (charWidth < minWidthRef.current) minWidthRef.current = charWidth;
    if (charWidth > maxWidthSeenRef.current) maxWidthSeenRef.current = charWidth;

    const isBreak = runningWidthRef.current >= maxWidth;
    if (isBreak) {
      lineCountRef.current += 1;
      runningWidthRef.current = 0;
      // Red flash
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashAlphaRef.current = 1;
      setFlashAlpha(1);
      flashTimerRef.current = setTimeout(() => {
        flashAlphaRef.current = 0;
        setFlashAlpha(0);
      }, 300);
    }

    const centerY = CANVAS_H / 2;
    const avgW = widthCountRef.current > 0 ? widthSumRef.current / widthCountRef.current : AVG_CHAR_WIDTH;
    const yDisplace = (charWidth - avgW) * SCALE_FACTOR;
    const y = Math.max(8, Math.min(CANVAS_H - 8, centerY - yDisplace));

    // Advance x cursor
    xCursorRef.current += WAVEFORM_SCROLL_STEP;

    // Scroll points left when we approach the right edge
    const scrollThreshold = CANVAS_W - 40;
    if (xCursorRef.current > scrollThreshold) {
      const shift = xCursorRef.current - scrollThreshold;
      pointsRef.current = pointsRef.current
        .map((p) => ({ ...p, x: p.x - shift }))
        .filter((p) => p.x > -10);
      xCursorRef.current = scrollThreshold;
    }

    pointsRef.current.push({
      x: xCursorRef.current,
      y,
      isBreak,
      charWidth,
      char,
    });

    charIndexRef.current = idx + 1;

    const avgCharWidth = widthCountRef.current > 0 ? widthSumRef.current / widthCountRef.current : 0;
    setStats({
      totalChars: charIndexRef.current,
      lineBreaks: lineCountRef.current,
      avgCharWidth,
      minWidth: minWidthRef.current === Infinity ? 0 : minWidthRef.current,
      maxWidth: maxWidthSeenRef.current,
      currentChar: char,
      currentWidth: charWidth,
    });

    if (canvasRef.current) {
      drawSeismograph(canvasRef.current, pointsRef.current, flashAlphaRef.current);
    }
  }, [activeText, maxWidth]);

  // Restart interval when speed changes while playing
  useEffect(() => {
    if (!isPlaying) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tickChar, speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [speed, isPlaying, tickChar]);

  const handlePlay = useCallback(() => {
    if (charIndexRef.current >= activeText.length) {
      resetPlayback();
      setTimeout(() => {
        setIsPlaying(true);
        setHasStarted(true);
        xCursorRef.current = 20;
        intervalRef.current = setInterval(tickChar, speed);
      }, 50);
      return;
    }
    setIsPlaying(true);
    setHasStarted(true);
    intervalRef.current = setInterval(tickChar, speed);
  }, [activeText, resetPlayback, tickChar, speed]);

  const handlePause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    resetPlayback();
  }, [resetPlayback]);

  // When preset changes, reset
  useEffect(() => {
    resetPlayback();
  }, [preset, resetPlayback]);

  // When maxWidth changes mid-play: keep playing but reset waveform
  const prevMaxWidth = useRef(maxWidth);
  useEffect(() => {
    if (prevMaxWidth.current !== maxWidth) {
      prevMaxWidth.current = maxWidth;
      if (isPlaying) {
        handlePause();
        resetPlayback();
      }
    }
  }, [maxWidth, isPlaying, handlePause, resetPlayback]);

  // Draw initial blank canvas on mount
  useEffect(() => {
    if (canvasRef.current) {
      drawSeismograph(canvasRef.current, [], 0);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  return (
    <section className="py-32 px-6 bg-black border-t border-white/10 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-px bg-white/20" />
          <span className="mono text-xs text-white/40 uppercase tracking-widest">
            Sensory Translation — Canvas × Metrics
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <div className="mono text-xs text-white/30 mb-4 uppercase tracking-widest">
            Text Seismograph
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Your text has a
            <br />
            <span className="text-amber-400">heartbeat.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-2xl leading-relaxed">
            Each character&apos;s pixel width becomes signal amplitude. Spaces dip.
            Punctuation spikes. Line-break thresholds fire red flashes. Two texts
            with the same word count can have completely different seismograph
            signatures.
          </p>
        </motion.div>

        {/* Controls row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-3 mb-6 items-center"
        >
          {/* Preset buttons */}
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setPreset(key);
                setCustomText("");
              }}
              className={`px-5 py-2 rounded-xl border text-sm transition-all ${
                preset === key && customText === ""
                  ? "bg-white text-black border-white font-semibold"
                  : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 bg-white/[0.03]"
              }`}
            >
              {PRESETS[key].label}
            </button>
          ))}

          <div className="h-5 w-px bg-white/10" />

          {/* Play / Pause / Reset */}
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className={`px-5 py-2 rounded-xl border text-sm font-semibold transition-all ${
              isPlaying
                ? "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                : "border-green-400/40 bg-green-400/10 text-green-400 hover:bg-green-400/20"
            }`}
          >
            {isPlaying ? "⏸ Pause" : hasStarted ? "▶ Resume" : "▶ Play"}
          </button>

          <button
            onClick={handleReset}
            className="px-5 py-2 rounded-xl border border-white/10 text-white/40 text-sm hover:border-white/25 hover:text-white/70 transition-all"
          >
            ↺ Reset
          </button>
        </motion.div>

        {/* Sliders row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-8 mb-6"
        >
          <div>
            <label className="mono text-xs text-white/30 uppercase tracking-widest block mb-2">
              Speed:{" "}
              <span className="text-white/60">{speed}ms/char</span>
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-40 accent-amber-400"
            />
          </div>
          <div>
            <label className="mono text-xs text-white/30 uppercase tracking-widest block mb-2">
              Break Threshold:{" "}
              <span className="text-white/60">{maxWidth}px</span>
            </label>
            <input
              type="range"
              min={100}
              max={500}
              step={10}
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value))}
              className="w-40 accent-red-400"
            />
          </div>
        </motion.div>

        {/* Custom text input */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <label className="mono text-xs text-white/30 uppercase tracking-widest block mb-2">
            Or type your own text
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
            }}
            placeholder="Paste or type any text…"
            className="w-full max-w-xl bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white/70 text-sm mono placeholder:text-white/20 focus:outline-none focus:border-amber-400/40 transition-all"
          />
        </motion.div>

        {/* Canvas + Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex gap-4 items-start"
        >
          {/* Canvas */}
          <div className="relative bg-black border border-white/10 rounded-2xl overflow-hidden flex-1">
            {/* Top bar */}
            <div className="px-5 py-3 border-b border-white/[0.08] flex items-center justify-between">
              <div className="mono text-xs text-white/30 flex items-center gap-3">
                <span className="text-white/20">char width → amplitude</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-px bg-amber-400/60" />
                  <span className="text-white/20 text-[10px]">normal</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-px bg-red-400/60" />
                  <span className="text-white/20 text-[10px]">break</span>
                </span>
              </div>
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    <span className="mono text-[10px] text-amber-400/60">reading</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* The canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  display: "block",
                  maxWidth: "100%",
                }}
              />

              {/* Idle overlay */}
              <AnimatePresence>
                {!hasStarted && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="text-center">
                      <div className="text-white/20 text-sm mono mb-1">awaiting signal</div>
                      <div className="text-white/10 text-xs mono">press play to begin</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Red flash overlay */}
              <AnimatePresence>
                {flashAlpha > 0 && (
                  <motion.div
                    key="flash"
                    initial={{ opacity: 0.15 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-red-500 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Active text display */}
            <div className="px-5 py-3 border-t border-white/[0.08]">
              <div className="mono text-[11px] text-white/25 leading-relaxed truncate">
                {activeText.split("").map((ch, i) => (
                  <span
                    key={i}
                    className={
                      i < charIndexRef.current
                        ? "text-amber-400/50"
                        : i === charIndexRef.current
                        ? "text-white bg-white/10 rounded"
                        : ""
                    }
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics sidebar */}
          <div className="w-44 shrink-0 space-y-2">
            <MetricCard
              label="Total Chars"
              value={stats.totalChars.toString()}
              dim={`/ ${activeText.length}`}
              color="text-white/80"
            />
            <MetricCard
              label="Line Breaks"
              value={stats.lineBreaks.toString()}
              color="text-red-400"
            />
            <MetricCard
              label="Avg Width"
              value={stats.avgCharWidth > 0 ? stats.avgCharWidth.toFixed(1) + "px" : "—"}
              color="text-amber-400"
            />
            <MetricCard
              label="Signal Range"
              value={
                stats.minWidth > 0 && stats.maxWidth > 0
                  ? `${stats.minWidth.toFixed(1)}–${stats.maxWidth.toFixed(1)}`
                  : "—"
              }
              dim="px"
              color="text-blue-400"
            />
            <MetricCard
              label="Current Char"
              value={
                stats.currentChar === " "
                  ? "SPACE"
                  : stats.currentChar === ""
                  ? "—"
                  : `"${stats.currentChar}"`
              }
              dim={stats.currentWidth > 0 ? `${stats.currentWidth.toFixed(1)}px` : ""}
              color="text-white/60"
            />
          </div>
        </motion.div>

        {/* Insight strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 bg-white/[0.02] border border-white/10 rounded-xl p-5"
        >
          <div className="mono text-[10px] text-white/30 uppercase tracking-widest mb-3">
            What you&apos;re seeing
          </div>
          <p className="text-white/45 text-sm leading-relaxed">
            This waveform IS your text&apos;s DNA.{" "}
            <span className="text-amber-400/70">Two texts with the same word count</span> can
            have completely different seismograph signatures. A haiku is calm — few
            breaks, narrow amplitude range. Legal prose is dense — many breaks, wide
            swings. Code is jagged — punctuation spikes everywhere. The
            seismograph exposes what character-level metrics look like as{" "}
            <span className="text-white/60">physical signal</span>.
          </p>
        </motion.div>

      </div>
    </section>
  );
}

// ── MetricCard ──────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  dim,
  color,
}: {
  label: string;
  value: string;
  dim?: string;
  color: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
      <div className="mono text-[9px] text-white/25 uppercase tracking-widest mb-1.5">
        {label}
      </div>
      <div className={`mono text-sm font-semibold ${color} leading-none`}>
        {value}
        {dim && <span className="text-white/25 text-xs font-normal ml-1">{dim}</span>}
      </div>
    </div>
  );
}
