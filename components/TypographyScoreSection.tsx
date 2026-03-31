"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Preset texts ────────────────────────────────────────────────────────────────

const HAIKU = "old pond\nfrog leaps in\nwater sound";
const LEGAL =
  "WHEREAS the Party of the First Part hereby grants to the Party of the Second Part a non-exclusive license";
const CODE =
  "const result = items.filter(x => x.active).map(x => x.value).reduce((a,b) => a+b, 0)";

type PresetKey = "haiku" | "legal" | "code";

const PRESETS: Record<PresetKey, { label: string; text: string }> = {
  haiku: { label: "Haiku", text: HAIKU },
  legal: { label: "Legal", text: LEGAL },
  code: { label: "Code", text: CODE },
};

// ── Note duration types ─────────────────────────────────────────────────────────

type NoteDuration = "sixteenth" | "eighth" | "quarter" | "half" | "whole";

interface Note {
  char: string;
  duration: NoteDuration;
  isRest: boolean;
  isBarLine: boolean;
  pitch: number; // 0–7 semitone steps on staff (0=top, 7=bottom)
  xPos: number;
  wordPosition: number; // position within word (0=first, normalized 0–1)
  lit: boolean;
  charWidth: number;
}

interface ScoreStats {
  totalNotes: number;
  timeSignature: string;
  tempo: number;
  uniqueDurations: number;
}

// ── Canvas constants ────────────────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 280;
const STAFF_TOP = 80;
const STAFF_LINE_GAP = 16; // px between staff lines
const STAFF_LINES = 5;
const NOTE_FONT = "16px monospace";

const STAFF_BOTTOM = STAFF_TOP + (STAFF_LINES - 1) * STAFF_LINE_GAP; // 144
const STAFF_MID = STAFF_TOP + 2 * STAFF_LINE_GAP; // 112

// Pitch row positions (9 positions: above, on/between staff lines)
const PITCH_Y: number[] = [
  STAFF_TOP - STAFF_LINE_GAP, // ledger line above
  STAFF_TOP, // line 1
  STAFF_TOP + STAFF_LINE_GAP * 0.5, // space
  STAFF_TOP + STAFF_LINE_GAP, // line 2
  STAFF_MID, // line 3 (middle)
  STAFF_TOP + STAFF_LINE_GAP * 3, // line 4
  STAFF_BOTTOM - STAFF_LINE_GAP * 0.5, // space
  STAFF_BOTTOM, // line 5
  STAFF_BOTTOM + STAFF_LINE_GAP, // ledger line below
];

// Frequencies mapped to pitch index (A4-based pentatonic-ish scale)
const PITCH_FREQ: number[] = [
  880.0, // A5
  783.99, // G5
  659.25, // E5
  587.33, // D5
  523.25, // C5
  440.0, // A4
  392.0, // G4
  329.63, // E4
  293.66, // D4
];

// ── Helper: character width → note duration ─────────────────────────────────────

function getDuration(charWidth: number): NoteDuration {
  if (charWidth <= 4) return "sixteenth";
  if (charWidth <= 7) return "eighth";
  if (charWidth <= 10) return "quarter";
  if (charWidth <= 13) return "half";
  return "whole";
}

function durationToBeats(duration: NoteDuration): number {
  switch (duration) {
    case "sixteenth": return 0.25;
    case "eighth": return 0.5;
    case "quarter": return 1;
    case "half": return 2;
    case "whole": return 4;
  }
}

// ── Helper: parse text into notes ───────────────────────────────────────────────

function parseTextToNotes(text: string, measureCtx: CanvasRenderingContext2D): Note[] {
  const notes: Note[] = [];
  const lines = text.split("\n");
  let xPos = 60;
  const X_STEP_BASE = 28;

  for (let li = 0; li < lines.length; li++) {
    if (li > 0) {
      // Bar line at line break
      notes.push({
        char: "\n",
        duration: "quarter",
        isRest: false,
        isBarLine: true,
        pitch: 4,
        xPos,
        wordPosition: 0,
        lit: false,
        charWidth: 0,
      });
      xPos += 18;
    }

    const line = lines[li];
    const words = line.split(" ");
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];

      if (wi > 0) {
        // Space = eighth rest
        notes.push({
          char: " ",
          duration: "eighth",
          isRest: true,
          isBarLine: false,
          pitch: 4,
          xPos,
          wordPosition: 0.5,
          lit: false,
          charWidth: measureCtx.measureText(" ").width,
        });
        xPos += X_STEP_BASE * 0.6;
      }

      for (let ci = 0; ci < word.length; ci++) {
        const char = word[ci];
        const rawWidth = measureCtx.measureText(char).width;
        const duration = getDuration(rawWidth);

        // Pitch = position within word mapped to staff positions 0–8
        const wordPos = word.length <= 1 ? 0.5 : ci / (word.length - 1);
        const pitchIndex = Math.round(wordPos * (PITCH_Y.length - 1));

        // X step scales with duration for visual spacing
        const xStep = X_STEP_BASE + durationToBeats(duration) * 4;

        notes.push({
          char,
          duration,
          isRest: false,
          isBarLine: false,
          pitch: pitchIndex,
          xPos,
          wordPosition: wordPos,
          lit: false,
          charWidth: rawWidth,
        });

        xPos += xStep;
      }
    }
  }

  return notes;
}

