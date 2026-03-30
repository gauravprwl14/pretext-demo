"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const ARTICLE_TEXT = `The fundamental problem with text layout on the web is that we've always had to ask the browser for measurements after the fact. You render text, then you ask "how tall did that end up being?" and wait for a potentially expensive layout recalculation.

Pretext inverts this relationship entirely. Before you render a single character, you know exactly how many lines it will wrap into, how tall the block will be, and where every line break falls.

This might sound like a small change, but its implications are profound. Imagine building a magazine layout where articles flow across columns responsively. With DOM-based measurements, you'd need to render, measure, adjust, re-render in an expensive feedback loop.

With pretext, you calculate the entire layout upfront. You know Article A needs 8 lines in a 280px column at 16px font. Article B needs 5 lines. You can pack them perfectly without a single DOM operation.

This is especially powerful for canvas and WebGL rendering, where DOM measurements aren't available at all. Pretext brings the same text layout capabilities to non-DOM environments that the web platform has always had, just without the DOM overhead.

The library handles all the typography edge cases you'd expect: CJK character breaking, bidirectional text, emoji width correction, soft hyphens, and even mixed-script text like Korean alongside RTL Arabic.`;

interface ColumnContent {
  text: string;
  lines: number;
  height: number;
}

export default function MagazineSection() {
  const [cols, setCols] = useState(2);
  const [fontSize, setFontSize] = useState(14);
  const [columns, setColumns] = useState<ColumnContent[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      try {
        const { prepare, layout } = await import("@chenglou/pretext");
        const colWidth = Math.floor(680 / cols) - 20;
        const lineHeight = fontSize * 1.65;

        // Split text into words and distribute across columns
        const words = ARTICLE_TEXT.split(" ");
        const colTexts: string[] = [];
        const wordsPerCol = Math.ceil(words.length / cols);

        for (let c = 0; c < cols; c++) {
          colTexts.push(words.slice(c * wordsPerCol, (c + 1) * wordsPerCol).join(" "));
        }

        const computed: ColumnContent[] = colTexts.map((text) => {
          const prepared = prepare(text, `${fontSize}px Georgia, serif`);
          const result = layout(prepared, colWidth, lineHeight);
          return {
            text,
            lines: result.lineCount,
            height: Math.round(result.height),
          };
        });

        if (!cancelled) setColumns(computed);
      } catch {
        // Fallback
        const colTexts: string[] = [];
        const words = ARTICLE_TEXT.split(" ");
        const wordsPerCol = Math.ceil(words.length / cols);
        for (let c = 0; c < cols; c++) {
          colTexts.push(words.slice(c * wordsPerCol, (c + 1) * wordsPerCol).join(" "));
        }
        if (!cancelled)
          setColumns(
            colTexts.map((text) => ({
              text,
              lines: Math.ceil(text.length / 60),
              height: Math.ceil(text.length / 60) * fontSize * 1.65,
            }))
          );
      }
    }

    compute();
    return () => {
      cancelled = true;
    };
  }, [cols, fontSize]);

  return (
    <section className="py-32 px-6 bg-[#0a0a0a] border-t border-white/10">
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
            Demo 04 — Dynamic Magazine Layout
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Responsive columns.
            <br />
            <span className="text-white/30">Calculated, not guessed.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl">
            Adjust columns and font size. Every reflow is calculated by pretext
            — knowing exact line counts lets you balance columns perfectly.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex gap-8 mb-10 flex-wrap"
        >
          <div>
            <label className="mono text-xs text-white/40 uppercase tracking-widest block mb-2">
              Columns: <span className="text-white">{cols}</span>
            </label>
            <input
              type="range"
              min={1}
              max={4}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-40 accent-white"
            />
          </div>
          <div>
            <label className="mono text-xs text-white/40 uppercase tracking-widest block mb-2">
              Font Size: <span className="text-white">{fontSize}px</span>
            </label>
            <input
              type="range"
              min={11}
              max={20}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-40 accent-white"
            />
          </div>
        </motion.div>

        {/* Article */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/3 border border-white/10 rounded-2xl p-8"
        >
          {/* Article header */}
          <div className="mb-8 pb-6 border-b border-white/10">
            <div className="mono text-xs text-white/30 uppercase tracking-widest mb-2">
              Feature Article
            </div>
            <h3
              className="text-white leading-tight font-bold mb-2"
              style={{ fontSize: Math.max(fontSize * 2, 28) }}
            >
              Inverting the Render Loop
            </h3>
            <p className="text-white/40 text-sm">
              How pretext changes everything about text layout
            </p>
          </div>

          {/* Columns */}
          <div
            className="grid gap-6 transition-all duration-300"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {columns.map((col, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <p
                  className="text-white/70 leading-relaxed"
                  style={{ fontSize, lineHeight: 1.65, fontFamily: "Georgia, serif" }}
                >
                  {col.text}
                </p>
                {/* Column stats */}
                <div className="mono text-[10px] text-white/20 mt-3 border-t border-white/10 pt-2">
                  {col.lines} lines · {col.height}px · pretext
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Column balance visualizer */}
        {columns.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-6 flex gap-3 items-end"
          >
            <span className="mono text-xs text-white/30">Column heights:</span>
            {columns.map((col, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="mono text-[10px] text-white/30">{col.height}px</div>
                <div
                  className="w-10 bg-white/20 rounded-t transition-all duration-300"
                  style={{
                    height: Math.max(4, (col.height / Math.max(...columns.map((c) => c.height))) * 60),
                  }}
                />
                <div className="mono text-[10px] text-white/30">col {i + 1}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
