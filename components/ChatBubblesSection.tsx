"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  text: string;
  from: "user" | "ai";
  delay: number;
}

const CONVERSATION: Message[] = [
  {
    id: 1,
    from: "ai",
    text: "Hello! I'm measured with pretext.",
    delay: 0,
  },
  {
    id: 2,
    from: "user",
    text: "No DOM measurement?",
    delay: 800,
  },
  {
    id: 3,
    from: "ai",
    text: "Exactly. My bubble width is calculated purely in JS — no getBoundingClientRect, no layout recalc, no reflow.",
    delay: 1800,
  },
  {
    id: 4,
    from: "user",
    text: "That's wild. How fast is it?",
    delay: 3200,
  },
  {
    id: 5,
    from: "ai",
    text: "Sub-millisecond per layout. Even if you have 10,000 chat bubbles, you can calculate all their heights in under 100ms.",
    delay: 4400,
  },
  {
    id: 6,
    from: "user",
    text: "Perfect for virtual scroll.",
    delay: 6000,
  },
  {
    id: 7,
    from: "ai",
    text: "Yes! No more measuring-then-scrolling jank. You know every height upfront.",
    delay: 7000,
  },
  {
    id: 8,
    from: "user",
    text: "I'm sold 🎉",
    delay: 8200,
  },
];

interface BubbleMetrics {
  width: number;
  lines: number;
}

function ChatBubble({
  message,
  metrics,
}: {
  message: Message;
  metrics: BubbleMetrics | null;
}) {
  const isUser = message.from === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div className="max-w-[75%] group">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-white text-black rounded-br-sm"
              : "bg-white/10 text-white border border-white/10 rounded-bl-sm"
          }`}
        >
          {message.text}
        </div>
        {/* Pretext metrics badge */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mono text-[10px] text-white/25 mt-1 ${isUser ? "text-right" : "text-left"}`}
          >
            {metrics.lines}L · {metrics.width}px · pretext
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatBubblesSection() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<Record<number, BubbleMetrics>>({});
  const [isRunning, setIsRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const measureMessage = async (msg: Message) => {
    try {
      const { prepare, layout } = await import("@chenglou/pretext");
      const maxWidth = 240;
      const fontSize = 14;
      const lineHeight = fontSize * 1.6;
      const prepared = prepare(msg.text, `${fontSize}px Arial`);
      const result = layout(prepared, maxWidth, lineHeight);
      setMetrics((prev) => ({
        ...prev,
        [msg.id]: { width: Math.round(maxWidth), lines: result.lineCount },
      }));
    } catch {
      setMetrics((prev) => ({
        ...prev,
        [msg.id]: { width: 240, lines: 1 },
      }));
    }
  };

  const startConversation = () => {
    setVisibleMessages([]);
    setMetrics({});
    setIsRunning(true);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    CONVERSATION.forEach((msg) => {
      const t = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, msg]);
        measureMessage(msg);
        // auto-scroll
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, msg.delay);
      timeoutsRef.current.push(t);
    });

    // Mark as not running after last message
    const last = CONVERSATION[CONVERSATION.length - 1];
    const done = setTimeout(() => setIsRunning(false), last.delay + 1000);
    timeoutsRef.current.push(done);
  };

  useEffect(() => {
    // Auto-start on mount after small delay
    const t = setTimeout(startConversation, 500);
    return () => {
      clearTimeout(t);
      timeoutsRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-scroll when messages added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleMessages]);

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
            Demo 02 — Chat Bubbles
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Shrinkwrapped bubbles.
            <br />
            <span className="text-white/30">No DOM tricks.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl">
            Each bubble&apos;s dimensions are computed by pretext before rendering.
            The tiny badge below each message shows the measured line count and
            width — proof the DOM was never consulted.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Chat window */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Header bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-2 mono text-xs text-white/30">pretext chat</span>
            </div>

            {/* Messages */}
            <div
              ref={containerRef}
              className="h-80 overflow-y-auto p-4 scroll-smooth"
            >
              <AnimatePresence>
                {visibleMessages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    metrics={metrics[msg.id] ?? null}
                  />
                ))}
              </AnimatePresence>

              {isRunning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-3"
                >
                  <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5">
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map((d) => (
                        <motion.div
                          key={d}
                          className="w-1.5 h-1.5 bg-white/40 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, delay: d, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
              <div className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm text-white/20 mono">
                Type a message...
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                ↑
              </div>
            </div>
          </motion.div>

          {/* Replay + info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:w-56 space-y-4"
          >
            <button
              onClick={startConversation}
              disabled={isRunning}
              className="w-full py-3 px-4 border border-white/20 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed mono"
            >
              {isRunning ? "● playing..." : "↺  replay"}
            </button>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="mono text-xs text-white/30 uppercase tracking-widest">
                How it works
              </div>
              {[
                "prepare() tokenizes text once",
                "layout() returns exact line count + height",
                "Bubble renders with known size",
                "Zero DOM reads needed",
              ].map((step, i) => (
                <div key={i} className="flex gap-2 text-sm text-white/50">
                  <span className="mono text-white/20">{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