// ── Canvas draw ─────────────────────────────────────────────────────────────────

function drawScore(
  canvas: HTMLCanvasElement,
  notes: Note[],
  cursorX: number,
  scrollOffset: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const tx = -scrollOffset;

  // ── Staff lines ──
  ctx.save();
  for (let i = 0; i < STAFF_LINES; i++) {
    const y = STAFF_TOP + i * STAFF_LINE_GAP;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // ── Treble clef symbol ──
  ctx.save();
  ctx.font = `${STAFF_LINE_GAP * 5}px serif`;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillText("𝄞", 4, STAFF_BOTTOM + 12);
  ctx.restore();

  // ── Notes ──
  ctx.save();
  ctx.translate(tx, 0);

  for (const note of notes) {
    const nx = note.xPos;

    // Clip to visible area (with margin)
    if (nx + tx < -40 || nx + tx > W + 40) continue;

    if (note.isBarLine) {
      // Bar line
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(nx, STAFF_TOP - 4);
      ctx.lineTo(nx, STAFF_BOTTOM + 4);
      ctx.stroke();
      continue;
    }

    const y = PITCH_Y[note.pitch];
    const litColor = "rgba(251,191,36,1)";
    const dimColor = note.isRest ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.55)";
    const color = note.lit ? litColor : dimColor;

    if (note.isRest) {
      // Rest symbol: short horizontal bar
      ctx.fillStyle = color;
      ctx.fillRect(nx - 5, STAFF_MID - 3, 10, 3);
      if (note.duration === "eighth") {
        ctx.fillRect(nx - 3, STAFF_MID - 8, 6, 2);
      }
      continue;
    }

    const dur = note.duration;

    // Notehead dimensions
    const rx = dur === "whole" ? 8 : 6;
    const ry = dur === "whole" ? 5 : 4;

    // Draw ledger lines if outside staff
    if (y < STAFF_TOP || y > STAFF_BOTTOM) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nx - rx - 4, y);
      ctx.lineTo(nx + rx + 4, y);
      ctx.stroke();
    }

    // Notehead
    ctx.beginPath();
    ctx.ellipse(nx, y, rx, ry, -0.3, 0, Math.PI * 2);

    if (dur === "whole" || dur === "half") {
      // Hollow notehead
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (dur === "whole") {
        // Inner cutout for whole note
        ctx.beginPath();
        ctx.ellipse(nx + 1, y, rx * 0.45, ry * 0.75, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = "#000";
        ctx.fill();
      }
    } else {
      // Filled notehead
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Stem (all except whole notes)
    if (dur !== "whole") {
      const stemDir = y < STAFF_MID ? 1 : -1; // stem goes down if above middle line
      const stemX = stemDir === 1 ? nx + rx - 1 : nx - rx + 1;
      const stemEnd = y + stemDir * 28;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(stemX, y);
      ctx.lineTo(stemX, stemEnd);
      ctx.stroke();

      // Flags
      if (dur === "eighth" || dur === "sixteenth") {
        drawFlag(ctx, stemX, stemEnd, stemDir, color);
      }
      if (dur === "sixteenth") {
        drawFlag(ctx, stemX, stemEnd + stemDir * 8, stemDir, color);
      }
    }
  }

  ctx.restore();

  // ── Playback cursor ──
  if (cursorX >= 0) {
    const cx = cursorX - scrollOffset;
    if (cx >= 0 && cx <= W) {
      ctx.save();
      const grad = ctx.createLinearGradient(cx - 1, 0, cx + 1, 0);
      grad.addColorStop(0, "rgba(239,68,68,0)");
      grad.addColorStop(0.5, "rgba(239,68,68,0.85)");
      grad.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 1, STAFF_TOP - 10, 3, STAFF_BOTTOM - STAFF_TOP + 20);
      ctx.restore();
    }
  }
}

function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + 10, y + dir * 6, x + 10, y + dir * 12, x + 2, y + dir * 16);
  ctx.stroke();
}

// ── Main Component ──────────────────────────────────────────────────────────────

