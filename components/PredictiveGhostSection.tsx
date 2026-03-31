"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";

// ─── Constants ───────────────────────────────────────────────────────────────

const FONT = "16px system-ui";
const MAX_WIDTH = 320;
const LINE_HEIGHT = 24;

const GHOST_CONTINUATION =
  " lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris";

const DEFAULT_INPUT =
  "Pretext knows your layout before the browser does. Try typing here and watch the ghost predict where every line will break.";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineData {
  text: string;
  width: number;
}

interface PanelData {
  lines: LineData[];
  lineCount: number;
  charsPrepared: number;
  measurementUs: number;
}

// ─── Pretext panel computation ────────────────────────────────────────────────

async function computePanel(text: string): Promise<PanelData> {
  const { prepareWithSegments, layoutWithLines } = await import(
    "@chenglou/pretext"
  );
  const t0 = performance.now();
  const prepared = prepareWithSegments(text, FONT);
  const result = layoutWithLines(prepared, MAX_WIDTH, LINE_HEIGHT);
  const elapsed = (performance.now() - t0) * 1000; // microseconds

  return {
    lines: result.lines.map((l) => ({ text: l.text, width: l.width })),
    lineCount: result.lineCount,
    charsPrepared: text.length,
    measurementUs: Math.round(elapsed),
  };
}

// ─── Line renderer ────────────────────────────────────────────────────────────

interface LineRendererProps {
  lines: LineData[];
  markerColor: string;
  isGhost: boolean;
  /** Index of the last line that belongs to the "now" text (ghost panel only) */
  nowLineIndex?: number;
}

