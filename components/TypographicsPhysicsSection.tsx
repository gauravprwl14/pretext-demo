"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PhysicsChar {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;        // pixel width of character
  radius: number;      // visual radius
  bounce: number;      // restitution coefficient
  gravity: number;     // per-char gravity
  color: string;       // narrow=blue, medium=amber, wide=red
  settled: boolean;
  rotation: number;
  rotationV: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getCharWidth(ctx: CanvasRenderingContext2D, char: string): number {
  return Math.max(2, ctx.measureText(char).width);
}

function charColor(mass: number): string {
  if (mass <= 5)  return "#60a5fa"; // blue-400  — narrow/light
  if (mass <= 9)  return "#fbbf24"; // amber-400 — medium
  return "#f87171";                  // red-400   — wide/heavy
}

function makeChar(
  ctx: CanvasRenderingContext2D,
  char: string,
  canvasW: number
): PhysicsChar {
  const mass    = getCharWidth(ctx, char);
  const radius  = Math.max(6, mass * 0.7);
  const bounce  = Math.max(0.08, 0.55 - mass * 0.025); // heavier = less bounce
  const gravity = 0.25 + mass * 0.018;                  // heavier = faster fall

  return {
    char,
    x:         20 + Math.random() * (canvasW - 40),
    y:         -radius - Math.random() * 40,
    vx:        (Math.random() - 0.5) * 1.5,
    vy:        0,
    mass,
    radius,
    bounce,
    gravity,
    color:     charColor(mass),
    settled:   false,
    rotation:  Math.random() * Math.PI * 2,
    rotationV: (Math.random() - 0.5) * 0.12,
  };
}

// ── Physics step ───────────────────────────────────────────────────────────────

const FLOOR_FRICTION = 0.78;
const WALL_BOUNCE    = 0.35;
const SLEEP_VY       = 0.15;
const SLEEP_VX       = 0.08;

function stepChar(p: PhysicsChar, floor: number, canvasW: number) {
  if (p.settled) return;

  p.vy += p.gravity;
  p.vy  = Math.min(p.vy, 18); // terminal velocity
  p.x  += p.vx;
  p.y  += p.vy;

  // Floor collision
  const floorY = floor - p.radius;
  if (p.y >= floorY) {
    p.y   = floorY;
    p.vy *= -p.bounce;
    p.vx *= FLOOR_FRICTION;
    p.rotationV *= 0.7;

    if (Math.abs(p.vy) < SLEEP_VY && Math.abs(p.vx) < SLEEP_VX) {
      p.vy      = 0;
      p.vx      = 0;
      p.settled = true;
    }
  }

  // Wall collisions
  if (p.x - p.radius < 0) {
    p.x  = p.radius;
    p.vx = Math.abs(p.vx) * WALL_BOUNCE;
  }
  if (p.x + p.radius > canvasW) {
    p.x  = canvasW - p.radius;
    p.vx = -Math.abs(p.vx) * WALL_BOUNCE;
  }

  p.rotation += p.rotationV;
}

// Simple circle–circle push-apart (broad-phase skip if settled both)
function resolveCollisions(chars: PhysicsChar[]) {
  for (let i = 0; i < chars.length; i++) {
    for (let j = i + 1; j < chars.length; j++) {
      const a = chars[i];
      const b = chars[j];
      if (a.settled && b.settled) continue;

      const dx   = b.x - a.x;
      const dy   = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minD = a.radius + b.radius - 1;

      if (dist < minD && dist > 0.01) {
        const overlap = minD - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        // Push apart proportionally to mass (heavier moves less)
        const totalMass = a.mass + b.mass;
        const ratioA = b.mass / totalMass;
        const ratioB = a.mass / totalMass;

        if (!a.settled) { a.x -= nx * overlap * ratioA; a.y -= ny * overlap * ratioA; }
        if (!b.settled) { b.x += nx * overlap * ratioB; b.y += ny * overlap * ratioB; }

        // Exchange velocity component along normal
        const relVx = b.vx - a.vx;
        const relVy = b.vy - a.vy;
        const dot    = relVx * nx + relVy * ny;
        if (dot < 0) {
          const impulse = (2 * dot) / totalMass;
          if (!a.settled) { a.vx += impulse * b.mass * nx * 0.5; a.vy += impulse * b.mass * ny * 0.5; }
          if (!b.settled) { b.vx -= impulse * a.mass * nx * 0.5; b.vy -= impulse * a.mass * ny * 0.5; }
          a.settled = false;
          b.settled = false;
        }
      }
    }
  }
}