export default function TypographyScoreSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [preset, setPreset] = useState<PresetKey>("haiku");
  const [inputText, setInputText] = useState("");
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [cursorX, setCursorX] = useState(-1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [stats, setStats] = useState<ScoreStats>({
    totalNotes: 0,
    timeSignature: "4/4",
    tempo: 120,
    uniqueDurations: 0,
  });

  const noteIndexRef = useRef(0);
  const notesRef = useRef<Note[]>([]);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const tempoRef = useRef(120);
  const scrollOffsetRef = useRef(0);

  const activeText = inputText.trim() !== "" ? inputText : PRESETS[preset].text;

  // ── Init offscreen canvas for measureText ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const off = document.createElement("canvas");
    const ctx = off.getContext("2d");
    if (ctx) {
      ctx.font = NOTE_FONT;
      measureCtxRef.current = ctx;
    }
  }, []);

  // ── Setup canvas DPR scaling ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = CANVAS_W + "px";
    canvas.style.height = CANVAS_H + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  // ── Reparse notes when text changes ──
  const rebuildNotes = useCallback(() => {
    if (!measureCtxRef.current) return;
    const parsed = parseTextToNotes(activeText, measureCtxRef.current);
    notesRef.current = parsed.map((n) => ({ ...n, lit: false }));
    setNotes([...notesRef.current]);

    // Compute stats
    const playNotes = parsed.filter((n) => !n.isBarLine && !n.isRest);
    const durations = new Set(playNotes.map((n) => n.duration));
    const lines = activeText.split("\n");
    const avgLineLen = lines.reduce((s, l) => s + l.length, 0) / Math.max(lines.length, 1);
    const beats = avgLineLen < 4 ? 3 : avgLineLen < 8 ? 4 : 4;
    setStats({
      totalNotes: playNotes.length,
      timeSignature: `${beats}/4`,
      tempo,
      uniqueDurations: durations.size,
    });
  }, [activeText, tempo]);

  useEffect(() => {
    rebuildNotes();
  }, [rebuildNotes]);

  // ── Redraw canvas whenever notes/cursor/scroll change ──
  useEffect(() => {
    if (canvasRef.current) {
      drawScore(canvasRef.current, notes, cursorX, scrollOffset);
    }
  }, [notes, cursorX, scrollOffset]);

  // ── Stop playback ──
  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // ── Reset ──
  const resetScore = useCallback(() => {
    stopPlayback();
    noteIndexRef.current = 0;
    scrollOffsetRef.current = 0;
    setScrollOffset(0);
    setCursorX(-1);
    // Unlight all notes
    notesRef.current = notesRef.current.map((n) => ({ ...n, lit: false }));
    setNotes([...notesRef.current]);
  }, [stopPlayback]);

  // ── Play a single audio note ──
  const playAudioNote = useCallback(
    (pitchIndex: number, durationSec: number) => {
      if (typeof window === "undefined") return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const actx = audioCtxRef.current;
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);

        osc.type = "sine";
        osc.frequency.value = PITCH_FREQ[pitchIndex] ?? 440;

        const now = actx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.setTargetAtTime(0, now + Math.max(durationSec * 0.6, 0.05), 0.05);

        osc.start(now);
        osc.stop(now + durationSec + 0.1);
      } catch {
        // Audio context may be unavailable in SSR/test envs
      }
    },
    []
  );

  // ── Recursive note scheduler ──
  const scheduleNext = useCallback(() => {
    if (!isPlayingRef.current) return;

    const allNotes = notesRef.current;
    const idx = noteIndexRef.current;

    if (idx >= allNotes.length) {
      stopPlayback();
      return;
    }

    const note = allNotes[idx];
    const quarterSec = 60 / tempoRef.current;

    // Light up current note
    notesRef.current = allNotes.map((n, i) => ({ ...n, lit: i === idx }));
    setNotes([...notesRef.current]);

    // Update cursor position
    const targetX = note.xPos;
    setCursorX(targetX);

    // Scroll if cursor is near right edge
    const visibleX = targetX - scrollOffsetRef.current;
    if (visibleX > CANVAS_W * 0.65) {
      const newOffset = targetX - CANVAS_W * 0.35;
      scrollOffsetRef.current = newOffset;
      setScrollOffset(newOffset);
    }

    // Play audio for non-rest, non-barline notes
    if (!note.isRest && !note.isBarLine) {
      const durationSec = durationToBeats(note.duration) * quarterSec;
      playAudioNote(note.pitch, durationSec);
    }

    // Duration for advancing
    const advanceSec = note.isBarLine
      ? quarterSec * 0.1
      : durationToBeats(note.duration) * quarterSec;

    noteIndexRef.current = idx + 1;
    playTimerRef.current = setTimeout(scheduleNext, advanceSec * 1000);
  }, [stopPlayback, playAudioNote]);

  // ── Play / Pause toggle ──
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    // Resume AudioContext if suspended (browser autoplay policy)
    if (typeof window !== "undefined") {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    }

    // If finished, restart from beginning
    if (noteIndexRef.current >= notesRef.current.length) {
      noteIndexRef.current = 0;
      scrollOffsetRef.current = 0;
      setScrollOffset(0);
      notesRef.current = notesRef.current.map((n) => ({ ...n, lit: false }));
    }

    isPlayingRef.current = true;
    tempoRef.current = tempo;
    setIsPlaying(true);
    scheduleNext();
  }, [isPlaying, stopPlayback, tempo, scheduleNext]);

  // Keep tempoRef in sync
  useEffect(() => {
    tempoRef.current = tempo;
    setStats((prev) => ({ ...prev, tempo }));
  }, [tempo]);

  // Reset when text/preset changes
  useEffect(() => {
    resetScore();
  }, [activeText, resetScore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      audioCtxRef.current?.close();
    };
  }, [stopPlayback]);

  return (
    <section className="py-24 px-6 bg-black border-t border-white/[0.06]">
      <div className="max-w-4xl mx-auto">

        {/* Section header */}
        <div className="mb-6">
          <div className="text-[10px] tracking-widest text-white/25 uppercase mb-2">
            Experiment · Sound
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1">Typography Score</h2>
          <p className="text-white/35 text-sm">
            Character widths become note durations. Line breaks become bar lines.
            Your text has always had a rhythm — pretext reveals it.
          </p>
        </div>

        {/* Textarea */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-5"
        >
          <textarea
            rows={4}
            value={inputText || PRESETS[preset].text}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste any text..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white/70 text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed"
          />
        </motion.div>

        {/* Controls row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex flex-wrap gap-3 items-center mb-5"
        >
          {/* Preset buttons */}
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setPreset(key);
                setInputText("");
              }}
              className={`px-4 py-1.5 rounded-lg border text-xs transition-all ${
                preset === key && inputText === ""
                  ? "bg-white text-black border-white font-semibold"
                  : "border-white/12 text-white/45 hover:border-white/25 hover:text-white/70 bg-white/[0.03]"
              }`}
            >
              {PRESETS[key].label}
            </button>
          ))}

          <div className="h-4 w-px bg-white/10" />

          {/* Play / Pause */}
          <button
            onClick={handlePlay}
            className={`px-5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isPlaying
                ? "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                : "border-white/20 bg-white/[0.05] text-white/70 hover:bg-white/[0.08]"
            }`}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          {/* Reset */}
          <button
            onClick={resetScore}
            className="px-4 py-1.5 rounded-lg border border-white/10 text-white/35 text-xs hover:border-white/20 hover:text-white/55 transition-all"
          >
            ↺ Reset
          </button>

          {/* Tempo slider */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-[10px] text-white/30 tracking-widest uppercase font-mono">
              {tempo} BPM
            </label>
            <input
              type="range"
              min={60}
              max={240}
              step={5}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-28 accent-amber-400"
            />
          </div>
        </motion.div>

        {/* Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative bg-black border border-white/[0.08] rounded-2xl overflow-hidden mb-5"
        >
          {/* Canvas chrome bar */}
          <div className="px-5 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/25">
              <span>char width → note duration</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-1 rounded-full bg-white/40" />
                <span>normal</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-1 rounded-full bg-amber-400/70" />
                <span>active</span>
              </span>
            </div>
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-red-400/60">playing</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* The score canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                width: CANVAS_W,
                height: CANVAS_H,
                maxWidth: "100%",
              }}
            />

            {/* Idle overlay */}
            <AnimatePresence>
              {notes.length === 0 && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <p className="text-white/15 text-sm font-mono">loading score…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-4 gap-3"
        >
          <StatCard label="Total notes" value={stats.totalNotes.toString()} />
          <StatCard label="Time signature" value={stats.timeSignature} />
          <StatCard label="Tempo" value={`${stats.tempo} BPM`} />
          <StatCard label="Unique durations" value={stats.uniqueDurations.toString()} />
        </motion.div>

        {/* Duration legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 flex flex-wrap gap-x-6 gap-y-1"
        >
          {[
            { dur: "sixteenth", label: "i l 1 — sixteenth", width: "≤ 4px" },
            { dur: "eighth", label: "f r t — eighth", width: "5–7px" },
            { dur: "quarter", label: "a e n — quarter", width: "8–10px" },
            { dur: "half", label: "h k u — half", width: "11–13px" },
            { dur: "whole", label: "W M m — whole", width: "≥ 14px" },
          ].map(({ label, width }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-white/30">{label}</span>
              <span className="text-[10px] font-mono text-white/15">{width}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── StatCard ────────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-3">
      <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1.5">
        {label}
      </div>
      <div className="text-sm font-semibold text-white/70 font-mono leading-none">
        {value}
      </div>
    </div>
  );
}
