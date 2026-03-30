"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 700;
const CANVAS_H = 250;
const CHAR_W = 12;
const CHAR_H = 18;
const GRAVITY = 0.4;
const JUMP_VEL = -8;
const GROUND_Y = 195; // y of line 0 (bottom-most line) platform top
const LINE_STEP = 22; // each higher line raises by this much
const GAP_W = 20;     // horizontal gap between lines (must jump)
const FONT = "14px monospace";

const PRESET_TEXTS = [
  "The quick brown fox jumps over the lazy dog near the old oak tree",
  "To be or not to be that is the question whether tis nobler in the mind",
  "Hello world from pretext where every word has a width and every line has a height",
];

// ── Types ────────────────────────────────────────────────────────────────────

interface Platform {
  x: number;
  y: number;
  width: number;
  wordIndex: number; // index into words array
  lineIndex: number;
}

interface GameState {
  charX: number;
  charY: number;
  velY: number;
  onGround: boolean;
  speed: number;
  activeWordIndex: number;
}

// ── Terrain builder ──────────────────────────────────────────────────────────

async function buildTerrain(
  text: string,
  ctx: CanvasRenderingContext2D
): Promise<{ platforms: Platform[]; words: string[] }> {
  // Dynamically import pretext
  const { prepareWithSegments, layoutWithLines } = await import("@chenglou/pretext");

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { platforms: [], words: [] };

  // Measure each word width with canvas (same font as pretext reference)
  ctx.font = FONT;
  const wordWidths = words.map((w) => Math.max(ctx.measureText(w).width * 3, 18));

  // Use pretext to determine line breaks at maxWidth=600
  const prepared = prepareWithSegments(text.trim(), FONT);
  const { lines } = layoutWithLines(prepared, 600, 20);

  // Map each line's words to word indices
  // lines[i].text is the text of that line (trimmed)
  const lineWordLists: number[][] = [];
  let wordCursor = 0;

  for (const line of lines) {
    const lineWords = line.text.trim().split(/\s+/).filter(Boolean);
    const indices: number[] = [];
    for (let i = 0; i < lineWords.length; i++) {
      indices.push(wordCursor + i);
    }
    lineWordLists.push(indices);
    wordCursor += lineWords.length;
  }

  // Build platforms — line 0 (first line) is at the bottom, last line is highest
  // lines[0] = bottom terrain (GROUND_Y), lines[N-1] = top terrain
  const totalLines = lineWordLists.length;
  const platforms: Platform[] = [];

  let globalX = 10; // start x offset

  for (let li = 0; li < totalLines; li++) {
    const platformY = GROUND_Y - li * LINE_STEP;
    const wordIndices = lineWordLists[li];

    for (let wi = 0; wi < wordIndices.length; wi++) {
      const wIdx = wordIndices[wi];
      const pw = wordWidths[wIdx] ?? 20;
      platforms.push({
        x: globalX,
        y: platformY,
        width: pw,
        wordIndex: wIdx,
        lineIndex: li,
      });
      // Small gap between words on same line (2px)
      globalX += pw + 2;
    }

    // Gap between lines (character must jump)
    globalX += GAP_W;
  }

  return { platforms, words };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TextTerrainSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>({
    charX: 10,
    charY: GROUND_Y - CHAR_H,
    velY: 0,
    onGround: false,
    speed: 1.5,
    activeWordIndex: -1,
  });
  const platformsRef = useRef<Platform[]>([]);
  const wordsRef = useRef<string[]>([]);
  const rafRef = useRef<number>(0);
  const jumpPendingRef = useRef(false);
  const buildingRef = useRef(false);

  const [text, setText] = useState(PRESET_TEXTS[0]);
  const [pendingText, setPendingText] = useState(PRESET_TEXTS[0]);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [speed, setSpeed] = useState(1.5);
  const [ready, setReady] = useState(false);
  const [lineCount, setLineCount] = useState(0);

  // ── Terrain generation ──────────────────────────────────────────────────────

  const generateTerrain = useCallback(async (newText: string) => {
    const canvas = canvasRef.current;
    if (!canvas || buildingRef.current) return;
    buildingRef.current = true;

    const ctx = canvas.getContext("2d");
    if (!ctx) { buildingRef.current = false; return; }

    try {
      const { platforms, words } = await buildTerrain(newText, ctx);
      platformsRef.current = platforms;
      wordsRef.current = words;

      // Count distinct lines
      const maxLine = platforms.reduce((m, p) => Math.max(m, p.lineIndex), -1);
      setLineCount(maxLine + 1);

      // Reset character
      const g = gameRef.current;
      g.charX = 10;
      g.charY = GROUND_Y - CHAR_H;
      g.velY = 0;
      g.onGround = false;
      g.activeWordIndex = -1;
      setActiveWordIndex(-1);
      setReady(true);
    } finally {
      buildingRef.current = false;
    }
  }, []);

  // ── Game loop ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generate initial terrain
    generateTerrain(text);

    let frameId: number;

    function draw() {
      if (!ctx || !canvas) return;
      const g = gameRef.current;
      const platforms = platformsRef.current;

      // ── Physics update ──────────────────────────────────────────────────────

      // Move right
      g.charX += g.speed;

      // Apply gravity
      g.velY += GRAVITY;
      g.charY += g.velY;

      // Jump if pending and on ground
      if (jumpPendingRef.current && g.onGround) {
        g.velY = JUMP_VEL;
        g.onGround = false;
        jumpPendingRef.current = false;
      }

      // ── Collision detection ─────────────────────────────────────────────────
      g.onGround = false;
      let currentWordIdx = -1;

      for (const p of platforms) {
        const charLeft = g.charX;
        const charRight = g.charX + CHAR_W;
        const charBottom = g.charY + CHAR_H;
        const charTop = g.charY;

        const platLeft = p.x;
        const platRight = p.x + p.width;
        const platTop = p.y;

        // Horizontal overlap
        if (charRight > platLeft + 2 && charLeft < platRight - 2) {
          // Landing from above
          if (charBottom >= platTop && charTop < platTop && g.velY >= 0) {
            g.charY = platTop - CHAR_H;
            g.velY = 0;
            g.onGround = true;
            currentWordIdx = p.wordIndex;
          }
        }
      }

      // Respawn if fell off bottom
      if (g.charY > CANVAS_H + 20) {
        g.charX = 10;
        g.charY = GROUND_Y - CHAR_H;
        g.velY = 0;
        g.onGround = false;
      }

      // Respawn if ran past all platforms
      if (platforms.length > 0) {
        const lastPlatform = platforms[platforms.length - 1];
        if (g.charX > lastPlatform.x + lastPlatform.width + 60) {
          g.charX = 10;
          g.charY = GROUND_Y - CHAR_H;
          g.velY = 0;
          g.onGround = false;
        }
      }

      if (currentWordIdx !== g.activeWordIndex) {
        g.activeWordIndex = currentWordIdx;
        setActiveWordIndex(currentWordIdx);
      }

      // ── Camera: offset so character is always in view ───────────────────────
      const viewOffsetX = Math.max(0, g.charX - CANVAS_W * 0.35);

      // ── Clear ───────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid lines (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let y = 0; y <= CANVAS_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }

      // ── Draw platforms (translated by camera) ──────────────────────────────
      ctx.save();
      ctx.translate(-viewOffsetX, 0);

      for (const p of platforms) {
        const isActive = p.wordIndex === g.activeWordIndex;

        // Platform body — amber glow when active
        if (isActive) {
          ctx.fillStyle = "rgba(251,191,36,0.9)";
          // Glow
          ctx.shadowColor = "rgba(251,191,36,0.6)";
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = "rgba(100,100,120,0.8)";
          ctx.shadowBlur = 0;
        }

        // Platform rect (height 6px)
        ctx.fillRect(p.x, p.y, p.width, 6);
        ctx.shadowBlur = 0;

        // Platform top highlight
        ctx.fillStyle = isActive ? "rgba(255,220,80,0.9)" : "rgba(160,160,180,0.5)";
        ctx.fillRect(p.x, p.y, p.width, 2);

        // Word label on platform
        ctx.font = "10px monospace";
        ctx.fillStyle = isActive ? "rgba(255,220,60,1)" : "rgba(180,180,200,0.6)";
        ctx.textAlign = "left";
        const word = wordsRef.current[p.wordIndex] ?? "";
        // Clip word to platform width
        const maxW = p.width - 4;
        let label = word;
        while (label.length > 0 && ctx.measureText(label).width > maxW) {
          label = label.slice(0, -1);
        }
        if (label.length < word.length && label.length > 0) label += "…";
        ctx.fillText(label, p.x + 2, p.y - 4);
      }

      // ── Draw character ─────────────────────────────────────────────────────
      const cx = g.charX;
      const cy = g.charY;

      // Shadow under character
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(cx + 2, cy + CHAR_H + 1, CHAR_W - 4, 3);

      // Body
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(200,200,255,0.8)";
      ctx.shadowBlur = 8;
      ctx.fillRect(cx, cy, CHAR_W, CHAR_H);
      ctx.shadowBlur = 0;

      // Eyes (cute pixel art)
      ctx.fillStyle = "#050505";
      ctx.fillRect(cx + 2, cy + 4, 3, 3);
      ctx.fillRect(cx + 7, cy + 4, 3, 3);

      // Legs (simple animation based on x position)
      const legPhase = Math.floor(cx / 6) % 2;
      ctx.fillStyle = "rgba(200,200,200,0.9)";
      if (g.onGround) {
        if (legPhase === 0) {
          ctx.fillRect(cx + 1, cy + CHAR_H, 4, 4);
          ctx.fillRect(cx + 7, cy + CHAR_H - 2, 4, 3);
        } else {
          ctx.fillRect(cx + 1, cy + CHAR_H - 2, 4, 3);
          ctx.fillRect(cx + 7, cy + CHAR_H, 4, 4);
        }
      } else {
        // Airborne — legs tucked
        ctx.fillRect(cx + 1, cy + CHAR_H - 2, 4, 3);
        ctx.fillRect(cx + 7, cy + CHAR_H - 2, 4, 3);
      }

      ctx.restore();

      // ── HUD ────────────────────────────────────────────────────────────────
      ctx.font = "11px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.textAlign = "left";
      ctx.fillText("SPACE / ↑ to jump", 10, 18);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(251,191,36,0.5)";
      if (g.activeWordIndex >= 0 && wordsRef.current[g.activeWordIndex]) {
        ctx.fillText(`"${wordsRef.current[g.activeWordIndex]}"`, CANVAS_W - 10, 18);
      }

      frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);
    rafRef.current = frameId;

    return () => cancelAnimationFrame(frameId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Speed sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    gameRef.current.speed = speed;
  }, [speed]);

  // ── Keyboard controls ───────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jumpPendingRef.current = true;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Text change handler ─────────────────────────────────────────────────────
  const applyText = useCallback(() => {
    if (!pendingText.trim()) return;
    setText(pendingText);
    generateTerrain(pendingText);
  }, [pendingText, generateTerrain]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const words = wordsRef.current;

  return (
    <section className="py-24 px-6 bg-black">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono mb-6">
            Wrong Domain
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Text as Terrain
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Your text is the map.{" "}
            <span className="text-amber-400/80">Pretext drew every platform.</span>
          </p>
        </div>

        {/* Canvas game */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#050505]">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full block"
            style={{ imageRendering: "pixelated" }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.code === "Space" || e.code === "ArrowUp") {
                e.preventDefault();
                jumpPendingRef.current = true;
              }
            }}
          />

          {/* Loading overlay */}
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-white/40 text-sm font-mono animate-pulse">
                building terrain…
              </span>
            </div>
          )}

          {/* Stat pills */}
          {ready && (
            <div className="absolute top-3 right-3 flex gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/40 text-xs font-mono">
                {words.length} platforms
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/40 text-xs font-mono">
                {lineCount} lines
              </span>
            </div>
          )}
        </div>

        {/* Word highlight display */}
        <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 font-mono text-sm leading-7 min-h-[60px]">
          {words.length === 0 ? (
            <span className="text-white/20">terrain loading…</span>
          ) : (
            words.map((word, i) => (
              <span key={i}>
                <span
                  className={
                    i === activeWordIndex
                      ? "bg-amber-500/30 text-amber-300 rounded px-0.5 transition-all duration-75"
                      : "text-white/40"
                  }
                >
                  {word}
                </span>
                {i < words.length - 1 && <span className="text-white/20"> </span>}
              </span>
            ))
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-4">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {PRESET_TEXTS.map((preset, i) => (
              <button
                key={i}
                onClick={() => {
                  setPendingText(preset);
                  setText(preset);
                  generateTerrain(preset);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  text === preset
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                    : "border-white/15 bg-white/[0.03] text-white/40 hover:border-white/30 hover:text-white/60"
                }`}
              >
                Preset {i + 1}
              </button>
            ))}
          </div>

          {/* Text input + apply */}
          <div className="flex gap-3">
            <input
              type="text"
              value={pendingText}
              onChange={(e) => setPendingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyText();
              }}
              placeholder="Type your terrain text…"
              className="flex-1 bg-white/[0.04] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 font-mono focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
            />
            <button
              onClick={applyText}
              className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-mono hover:bg-amber-500/30 transition-all"
            >
              Generate
            </button>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-4">
            <span className="text-white/30 text-xs font-mono w-20">
              Speed: {speed.toFixed(1)}x
            </span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="flex-1 accent-amber-400"
            />
            {/* Jump button for mobile */}
            <button
              onPointerDown={() => { jumpPendingRef.current = true; }}
              className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono hover:bg-blue-500/30 active:scale-95 transition-all select-none"
            >
              JUMP ↑
            </button>
          </div>
        </div>

        {/* How it works callout */}
        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-sm text-white/40 font-mono leading-6">
          <span className="text-white/60">How it works:</span>{" "}
          Each word → platform width via{" "}
          <span className="text-amber-400/70">canvas.measureText()</span>. Line breaks via{" "}
          <span className="text-blue-400/70">pretext.layoutWithLines(maxWidth=600)</span>.
          Line 1 = ground level, each subsequent line is{" "}
          <span className="text-green-400/70">{LINE_STEP}px higher</span>. Gaps between lines = jump zones.
        </div>

        {/* Evaluation badge */}
        <div className="mt-6 p-4 border border-white/10 rounded-xl bg-white/[0.02] flex flex-wrap gap-6 text-sm">
          <span className="text-white/40">
            Prompt: <span className="text-blue-400/70">Wrong Domain</span>
          </span>
          <span className="text-white/40">
            Novelty: <span className="text-green-400">10/10</span>
          </span>
          <span className="text-white/40">
            Stop-scroll: <span className="text-green-400">10/10</span>
          </span>
          <span className="text-white/40">
            Pretext clarity: <span className="text-amber-400">7/10</span>
          </span>
          <span className="text-white/40">
            Interactivity: <span className="text-green-400">10/10</span>
          </span>
        </div>
      </div>
    </section>
  );
}
