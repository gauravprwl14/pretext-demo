"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import CodeExamplesSection from "./CodeExamplesSection";

// ─── Quick Start Step ────────────────────────────────────────────────────────

interface QuickStep {
  num: number;
  badgeColor: string;
  badgeLabel: string;
  code: string;
  tokens: { text: string; color: string }[];
}

const QUICK_STEPS: QuickStep[] = [
  {
    num: 1,
    badgeColor: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    badgeLabel: "1",
    code: "npm install @chenglou/pretext",
    tokens: [
      { text: "npm ", color: "text-white/50" },
      { text: "install ", color: "text-yellow-300" },
      { text: "@chenglou/pretext", color: "text-green-300" },
    ],
  },
  {
    num: 2,
    badgeColor: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
    badgeLabel: "2",
    code: "import { prepare, layout } from '@chenglou/pretext'",
    tokens: [
      { text: "import ", color: "text-purple-300" },
      { text: "{ ", color: "text-white/60" },
      { text: "prepare", color: "text-blue-300" },
      { text: ", ", color: "text-white/60" },
      { text: "layout", color: "text-blue-300" },
      { text: " } ", color: "text-white/60" },
      { text: "from ", color: "text-purple-300" },
      { text: "'@chenglou/pretext'", color: "text-green-300" },
    ],
  },
  {
    num: 3,
    badgeColor: "bg-orange-500/20 border-orange-500/40 text-orange-300",
    badgeLabel: "runs once",
    code: 'const p = prepare("Your text here", "16px Arial")',
    tokens: [
      { text: "const ", color: "text-purple-300" },
      { text: "p ", color: "text-white/80" },
      { text: "= ", color: "text-white/50" },
      { text: "prepare", color: "text-yellow-300" },
      { text: "(", color: "text-white/60" },
      { text: '"Your text here"', color: "text-green-300" },
      { text: ", ", color: "text-white/60" },
      { text: '"16px Arial"', color: "text-green-300" },
      { text: ")", color: "text-white/60" },
    ],
  },
  {
    num: 4,
    badgeColor: "bg-green-500/20 border-green-500/40 text-green-300",
    badgeLabel: "~0.001ms ← call this thousands of times",
    code: "const { lineCount, height } = layout(p, 300, 24)",
    tokens: [
      { text: "const ", color: "text-purple-300" },
      { text: "{ ", color: "text-white/60" },
      { text: "lineCount", color: "text-blue-300" },
      { text: ", ", color: "text-white/60" },
      { text: "height", color: "text-blue-300" },
      { text: " } ", color: "text-white/60" },
      { text: "= ", color: "text-white/50" },
      { text: "layout", color: "text-yellow-300" },
      { text: "(", color: "text-white/60" },
      { text: "p", color: "text-white/80" },
      { text: ", ", color: "text-white/60" },
      { text: "300", color: "text-orange-300" },
      { text: ", ", color: "text-white/60" },
      { text: "24", color: "text-orange-300" },
      { text: ")", color: "text-white/60" },
    ],
  },
];

function QuickStartSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="mb-24"
    >
      <div className="mono text-xs text-white/40 mb-3 uppercase tracking-widest">
        Quick Start
      </div>
      <h2 className="text-3xl font-bold text-white mb-10">Use it in 4 lines</h2>
      <div className="space-y-4">
        {QUICK_STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="flex items-start gap-4"
          >
            {/* Step badge */}
            <div
              className={`shrink-0 mt-1 border rounded-full px-3 py-0.5 mono text-xs font-semibold ${step.badgeColor}`}
            >
              {step.badgeLabel}
            </div>
            {/* Code block */}
            <div className="flex-1 bg-white/8 border border-white/15 rounded-xl px-5 py-3 min-h-[52px] flex items-center">
              <code className="mono text-sm whitespace-pre-wrap break-all">
                {step.tokens.map((tok, j) => (
                  <span key={j} className={tok.color}>
                    {tok.text}
                  </span>
                ))}
              </code>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Problem Section: Main Thread Timeline ───────────────────────────────────

function LargeTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  // DOM timeline blocks
  const domBlocks = [
    { type: "js", label: "JS", w: 44 },
    { type: "reflow", label: "REFLOW", w: 82 },
    { type: "js", label: "JS", w: 30 },
    { type: "reflow", label: "REFLOW", w: 88 },
    { type: "js", label: "JS", w: 26 },
    { type: "reflow", label: "REFLOW", w: 80 },
    { type: "js", label: "JS", w: 22 },
    { type: "reflow", label: "REFLOW", w: 76 },
    { type: "js", label: "JS", w: 18 },
  ];

  // Pretext timeline blocks
  const pretextBlocks = [
    { type: "js", label: "JS", w: 44 },
    { type: "prepare", label: "prepare()", w: 56 },
    { type: "js", label: "JS", w: 140 },
    { type: "layout", label: "layout×100", w: 10 },
    { type: "js", label: "JS", w: 160 },
  ];

  const blockStyle = (type: string) => {
    if (type === "js") return "bg-blue-500/40 border-blue-400/20";
    if (type === "reflow") return "bg-red-500/60 border-red-400/30";
    if (type === "prepare") return "bg-purple-500/50 border-purple-400/30";
    if (type === "layout") return "bg-green-500/60 border-green-400/30";
    return "bg-white/10";
  };

  const textStyle = (type: string) => {
    if (type === "reflow") return "text-red-200 font-bold text-[10px]";
    if (type === "layout") return "text-green-200 font-bold text-[8px]";
    if (type === "prepare") return "text-purple-200 text-[9px]";
    return "text-blue-200/50 text-[9px]";
  };

  return (
    <div ref={ref} className="space-y-8">
      {/* DOM timeline */}
      <div>
        <div className="mono text-xs text-red-400/70 uppercase tracking-widest mb-3">
          Without Pretext — DOM measurements
        </div>
        <div className="flex h-12 gap-0.5 items-stretch overflow-hidden rounded-lg min-h-[48px]">
          {domBlocks.map((block, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={inView ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ delay: i * 0.07, duration: 0.3, ease: "easeOut" }}
              style={{ width: block.w, originX: 0 }}
              className={`border flex items-center justify-center shrink-0 ${blockStyle(block.type)}`}
            >
              {(block.type === "reflow" || block.type === "layout") && (
                <span className={`mono ${textStyle(block.type)} px-1 text-center leading-tight`}>
                  {block.label}
                </span>
              )}
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
            className="flex items-center ml-2"
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="mono text-sm text-red-400/60"
            >
              ···
            </motion.span>
          </motion.div>
        </div>
        <div className="mono text-xs text-white/40 mt-2">
          Each REFLOW blocks the main thread for 2–15ms — no JS can run during it
        </div>
      </div>

      {/* Pretext timeline */}
      <div>
        <div className="mono text-xs text-green-400/70 uppercase tracking-widest mb-3">
          With Pretext — main thread stays free
        </div>
        <div className="flex h-12 gap-0.5 items-stretch overflow-hidden rounded-lg min-h-[48px]">
          {pretextBlocks.map((block, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={inView ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.35, ease: "easeOut" }}
              style={{ width: block.w, originX: 0 }}
              className={`border flex items-center justify-center shrink-0 ${blockStyle(block.type)}`}
            >
              {(block.type === "prepare" || block.type === "layout") && (
                <span className={`mono ${textStyle(block.type)} px-1 text-center leading-tight`}>
                  {block.label}
                </span>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mono text-xs text-white/40 mt-2">
          prepare() runs once, then layout() is pure math — never touches the DOM
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-5 flex-wrap pt-2">
        {[
          { color: "bg-blue-500/40", label: "JavaScript execution" },
          { color: "bg-red-500/60", label: "DOM reflow (blocking)" },
          { color: "bg-purple-500/50", label: "prepare() — runs once" },
          { color: "bg-green-500/60", label: "layout() — instant" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-sm ${color}`} />
            <span className="mono text-xs text-white/50">{label}</span>
          </div>
        ))}
      </div>

      {/* Cost comparison */}
      <div className="grid sm:grid-cols-2 gap-4 pt-2">
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-5">
          <div className="mono text-sm font-bold text-red-400">
            100 items × 5ms = 500ms of blocking
          </div>
          <div className="mono text-xs text-white/50 mt-1">
            Half a second where your UI is completely frozen
          </div>
        </div>
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-5">
          <div className="mono text-sm font-bold text-green-400">
            100 items × 0.001ms = 0.1ms total
          </div>
          <div className="mono text-xs text-white/50 mt-1">
            5000× faster — imperceptible to the user
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Architecture Cards ──────────────────────────────────────────────────────

function ArchCards() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
        {/* Card 1: prepare() */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-8"
        >
          <div className="mono text-xs text-purple-400/70 uppercase tracking-widest mb-5">
            Phase 1 — prepare()
          </div>
          <div className="space-y-3">
            {[
              {
                icon: "→",
                step: "Receive text + font",
                desc: "Takes a raw string and a CSS font string like \"16px Arial\"",
                color: "border-purple-500/25 bg-purple-500/8",
              },
              {
                icon: "🔤",
                step: "Intl.Segmenter",
                desc: "Splits the string into grapheme clusters — handles emoji, ligatures, multi-byte chars",
                color: "border-blue-500/25 bg-blue-500/8",
              },
              {
                icon: "📐",
                step: "canvas.measureText()",
                desc: "Measures each unique character's advance width using an offscreen canvas",
                color: "border-yellow-500/25 bg-yellow-500/8",
              },
              {
                icon: "💾",
                step: "Cache widths[]",
                desc: "Stores a parallel array of float widths — one per grapheme cluster",
                color: "border-white/15 bg-white/5",
              },
            ].map(({ icon, step, desc, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className={`border rounded-xl px-4 py-3 ${color}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{icon}</span>
                  <span className="mono text-sm font-semibold text-white/80">{step}</span>
                </div>
                <p className="mono text-sm text-white/60 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
            className="mono text-xs text-yellow-400/60 mt-5 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-yellow-400/60 rounded-full" />
            cost: ~1ms · runs once per text+font combo
          </motion.div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="hidden md:flex flex-col items-center justify-center gap-2 pt-24 text-white/30"
        >
          <div className="mono text-2xl font-bold text-white/20">→→→</div>
          <div className="mono text-[10px] text-white/30 text-center whitespace-nowrap bg-white/5 border border-white/10 rounded-full px-3 py-1">
            use PreparedText
          </div>
        </motion.div>

        {/* Card 2: layout() */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8"
        >
          <div className="mono text-xs text-green-400/70 uppercase tracking-widest mb-5">
            Phase 2 — layout()
          </div>
          <div className="space-y-3">
            {[
              {
                icon: "📖",
                step: "Read PreparedText",
                desc: "Takes the opaque PreparedText handle — no DOM access, no remeasuring",
                color: "border-green-500/25 bg-green-500/8",
              },
              {
                icon: "➕",
                step: "Sum widths left→right",
                desc: "Walks the widths[] array, accumulating a running total — pure addition",
                color: "border-green-500/25 bg-green-500/8",
              },
              {
                icon: "↵",
                step: "Line break check",
                desc: "When running total > maxWidth, reset to 0 and increment lineCount",
                color: "border-green-500/25 bg-green-500/8",
              },
              {
                icon: "📦",
                step: "Return { lineCount, height }",
                desc: "height = lineCount × lineHeight — two numbers, no layout engine needed",
                color: "border-white/15 bg-white/5",
              },
            ].map(({ icon, step, desc, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                className={`border rounded-xl px-4 py-3 ${color}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{icon}</span>
                  <span className="mono text-sm font-semibold text-white/80">{step}</span>
                </div>
                <p className="mono text-sm text-white/60 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.85 }}
            className="mono text-xs text-green-400/60 mt-5 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-green-400/60 rounded-full" />
            cost: ~0.001ms · call at any width, instantly
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Two-Phase Visual ────────────────────────────────────────────────────────

const DEMO_CHARS = ["H","e","l","l","o"," ","w","o","r","l","d","!"];
const DEMO_WIDTHS = [11, 8, 4, 4, 9, 4, 12, 9, 5, 4, 9, 4];
const DEMO_MAX_W = 44;
const DEMO_LINE_H = 24;

const CHAR_TOKEN_COLORS = [
  "text-blue-300","text-purple-300","text-yellow-300","text-orange-300",
  "text-pink-300","text-cyan-300","text-green-300","text-red-300",
  "text-indigo-300","text-teal-300","text-rose-300","text-amber-300",
];

function TwoPhaseVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [prepareStep, setPrepareStep] = useState(-1);
  const [layoutStep, setLayoutStep] = useState(-1);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let p = -1;
    const prepTimer = setInterval(() => {
      p++;
      setPrepareStep(p);
      if (p >= DEMO_CHARS.length - 1) {
        clearInterval(prepTimer);
        setTimeout(() => {
          let l = -1;
          const layTimer = setInterval(() => {
            l++;
            setLayoutStep(l);
            if (l >= DEMO_CHARS.length - 1) {
              clearInterval(layTimer);
              setTimeout(() => setShowResult(true), 400);
            }
          }, 130);
        }, 700);
      }
    }, 130);
    return () => clearInterval(prepTimer);
  }, [inView]);

  // Simulate layout steps
  let runSum = 0;
  let lineNum = 1;
  const lSteps = DEMO_CHARS.map((c, i) => {
    const w = DEMO_WIDTHS[i];
    const potential = runSum + w;
    const willBreak = potential > DEMO_MAX_W && i > 0;
    if (willBreak) { lineNum++; runSum = w; }
    else { runSum = potential; }
    return { char: c, w, runSum, willBreak, line: lineNum };
  });

  return (
    <div ref={ref} className="mb-10 space-y-3">

      {/* ── Phase 1: prepare() ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden border border-purple-500/25"
        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(0,0,0,0) 100%)" }}
      >
        {/* Header bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-purple-500/15">
          <span className="w-2 h-2 rounded-full bg-purple-400/70 shrink-0" />
          <code className="mono text-sm text-purple-200">
            prepare<span className="text-white/50">(</span>
            <span className="text-[#c3e88d]">&quot;Hello world!&quot;</span>
            <span className="text-white/50">, </span>
            <span className="text-[#c3e88d]">&quot;16px Arial&quot;</span>
            <span className="text-white/50">)</span>
          </code>
          <span className="ml-auto mono text-[10px] text-purple-400/60 uppercase tracking-widest shrink-0">
            runs once
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Annotation */}
          <p className="mono text-xs text-white/40 leading-relaxed">
            Calls{" "}
            <span className="text-purple-300">canvas.measureText()</span> for each character —
            stores the pixel width in a{" "}
            <span className="text-white/70">widths[]</span> array. This is the only time a
            canvas is touched.
          </p>

          {/* Character grid */}
          <div className="flex flex-wrap gap-2 items-end">
            {DEMO_CHARS.map((char, i) => (
              <motion.div
                key={i}
                animate={{ opacity: i <= prepareStep ? 1 : 0.18, scale: i === prepareStep ? 1.12 : 1 }}
                transition={{ duration: 0.1 }}
                className="flex flex-col items-center gap-1"
              >
                {/* Canvas icon for current scanning char */}
                {i === prepareStep && prepareStep < DEMO_CHARS.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mono text-[9px] text-purple-400/80 bg-purple-500/10 border border-purple-500/20 rounded px-1"
                  >
                    ⬛ measuring
                  </motion.div>
                )}
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center mono text-sm font-bold transition-colors ${
                    i <= prepareStep
                      ? "bg-purple-500/12 border-purple-400/30"
                      : "bg-white/3 border-white/8"
                  } ${CHAR_TOKEN_COLORS[i % CHAR_TOKEN_COLORS.length]}`}
                >
                  {char === " " ? "·" : char}
                </div>
                {i <= prepareStep && (
                  <motion.span
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mono text-[10px] text-white/45"
                  >
                    {DEMO_WIDTHS[i]}px
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Resulting widths array */}
          {prepareStep >= DEMO_CHARS.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 flex-wrap bg-white/4 border border-white/10 rounded-xl px-4 py-3"
            >
              <span className="mono text-xs text-white/35">widths[] =</span>
              <code className="mono text-xs text-purple-200/80">
                [{DEMO_WIDTHS.join(", ")}]
              </code>
              <span className="mono text-[10px] text-purple-400/55 ml-auto flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/55" />
                reused for every layout() call — no re-measuring
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Connector ─────────────────────────────────────────────────── */}
      {prepareStep >= DEMO_CHARS.length - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 py-1"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-purple-500/0 to-purple-500/25" />
          <span className="mono text-[11px] text-white/30 bg-white/5 border border-white/10 rounded-full px-3 py-1">
            PreparedText →
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-green-500/25 to-green-500/0" />
        </motion.div>
      )}

      {/* ── Phase 2: layout() ────────────────────────────────────────── */}
      {layoutStep >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden border border-green-500/25"
          style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(0,0,0,0) 100%)" }}
        >
          {/* Header bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-green-500/15">
            <span className="w-2 h-2 rounded-full bg-green-400/70 shrink-0" />
            <code className="mono text-sm text-green-200">
              layout<span className="text-white/50">(</span>
              p
              <span className="text-white/50">, </span>
              <span className="text-[#f78c6c]">maxWidth</span>
              <span className="text-white/50">=</span>
              <span className="text-[#f78c6c]">{DEMO_MAX_W}</span>
              <span className="text-white/50">, </span>
              <span className="text-[#f78c6c]">lineHeight</span>
              <span className="text-white/50">=</span>
              <span className="text-[#f78c6c]">{DEMO_LINE_H}</span>
              <span className="text-white/50">)</span>
            </code>
            <span className="ml-auto mono text-[10px] text-green-400/60 uppercase tracking-widest shrink-0">
              pure arithmetic
            </span>
          </div>

          <div className="p-5 space-y-5">
            <p className="mono text-xs text-white/40 leading-relaxed">
              Walks{" "}
              <span className="text-green-300">widths[]</span> left→right, accumulating a
              running sum. When <span className="text-orange-300">sum &gt; maxWidth</span>,
              reset to 0 and start a new line. No canvas. No DOM.
            </p>

            {/* Step-by-step walking sum */}
            <div className="flex flex-wrap gap-2 items-start">
              {lSteps.map((s, i) =>
                i <= layoutStep ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.12 }}
                    className="flex flex-col items-center gap-1"
                  >
                    {s.willBreak && (
                      <motion.div
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mono text-[10px] text-red-400 font-bold leading-none"
                      >
                        ↵ new line
                      </motion.div>
                    )}
                    <div
                      className={`px-2 py-1.5 rounded-lg border flex flex-col items-center gap-0.5 min-w-[36px] ${
                        s.willBreak
                          ? "bg-red-500/12 border-red-400/30"
                          : s.runSum >= DEMO_MAX_W - 5
                          ? "bg-orange-500/12 border-orange-400/30"
                          : "bg-green-500/8 border-green-400/20"
                      }`}
                    >
                      <span className={`mono text-sm font-bold ${CHAR_TOKEN_COLORS[i % CHAR_TOKEN_COLORS.length]}`}>
                        {s.char === " " ? "·" : s.char}
                      </span>
                      <span className="mono text-[9px] text-white/35">{s.w}px</span>
                    </div>
                    <span
                      className={`mono text-[10px] font-semibold ${
                        s.willBreak ? "text-red-400/80" : s.runSum >= DEMO_MAX_W - 4 ? "text-orange-300/80" : "text-green-300/70"
                      }`}
                    >
                      ={s.runSum}
                    </span>
                  </motion.div>
                ) : null
              )}
            </div>

            {/* Overflow indicator */}
            {layoutStep >= 6 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 mono text-xs"
              >
                <span className="text-white/30">w(12) →</span>
                <span className="text-orange-300 font-semibold">40 + 12 = 52</span>
                <span className="text-red-400/80 font-bold">52 &gt; {DEMO_MAX_W} !</span>
                <span className="text-red-400/60">↵ line break here</span>
              </motion.div>
            )}

            {/* Line result boxes */}
            {layoutStep >= DEMO_CHARS.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid sm:grid-cols-2 gap-3"
              >
                {[
                  { n: 1, text: '"Hello "', px: 40, chars: "H+e+l+l+o+·" },
                  { n: 2, text: '"world!"', px: 43, chars: "w+o+r+l+d+!" },
                ].map(({ n, text, px, chars }) => (
                  <div
                    key={n}
                    className="bg-white/4 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <span className="mono text-xs text-white/30 shrink-0">line {n}</span>
                    <code className="mono text-sm text-white/80">{text}</code>
                    <span className="mono text-[10px] text-white/30 ml-auto shrink-0">{chars} = {px}px</span>
                    <span className="mono text-[10px] text-green-400 shrink-0">✓</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Final return value */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4 bg-green-500/8 border border-green-500/20 rounded-xl px-5 py-4"
              >
                <code className="mono text-sm">
                  <span className="text-white/45">returns </span>
                  <span className="text-white/75">{"{ "}</span>
                  <span className="text-[#82aaff]">lineCount</span>
                  <span className="text-white/45">: </span>
                  <span className="text-[#f78c6c]">2</span>
                  <span className="text-white/60">, </span>
                  <span className="text-[#82aaff]">height</span>
                  <span className="text-white/45">: </span>
                  <span className="text-[#f78c6c]">48</span>
                  <span className="text-white/75">{" }"}</span>
                </code>
                <span className="mono text-xs text-green-400/60">
                  // 2 × {DEMO_LINE_H}px — no reflow, no DOM, just math
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Algorithm Walkthrough ───────────────────────────────────────────────────

const WALK_CHARS = "Hello world".split("");
const WALK_WIDTHS: Record<string, number> = {
  H: 11, e: 8, l: 4, o: 9, " ": 4, w: 12, r: 5, d: 9,
};
const CHAR_COLORS = [
  "bg-blue-500/20 border-blue-400/30 text-blue-200",
  "bg-purple-500/20 border-purple-400/30 text-purple-200",
  "bg-yellow-500/20 border-yellow-400/30 text-yellow-200",
  "bg-orange-500/20 border-orange-400/30 text-orange-200",
  "bg-pink-500/20 border-pink-400/30 text-pink-200",
  "bg-cyan-500/20 border-cyan-400/30 text-cyan-200",
  "bg-green-500/20 border-green-400/30 text-green-200",
  "bg-red-500/20 border-red-400/30 text-red-200",
  "bg-indigo-500/20 border-indigo-400/30 text-indigo-200",
  "bg-teal-500/20 border-teal-400/30 text-teal-200",
  "bg-rose-500/20 border-rose-400/30 text-rose-200",
];

function AlgorithmWalkthrough() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [scanPos, setScanPos] = useState(-1);
  const [phase, setPhase] = useState<"scan" | "break" | "done">("scan");
  const [lineBreakPos, setLineBreakPos] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    let pos = -1;
    const interval = setInterval(() => {
      pos++;
      setScanPos(pos);
      if (pos >= WALK_CHARS.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase("break");
          // "Hello " = 11+8+4+4+9+4 = 40px < 90px limit
          // "Hello w" = 40+12 = 52px < 90
          // "Hello wo" = 52+9 = 61 < 90
          // "Hello wor" = 61+5 = 66 < 90
          // "Hello worl" = 66+4 = 70 < 90
          // "Hello world" = 70+9 = 79 < 90 — actually fits, let's use 70px for the break demo
          setLineBreakPos(5); // break after "Hello "
          setTimeout(() => setPhase("done"), 800);
        }, 400);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [inView]);

  // running width accumulator
  const maxWidth = 70;
  let runningWidth = 0;

  return (
    <div ref={ref} className="space-y-8">
      {/* Phase label */}
      <div className="mono text-xs text-white/40 uppercase tracking-widest">
        {phase === "scan"
          ? "Step 1 — prepare() scans each character"
          : phase === "break"
          ? "Step 2 — layout() finds line breaks"
          : "Done — {lineCount: 2, height: 48}"}
      </div>

      {/* Character badges */}
      <div className="flex flex-wrap gap-2">
        {WALK_CHARS.map((char, i) => {
          const w = WALK_WIDTHS[char] ?? 7;
          const colorClass = CHAR_COLORS[i % CHAR_COLORS.length];
          const revealed = i <= scanPos;
          const isBreakPoint = phase !== "scan" && i === lineBreakPos;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              {isBreakPoint && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mono text-[10px] text-red-400 font-bold"
                >
                  ↵
                </motion.div>
              )}
              <motion.div
                animate={{
                  opacity: revealed ? 1 : 0.15,
                  scale: i === scanPos ? 1.15 : 1,
                }}
                transition={{ duration: 0.15 }}
                className={`border rounded-lg px-2.5 py-2 text-center min-w-[36px] ${
                  revealed ? colorClass : "bg-white/3 border-white/8 text-white/20"
                }`}
              >
                <div className="mono text-sm font-semibold">
                  {char === " " ? "·" : char}
                </div>
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mono text-[9px] text-white/50 mt-0.5"
                  >
                    {w}px
                  </motion.div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Visual ruler for line breaking */}
      {phase !== "scan" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/4 border border-white/12 rounded-xl p-6 space-y-4"
        >
          <div className="mono text-xs text-white/40 mb-2">
            layout(p, maxWidth=70px, lineHeight=24px)
          </div>

          {/* Ruler */}
          <div className="relative">
            <div className="flex h-8 bg-white/5 rounded-lg overflow-hidden border border-white/10">
              {/* Max width marker */}
              <div
                className="absolute top-0 bottom-0 border-r-2 border-red-500/60 border-dashed z-10"
                style={{ left: `${(maxWidth / 120) * 100}%` }}
              />
              <div
                className="absolute -top-5 mono text-[9px] text-red-400/70"
                style={{ left: `${(maxWidth / 120) * 100}%`, transform: "translateX(-50%)" }}
              >
                maxWidth
              </div>

              {/* Characters filling up */}
              {WALK_CHARS.map((char, i) => {
                const w = WALK_WIDTHS[char] ?? 7;
                const prevWidth = WALK_CHARS.slice(0, i).reduce(
                  (acc, c) => acc + (WALK_WIDTHS[c] ?? 7),
                  0
                );
                const isLine2 = i > lineBreakPos;
                const line2Width = WALK_CHARS.slice(lineBreakPos + 1, i).reduce(
                  (acc, c) => acc + (WALK_WIDTHS[c] ?? 7),
                  0
                );
                const xPct = isLine2
                  ? (line2Width / 120) * 100
                  : (prevWidth / 120) * 100;
                const colorClass = CHAR_COLORS[i % CHAR_COLORS.length];

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`absolute top-1 bottom-1 rounded ${
                      isLine2 ? "top-[110%]" : ""
                    } ${colorClass.split(" ")[0]}`}
                    style={{
                      left: `${xPct}%`,
                      width: `${(w / 120) * 100}%`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Line breakdown */}
          <div className="space-y-2 pt-2">
            {[
              { line: "Hello ", chars: WALK_CHARS.slice(0, lineBreakPos + 1) },
              { line: "world", chars: WALK_CHARS.slice(lineBreakPos + 1) },
            ].map(({ line, chars }, li) => {
              const totalW = chars.reduce((a, c) => a + (WALK_WIDTHS[c] ?? 7), 0);
              return (
                <motion.div
                  key={li}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: li * 0.25 }}
                  className="flex items-center gap-3"
                >
                  <div className="mono text-xs text-white/40 w-12">
                    line {li + 1}
                  </div>
                  <div className="mono text-sm text-white/80 bg-white/6 border border-white/12 rounded-lg px-3 py-1.5">
                    "{line.trim() || line}"
                  </div>
                  <div className="mono text-xs text-white/50">
                    {totalW}px
                  </div>
                  <div className="mono text-xs text-green-400/70">
                    ✓ fits
                  </div>
                </motion.div>
              );
            })}
          </div>

          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3 mono text-sm"
            >
              <span className="text-white/50">returns </span>
              <span className="text-white/80">{"{ "}</span>
              <span className="text-blue-300">lineCount</span>
              <span className="text-white/50">: </span>
              <span className="text-orange-300">2</span>
              <span className="text-white/80">, </span>
              <span className="text-blue-300">height</span>
              <span className="text-white/50">: </span>
              <span className="text-orange-300">48</span>
              <span className="text-white/80">{" }"}</span>
              <span className="text-green-400/60 ml-3 text-xs">// 2 × 24px lineHeight</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TechExplainerSection() {
  return (
    <section className="py-32 px-6 bg-[#050505] border-t border-white/10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-24"
        >
          <div className="mono text-xs text-white/40 mb-4 uppercase tracking-widest">
            Under The Hood
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Why DOM layout is
            <br />
            <span className="text-white/30">the wrong primitive.</span>
          </h2>
          <p className="text-white/60 mt-5 max-w-2xl leading-relaxed text-base">
            Every time you call{" "}
            <code className="mono text-white/80 text-sm bg-white/8 border border-white/15 px-1.5 py-0.5 rounded">
              getBoundingClientRect()
            </code>{" "}
            or{" "}
            <code className="mono text-white/80 text-sm bg-white/8 border border-white/15 px-1.5 py-0.5 rounded">
              element.scrollHeight
            </code>
            , the browser must synchronously complete a full layout pass. For 100 elements
            that&apos;s 100 forced reflows. Pretext solves this by taking text measurement
            entirely out of the DOM.
          </p>
        </motion.div>

        {/* 1. Quick Start */}
        <QuickStartSection />

        {/* 2. The Problem */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="mono text-xs text-white/40 mb-3 uppercase tracking-widest">
            The Problem
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">
            Every DOM measurement costs you
          </h3>
          <p className="text-white/60 mb-8 leading-relaxed">
            DOM measurements force synchronous layout. The browser can&apos;t run your
            JavaScript while it&apos;s recalculating the entire document tree.
          </p>
          <div className="bg-white/3 border border-white/10 rounded-2xl p-8 min-h-[120px]">
            <LargeTimeline />
          </div>
        </motion.div>

        {/* 3. Architecture */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="mono text-xs text-white/40 mb-3 uppercase tracking-widest">
            Architecture
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">
            Two-phase design
          </h3>
          <p className="text-white/60 mb-8 leading-relaxed">
            The key insight: measuring character widths is a one-time cost.
            Line-breaking is just arithmetic over those cached widths — no browser involved.
          </p>

          {/* Interactive two-phase walkthrough */}
          <TwoPhaseVisual />

          <ArchCards />
        </motion.div>

        {/* 4. Algorithm Walkthrough */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mono text-xs text-white/40 mb-3 uppercase tracking-widest">
            Algorithm
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">
            Watch it happen
          </h3>
          <p className="text-white/60 mb-8 leading-relaxed">
            Scroll into view to watch{" "}
            <code className="mono text-white/80 text-sm bg-white/8 border border-white/15 px-1.5 py-0.5 rounded">
              prepare()
            </code>{" "}
            scan each character, then{" "}
            <code className="mono text-white/80 text-sm bg-white/8 border border-white/15 px-1.5 py-0.5 rounded">
              layout()
            </code>{" "}
            find line breaks using only arithmetic.
          </p>
          <div className="bg-white/3 border border-white/10 rounded-2xl p-8 min-h-[120px]">
            <AlgorithmWalkthrough />
          </div>
        </motion.div>

        {/* Code Examples */}
        <CodeExamplesSection />

      </div>
    </section>
  );
}
