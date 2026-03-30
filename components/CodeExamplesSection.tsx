"use client";

import { useState, useEffect, useRef } from "react";
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
  keyword:  "text-[#c792ea]",
  fn:       "text-[#82aaff]",
  str:      "text-[#c3e88d]",
  num:      "text-[#f78c6c]",
  type:     "text-[#ffcb6b]",
  comment:  "text-[#546e7a]",
  punc:     "text-[#89ddff]",
  plain:    "text-[#eeffff]",
  dim:      "text-white/40",
  tag:      "text-[#f07178]",
  prop:     "text-[#b2ccd6]",
  import:   "text-[#c3e88d]",
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
    label: "Auto Textarea",
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
      [{ text: `    `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `layout`, color: C.fn }, { text: `(p, `, color: C.punc }, { text: `9999`, color: C.num }, { text: `, `, color: C.punc }, { text: `18`, color: C.num }, { text: `).height`, color: C.punc }],
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
      [{ text: `    `, color: C.keyword }, { text: `return `, color: C.keyword }, { text: `{ ...item, minHeight: titleH `, color: C.punc }, { text: `+ `, color: C.punc }, { text: `bodyH `, color: C.punc }, { text: `+ `, color: C.punc }, { text: `48 `, color: C.punc }, { text: `}`, color: C.punc }],
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

// ── Live Preview Components ────────────────────────────────────────────────────

