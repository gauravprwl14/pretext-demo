"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 500;
const FONT = "14px system-ui";
const BLOCK_HEIGHT = 48; // building height base
const BLOCK_GAP = 20;    // street gap between lines (top-down view block height = 60 total)
const BUILDING_SCALE = 3.5;
const ALLEY_GAP = 2;
const DEFAULT_TEXT =
  "The quick brown fox jumps over the lazy dog near the river bank at twilight";

// ── Types ────────────────────────────────────────────────────────────────────

interface Building {
  word: string;
  pixelWidth: number;
  scaledWidth: number;
  height: number; // visual height in top-down = block height (fixed), but we store floor count
  floors: number;
  x: number;      // local x within block
  lineIndex: number;
  wordIndex: number;
  color: string;
}

interface CityBlock {
  lineIndex: number;
  buildings: Building[];
  totalWidth: number;
}

interface HoveredBuilding {
  building: Building;
  canvasX: number;
  canvasY: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  // simple LCG
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function wordColor(word: string): string {
  const len = word.length;
  if (len <= 3) {
    // short → blue, very dark
    return `hsl(220, 25%, 22%)`;
  } else if (len <= 6) {
    // medium → amber
    return `hsl(38, 22%, 22%)`;
  } else {
    // long → rose/red
    return `hsl(0, 22%, 22%)`;
  }
}

function wordColorHighlight(word: string): string {
  const len = word.length;
  if (len <= 3) return `hsl(220, 35%, 32%)`;
  else if (len <= 6) return `hsl(38, 32%, 32%)`;
  else return `hsl(0, 32%, 32%)`;
}

/** Greedy word-wrap using canvas measureText */
function buildCityBlocks(
  words: string[],
  maxWidth: number,
  ctx: CanvasRenderingContext2D
): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let currentW = 0;
  for (const word of words) {
    const w = ctx.measureText(word + " ").width;
    if (currentW + w > maxWidth && current.length > 0) {
      lines.push(current);
      current = [word];
      currentW = w;
    } else {
      current.push(word);
      currentW += w;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

function buildingsFromLines(
  lines: string[][],
  ctx: CanvasRenderingContext2D
): CityBlock[] {
  const blocks: CityBlock[] = [];
  let globalWordIndex = 0;

  for (let li = 0; li < lines.length; li++) {
    const lineWords = lines[li];
    const buildings: Building[] = [];
    let xOffset = 0;

    for (let wi = 0; wi < lineWords.length; wi++) {
      const word = lineWords[wi];
      const pixelWidth = ctx.measureText(word).width;
      const scaledWidth = Math.max(8, pixelWidth * BUILDING_SCALE);
      const seed = word.charCodeAt(0) % 20;
      const heightVariation = Math.floor(seededRandom(globalWordIndex) * seed);
      const floors = Math.floor((BLOCK_HEIGHT + heightVariation) / 8);

      buildings.push({
        word,
        pixelWidth: Math.round(pixelWidth),
        scaledWidth,
        height: BLOCK_HEIGHT + heightVariation,
        floors,
        x: xOffset,
        lineIndex: li,
        wordIndex: globalWordIndex,
        color: wordColor(word),
      });

      xOffset += scaledWidth + ALLEY_GAP;
      globalWordIndex++;
    }

    blocks.push({
      lineIndex: li,
      buildings,
      totalWidth: xOffset,
    });
  }

  return blocks;
}

// ── Canvas draw ──────────────────────────────────────────────────────────────

function drawCity(
  ctx: CanvasRenderingContext2D,
  blocks: CityBlock[],
  panX: number,
  panY: number,
  zoom: number,
  hoveredBuilding: { lineIndex: number; wordIndex: number } | null
) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  const gridSpacing = 40 * zoom;
  const gridOffX = ((panX % gridSpacing) + gridSpacing) % gridSpacing;
  const gridOffY = ((panY % gridSpacing) + gridSpacing) % gridSpacing;

  for (let x = gridOffX; x < CANVAS_W; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = gridOffY; y < CANVAS_H; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  const ROW_HEIGHT = BLOCK_HEIGHT + BLOCK_GAP;

  for (const block of blocks) {
    const blockY = block.lineIndex * ROW_HEIGHT;

    // Street area (lighter bg strip between blocks)
    if (block.lineIndex < blocks.length - 1) {
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(0, blockY + BLOCK_HEIGHT, block.totalWidth + 200, BLOCK_GAP);

      // Crosswalk markings at block end
      const cwX = block.totalWidth + 4;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      for (let s = 0; s < BLOCK_GAP; s += 5) {
        ctx.fillRect(cwX, blockY + BLOCK_HEIGHT + s, 24, 2);
      }
    }

    for (const b of block.buildings) {
      const bx = b.x;
      const by = blockY;
      const bw = b.scaledWidth;
      const bh = b.height;

      const isHovered =
        hoveredBuilding !== null &&
        hoveredBuilding.lineIndex === b.lineIndex &&
        hoveredBuilding.wordIndex === b.wordIndex;

      // Building base
      ctx.fillStyle = isHovered ? wordColorHighlight(b.word) : b.color;
      ctx.fillRect(bx, by, bw, bh);

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5 / zoom;
      ctx.strokeRect(bx, by, bw, bh);

      // Windows (small white dots)
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      const winSpacingX = 6;
      const winSpacingY = 7;
      const winSize = 1.5;
      const winMargin = 4;
      for (let wy = by + winMargin; wy < by + bh - winMargin; wy += winSpacingY) {
        for (let wx = bx + winMargin; wx < bx + bw - winMargin; wx += winSpacingX) {
          ctx.fillRect(wx, wy, winSize, winSize);
        }
      }

      // Hover highlight overlay
      if (isHovered) {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  }

  ctx.restore();
}

// ── Hit test ─────────────────────────────────────────────────────────────────

function hitTest(
  canvasX: number,
  canvasY: number,
  blocks: CityBlock[],
  panX: number,
  panY: number,
  zoom: number
): { lineIndex: number; wordIndex: number; building: Building } | null {
  const wx = (canvasX - panX) / zoom;
  const wy = (canvasY - panY) / zoom;
  const ROW_HEIGHT = BLOCK_HEIGHT + BLOCK_GAP;

  for (const block of blocks) {
    const blockY = block.lineIndex * ROW_HEIGHT;
    for (const b of block.buildings) {
      if (
        wx >= b.x &&
        wx <= b.x + b.scaledWidth &&
        wy >= blockY &&
        wy <= blockY + b.height
      ) {
        return { lineIndex: b.lineIndex, wordIndex: b.wordIndex, building: b };
      }
    }
  }
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CityFromTextSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [inputText, setInputText] = useState(DEFAULT_TEXT);
  const [columnWidth, setColumnWidth] = useState(400);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(24);
  const [panY, setPanY] = useState(24);
  const [blocks, setBlocks] = useState<CityBlock[]>([]);
  const [hovered, setHovered] = useState<HoveredBuilding | null>(null);

  const panRef = useRef({ dragging: false, startX: 0, startY: 0, panX: 24, panY: 24 });
  const stateRef = useRef({ panX: 24, panY: 24, zoom: 1, blocks: [] as CityBlock[], hovered: null as { lineIndex: number; wordIndex: number } | null });

  // Keep ref in sync
  useEffect(() => {
    stateRef.current.panX = panX;
    stateRef.current.panY = panY;
    stateRef.current.zoom = zoom;
    stateRef.current.blocks = blocks;
  }, [panX, panY, zoom, blocks]);

  // Build city blocks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = FONT;
    const words = text.split(/\s+/).filter(Boolean);
    const lines = buildCityBlocks(words, columnWidth, ctx);
    const newBlocks = buildingsFromLines(lines, ctx);
    setBlocks(newBlocks);
    setHovered(null);
  }, [text, columnWidth]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = FONT;
    drawCity(ctx, blocks, panX, panY, zoom, stateRef.current.hovered);
  }, [blocks, panX, panY, zoom]);

  // Re-render when hovered changes
  const renderWithHovered = useCallback(
    (hov: { lineIndex: number; wordIndex: number } | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = FONT;
      drawCity(ctx, stateRef.current.blocks, stateRef.current.panX, stateRef.current.panY, stateRef.current.zoom, hov);
    },
    []
  );

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    panRef.current.dragging = true;
    panRef.current.startX = e.clientX;
    panRef.current.startY = e.clientY;
    panRef.current.panX = stateRef.current.panX;
    panRef.current.panY = stateRef.current.panY;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      if (panRef.current.dragging) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        const newPanX = panRef.current.panX + dx;
        const newPanY = panRef.current.panY + dy;
        stateRef.current.panX = newPanX;
        stateRef.current.panY = newPanY;
        setPanX(newPanX);
        setPanY(newPanY);
        setHovered(null);
        stateRef.current.hovered = null;
        renderWithHovered(null);
        return;
      }

      // Hit test for hover
      const hit = hitTest(cx, cy, stateRef.current.blocks, stateRef.current.panX, stateRef.current.panY, stateRef.current.zoom);
      if (hit) {
        stateRef.current.hovered = { lineIndex: hit.lineIndex, wordIndex: hit.wordIndex };
        setHovered({ building: hit.building, canvasX: cx, canvasY: cy });
        renderWithHovered({ lineIndex: hit.lineIndex, wordIndex: hit.wordIndex });
      } else {
        if (stateRef.current.hovered !== null) {
          stateRef.current.hovered = null;
          setHovered(null);
          renderWithHovered(null);
        }
      }
    },
    [renderWithHovered]
  );

  const handleMouseUp = useCallback(() => {
    panRef.current.dragging = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    panRef.current.dragging = false;
    if (stateRef.current.hovered !== null) {
      stateRef.current.hovered = null;
      setHovered(null);
      renderWithHovered(null);
    }
  }, [renderWithHovered]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(3, Math.max(0.5, stateRef.current.zoom * factor));
      stateRef.current.zoom = newZoom;
      setZoom(newZoom);
    },
    []
  );

  // Stats
  const totalBuildings = blocks.reduce((s, b) => s + b.buildings.length, 0);
  const totalBlocks = blocks.length;
  const widestBlock = blocks.reduce((max, b) => Math.max(max, Math.round(b.totalWidth)), 0);

  const handleGenerate = () => {
    setText(inputText);
  };

  return (
    <section className="py-24 px-6 bg-black border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] tracking-widest text-white/25 uppercase mb-2">
            Experiment · Urban
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1">City From Text</h2>
          <p className="text-white/35 text-sm">
            Every word is a building. Its width is its footprint. Line breaks become streets.{" "}
            <span className="text-white/50">pretext</span> is the city planner.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex gap-2 items-start">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={2}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-3 py-2 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-white/20 font-mono"
              placeholder="Type any text..."
            />
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded text-white/70 text-sm transition-colors whitespace-nowrap"
            >
              Generate
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-[11px] tracking-widest text-white/30 uppercase whitespace-nowrap">
              Column Width
            </label>
            <input
              type="range"
              min={200}
              max={800}
              value={columnWidth}
              onChange={(e) => setColumnWidth(Number(e.target.value))}
              className="flex-1 accent-white/40 h-1"
            />
            <span className="text-[11px] text-white/40 font-mono w-14 text-right">
              {columnWidth}px
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-lg overflow-hidden border border-white/[0.06]"
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              style={{ display: "block", cursor: panRef.current.dragging ? "grabbing" : "grab", width: "100%", height: "auto" }}
            />
          </motion.div>

          {/* Zoom badge */}
          <div className="absolute top-3 right-3 bg-black/60 border border-white/[0.08] rounded px-2 py-1 text-[10px] font-mono text-white/40">
            {(zoom * 100).toFixed(0)}%
          </div>

          {/* Tooltip */}
          {hovered && (
            <div
              className="absolute pointer-events-none z-10 bg-black/90 border border-white/[0.12] rounded px-2.5 py-1.5 text-[11px] font-mono text-white/70"
              style={{
                left: Math.min(hovered.canvasX + 12, CANVAS_W - 140),
                top: Math.max(hovered.canvasY - 48, 4),
              }}
            >
              <div className="text-white/90 font-semibold mb-0.5">&ldquo;{hovered.building.word}&rdquo;</div>
              <div className="text-white/40">{hovered.building.pixelWidth}px wide · {hovered.building.floors} floors</div>
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          {[
            ["Buildings", `${totalBuildings} words`],
            ["Blocks", `${totalBlocks} lines`],
            ["Streets", `${Math.max(0, totalBlocks - 1)}`],
            ["Widest block", `${widestBlock}px`],
            ["Column width", `${columnWidth}px`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <span className="text-[10px] tracking-widest text-white/20 uppercase">{label}:</span>
              <span className="text-[11px] font-mono text-white/50">{value}</span>
            </div>
          ))}
        </div>

        {/* Hint */}
        <p className="mt-2 text-[10px] text-white/20">
          Drag to pan · Scroll to zoom · Hover a building for word metrics
        </p>
      </div>
    </section>
  );
}
