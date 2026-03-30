"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Particle {
  char: string;
  homeX: number; // pretext-measured resting position
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
}

type KMode = "wave" | "gravity" | "reflow";

// ── Physics constants ──────────────────────────────────────────────────────────

const SPRING_K = 0.072;
const DAMPING = 0.78;
const ATTRACT_K = 0.09;
const ATTRACT_DAMPING = 0.72;
const REPEL_RADIUS = 90;
const REPEL_STRENGTH = 16;
const ATTRACT_RADIUS = 180;

// ── Pretext + canvas char-position builder ────────────────────────────────────

async function buildParticles(
  text: string,
  font: string,
  lineHeight: number,
  maxWidth: number,
  canvasW: number,
  canvasH: number,
  scatter = false
): Promise<Particle[]> {
  const { prepareWithSegments, layoutWithLines } = await import("@chenglou/pretext");
  const prepared = prepareWithSegments(text, font);
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);

  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d")!;
  offCtx.font = font;

  const totalH = lines.length * lineHeight;
  const startY = (canvasH - totalH) / 2 + lineHeight * 0.72;

  const particles: Particle[] = [];
  lines.forEach((line, li) => {
    const lineStartX = (canvasW - line.width) / 2;
    let cx = lineStartX;
    for (const char of [...line.text]) {
      const cw = offCtx.measureText(char).width;
      const hx = cx + cw / 2;
      const hy = startY + li * lineHeight;
      particles.push({
        char,
        homeX: hx,
        homeY: hy,
        x: scatter ? Math.random() * canvasW : hx,
        y: scatter ? Math.random() * canvasH : hy,
        vx: scatter ? (Math.random() - 0.5) * 8 : 0,
        vy: scatter ? (Math.random() - 0.5) * 8 : 0,
        alpha: 1,
        scale: 1,
      });
      cx += cw;
    }
  });
  return particles;
}

async function updateParticleHomes(
  particles: Particle[],
  text: string,
  font: string,
  lineHeight: number,
  maxWidth: number,
  canvasW: number,
  canvasH: number
): Promise<void> {
  const { prepareWithSegments, layoutWithLines } = await import("@chenglou/pretext");
  const prepared = prepareWithSegments(text, font);
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);

  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d")!;
  offCtx.font = font;

  const totalH = lines.length * lineHeight;
  const startY = (canvasH - totalH) / 2 + lineHeight * 0.72;

  let pi = 0;
  lines.forEach((line, li) => {
    const lineStartX = (canvasW - line.width) / 2;
    let cx = lineStartX;
    for (const char of [...line.text]) {
      const cw = offCtx.measureText(char).width;
      if (particles[pi]) {
        particles[pi].homeX = cx + cw / 2;
        particles[pi].homeY = startY + li * lineHeight;
      }
      cx += cw;
      pi++;
    }
  });
}

// ── Canvas component ──────────────────────────────────────────────────────────

const CANVAS_H = 260;

interface CanvasProps {
  mode: KMode;
  reflowWidth: number;
}