// ── Draw ───────────────────────────────────────────────────────────────────────

function drawChar(ctx: CanvasRenderingContext2D, p: PhysicsChar) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  const r = p.radius;

  // Glow
  ctx.shadowColor  = p.color;
  ctx.shadowBlur   = p.settled ? 4 : 10;

  // Circle background
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = p.color + "22";
  ctx.fill();

  // Circle stroke
  ctx.strokeStyle = p.color + "99";
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Character label
  ctx.shadowBlur = 0;
  ctx.fillStyle  = p.color;
  ctx.font       = `bold ${Math.max(8, r * 1.1)}px monospace`;
  ctx.textAlign  = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(p.char === " " ? "·" : p.char, 0, 0);

  ctx.restore();
}

// ── Legend items ───────────────────────────────────────────────────────────────

interface LegendEntry {
  char: string;
  width: number;
  label: string;
}

function computeLegend(
  chars: PhysicsChar[]
): { heaviest: LegendEntry | null; lightest: LegendEntry | null; count: number } {
  if (chars.length === 0) return { heaviest: null, lightest: null, count: 0 };

  let heaviest = chars[0];
  let lightest = chars[0];
  for (const c of chars) {
    if (c.mass > heaviest.mass) heaviest = c;
    if (c.mass < lightest.mass) lightest = c;
  }

  return {
    heaviest: {
      char:  heaviest.char === " " ? "·" : heaviest.char,
      width: Math.round(heaviest.mass),
      label: "heavy",
    },
    lightest: {
      char:  lightest.char === " " ? "·" : lightest.char,
      width: Math.round(lightest.mass),
      label: "light",
    },
    count: chars.length,
  };
}

// ── Canvas dimensions ──────────────────────────────────────────────────────────

