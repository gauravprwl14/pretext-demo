"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Token {
  text: string;
  color: string;
}

interface CodeExample {
  id: string;
  label: string;
  tag: string;
  tagColor: string;
  description: string;
  filename: string;
  filenameColor: string;
  lines: Token[][];
}

// ── Color palette ──────────────────────────────────────────────────────────────

const C = {
  keyword:  "text-[#c792ea]",   // purple  — import, const, return, async, etc.
  fn:       "text-[#82aaff]",   // blue    — function names
  str:      "text-[#c3e88d]",   // green   — string literals
  num:      "text-[#f78c6c]",   // orange  — numbers
  type:     "text-[#ffcb6b]",   // yellow  — types, hooks
  comment:  "text-[#546e7a]",   // grey    — comments
  punc:     "text-[#89ddff]",   // cyan    — punctuation {, }, (, ), <, >
  plain:    "text-[#eeffff]",   // white   — identifiers
  dim:      "text-white/40",    // dimmed  — less important
  tag:      "text-[#f07178]",   // red     — JSX tags
  prop:     "text-[#b2ccd6]",   // light   — props
  import:   "text-[#c3e88d]",   // same as str for imports
};

// ── Examples ───────────────────────────────────────────────────────────────────

const EXAMPLES: CodeExample[] = [
  {
    id: "hook",
    label: "React Hook",
    tag: "React",
    tagColor: "bg-blue-500/15 border-blue-500/30 text-blue-300",
    description:
      "A reusable `useTextMetrics` hook. Call it anywhere — returns `{ lineCount, height }` instantly without touching the DOM.",
    filename: "useTextMetrics.ts",
    filenameColor: "text-blue-300",
    lines: [
      [{ text: `import `, color: C.keyword }, { text: `{ prepare, layout }`, color: C.punc }, { text: ` from `, color: C.keyword }, { text: `'@chenglou/pretext'`, color: C.str }],
      [{ text: `import `, color: C.keyword }, { text: `{ useState, useEffect, useRef }`, color: C.punc }, { text: ` from `, color: C.keyword }, { text: `'react'`, color: C.str }],
      [{ text: ``, color: C.plain }],
      [{ text: `export `, color: C.keyword }, { text: `function `, color: C.keyword }, { text: `useTextMetrics`, color: C.fn }, { text: `(`, color: C.punc }],
      [{ text: `  text`, color: C.plain }, { text: `: `, color: C.punc }, { text: `string`, color: C.type }, { text: `,`, color: C.punc }],
      [{ text: `  font`, color: C.plain }, { text: `: `, color: C.punc }, { text: `string`, color: C.type }, { text: ` = `, color: C.punc }, { text: `'16px Arial'`, color: C.str }, { text: `,`, color: C.punc }],
      [{ text: `  maxWidth`, color: C.plain }, { text: `: `, color: C.punc }, { text: `number`, color: C.type }, { text: `,`, color: C.punc }],
      [{ text: `  lineHeight`, color: C.plain }, { text: `: `, color: C.punc }, { text: `number `, color: C.type }, { text: `= `, color: C.punc }, { text: `24`, color: C.num }],
      [{ text: `) {`, color: C.punc }],
      [{ text: `  `, color: C.plain }, { text: `const `, color: C.keyword }, { text: `preparedRef `, color: C.plain }, { text: `= `, color: C.punc }, { text: `useRef`, color: C.fn }, { text: `(`, color: C.punc }, { text: `null`, color: C.keyword }, { text: `)`, color: C.punc }],
      [{ text: `  `, color: C.plain }, { text: `const `, color: C.keyword }, { text: `[result, setResult] `, color: C.plain }, { text: `= `, color: C.punc }, { text: `useState`, color: C.fn }, { text: `({ lineCount: `, color: C.punc }, { text: `0`, color: C.num }, { text: `, height: `, color: C.punc }, { text: `0 `, color: C.punc }, { text: `})`, color: C.punc }],
      [{ text: ``, color: C.plain }],
      [{ text: `  `, color: C.plain }, { text: `useEffect`, color: C.fn }, { text: `(() => {`, color: C.punc }],
      [{ text: `    `, color: C.comment }, { text: `// prepare() is expensive — run only when text/font changes`, color: C.comment }],
      [{ text: `    preparedRef.current `, color: C.plain }, { text: `= `, color: C.punc }, { text: `prepare`, color: C.fn }, { text: `(text, font)`, color: C.punc }],
      [{ text: `    `, color: C.plain }, { text: `const `, color: C.keyword }, { text: `r `, color: C.plain }, { text: `= `, color: C.punc }, { text: `layout`, color: C.fn }, { text: `(preparedRef.current, maxWidth, lineHeight)`, color: C.punc }],
      [{ text: `    setResult`, color: C.fn }, { text: `(r)`, color: C.punc }],
      [{ text: `  }, [text, font])`, color: C.punc }],
      [{ text: ``, color: C.plain }],
      [{ text: `  useEffect`, color: C.fn }, { text: `(() => {`, color: C.punc }],
      [{ text: `    `, color: C.comment }, { text: `// layout() is instant — run on every width change`, color: C.comment }],
      [{ text: `    `, color: C.keyword }, { text: `if `, color: C.keyword }, { text: `(preparedRef.current)`, color: C.punc }],
      [{ text: `      setResult`, color: C.fn }, { text: `(`, color: C.punc }, { text: `layout`, color: C.fn }, { text: `(preparedRef.current, maxWidth, lineHeight))`, color: C.punc }],
      [{ text: `  }, [maxWidth, lineHeight])`, color: C.punc }],
      [{ text: ``, color: C.plain }],
      [{ text: `  `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `result `, color: C.plain }, { text: `// { lineCount, height }`, color: C.comment }],
      [{ text: `}`, color: C.punc }],
    ],
  },

  {
    id: "textarea",
    label: "shadcn Textarea",
    tag: "shadcn/ui",
    tagColor: "bg-purple-500/15 border-purple-500/30 text-purple-300",
    description:
      "Auto-growing Textarea using shadcn's component. Pretext pre-measures the height before the DOM renders — zero layout shift as you type.",
    filename: "AutoTextarea.tsx",
    filenameColor: "text-purple-300",
    lines: [
      [{ text: `import `, color: C.keyword }, { text: `{ Textarea }`, color: C.punc }, { text: ` from `, color: C.keyword }, { text: `'@/components/ui/textarea'`, color: C.str }],
      [{ text: `import `, color: C.keyword }, { text: `{ prepare, layout }`, color: C.punc }, { text: ` from `, color: C.keyword }, { text: `'@chenglou/pretext'`, color: C.str }],
      [{ text: `import `, color: C.keyword }, { text: `{ useState, useEffect }`, color: C.punc }, { text: ` from `, color: C.keyword }, { text: `'react'`, color: C.str }],
      [{ text: ``, color: C.plain }],
      [{ text: `export `, color: C.keyword }, { text: `function `, color: C.keyword }, { text: `AutoTextarea`, color: C.fn }, { text: `() {`, color: C.punc }],
      [{ text: `  `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `[value, setValue] `, color: C.plain }, { text: `= useState(`, color: C.punc }, { text: `''`, color: C.str }, { text: `)`, color: C.punc }],
      [{ text: `  `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `[height, setHeight] `, color: C.plain }, { text: `= useState(`, color: C.punc }, { text: `80`, color: C.num }, { text: `)`, color: C.punc }],
      [{ text: ``, color: C.plain }],
      [{ text: `  useEffect`, color: C.fn }, { text: `(() => {`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `if `, color: C.keyword }, { text: `(!value) `, color: C.plain }, { text: `return`, color: C.keyword }],
      [{ text: `    `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `p `, color: C.plain }, { text: `= `, color: C.punc }, { text: `prepare`, color: C.fn }, { text: `(value, `, color: C.punc }, { text: `'14px Inter'`, color: C.str }, { text: `)`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `{ height: h } `, color: C.plain }, { text: `= `, color: C.punc }, { text: `layout`, color: C.fn }, { text: `(p, `, color: C.punc }, { text: `360`, color: C.num }, { text: `, `, color: C.punc }, { text: `22`, color: C.num }, { text: `)`, color: C.punc }],
      [{ text: `    setHeight`, color: C.fn }, { text: `(Math.max(`, color: C.punc }, { text: `80`, color: C.num }, { text: `, h + `, color: C.punc }, { text: `24`, color: C.num }, { text: `))`, color: C.punc }, { text: `  // + padding`, color: C.comment }],
      [{ text: `  }, [value])`, color: C.punc }],
      [{ text: ``, color: C.plain }],
      [{ text: `  `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `(`, color: C.punc }],
      [{ text: `    `, color: C.tag }, { text: `<Textarea`, color: C.tag }],
      [{ text: `      `, color: C.prop }, { text: `value`, color: C.prop }, { text: `={value}`, color: C.punc }],
      [{ text: `      `, color: C.prop }, { text: `onChange`, color: C.prop }, { text: `={(e) => setValue(e.target.value)}`, color: C.punc }],
      [{ text: `      style={{ height, resize: `, color: C.punc }, { text: `'none'`, color: C.str }, { text: `, overflow: `, color: C.punc }, { text: `'hidden'`, color: C.str }, { text: ` }}`, color: C.punc }],
      [{ text: `      className`, color: C.prop }, { text: `=`, color: C.punc }, { text: `"transition-[height] duration-100"`, color: C.str }],
      [{ text: `    `, color: C.tag }, { text: `/>`, color: C.tag }],
      [{ text: `  )`, color: C.punc }],
      [{ text: `}`, color: C.punc }],
    ],
  },

  {
    id: "tooltip",
    label: "Smart Tooltip",
    tag: "shadcn/ui",
    tagColor: "bg-purple-500/15 border-purple-500/30 text-purple-300",
    description:
      "Tooltip that knows its content width before rendering. Pretext calculates whether it overflows left/right — the tooltip always stays on screen.",
    filename: "SmartTooltip.tsx",
    filenameColor: "text-purple-300",
    lines: [
      [{ text: `import `, color: C.keyword }, { text: `{ Tooltip, TooltipContent, TooltipTrigger }`, color: C.punc }],
      [{ text: `  `, color: C.keyword }, { text: `from `, color: C.keyword }, { text: `'@/components/ui/tooltip'`, color: C.str }],
      [{ text: `import `, color: C.keyword }, { text: `{ prepare, layout }`, color: C.punc }, { text: ` from `, color: C.keyword }, { text: `'@chenglou/pretext'`, color: C.str }],
      [{ text: ``, color: C.plain }],
      [{ text: `export `, color: C.keyword }, { text: `function `, color: C.keyword }, { text: `SmartTooltip`, color: C.fn }, { text: `({ content, anchorX, containerW, children }`, color: C.plain }, { text: `) {`, color: C.punc }],
      [{ text: `  `, color: C.comment }, { text: `// Measure tooltip content width before it renders`, color: C.comment }],
      [{ text: `  `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `tooltipW `, color: C.plain }, { text: `= useMemo(() => {`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `p `, color: C.plain }, { text: `= `, color: C.punc }, { text: `prepare`, color: C.fn }, { text: `(content, `, color: C.punc }, { text: `'12px Inter'`, color: C.str }, { text: `)`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `layout`, color: C.fn }, { text: `(p, `, color: C.punc }, { text: `9999`, color: C.num }, { text: `, `, color: C.punc }, { text: `18`, color: C.num }, { text: `).height  `, color: C.punc }, { text: `// single-line width`, color: C.comment }],
      [{ text: `  }, [content])`, color: C.punc }],
      [{ text: ``, color: C.plain }],
      [{ text: `  `, color: C.comment }, { text: `// Decide side before DOM sees it`, color: C.comment }],
      [{ text: `  `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `side `, color: C.plain }, { text: `= anchorX + tooltipW > containerW `, color: C.punc }, { text: `? `, color: C.keyword }, { text: `'left'`, color: C.str }, { text: ` : `, color: C.punc }, { text: `'right'`, color: C.str }],
      [{ text: ``, color: C.plain }],
      [{ text: `  `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `(`, color: C.punc }],
      [{ text: `    `, color: C.tag }, { text: `<Tooltip`, color: C.tag }, { text: `>`, color: C.punc }],
      [{ text: `      `, color: C.tag }, { text: `<TooltipTrigger`, color: C.tag }, { text: `>{children}</`, color: C.punc }, { text: `TooltipTrigger`, color: C.tag }, { text: `>`, color: C.punc }],
      [{ text: `      `, color: C.tag }, { text: `<TooltipContent `, color: C.tag }, { text: `side`, color: C.prop }, { text: `={side}`, color: C.punc }, { text: `>`, color: C.punc }],
      [{ text: `        {content}`, color: C.plain }],
      [{ text: `      `, color: C.tag }, { text: `</TooltipContent`, color: C.tag }, { text: `>`, color: C.punc }],
      [{ text: `    `, color: C.tag }, { text: `</Tooltip`, color: C.tag }, { text: `>`, color: C.punc }],
      [{ text: `  )`, color: C.punc }],
      [{ text: `}`, color: C.punc }],
    ],
  },

  {
    id: "card",
    label: "Balanced Cards",
    tag: "React",
    tagColor: "bg-blue-500/15 border-blue-500/30 text-blue-300",
    description:
      "A card grid where every card height is measured by pretext upfront. Set `minHeight` before the first render — no jumpy reflow as images or fonts load.",
    filename: "CardGrid.tsx",
    filenameColor: "text-blue-300",
    lines: [
      [{ text: `import `, color: C.keyword }, { text: `{ prepare, layout }`, color: C.punc }, { text: ` from `, color: C.keyword }, { text: `'@chenglou/pretext'`, color: C.str }],
      [{ text: ``, color: C.plain }],
      [{ text: `const `, color: C.keyword }, { text: `CARD_W `, color: C.plain }, { text: `= `, color: C.punc }, { text: `280`, color: C.num }],
      [{ text: ``, color: C.plain }],
      [{ text: `function `, color: C.fn }, { text: `measureCards`, color: C.fn }, { text: `(items`, color: C.plain }, { text: `: `, color: C.punc }, { text: `{ title: string; body: string }[]`, color: C.type }, { text: `) {`, color: C.punc }],
      [{ text: `  `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `items.map(item => {`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `tp `, color: C.plain }, { text: `= `, color: C.punc }, { text: `prepare`, color: C.fn }, { text: `(item.title, `, color: C.punc }, { text: `'bold 16px Inter'`, color: C.str }, { text: `)`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `bp `, color: C.plain }, { text: `= `, color: C.punc }, { text: `prepare`, color: C.fn }, { text: `(item.body,  `, color: C.punc }, { text: `'14px Inter'`, color: C.str }, { text: `)`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `titleH `, color: C.plain }, { text: `= `, color: C.punc }, { text: `layout`, color: C.fn }, { text: `(tp, CARD_W`, color: C.punc }, { text: ` - `, color: C.punc }, { text: `32`, color: C.num }, { text: `, `, color: C.punc }, { text: `22`, color: C.num }, { text: `).height`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `bodyH  `, color: C.plain }, { text: `= `, color: C.punc }, { text: `layout`, color: C.fn }, { text: `(bp, CARD_W`, color: C.punc }, { text: ` - `, color: C.punc }, { text: `32`, color: C.num }, { text: `, `, color: C.punc }, { text: `20`, color: C.num }, { text: `).height`, color: C.punc }],
      [{ text: `    `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `{ ...item, minHeight: titleH `, color: C.punc }, { text: `+ `, color: C.punc }, { text: `bodyH `, color: C.punc }, { text: `+ `, color: C.punc }, { text: `48 `, color: C.punc }, { text: `}  `, color: C.punc }, { text: `// + padding`, color: C.comment }],
      [{ text: `  })`, color: C.punc }],
      [{ text: `}`, color: C.punc }],
      [{ text: ``, color: C.plain }],
      [{ text: `export `, color: C.keyword }, { text: `function `, color: C.keyword }, { text: `CardGrid`, color: C.fn }, { text: `({ items }) {`, color: C.punc }],
      [{ text: `  `, color: C.keyword }, { text: `const `, color: C.keyword }, { text: `cards `, color: C.plain }, { text: `= useMemo(() => `, color: C.punc }, { text: `measureCards`, color: C.fn }, { text: `(items), [items])`, color: C.punc }],
      [{ text: `  `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `(`, color: C.punc }],
      [{ text: `    `, color: C.tag }, { text: `<div `, color: C.tag }, { text: `className`, color: C.prop }, { text: `=`, color: C.punc }, { text: `"grid grid-cols-3 gap-4"`, color: C.str }, { text: `>`, color: C.punc }],
      [{ text: `      {cards.map(c => (`, color: C.punc }],
      [{ text: `        `, color: C.tag }, { text: `<div `, color: C.tag }, { text: `style`, color: C.prop }, { text: `={{ minHeight: c.minHeight }}>`, color: C.punc }],
      [{ text: `          `, color: C.tag }, { text: `<h3`, color: C.tag }, { text: `>{c.title}</`, color: C.punc }, { text: `h3`, color: C.tag }, { text: `>`, color: C.punc }],
      [{ text: `          `, color: C.tag }, { text: `<p`, color: C.tag }, { text: `>{c.body}</`, color: C.punc }, { text: `p`, color: C.tag }, { text: `>`, color: C.punc }],
      [{ text: `        `, color: C.tag }, { text: `</div`, color: C.tag }, { text: `>`, color: C.punc }],
      [{ text: `      ))}`, color: C.punc }],
      [{ text: `    `, color: C.tag }, { text: `</div`, color: C.tag }, { text: `>`, color: C.punc }],
      [{ text: `  )`, color: C.punc }],
      [{ text: `}`, color: C.punc }],
    ],
  },
];