function HookPreview() {
  const [text, setText] = useState(
    "The key insight: measuring character widths is a one-time cost. Line-breaking is just arithmetic."
  );
  const [maxWidth, setMaxWidth] = useState(220);
  const [fontSize, setFontSize] = useState(14);
  const [metrics, setMetrics] = useState<{ lineCount: number; height: number } | null>(null);
  const preparedRef = useRef<unknown>(null);

  // prepare() — runs when text or font changes
  useEffect(() => {
    preparedRef.current = null;
    const run = async () => {
      const { prepare, layout } = await import("@chenglou/pretext");
      preparedRef.current = prepare(text, `${fontSize}px Arial`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = layout(preparedRef.current as any, maxWidth, fontSize * 1.6);
      setMetrics({ lineCount: r.lineCount, height: Math.round(r.height) });
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, fontSize]);

  // layout() — instant, runs when width changes
  useEffect(() => {
    if (!preparedRef.current) return;
    const run = async () => {
      const { layout } = await import("@chenglou/pretext");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = layout(preparedRef.current as any, maxWidth, fontSize * 1.6);
      setMetrics({ lineCount: r.lineCount, height: Math.round(r.height) });
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxWidth]);

  return (
    <div className="p-5 space-y-4">
      <div>
        <label className="mono text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">
          text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-white/30 mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mono text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">
            maxWidth — <span className="text-white">{maxWidth}px</span>
          </label>
          <input
            type="range" min={80} max={380} value={maxWidth}
            onChange={(e) => setMaxWidth(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>
        <div>
          <label className="mono text-[10px] text-white/35 uppercase tracking-widest block mb-1.5">
            fontSize — <span className="text-white">{fontSize}px</span>
          </label>
          <input
            type="range" min={10} max={22} value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>
      </div>

      {/* Output */}
      <div className="flex gap-4 items-start">
        {/* Visual text box */}
        <div
          className="border border-dashed border-white/20 rounded-lg p-3 text-white/75 break-words shrink-0 leading-relaxed"
          style={{ width: Math.min(maxWidth, 260), fontSize, lineHeight: 1.6 }}
        >
          {text || "…"}
        </div>
        {/* Metrics */}
        {metrics && (
          <div className="space-y-2 shrink-0">
            {[
              { label: "lineCount", value: metrics.lineCount, color: "text-[#82aaff]" },
              { label: "height", value: `${metrics.height}px`, color: "text-[#f78c6c]" },
            ].map(({ label, value, color }) => (
              <motion.div
                key={`${label}-${value}`}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[100px]"
              >
                <div className="mono text-[9px] text-white/30 mb-0.5">{label}</div>
                <div className={`mono text-xl font-bold ${color}`}>{value}</div>
              </motion.div>
            ))}
            <div className="mono text-[9px] text-green-400/50 flex items-center gap-1 pt-1">
              <span className="w-1 h-1 rounded-full bg-green-400/50" />
              no DOM reads
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TextareaPreview() {
  const [value, setValue] = useState("");
  const [height, setHeight] = useState(80);
  const [measuredH, setMeasuredH] = useState<number | null>(null);
  const preparedRef = useRef<unknown>(null);

  useEffect(() => {
    if (!value) {
      setHeight(80);
      setMeasuredH(null);
      return;
    }
    const run = async () => {
      const { prepare, layout } = await import("@chenglou/pretext");
      preparedRef.current = prepare(value, "14px Inter");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { height: h } = layout(preparedRef.current as any, 320, 22);
      const final = Math.max(80, Math.round(h) + 28);
      setMeasuredH(Math.round(h));
      setHeight(final);
    };
    run();
  }, [value]);

  return (
    <div className="p-5 space-y-4">
      <div className="mono text-xs text-white/40 leading-relaxed">
        Type below — <span className="text-white/70">height is pre-calculated by pretext</span> before
        the DOM renders. No <code className="text-white/60">scrollHeight</code> reads.
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Start typing to watch me grow…"
          style={{ height, resize: "none", transition: "height 120ms ease", overflow: "hidden" }}
          className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400/50 mono placeholder-white/20"
        />
        {/* Height badge */}
        <AnimatePresence>
          {measuredH !== null && (
            <motion.div
              key={height}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex flex-col items-center gap-1"
            >
              <div className="w-px h-6 bg-purple-400/30" />
              <div className="mono text-[10px] text-purple-300/70 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-0.5 whitespace-nowrap">
                {height}px
              </div>
              <div className="w-px h-6 bg-purple-400/30" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="mono text-[10px] text-white/30">
          pretext says:{" "}
          <span className="text-white/60">
            {measuredH !== null ? `text height = ${measuredH}px → textarea = ${height}px` : "waiting for input…"}
          </span>
        </div>
        {measuredH !== null && (
          <span className="mono text-[10px] text-green-400/60 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-green-400/60" />
            zero layout shift
          </span>
        )}
      </div>
    </div>
  );
}

const TOOLTIP_ITEMS = [
  { label: "Profile", content: "View your profile", pos: "left" },
  { label: "Export as CSV file", content: "Download data as spreadsheet", pos: "center" },
  { label: "Delete", content: "Permanently remove this — cannot be undone", pos: "right" },
];

function TooltipPreview() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [sides, setSides] = useState<("left" | "right")[]>(["right", "right", "left"]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure each tooltip's content width with pretext to determine side
  useEffect(() => {
    const run = async () => {
      const { prepare, layout } = await import("@chenglou/pretext");
      const containerW = containerRef.current?.clientWidth ?? 400;
      const newSides = TOOLTIP_ITEMS.map((item, i) => {
        const p = prepare(item.content, "12px Inter");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tooltipW = layout(p as any, 9999, 18).height + 24; // single-line: height ≈ width proxy
        // Use rough pixel positions for each button
        const anchorX = i === 0 ? 40 : i === 1 ? containerW / 2 : containerW - 80;
        return anchorX + tooltipW * 6 > containerW ? "left" : "right";
      });
      setSides(newSides as ("left" | "right")[]);
    };
    run();
  }, []);

  return (
    <div className="p-5 space-y-4">
      <div className="mono text-xs text-white/40 leading-relaxed">
        Hover the buttons — pretext measures each tooltip&apos;s content width{" "}
        <span className="text-white/70">before mount</span>, so the side is always correct.
        No flip animation needed.
      </div>

      <div
        ref={containerRef}
        className="bg-white/3 border border-white/10 rounded-xl p-6 relative flex items-center justify-between"
        style={{ minHeight: 80 }}
      >
        {TOOLTIP_ITEMS.map((item, i) => (
          <div
            key={i}
            className="relative"
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <button className="mono text-xs px-3 py-1.5 bg-white/8 border border-white/20 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all whitespace-nowrap">
              {item.label}
            </button>

            <AnimatePresence>
              {activeIdx === i && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.12 }}
                  className="absolute z-20 top-full mt-2 mono text-[11px] bg-[#0d1117] border border-white/20 rounded-lg px-3 py-1.5 text-white/85 whitespace-nowrap shadow-2xl"
                  style={
                    sides[i] === "right"
                      ? { left: 0 }
                      : { right: 0 }
                  }
                >
                  {item.content}
                  <span className={`ml-2 text-[9px] font-bold ${sides[i] === "right" ? "text-blue-400/70" : "text-orange-400/70"}`}>
                    [{sides[i]}]
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mono text-[10px] text-white/35">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500/40" /> opens right</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-orange-500/40" /> flips left (would overflow)</span>
      </div>
    </div>
  );
}

const CARD_DATA = [
  {
    title: "Revenue",
    body: "Total revenue across all channels this month.",
    color: "border-blue-500/25 bg-blue-500/5",
    accent: "text-blue-300",
  },
  {
    title: "Monthly Active Users",
    body: "Unique users who performed at least one meaningful action in the last 30 days. Excludes bots.",
    color: "border-purple-500/25 bg-purple-500/5",
    accent: "text-purple-300",
  },
  {
    title: "Conversion",
    body: "Checkout conversion rate.",
    color: "border-green-500/25 bg-green-500/5",
    accent: "text-green-300",
  },
];

function CardGridPreview() {
  const [cards, setCards] = useState(
    CARD_DATA.map((c) => ({ ...c, minHeight: 0, measured: false }))
  );

  useEffect(() => {
    const run = async () => {
      const { prepare, layout } = await import("@chenglou/pretext");
      const CARD_W = 160;
      const measured = CARD_DATA.map((card) => {
        const tp = prepare(card.title, "bold 13px Inter");
        const bp = prepare(card.body, "12px Inter");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const titleH = layout(tp as any, CARD_W - 24, 20).height;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bodyH = layout(bp as any, CARD_W - 24, 18).height;
        return { ...card, minHeight: Math.round(titleH + bodyH + 56), measured: true };
      });
      setCards(measured);
    };
    run();
  }, []);

  return (
    <div className="p-5 space-y-4">
      <div className="mono text-xs text-white/40 leading-relaxed">
        Each card&apos;s <code className="text-white/60">minHeight</code> is pre-calculated by pretext
        before first render.{" "}
        <span className="text-white/70">The grid never jumps</span> as content loads.
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className={`border rounded-xl p-3 flex flex-col gap-2 relative ${card.color}`}
            style={{ minHeight: card.minHeight || 80 }}
          >
            <div className={`mono text-xs font-bold leading-tight ${card.accent}`}>
              {card.title}
            </div>
            <div className="mono text-[11px] text-white/50 leading-relaxed flex-1">
              {card.body}
            </div>
            {/* minHeight badge */}
            {card.measured && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="absolute -top-2 -right-2 mono text-[9px] bg-black border border-white/20 rounded-full px-2 py-0.5 text-white/40 whitespace-nowrap"
              >
                min={card.minHeight}px
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mono text-[10px] text-green-400/55 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400/55" />
        minHeight set before first paint — badges show pretext output
      </div>
    </div>
  );
}

// ── Code Block ─────────────────────────────────────────────────────────────────

function CodeBlock({ lines, filename, filenameColor }: {
  lines: Token[][];
  filename: string;
  filenameColor: string;
}) {
  const [copied, setCopied] = useState(false);
  const rawCode = lines.map((line) => line.map((t) => t.text).join("")).join("\n");

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
      style={{ background: "linear-gradient(135deg, #0d1117 0%, #0f1320 50%, #0d1117 100%)" }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/8"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className={`mono text-xs ml-3 ${filenameColor}`}>{filename}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(rawCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
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
              <span className="select-none w-8 shrink-0 text-right pr-4 mono text-white/20 text-xs pt-px">
                {li + 1}
              </span>
              <span>
                {line.map((token, ti) => (
                  <span key={ti} className={`mono ${token.color}`}>{token.text}</span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ── Preview panel map ──────────────────────────────────────────────────────────

const PREVIEW_MAP: Record<string, React.ComponentType> = {
  hook:     HookPreview,
  textarea: TextareaPreview,
  tooltip:  TooltipPreview,
  card:     CardGridPreview,
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CodeExamplesSection() {
  const [active, setActive] = useState("hook");
  const [showPreview, setShowPreview] = useState(false);
  const example = EXAMPLES.find((e) => e.id === active)!;
  const PreviewComponent = PREVIEW_MAP[active];

  // Reset to code view when switching tabs
  const handleTabChange = (id: string) => {
    setActive(id);
    setShowPreview(false);
  };

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
          Works with any React project — and slots naturally into shadcn/ui components.
          Pick a pattern, read the code, then hit{" "}
          <span className="text-white/80 font-medium">Preview</span> to see it run live.
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => handleTabChange(ex.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
              active === ex.id
                ? "bg-white text-black border-white font-semibold"
                : "bg-white/3 border-white/15 text-white/55 hover:text-white/80 hover:border-white/30"
            }`}
          >
            {ex.label}
            <span
              className={`mono text-[10px] px-1.5 py-0.5 rounded border ${
                active === ex.id ? "bg-black/15 border-black/15 text-black/50" : ex.tagColor
              }`}
            >
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
          transition={{ duration: 0.22 }}
          className="grid md:grid-cols-[1fr_1.8fr] gap-6 items-start"
        >
          {/* ── Left: description + key pattern + install ── */}
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
              <p className="text-white/55 text-sm leading-relaxed">{example.description}</p>
            </div>

            {/* Key pattern */}
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
                  <div className="flex gap-2"><span className="text-green-400">→</span><code className="mono text-white/80">prepare()</code> in <code className="mono text-white/80">useEffect([text, font])</code></div>
                  <div className="flex gap-2"><span className="text-green-400">→</span><code className="mono text-white/80">layout()</code> in <code className="mono text-white/80">useEffect([maxWidth])</code></div>
                  <div className="flex gap-2"><span className="text-green-400">→</span>Two effects = two costs, separated cleanly</div>
                </div>
              )}
              {example.id === "textarea" && (
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex gap-2"><span className="text-green-400">→</span>Height <strong className="text-white">known before render</strong></div>
                  <div className="flex gap-2"><span className="text-green-400">→</span><code className="mono text-white/80">transition-[height]</code> animates the grow</div>
                  <div className="flex gap-2"><span className="text-green-400">→</span>No <code className="mono text-white/80">scrollHeight</code> reads needed</div>
                </div>
              )}
              {example.id === "tooltip" && (
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex gap-2"><span className="text-green-400">→</span><code className="mono text-white/80">side</code> calculated <strong className="text-white">before mount</strong></div>
                  <div className="flex gap-2"><span className="text-green-400">→</span>No flip animation — position is always right first time</div>
                  <div className="flex gap-2"><span className="text-green-400">→</span>Works for any content length</div>
                </div>
              )}
              {example.id === "card" && (
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex gap-2"><span className="text-green-400">→</span><code className="mono text-white/80">minHeight</code> set before first paint</div>
                  <div className="flex gap-2"><span className="text-green-400">→</span>Grid never jumps as content loads</div>
                  <div className="flex gap-2"><span className="text-green-400">→</span><code className="mono text-white/80">measureCards()</code> runs once in <code className="mono text-white/80">useMemo</code></div>
                </div>
              )}
            </div>

            {/* Install */}
            <div
              className="rounded-xl px-4 py-3 border flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <span className="mono text-white/20 text-xs">$</span>
              <code className="mono text-xs text-white/50 select-all">npm install @chenglou/pretext</code>
            </div>
          </div>

          {/* ── Right: Code / Preview toggle panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="flex flex-col gap-0"
          >
            {/* Toggle bar */}
            <div className="flex items-center gap-1 mb-3">
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setShowPreview(false)}
                  className={`mono text-xs px-4 py-1.5 rounded-lg transition-all ${
                    !showPreview
                      ? "bg-white text-black font-semibold shadow"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  Code
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className={`mono text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    showPreview
                      ? "bg-white text-black font-semibold shadow"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${showPreview ? "bg-green-600" : "bg-green-400/60"}`} />
                  Preview
                </button>
              </div>
              <span className="mono text-[10px] text-white/25 ml-2">
                {showPreview ? "live output — powered by real pretext" : example.filename}
              </span>
            </div>

            {/* Panel */}
            <AnimatePresence mode="wait">
              {!showPreview ? (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <CodeBlock
                    lines={example.lines}
                    filename={example.filename}
                    filenameColor={example.filenameColor}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-2xl overflow-hidden border border-white/10"
                  style={{ background: "linear-gradient(135deg, #0d1117 0%, #0f1320 50%, #0d1117 100%)" }}
                >
                  {/* Preview chrome */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/8"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="mono text-xs text-white/30 ml-2">live preview</span>
                    <span className="ml-auto mono text-[10px] text-green-400/50 flex items-center gap-1.5">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-green-400/60"
                      />
                      running @chenglou/pretext
                    </span>
                  </div>
                  <PreviewComponent />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
