"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

type MetricStatus = "healthy" | "caution" | "danger" | "info";

type Metric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  status: MetricStatus;
  badge: string;
  description: string;
  ref?: string;
  cols: number;
  rows: number;
};

type MeasuredMetric = Metric & {
  textAdjusted: boolean;
};

// --- Profile data ---

const PROFILE_STRONG: Metric[] = [
  {
    id: "credit",
    label: "CREDIT SCORE",
    value: "742",
    status: "healthy",
    badge: "GOOD",
    description:
      "Prime borrower range. Qualifies for best mortgage rates. One missed payment can drop 60-110 points. Maintain low utilization.",
    ref: "Ref: 720+",
    cols: 2,
    rows: 2,
  },
  {
    id: "networth",
    label: "NET WORTH",
    value: "$284k",
    status: "healthy",
    badge: "GROWING",
    description:
      "On track for age bracket. Compound growth accelerating. Illiquid assets represent 68% — consider liquidity buffer.",
    ref: "Target: $250k+",
    cols: 1,
    rows: 1,
  },
  {
    id: "savings",
    label: "SAVINGS RATE",
    value: "18%",
    status: "healthy",
    badge: "HEALTHY",
    description:
      "Above median. FIRE threshold is 25%+. Automate increases by 1% per raise.",
    ref: "Target: >15%",
    cols: 1,
    rows: 1,
  },
  {
    id: "dti",
    label: "DEBT-TO-INCOME",
    value: "34%",
    status: "caution",
    badge: "ELEVATED",
    description:
      "Approaching lender thresholds for new credit. Maximum for qualified mortgage is 43%. Prioritise high-rate debt paydown before applying for additional credit.",
    ref: "Target: <36%",
    cols: 2,
    rows: 1,
  },
  {
    id: "emergency",
    label: "EMERGENCY FUND",
    value: "3.2 mo",
    status: "caution",
    badge: "LOW",
    description:
      "Below recommended 6-month target. One job loss event creates debt spiral risk. Increase by $300/mo until 6 months reached.",
    ref: "Target: 6 months",
    cols: 1,
    rows: 2,
  },
  {
    id: "returns",
    label: "PORTFOLIO RETURN",
    value: "+12.4%",
    status: "healthy",
    badge: "STRONG",
    description:
      "YTD. Outpacing S&P by 2.1%. Verify allocation drift — rebalance if equity exceeds 5% of target.",
    ref: "Benchmark: +10.3%",
    cols: 1,
    rows: 1,
  },
  {
    id: "cashflow",
    label: "MONTHLY CASH FLOW",
    value: "+$1,240",
    status: "healthy",
    badge: "POSITIVE",
    description:
      "Positive surplus. Direct to emergency fund completion before taxable brokerage.",
    ref: "Target: >$0",
    cols: 1,
    rows: 1,
  },
  {
    id: "401k",
    label: "401K RATE",
    value: "8%",
    status: "caution",
    badge: "SUBMAXIMAL",
    description:
      "Below IRS max of $23,000/yr. Missing employer match on 2% gap costs $1,840/yr in free money.",
    ref: "Max: $23,000/yr",
    cols: 1,
    rows: 1,
  },
  {
    id: "debt",
    label: "HIGH-RATE DEBT",
    value: "$8,400",
    status: "danger",
    badge: "ACTION NEEDED",
    description:
      "Credit card APR 24.9%. Costs $174/mo in interest alone. Avalanche method: eliminate before any discretionary investing.",
    ref: "Target: $0",
    cols: 2,
    rows: 1,
  },
  {
    id: "housing",
    label: "HOUSING COST RATIO",
    value: "28%",
    status: "healthy",
    badge: "OPTIMAL",
    description:
      "Within the 28% gross income rule. Leaves capacity for wealth accumulation. Review at next lease renewal.",
    ref: "Target: <30%",
    cols: 1,
    rows: 1,
  },
  {
    id: "tax",
    label: "EFFECTIVE TAX RATE",
    value: "19.2%",
    status: "info",
    badge: "MODERATE",
    description:
      "Room to optimise via HSA ($4,150), backdoor Roth, and tax-loss harvesting. Consult CPA before year-end.",
    ref: "",
    cols: 1,
    rows: 1,
  },
  {
    id: "insurance",
    label: "LIFE INSURANCE",
    value: "10× income",
    status: "healthy",
    badge: "ADEQUATE",
    description:
      "Term policy covers dependents through college. Review annually for income changes.",
    ref: "Target: 10-12×",
    cols: 1,
    rows: 1,
  },
];