function KineticCanvas({ mode, reflowWidth }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -999, y: -999, down: false });
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(700);
  const [ready, setReady] = useState(false);
  const prevReflowW = useRef(reflowWidth);

  // Fix #1 & #4: increased font sizes — wave 52→64, gravity 40→52, reflow 15→16
  const FONT_SIZE = mode === "wave" ? 64 : mode === "gravity" ? 52 : 16;
  const LINE_H = FONT_SIZE * 1.35;
  const FONT = mode === "wave"
    ? `800 ${FONT_SIZE}px Arial`
    : mode === "gravity"
    ? `700 ${FONT_SIZE}px Arial`
    : `${FONT_SIZE}px Arial`;
  const TEXT =
    mode === "wave"
      ? "TEXT IS MATH"
      : mode === "gravity"
      ? "LAYOUT WITHOUT DOM"
      : "Pretext calculates where every line breaks before rendering. Pure arithmetic. Zero DOM reads. Drag to reflow instantly.";

  // Measure container width
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setCanvasW(w);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Init particles
  useEffect(() => {
    if (!canvasRef.current || canvasW < 100) return;
    let cancelled = false;
    setReady(false);

    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    canvas.width = canvasW * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = canvasW + "px";
    canvas.style.height = CANVAS_H + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const maxW = mode === "reflow" ? reflowWidth : canvasW - 60;
    buildParticles(TEXT, FONT, LINE_H, maxW, canvasW, CANVAS_H, mode === "gravity").then((p) => {
      if (!cancelled) {
        particlesRef.current = p;
        setReady(true);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, canvasW]);

  // Update homes on reflow width change
  useEffect(() => {
    if (mode !== "reflow" || !ready || particlesRef.current.length === 0) return;
    if (prevReflowW.current === reflowWidth) return;
    prevReflowW.current = reflowWidth;
    updateParticleHomes(particlesRef.current, TEXT, FONT, LINE_H, reflowWidth, canvasW, CANVAS_H);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflowWidth, mode, ready]);

  // Animation loop
  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      timeRef.current += 0.018;
      const t = timeRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, canvasW, CANVAS_H);

      for (const p of particlesRef.current) {
        if (mode === "wave") {
          // ── Wave: smooth sine displacement ──────────────────────────────
          const mxPhase = (mouse.x / canvasW) * Math.PI * 3;
          const myAmp = mouse.y > 0 && mouse.y < CANVAS_H
            ? Math.max(8, (1 - Math.abs(mouse.y - CANVAS_H / 2) / (CANVAS_H / 2)) * 28)
            : 18;
          const wave = Math.sin(p.homeX * 0.038 + t * 2.1 + mxPhase) * myAmp;
          const wave2 = Math.sin(p.homeX * 0.021 + t * 1.3 + mxPhase * 0.5) * (myAmp * 0.35);
          p.x = p.homeX;
          p.y = p.homeY + wave + wave2;

          const disp = Math.abs(wave + wave2);
          const brightness = Math.round(200 + (disp / myAmp) * 55);
          // Fix #1: base opacity 0.82 minimum, max ~1.0
          const opacity = 0.82 + (disp / (myAmp + 8)) * 0.18;
          ctx.font = FONT;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${opacity})`;
          // Fix #2: subtle glow for wave mode
          ctx.shadowColor = "rgba(255,255,255,0.3)";
          ctx.shadowBlur = 6;
          ctx.fillText(p.char, p.x, p.y);
          ctx.shadowBlur = 0;
        } else {
          // ── Spring toward home ─────────────────────────────────────────
          const dx = p.homeX - p.x;
          const dy = p.homeY - p.y;
          p.vx += dx * SPRING_K;
          p.vy += dy * SPRING_K;

          if (mode === "gravity" && mouse.x > 0) {
            const mdx = p.x - mouse.x;
            const mdy = p.y - mouse.y;
            const sqDist = mdx * mdx + mdy * mdy;

            if (mouse.down) {
              // Click = attract toward cursor
              if (sqDist < ATTRACT_RADIUS * ATTRACT_RADIUS && sqDist > 1) {
                const dist = Math.sqrt(sqDist);
                const force = (ATTRACT_RADIUS - dist) / ATTRACT_RADIUS;
                p.vx -= (mdx / dist) * force * 18;
                p.vy -= (mdy / dist) * force * 18;
                p.vx *= ATTRACT_DAMPING;
                p.vy *= ATTRACT_DAMPING;
              }
            } else {
              // Hover = repel from cursor
              if (sqDist < REPEL_RADIUS * REPEL_RADIUS && sqDist > 1) {
                const dist = Math.sqrt(sqDist);
                const falloff = 1 - dist / REPEL_RADIUS;
                p.vx += (mdx / dist) * falloff * REPEL_STRENGTH;
                p.vy += (mdy / dist) * falloff * REPEL_STRENGTH;
              }
            }
          }

          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;

          // Color: glow based on distance from home
          const dist = Math.sqrt(dx * dx + dy * dy);
          const glow = Math.min(1, dist / 45);
          const r = Math.round(255);
          const g = Math.round(255 - glow * 120);
          const b = Math.round(255 - glow * 200);
          // Fix #1: gravity base opacity 0.85 minimum
          const a = 0.85 + glow * 0.15;

          ctx.font = FONT;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;

          // Mouse proximity glow
          if (mode === "gravity" && mouse.x > 0) {
            const md = Math.sqrt((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2);
            if (md < 60) {
              ctx.shadowColor = "rgba(255,200,100,0.8)";
              ctx.shadowBlur = 12;
            }
          }

          ctx.fillText(p.char, p.x, p.y);
          ctx.shadowBlur = 0;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [ready, mode, canvasW, FONT, LINE_H, TEXT]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -999, y: -999, down: false };
  }, []);

  const handleMouseDown = useCallback(() => {
    mouseRef.current.down = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.down = false;
  }, []);

  // Scatter on click for gravity
  const handleClick = useCallback(() => {
    if (mode !== "gravity") return;
    for (const p of particlesRef.current) {
      p.vx += (Math.random() - 0.5) * 20;
      p.vy += (Math.random() - 0.5) * 20;
    }
  }, [mode]);

  return (
    <div ref={containerRef} className="w-full">
      {!ready && (
        <div
          className="w-full flex items-center justify-center text-white/20 mono text-sm"
          style={{ height: CANVAS_H }}
        >
          measuring with pretext...
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        style={{ height: CANVAS_H, display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  );
}

// ── Reflow drag handle ─────────────────────────────────────────────────────────

function ReflowControls({
  width,
  onChange,
}: {
  width: number;
  onChange: (w: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div>
        <label className="mono text-xs text-white/30 uppercase tracking-widest block mb-2">
          Container Width:{" "}
          <motion.span
            key={width}
            initial={{ color: "#ffffff" }}
            animate={{ color: "rgba(255,255,255,0.8)" }}
            className="text-white font-medium"
          >
            {width}px
          </motion.span>
        </label>
        <input
          type="range"
          min={140}
          max={600}
          value={width}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-64 accent-white"
        />
      </div>
      <div className="bg-white/5 border border-white/10 rounded px-3 py-2">
        <div className="mono text-[10px] text-white/30 mb-0.5">pretext layout()</div>
        <div className="mono text-xs text-green-400">instant at any width</div>
      </div>
    </div>
  );
}

// ── Mode descriptions ──────────────────────────────────────────────────────────

// Fix #5: expanded detail text explaining WHY each mode differs from playground/showcase
const MODE_INFO: Record<
  KMode,
  { title: string; hint: string; tag: string; detail: string }
> = {
  wave: {
    title: "Wave Synth",
    tag: "move mouse",
    hint: "Move cursor left/right to shift wave phase · up/down to change amplitude",
    detail:
      "Character Y positions oscillate as a sine wave. The phase is controlled by your mouse X position — pretext gives us the exact resting position for each character so we always know how far they've displaced. This is purely creative — pretext gives you character coordinates for artistic animations. Different from the Playground (which is for measuring) or Showcase (which is for production patterns).",
  },
  gravity: {
    title: "Gravity Field",
    tag: "hover + click",
    hint: "Hover to repel characters · click to scatter them · move away to spring back",
    detail:
      "Mouse cursor creates a repulsion field. Each character's 'home' is its pretext-measured position. Spring physics pulls them back — when you move the mouse away, how does each character know where to go back? That's the pretext position. The Playground measures text; this visualizes what those measurements enable.",
  },
  reflow: {
    title: "Live Reflow",
    tag: "drag slider",
    hint: "Drag the width slider — characters animate smoothly to new line breaks",
    detail:
      "Pretext recalculates the entire layout at the new width in < 0.1ms. Spring physics animates each character to its new position. This shows the CORE VALUE: drag the slider and watch text reflow with NO DOM reads. This is what makes the Showcase patterns possible — instant layout at any width.",
  },
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function KineticSection() {
  const [mode, setMode] = useState<KMode>("wave");
  const [reflowWidth, setReflowWidth] = useState(320);

  return (
    <section className="py-32 px-6 bg-black border-t border-white/10 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Fix #3: section purpose label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-px bg-white/20" />
          <span className="mono text-xs text-white/40 uppercase tracking-widest">
            Canvas × Physics × Pretext — Creative layer
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="mono text-xs text-white/30 mb-4 uppercase tracking-widest">
            Kinetic Text — Canvas × Pretext
          </div>
          {/* Fix #6: larger heading text-5xl md:text-6xl */}
          <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            When measurement is free,
            <br />
            <span className="text-white/30">animation becomes physics.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-2xl leading-relaxed">
            Every character&apos;s &quot;home&quot; position is calculated by pretext before a
            single pixel renders. That makes spring physics, wave oscillation, and
            live reflow trivial — you always know where characters belong.
          </p>
        </motion.div>

        {/* Mode switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex gap-2 mb-8 flex-wrap"
        >
          {(["wave", "gravity", "reflow"] as KMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm transition-all ${
                mode === m
                  ? "bg-white text-black border-white font-semibold"
                  : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 bg-white/3"
              }`}
            >
              {MODE_INFO[m].title}
              <span
                className={`mono text-[10px] px-1.5 py-0.5 rounded ${
                  mode === m ? "bg-black/15 text-black/50" : "bg-white/8 text-white/30"
                }`}
              >
                {MODE_INFO[m].tag}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Canvas */}
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative bg-black border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Subtle grid bg */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Hint bar */}
          <div className="relative z-10 px-5 py-3 border-b border-white/8 flex items-center justify-between">
            <div className="mono text-xs text-white/30">{MODE_INFO[mode].hint}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="mono text-[10px] text-green-400/60">pretext active</span>
            </div>
          </div>

          {/* Canvas zone */}
          <div className="relative px-4 py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <KineticCanvas mode={mode} reflowWidth={reflowWidth} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Reflow controls */}
          {mode === "reflow" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-4 border-t border-white/8"
            >
              <ReflowControls width={reflowWidth} onChange={setReflowWidth} />
            </motion.div>
          )}
        </motion.div>

        {/* Mode explanation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 grid md:grid-cols-2 gap-6"
          >
            <div className="bg-white/3 border border-white/10 rounded-xl p-5">
              <div className="mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
                How this works
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                {MODE_INFO[mode].detail}
              </p>
            </div>

            <div className="bg-white/3 border border-white/10 rounded-xl p-5">
              <div className="mono text-[10px] text-white/30 uppercase tracking-widest mb-3">
                Pretext powers this
              </div>
              <div className="space-y-2">
                {mode === "wave" && [
                  ["prepareWithSegments()", "tokenize text once"],
                  ["layoutWithLines()", "get per-line text + widths"],
                  ["canvas measureText()", "char X positions within lines"],
                  ["home positions →", "sine wave displacement targets"],
                ].map(([fn, desc]) => (
                  <div key={fn} className="flex gap-2 text-xs">
                    <code className="mono text-white/60 shrink-0">{fn}</code>
                    <span className="text-white/30">{desc}</span>
                  </div>
                ))}
                {mode === "gravity" && [
                  ["prepareWithSegments()", "tokenize text once"],
                  ["layoutWithLines()", "get character line positions"],
                  ["homeX/homeY", "spring anchor points = pretext positions"],
                  ["layout() → home", "chars always know where to return"],
                ].map(([fn, desc]) => (
                  <div key={fn} className="flex gap-2 text-xs">
                    <code className="mono text-white/60 shrink-0">{fn}</code>
                    <span className="text-white/30">{desc}</span>
                  </div>
                ))}
                {mode === "reflow" && [
                  ["layout(width)", "~0.001ms per call, any width"],
                  ["new homeX/homeY", "updated instantly on slider change"],
                  ["spring physics", "characters animate to new layout"],
                  ["no DOM reads", "entire reflow in userland JS"],
                ].map(([fn, desc]) => (
                  <div key={fn} className="flex gap-2 text-xs">
                    <code className="mono text-white/60 shrink-0">{fn}</code>
                    <span className="text-white/30">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