function LineRenderer({
  lines,
  markerColor,
  isGhost,
  nowLineIndex,
}: LineRendererProps) {
  return (
    <div
      className="relative font-[system-ui] text-base leading-6 select-text"
      style={{ width: MAX_WIDTH }}
    >
      {lines.map((line, i) => {
        const isNowBoundary = isGhost && i === nowLineIndex;
        const isPastNow = isGhost && nowLineIndex !== undefined && i > nowLineIndex;

        return (
          <div key={i} className="relative group">
            {/* Amber "you are here" glow line in the ghost panel */}
            {isNowBoundary && (
              <div
                className="absolute inset-x-0 -top-px h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #f59e0b 30%, #f59e0b 70%, transparent)",
                  boxShadow: "0 0 8px 1px rgba(245,158,11,0.6)",
                }}
              />
            )}

            <div
              className="relative flex items-center"
              style={{ height: LINE_HEIGHT }}
            >
              {/* Line text */}
              <span
                className={
                  isPastNow
                    ? "text-blue-300/50"
                    : isGhost
                    ? "text-blue-200/70"
                    : "text-white/90"
                }
                style={{ fontFamily: "system-ui", fontSize: 16 }}
              >
                {line.text || "\u00A0"}
              </span>

              {/* Line-break marker at the right edge (non-ghost: amber, ghost: blue) */}
              {line.text.trim() !== "" && (
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isGhost
                        ? "rgba(96,165,250,0.5)"
                        : "rgba(245,158,11,0.5)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Persistent faint break marker line */}
            {i < lines.length - 1 && line.text.trim() !== "" && (
              <div
                className="absolute bottom-0 left-0 h-px"
                style={{
                  width: `${Math.round((line.width / MAX_WIDTH) * 100)}%`,
                  backgroundColor: markerColor,
                  opacity: 0.15,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel card ───────────────────────────────────────────────────────────────

interface PanelCardProps {
  label: string;
  sublabel: string;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  data: PanelData | null;
  markerColor: string;
  isGhost: boolean;
  nowLineIndex?: number;
  loading: boolean;
}

function PanelCard({
  label,
  sublabel,
  accentClass,
  borderClass,
  bgClass,
  data,
  markerColor,
  isGhost,
  nowLineIndex,
  loading,
}: PanelCardProps) {
  return (
    <div
      className={`flex-1 min-w-0 rounded-2xl border ${borderClass} ${bgClass} p-5 flex flex-col gap-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${accentClass}`}
          >
            {label}
          </span>
          <span className="text-white/30 text-xs">{sublabel}</span>
        </div>
        {loading && (
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        )}
      </div>

      {/* Line area */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          minHeight: LINE_HEIGHT * 6,
          background: isGhost
            ? "rgba(59,130,246,0.04)"
            : "rgba(255,255,255,0.02)",
        }}
      >
        <div className="p-3">
          {data && data.lines.length > 0 ? (
            <div className={isGhost ? "opacity-75" : ""}>
              <LineRenderer
                lines={data.lines}
                markerColor={markerColor}
                isGhost={isGhost}
                nowLineIndex={nowLineIndex}
              />
            </div>
          ) : (
            <div className="text-white/20 text-sm italic">
              {loading ? "Measuring…" : "Start typing to see layout"}
            </div>
          )}
        </div>
      </div>

      {/* Line count badge */}
      {data && (
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-white/30">lines</span>
          <span className={`font-bold ${isGhost ? "text-blue-400" : "text-amber-400"}`}>
            {data.lineCount}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PredictiveGhostSection() {
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [nowData, setNowData] = useState<PanelData | null>(null);
  const [ghostData, setGhostData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute the index in the ghost lines where the "now" text ends
  const nowLineIndex = useMemo(() => {
    if (!nowData || !ghostData) return undefined;
    // The now text ends somewhere in the ghost. The last line of "now" is
    // approximately at nowData.lineCount - 1 in the ghost panel (same text up front).
    return Math.max(0, nowData.lineCount - 1);
  }, [nowData, ghostData]);

  const runMeasurement = async (text: string) => {
    if (!text.trim()) {
      setNowData(null);
      setGhostData(null);
      return;
    }
    setLoading(true);
    try {
      const [nd, gd] = await Promise.all([
        computePanel(text),
        computePanel(text + GHOST_CONTINUATION),
      ]);
      setNowData(nd);
      setGhostData(gd);
    } catch (err) {
      console.error("pretext measurement failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger on mount and on input change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runMeasurement(inputText);
    }, 80);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText]);

  // Combined metrics
  const totalChars = nowData ? nowData.charsPrepared : 0;
  const ghostChars = ghostData ? ghostData.charsPrepared : 0;
  const measureUs = (nowData?.measurementUs ?? 0) + (ghostData?.measurementUs ?? 0);

  return (
    <section className="w-full py-20 px-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-amber-400" />
            <span className="text-xs font-mono text-amber-400/70 uppercase tracking-widest">
              Predictive Ghost Layout
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            The browser doesn&apos;t know this yet.{" "}
            <span className="text-amber-400">Pretext already does.</span>
          </h2>
          <p className="text-white/50 text-base max-w-2xl">
            Pretext measures exact line-break positions before text exists in the DOM.
            Type below — the{" "}
            <span className="text-amber-300/80">left panel</span> shows your current
            layout, the{" "}
            <span className="text-blue-300/80">ghost panel</span> predicts where every
            break will fall 50 words from now.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
              placeholder="Start typing…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white/90 text-base resize-none focus:outline-none focus:border-amber-400/40 focus:bg-white/[0.06] transition-all placeholder:text-white/20 font-[system-ui]"
            />
            <div className="absolute bottom-3 right-4 text-white/25 text-xs font-mono pointer-events-none">
              {inputText.length} chars
            </div>
          </div>
        </motion.div>

        {/* Metrics bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono border-b border-white/[0.06] pb-4"
        >
          <MetricPill
            label="now lines"
            value={nowData?.lineCount ?? "—"}
            color="text-amber-400"
          />
          <MetricPill
            label="ghost lines"
            value={ghostData?.lineCount ?? "—"}
            color="text-blue-400"
          />
          <MetricPill
            label="chars prepared"
            value={totalChars + ghostChars || "—"}
            color="text-white/60"
          />
          <MetricPill
            label="measure time"
            value={measureUs ? `${measureUs} µs` : "—"}
            color="text-green-400"
          />
          <MetricPill
            label="max width"
            value={`${MAX_WIDTH}px`}
            color="text-white/40"
          />
          <MetricPill
            label="line height"
            value={`${LINE_HEIGHT}px`}
            color="text-white/40"
          />
        </motion.div>

        {/* Two-panel layout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* LEFT: Now */}
          <PanelCard
            label="Now"
            sublabel="current text, measured"
            accentClass="bg-amber-500/10 border border-amber-500/20 text-amber-300"
            borderClass="border-amber-500/10"
            bgClass="bg-amber-500/[0.02]"
            data={nowData}
            markerColor="#f59e0b"
            isGhost={false}
            loading={loading}
          />

          {/* Separator */}
          <div className="hidden sm:flex flex-col items-center justify-center gap-2 px-1">
            <div className="w-px flex-1 bg-white/[0.06]" />
            <div className="text-white/20 text-xs font-mono rotate-0">+50w</div>
            <div className="w-px flex-1 bg-white/[0.06]" />
          </div>

          {/* RIGHT: Ghost */}
          <PanelCard
            label="Ghost +50 words"
            sublabel="predicted future layout"
            accentClass="bg-blue-500/10 border border-blue-500/20 text-blue-300"
            borderClass="border-blue-500/10"
            bgClass="bg-blue-500/[0.02]"
            data={ghostData}
            markerColor="#60a5fa"
            isGhost={true}
            nowLineIndex={nowLineIndex}
            loading={loading}
          />
        </motion.div>

        {/* Key insight callout */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        >
          {/* Amber left bar */}
          <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-amber-400/40" />
          <div className="pl-4 flex flex-col gap-1">
            <p className="text-amber-300/90 text-sm font-semibold">
              What was impossible before pretext?
            </p>
            <p className="text-white/50 text-sm">
              Knowing exact layout — including every line break, every word wrap — before
              the text is painted to the DOM. No reflow. No{" "}
              <code className="text-amber-300/70 text-xs bg-amber-400/10 px-1 py-0.5 rounded">
                getBoundingClientRect
              </code>
              . Zero DOM access. Pretext computes it all in a single linear pass in pure
              JavaScript, before the browser even knows the text exists.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

// ─── Metric pill ─────────────────────────────────────────────────────────────

function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-white/30">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