const CANVAS_H  = 300;
const FONT_MEAS = "16px monospace";

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TypographicsPhysicsSection() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const charsRef    = useRef<PhysicsChar[]>([]);
  const rafRef      = useRef<number>(0);
  const measCtxRef  = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasW, setCanvasW]   = useState(600);
  const [inputVal, setInputVal] = useState("");
  const [legend, setLegend]     = useState<ReturnType<typeof computeLegend>>({
    heaviest: null,
    lightest: null,
    count: 0,
  });

  // Measure container width
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0) setCanvasW(w);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Set up canvas DPR + size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvasW * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width  = canvasW + "px";
    canvas.style.height = CANVAS_H + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Measurement context — shared off-screen
    const off = document.createElement("canvas");
    const offCtx = off.getContext("2d")!;
    offCtx.font = FONT_MEAS;
    measCtxRef.current = offCtx;
  }, [canvasW]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = () => {
      const ctx = canvas.getContext("2d")!;
      const chars = charsRef.current;
      const floor = CANVAS_H;

      ctx.clearRect(0, 0, canvasW, CANVAS_H);

      // Draw subtle floor line
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_H - 1);
      ctx.lineTo(canvasW, CANVAS_H - 1);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Physics
      for (const p of chars) stepChar(p, floor, canvasW);
      resolveCollisions(chars);

      // Draw
      for (const p of chars) drawChar(ctx, p);

      // Update legend every ~12 frames
      if (Math.random() < 0.08) {
        setLegend(computeLegend(chars));
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [canvasW]);

  // Add characters from input
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const prev   = inputVal;
    setInputVal(newVal);

    const mCtx = measCtxRef.current;
    if (!mCtx) return;

    if (newVal.length > prev.length) {
      // Characters added — spawn them
      const added = [...newVal.slice(prev.length)];
      const spawned = added
        .filter((c) => c !== "\n")
        .map((c) => makeChar(mCtx, c, canvasW));

      charsRef.current = [...charsRef.current, ...spawned];
      setLegend(computeLegend(charsRef.current));
    } else if (newVal.length < prev.length) {
      // Backspace — remove last N
      const diff = prev.length - newVal.length;
      charsRef.current = charsRef.current.slice(0, -diff);
      setLegend(computeLegend(charsRef.current));
    }
  }, [inputVal, canvasW]);

  const handleShake = useCallback(() => {
    for (const p of charsRef.current) {
      p.settled = false;
      p.vx += (Math.random() - 0.5) * 22;
      p.vy  = -(Math.random() * 8 + 4);
      p.rotationV = (Math.random() - 0.5) * 0.4;
    }
  }, []);

  const handleClear = useCallback(() => {
    charsRef.current = [];
    setInputVal("");
    setLegend({ heaviest: null, lightest: null, count: 0 });
  }, []);

  // Pre-seed a nice phrase on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const mCtx = measCtxRef.current;
      if (!mCtx) return;
      const seed = "WiMlTo.";
      const chars = [...seed].map((c) => makeChar(mCtx, c, canvasW));
      charsRef.current = chars;
      setInputVal(seed);
      setLegend(computeLegend(chars));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="py-24 px-6 bg-black border-t border-white/10">
      <div className="max-w-4xl mx-auto">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-px bg-white/20" />
          <span className="font-mono text-xs text-white/40 uppercase tracking-widest">
            Typography Physics — Creative experiment
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="font-mono text-xs text-white/30 mb-4 uppercase tracking-widest">
            What if physics was wrong?
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Character pixel-width
            <br />
            <span className="text-white/30">= its mass.</span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl leading-relaxed text-sm">
            Type any text. Each character becomes a falling particle whose weight is
            its measured pixel width. Wide glyphs like{" "}
            <span className="text-red-400 font-mono font-bold">W</span> and{" "}
            <span className="text-red-400 font-mono font-bold">M</span> are heavy —
            they crash down and barely bounce. Thin glyphs like{" "}
            <span className="text-blue-400 font-mono font-bold">i</span> and{" "}
            <span className="text-blue-400 font-mono font-bold">l</span> float slowly
            and spring back up. Widths measured via{" "}
            <span className="text-amber-400 font-mono">canvas measureText</span>.
          </p>
        </motion.div>

        {/* Controls row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-4"
        >
          <input
            type="text"
            value={inputVal}
            onChange={handleInput}
            placeholder="Type anything… W i M l T o . @ #"
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                       text-white placeholder-white/20 font-mono text-sm
                       focus:outline-none focus:border-amber-400/40 focus:bg-white/8 transition-all"
          />
          <button
            onClick={handleShake}
            className="px-5 py-2.5 rounded-xl border border-amber-400/30 text-amber-400/80
                       hover:border-amber-400/60 hover:text-amber-400 hover:bg-amber-400/5
                       font-mono text-sm transition-all active:scale-95"
          >
            Shake
          </button>
          <button
            onClick={handleClear}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-white/40
                       hover:border-white/20 hover:text-white/60 hover:bg-white/5
                       font-mono text-sm transition-all active:scale-95"
          >
            Clear
          </button>
        </motion.div>

        {/* Canvas area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative bg-black border border-white/10 rounded-2xl overflow-hidden"
          ref={containerRef}
        >
          {/* Subtle dot-grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Status bar */}
          <div className="relative z-10 px-4 py-2.5 border-b border-white/8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 text-xs font-mono">
              {/* Legend: heaviest */}
              {legend.heaviest ? (
                <span className="text-white/30">
                  Heaviest:{" "}
                  <span className="text-red-400 font-bold">{legend.heaviest.char}</span>
                  <span className="text-white/20"> = {legend.heaviest.width}px</span>
                </span>
              ) : (
                <span className="text-white/20">type to begin…</span>
              )}
              {legend.lightest && legend.lightest.char !== legend.heaviest?.char && (
                <span className="text-white/30">
                  Lightest:{" "}
                  <span className="text-blue-400 font-bold">{legend.lightest.char}</span>
                  <span className="text-white/20"> = {legend.lightest.width}px</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Color key */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/25">
                <span className="text-blue-400">●</span> light
                <span className="text-amber-400 ml-1">●</span> medium
                <span className="text-red-400 ml-1">●</span> heavy
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="font-mono text-[10px] text-green-400/50">
                  {legend.count} particles
                </span>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="block w-full"
            style={{ height: CANVAS_H }}
          />
        </motion.div>

        {/* Info panels */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 grid md:grid-cols-3 gap-4"
        >
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
              Mass = pixel width
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {[
                { char: "W", range: "~13px", color: "text-red-400",  label: "heaviest" },
                { char: "M", range: "~12px", color: "text-red-400",  label: "heavy"    },
                { char: "o", range: "~8px",  color: "text-amber-400",label: "medium"   },
                { char: "r", range: "~6px",  color: "text-amber-400",label: "medium"   },
                { char: "i", range: "~4px",  color: "text-blue-400", label: "light"    },
                { char: "l", range: "~3px",  color: "text-blue-400", label: "lightest" },
              ].map(({ char, range, color, label }) => (
                <div key={char} className="flex items-center gap-2">
                  <span className={`${color} font-bold w-4`}>{char}</span>
                  <span className="text-white/20">=</span>
                  <span className="text-white/40">{range}</span>
                  <span className="text-white/20 text-[10px]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
              Physics rules
            </div>
            <div className="space-y-2 text-xs text-white/40 leading-relaxed">
              <p>
                <span className="text-white/60">gravity</span> = 0.25 + mass × 0.018
              </p>
              <p>
                <span className="text-white/60">bounce</span> = 0.55 − mass × 0.025
              </p>
              <p>
                <span className="text-white/60">terminal vel</span> = 18 px/frame
              </p>
              <p>
                <span className="text-white/60">collision</span> → mass-weighted push
              </p>
              <p className="text-white/25 text-[10px] pt-1">
                Heavy chars fall faster and bounce less.<br />
                Light chars drift down and spring back up.
              </p>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
              Try these
            </div>
            <div className="space-y-1.5 font-mono text-xs text-white/50">
              {[
                { input: "WWWW",     hint: "all heavy, fast crash"  },
                { input: "iiii",     hint: "all light, slow float"  },
                { input: "WiWiWi",   hint: "alternating mass"       },
                { input: ".,,,..,,", hint: "tiny punctuation rain"  },
                { input: "MAMMOGRAM",hint: "very heavy phrase"      },
              ].map(({ input, hint }) => (
                <button
                  key={input}
                  className="w-full text-left flex items-center gap-2 hover:text-white/80 transition-colors group"
                  onClick={() => {
                    const mCtx = measCtxRef.current;
                    if (!mCtx) return;
                    const newChars = [...input].map((c) => makeChar(mCtx, c, canvasW));
                    charsRef.current = [...charsRef.current, ...newChars];
                    setInputVal((v) => v + input);
                    setLegend(computeLegend(charsRef.current));
                  }}
                >
                  <span className="text-amber-400/70 group-hover:text-amber-400 transition-colors">
                    {input}
                  </span>
                  <span className="text-white/20 text-[10px]">— {hint}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
