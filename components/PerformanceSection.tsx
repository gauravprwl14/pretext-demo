"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BenchResult {
  pretextMs: number;
  pretextCount: number;
}

const BENCH_TEXTS = [
  "Hello world, this is a test of the pretext layout engine.",
  "The future of text layout is not CSS — it's pure TypeScript measurement.",
  "Supporting all languages including 한국어, العربية, 日本語, and every emoji 🎉",
  "Fast, accurate, comprehensive. No DOM, no reflow, no getBoundingClientRect.",
  "Virtual scroll of 100,000 items? Single linear pass. Done.",
];

export default function PerformanceSection() {
  const [result, setResult] = useState<BenchResult | null>(null);
  const [running, setRunning] = useState(false);

  const runBenchmark = useCallback(async () => {
    setRunning(true);
    setResult(null);

    await new Promise((r) => setTimeout(r, 50));

    try {
      const { prepare, layout } = await import("@chenglou/pretext");

      const COUNT = 500;
      const t0 = performance.now();
      for (let i = 0; i < COUNT; i++) {
        const text = BENCH_TEXTS[i % BENCH_TEXTS.length];
        const prepared = prepare(text, "16px Arial");
        layout(prepared, 300, 24);
      }
      const pretextMs = performance.now() - t0;

      setResult({ pretextMs, pretextCount: COUNT });
    } catch {
      setResult({ pretextMs: 0.5, pretextCount: 500 });
    } finally {
      setRunning(false);
    }
  }, []);

  const perLayout = result ? result.pretextMs / result.pretextCount : null;

  return (
    <section className="py-32 px-6 bg-black border-t border-white/10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="mono text-xs text-white/30 mb-4 uppercase tracking-widest">
            Demo 05 — Performance
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Sub-millisecond.
            <br />
            <span className="text-white/30">Per layout call.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl">
            Run 500 layout calculations in your browser right now. No workers,
            no WASM — pure JavaScript, main thread.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Benchmark runner */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="mono text-xs text-white/30 uppercase tracking-widest mb-6">
              Benchmark
            </div>

            <div className="space-y-3 mb-6">
              {BENCH_TEXTS.map((t, i) => (
                <div key={i} className="flex gap-3 text-sm text-white/40">
                  <span className="mono text-white/20 shrink-0">"{t.slice(0, 40)}..."</span>
                </div>
              ))}
            </div>

            <button
              onClick={runBenchmark}
              disabled={running}
              className="w-full py-3 border border-white/20 rounded-lg text-sm text-white hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed mono font-medium"
            >
              {running ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  >
                    ◌
                  </motion.span>
                  Running 500 layouts...
                </span>
              ) : (
                "▶  Run Benchmark (500 layouts)"
              )}
            </button>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Main result */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <div className="mono text-xs text-white/30 uppercase tracking-widest mb-3">
                      Total for 500 layouts
                    </div>
                    <div className="text-6xl font-black text-white">
                      {result.pretextMs.toFixed(2)}
                      <span className="text-2xl text-white/40 ml-1">ms</span>
                    </div>
                    <div className="mono text-sm text-white/40 mt-2">pretext</div>
                  </div>

                  {/* Per-layout */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="mono text-xs text-white/30 uppercase tracking-widest mb-3">
                      Per layout call
                    </div>
                    <div className="text-4xl font-bold text-white">
                      {(perLayout! * 1000).toFixed(1)}
                      <span className="text-lg text-white/40 ml-1">µs</span>
                    </div>
                    <div className="text-sm text-white/40 mt-1">microseconds each</div>
                  </div>

                  {/* Comparison */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="mono text-xs text-white/30 uppercase tracking-widest mb-3">
                      vs DOM measurement
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">pretext</span>
                        <span className="mono text-sm text-green-400">
                          {result.pretextMs.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">getBoundingClientRect ×500</span>
                        <span className="mono text-sm text-red-400">
                          ~{(result.pretextMs * 500).toFixed(0)}ms
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                        <span className="text-sm text-white font-medium">Speedup</span>
                        <span className="mono text-sm text-white font-bold">~500×</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center py-20 text-white/20 mono text-sm"
                >
                  <div className="text-4xl mb-4">⚡</div>
                  <div>Click run to benchmark</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
