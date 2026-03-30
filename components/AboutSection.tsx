"use client";

import { motion } from "framer-motion";

const TIMELINE = [
  {
    phase: "Now",
    items: [
      "Pure TypeScript, ~4kb gzipped",
      "All languages: CJK, RTL Arabic, emoji",
      "Sub-millisecond layout calculations",
      "Two-phase API: prepare() + layout()",
    ],
    color: "text-white",
  },
  {
    phase: "Near Future",
    items: [
      "Canvas & WebGL rendering layer",
      "Full virtual DOM bypass",
      "Native app-quality animations",
      "Streaming layout for AI text",
    ],
    color: "text-white/60",
  },
  {
    phase: "Vision",
    items: [
      "Entire UIs without CSS",
      "GL + text at 120fps on any device",
      "AI-generated layouts, measured before render",
      "The end of layout thrashing forever",
    ],
    color: "text-white/30",
  },
];

const CODE_SNIPPET = `import { prepare, layout } from '@chenglou/pretext';

// Phase 1: tokenize once
const prepared = prepare(
  "Hello world, this text will wrap",
  "16px Arial"
);

// Phase 2: layout at any width (pure math)
const { lineCount, height } = layout(
  prepared,
  300,   // maxWidth
  24     // lineHeight
);

// No DOM touched. No reflow triggered.
// lineCount: 2, height: 48`;

export default function AboutSection() {
  return (
    <section className="py-32 px-6 bg-[#0a0a0a] border-t border-white/10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-20"
        >
          <div className="mono text-xs text-white/30 mb-4 uppercase tracking-widest">
            About Pretext
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-2xl">
            What it is, how it works,
            where it&apos;s going.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Left: explanation + code */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-xl font-bold text-white mb-3">What is it?</h3>
              <p className="text-white/50 leading-relaxed">
                Pretext is a userland text measurement library. It tells you
                exactly how text will wrap at any width — without asking the
                browser. The browser&apos;s font engine is used as ground truth
                during a one-time calibration; after that, it&apos;s pure math.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="text-xl font-bold text-white mb-3">How does it work?</h3>
              <p className="text-white/50 leading-relaxed mb-4">
                A two-phase API: <code className="mono text-white/70">prepare()</code> tokenizes
                text and caches character widths once. <code className="mono text-white/70">layout()</code>{" "}
                then runs purely arithmetic line-breaking at any width — no
                DOM, no side effects, no reflow.
              </p>

              {/* Code block */}
              <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <span className="ml-2 mono text-xs text-white/30">example.ts</span>
                </div>
                <pre className="p-4 text-xs leading-relaxed text-white/70 overflow-x-auto mono">
                  {CODE_SNIPPET}
                </pre>
              </div>
            </motion.div>
          </div>

          {/* Right: roadmap */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-white mb-3">Where is it going?</h3>
              <p className="text-white/50 leading-relaxed">
                Text measurement was the last unsolved primitive. With it in
                hand, entirely new categories of UI become possible.
              </p>
            </motion.div>

            <div className="space-y-6">
              {TIMELINE.map((phase, i) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="relative pl-6"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute left-0 top-1.5 w-2 h-2 rounded-full border border-white/30"
                    style={{ background: i === 0 ? "white" : "transparent" }}
                  />
                  {/* Connector */}
                  {i < TIMELINE.length - 1 && (
                    <div className="absolute left-[3px] top-4 bottom-[-24px] w-px bg-white/10" />
                  )}

                  <div
                    className={`mono text-xs uppercase tracking-widest mb-2 ${phase.color}`}
                  >
                    {phase.phase}
                  </div>
                  <ul className="space-y-1">
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className={`text-sm flex gap-2 ${phase.color} opacity-80`}
                      >
                        <span className="text-white/20 shrink-0">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-24 text-center border-t border-white/10 pt-16"
        >
          <div className="text-white/30 mono text-sm mb-6">
            Built by Cheng Lou · Released March 2026
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="https://github.com/chenglou/pretext"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            >
              View on GitHub →
            </a>
            <span className="px-6 py-3 border border-white/20 text-white/60 rounded-lg text-sm mono">
              npm install @chenglou/pretext
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