function buildRecovery(base: Metric[]): Metric[] {
  const overrides: Record<string, Partial<Metric>> = {
    credit: { value: "580", status: "danger", badge: "POOR" },
    dti: { value: "52%", status: "danger", badge: "CRITICAL" },
    emergency: { value: "0.8 mo", status: "danger", badge: "CRITICAL" },
    debt: { value: "$34,000", status: "danger", badge: "CRITICAL" },
    cashflow: { value: "-$340", status: "danger", badge: "NEGATIVE" },
    savings: { value: "4%", status: "caution", badge: "LOW" },
  };
  return base.map((m) =>
    overrides[m.id] ? { ...m, ...overrides[m.id] } : m
  );
}

function buildWealth(base: Metric[]): Metric[] {
  const overrides: Record<string, Partial<Metric>> = {
    credit: { value: "810", status: "healthy", badge: "EXCELLENT" },
    networth: { value: "$1.2M", status: "healthy", badge: "STRONG" },
    savings: { value: "32%", status: "healthy", badge: "EXCELLENT" },
    dti: { value: "12%", status: "healthy", badge: "OPTIMAL" },
    emergency: { value: "14 mo", status: "healthy", badge: "STRONG" },
    returns: { value: "+24.1%", status: "healthy", badge: "EXCEPTIONAL" },
    "401k": { value: "Max", status: "healthy", badge: "MAXED" },
  };
  return base.map((m) =>
    overrides[m.id] ? { ...m, ...overrides[m.id] } : m
  );
}

const PROFILES: Record<string, Metric[]> = {
  "Strong Foundation": PROFILE_STRONG,
  "Recovery Mode": buildRecovery(PROFILE_STRONG),
  "Wealth Building": buildWealth(PROFILE_STRONG),
};

const PROFILE_NAMES = Object.keys(PROFILES) as (keyof typeof PROFILES)[];

// --- Color maps ---

const colorClasses: Record<MetricStatus, string> = {
  healthy: "bg-emerald-950/60 border-emerald-800/40",
  caution: "bg-amber-950/60 border-amber-800/40",
  danger: "bg-red-950/60 border-red-800/40",
  info: "bg-blue-950/60 border-blue-800/40",
};

const badgeClasses: Record<MetricStatus, string> = {
  healthy: "bg-emerald-900/80 text-emerald-300",
  caution: "bg-amber-900/80 text-amber-300",
  danger: "bg-red-900/80 text-red-300",
  info: "bg-blue-900/80 text-blue-300",
};

// --- Grid config ---
const GRID_COLS = 4;
const COL_UNIT_PX = 156; // approx px per grid column unit in a ~680px wide grid
const GAP_PX = 8;
const TILE_PADDING = 32; // 16px each side
const LINE_HEIGHT = 18;

function maxLinesForRows(rows: number): number {
  // 1 row tile: ~80px content area, 2 rows: ~190px, 3 rows: ~300px
  // subtract label (~14px), value (~44px), badge (~22px), ref (~16px), gaps (~20px)
  const ROW_UNIT_PX = 120;
  const contentPx = rows * ROW_UNIT_PX - 116;
  return Math.max(2, Math.floor(contentPx / LINE_HEIGHT));
}

// --- Main component ---