// ── Code Block renderer ────────────────────────────────────────────────────────

function CodeBlock({ lines, filename, filenameColor }: {
  lines: Token[][];
  filename: string;
  filenameColor: string;
}) {
  const [copied, setCopied] = useState(false);

  const rawCode = lines.map(line => line.map(t => t.text).join("")).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{
      background: "linear-gradient(135deg, #0d1117 0%, #0f1320 50%, #0d1117 100%)",
    }}>
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8"
        style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className={`mono text-xs ml-3 ${filenameColor}`}>{filename}</span>
        </div>
        <button
          onClick={handleCopy}
          className="mono text-[10px] text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/20"
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto">
        <pre className="p-5 text-sm leading-[1.7]">
          {lines.map((line, li) => (
            <div key={li} className="flex">
              {/* Line number */}
              <span className="select-none w-8 shrink-0 text-right pr-4 mono text-white/20 text-xs pt-px">
                {li + 1}
              </span>
              {/* Tokens */}
              <span>
                {line.map((token, ti) => (
                  <span key={ti} className={`mono ${token.color}`}>
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CodeExamplesSection() {
  const [active, setActive] = useState("hook");
  const example = EXAMPLES.find(e => e.id === active)!;

  return (
    <div className="mt-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <div className="mono text-xs text-white/40 uppercase tracking-widest mb-3">
          Code Examples
        </div>
        <h3 className="text-3xl font-bold text-white mb-3">
          Drop it into your project
        </h3>
        <p className="text-white/60 max-w-2xl leading-relaxed">
          Works with any React project — and slots naturally into shadcn/ui
          components. Pick a pattern below and copy it straight in.
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setActive(ex.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
              active === ex.id
                ? "bg-white text-black border-white font-semibold"
                : "bg-white/3 border-white/15 text-white/55 hover:text-white/80 hover:border-white/30"
            }`}
          >
            {ex.label}
            <span className={`mono text-[10px] px-1.5 py-0.5 rounded border ${
              active === ex.id ? "bg-black/15 border-black/15 text-black/50" : ex.tagColor
            }`}>
              {ex.tag}
            </span>
          </button>
        ))}
      </div>

      {/* Example */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="grid md:grid-cols-[1fr_1.8fr] gap-6 items-start"
        >
          {/* Left: description + key points */}
          <div className="space-y-5">
            <div
              className="rounded-2xl p-6 border"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div className={`inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border mb-4 ${example.tagColor}`}>
                {example.tag}
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{example.label}</h4>
              <p className="text-white/55 text-sm leading-relaxed">
                {example.description}
              </p>
            </div>

            {/* Key insight */}
            <div
              className="rounded-2xl p-5 border"
              style={{
                background: "linear-gradient(135deg, rgba(74,222,128,0.06) 0%, rgba(74,222,128,0.02) 100%)",
                borderColor: "rgba(74,222,128,0.15)",
              }}
            >
              <div className="mono text-[10px] text-green-400/70 uppercase tracking-widest mb-3">
                Key pattern
              </div>
              {example.id === "hook" && (
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex gap-2"><span className="text-green-400">→</span> <code className="mono text-white/80">prepare()</code> in <code className="mono text-white/80">useEffect([text, font])</code></div>
                  <div className="flex gap-2"><span className="text-green-400">→</span> <code className="mono text-white/80">layout()</code> in <code className="mono text-white/80">useEffect([maxWidth])</code></div>
                  <div className="flex gap-2"><span className="text-green-400">→</span> Two separate effects = two separate costs</div>
                </div>
              )}
              {example.id === "textarea" && (
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex gap-2"><span className="text-green-400">→</span> Height is <strong className="text-white">known before render</strong></div>
                  <div className="flex gap-2"><span className="text-green-400">→</span> <code className="mono text-white/80">transition-[height]</code> animates the grow</div>
                  <div className="flex gap-2"><span className="text-green-400">→</span> No <code className="mono text-white/80">scrollHeight</code> reads needed</div>
                </div>
              )}
              {example.id === "tooltip" && (
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex gap-2"><span className="text-green-400">→</span> <code className="mono text-white/80">side</code> calculated <strong className="text-white">before mount</strong></div>
                  <div className="flex gap-2"><span className="text-green-400">→</span> No flip animation needed — position is always right</div>
                  <div className="flex gap-2"><span className="text-green-400">→</span> Works for any content length</div>
                </div>
              )}
              {example.id === "card" && (
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex gap-2"><span className="text-green-400">→</span> <code className="mono text-white/80">minHeight</code> set before first paint</div>
                  <div className="flex gap-2"><span className="text-green-400">→</span> Grid never jumps as content loads</div>
                  <div className="flex gap-2"><span className="text-green-400">→</span> <code className="mono text-white/80">measureCards()</code> runs once in <code className="mono text-white/80">useMemo</code></div>
                </div>
              )}
            </div>

            {/* Install reminder */}
            <div
              className="rounded-xl px-4 py-3 border flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              <span className="mono text-white/20 text-xs">$</span>
              <code className="mono text-xs text-white/50 select-all">
                npm install @chenglou/pretext
              </code>
            </div>
          </div>

          {/* Right: code block */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <CodeBlock
              lines={example.lines}
              filename={example.filename}
              filenameColor={example.filenameColor}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