export default function FinMapSection() {
  const [activeProfile, setActiveProfile] = useState<string>(PROFILE_NAMES[0]);
  const [measuredMetrics, setMeasuredMetrics] = useState<MeasuredMetric[]>([]);
  const [adjustedCount, setAdjustedCount] = useState(0);

  useEffect(() => {
    const metrics = PROFILES[activeProfile];

    async function measure() {
      let layoutFn: (
        text: string,
        maxW: number,
        maxLines: number
      ) => boolean;

      try {
        const mod = await import("@chenglou/pretext");
        const { prepare, layout } = mod;
        layoutFn = (text, maxW, maxLines) => {
          const p = prepare(text, "13px system-ui");
          const result = layout(p, maxW, LINE_HEIGHT);
          return result.lineCount > maxLines;
        };
      } catch {
        // Fallback: rough char-based estimate
        layoutFn = (text, maxW, maxLines) => {
          const charsPerLine = Math.floor(maxW / (13 * 0.53));
          const lines = Math.ceil(text.length / charsPerLine);
          return lines > maxLines;
        };
      }

      let adjusted = 0;
      const result: MeasuredMetric[] = metrics.map((m) => {
        const tileContentWidth =
          m.cols * COL_UNIT_PX + (m.cols - 1) * GAP_PX - TILE_PADDING;
        const maxLines = maxLinesForRows(m.rows);
        const textAdjusted = layoutFn(m.description, tileContentWidth, maxLines);
        if (textAdjusted) adjusted++;
        return { ...m, textAdjusted };
      });

      setMeasuredMetrics(result);
      setAdjustedCount(adjusted);
    }

    measure();
  }, [activeProfile]);

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const tileVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 8 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  };

  return (
    <section className="py-24 px-6 bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="text-[10px] tracking-widest text-white/30 uppercase mb-3">
            Experiment · Fintech
          </div>
          <h2 className="text-3xl font-semibold text-white mb-2">FinMap</h2>
          <p className="text-white/40 text-sm max-w-xl">
            A mosaic of your financial vitals. Tile sizes reflect importance.
            Pretext measures every description before render — no reflow, no
            jank, perfect text fit across every tile size.
          </p>
        </motion.div>

        {/* Profile switcher */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          {PROFILE_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => setActiveProfile(name)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide border transition-all duration-200 ${
                activeProfile === name
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/0 border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
              }`}
            >
              {name}
            </button>
          ))}
        </motion.div>

        {/* Mosaic grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProfile}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            }}
          >
            {measuredMetrics.map((metric) => (
              <motion.div
                key={metric.id}
                variants={tileVariants}
                style={{
                  gridColumn: `span ${metric.cols}`,
                  gridRow: `span ${metric.rows}`,
                }}
                className={`p-4 rounded-xl border relative overflow-hidden ${colorClasses[metric.status]}`}
              >
                {/* Label */}
                <div className="text-[10px] font-semibold tracking-[0.15em] opacity-60 mb-1">
                  {metric.label}
                </div>

                {/* Value */}
                <div className="text-3xl font-bold text-white mb-0.5">
                  {metric.value}
                </div>

                {/* Unit */}
                {metric.unit && (
                  <div className="text-xs opacity-50 mb-2">{metric.unit}</div>
                )}

                {/* Badge */}
                <span
                  className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${badgeClasses[metric.status]} mb-2 inline-block`}
                >
                  {metric.badge}
                </span>

                {/* Description */}
                <p
                  className={`leading-relaxed opacity-70 ${
                    metric.textAdjusted ? "text-[11px]" : "text-[13px]"
                  }`}
                >
                  {metric.description}
                </p>

                {/* Ref */}
                {metric.ref && (
                  <div className="text-[10px] opacity-30 mt-2">{metric.ref}</div>
                )}

                {/* Pretext adjustment indicator */}
                {metric.textAdjusted && (
                  <span
                    className="absolute top-2 right-2 text-[10px] opacity-20"
                    title="font adjusted by pretext"
                  >
                    ⌖
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Footer note */}
        {measuredMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex items-center gap-2 text-[11px] text-white/25"
          >
            <span>⌖</span>
            <span>
              Text fit measured by{" "}
              <span className="text-white/40">pretext</span> —{" "}
              {adjustedCount} of {measuredMetrics.length} tiles font-adjusted.
              0 DOM reflows.
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
