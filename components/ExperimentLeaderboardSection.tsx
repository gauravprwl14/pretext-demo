"use client";

const DEMOS = [
  {
    rank: 1,
    name: "Text as Terrain",
    prompt: "Wrong Domain",
    promptDesc: 'Pretend pretext exists in a platformer game. What would it solve?',
    scores: { novelty: 10, stopScroll: 10, pretextClarity: 7, interactivity: 10 },
    total: 37,
    badge: "WINNER",
    badgeColor: "text-amber-400 border-amber-400/40 bg-amber-400/[0.07]",
    why: "Nobody has ever seen their sentence become a game map. The connection between word-width and platform-width is immediately intuitive yet completely unexpected.",
    href: "#terrain",
  },
  {
    rank: 2,
    name: "Text Seismograph",
    prompt: "Sensory Translation",
    promptDesc: "What if text metrics drove something non-visual?",
    scores: { novelty: 9, stopScroll: 9, pretextClarity: 7, interactivity: 9 },
    total: 34,
    badge: "RUNNER UP",
    badgeColor: "text-blue-400 border-blue-400/40 bg-blue-400/[0.07]",
    why: "A waveform that IS the text's DNA. Seeing a legal contract vs a haiku produce visibly different signals makes the concept viscerally obvious.",
    href: "#seismograph",
  },
  {
    rank: 3,
    name: "Typography Physics",
    prompt: "Physics Was Wrong",
    promptDesc: "Character pixel-width = its mass in a physics simulation.",
    scores: { novelty: 9, stopScroll: 8, pretextClarity: 6, interactivity: 9 },
    total: 32,
    badge: "TOP 3",
    badgeColor: "text-red-400 border-red-400/40 bg-red-400/[0.07]",
    why: "Watching W and M fall faster than i and l creates an immediate 'aha' — text has physical weight. Pure novelty play.",
    href: "#physics",
  },
  {
    rank: 4,
    name: "Predictive Ghost Layout",
    prompt: "What Was Impossible Before",
    promptDesc: "Know exact layout BEFORE the words are typed.",
    scores: { novelty: 8, stopScroll: 7, pretextClarity: 10, interactivity: 9 },
    total: 34,
    badge: "BEST CLARITY",
    badgeColor: "text-green-400 border-green-400/40 bg-green-400/[0.07]",
    why: "Best at explaining WHY pretext matters. The ghost panel showing layout before words exist is the clearest demonstration of the core value proposition.",
    href: "#ghost",
  },
  {
    rank: 5,
    name: "Million-Row Precision Scroll",
    prompt: "5000× Faster = What's Now Possible",
    promptDesc: "Pre-compute 10,000 row heights with zero DOM elements.",
    scores: { novelty: 7, stopScroll: 7, pretextClarity: 10, interactivity: 8 },
    total: 32,
    badge: "MOST PRACTICAL",
    badgeColor: "text-neutral-400 border-neutral-400/40 bg-neutral-400/[0.07]",
    why: "The most production-relevant demo. Every developer who has fought virtual scroll estimation bugs will immediately understand the value.",
    href: "#precision-scroll",
  },
];

const METRICS = [
  { key: "novelty", label: "Novelty", desc: "Has anyone seen this before?", color: "bg-amber-400" },
  { key: "stopScroll", label: "Stop-Scroll", desc: "Would someone pause on Twitter?", color: "bg-blue-400" },
  { key: "pretextClarity", label: "Pretext Clarity", desc: "Does it show WHY pretext enables this?", color: "bg-green-400" },
  { key: "interactivity", label: "Interactivity", desc: "Can the user play with it?", color: "bg-red-400" },
];

const WINNING_PROMPT = `[Unusual constraint] × [Familiar medium] × [Unexpected audience/context]

"I have [library/tool] that does [core capability] in [what makes it unique].
Pretend it doesn't exist on the web.
What problems would it solve if it existed in [completely different domain]?
Now bring those answers BACK to the browser as an interactive demo.

Rules:
- No dashboard, no playground, no benchmark
- Must work interactively in a browser
- Must make a developer say 'I never thought [X] could do that'
- Give 10 directions. 5 should feel slightly uncomfortable or wrong.
- For each: one sentence concept + one sentence why it's only possible with [library]"`;

export default function ExperimentLeaderboardSection() {
  return (
    <section className="py-24 px-6 bg-black border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs text-white/40 mb-6 tracking-widest uppercase">
            Experiment Results
          </div>
          <h2 className="text-3xl font-semibold text-white mb-3">
            5 Prompts. 5 Demos. Ranked.
          </h2>
          <p className="text-white/40 text-base max-w-xl mx-auto">
            Each demo above was generated from a single brainstorming prompt. Here&apos;s how they scored — and the formula that produced the winner.
          </p>
        </div>

        {/* Metric legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {METRICS.map((m) => (
            <div key={m.key} className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${m.color}`} />
                <span className="text-white/70 text-xs font-medium">{m.label}</span>
              </div>
              <p className="text-white/30 text-xs leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-4 mb-16">
          {DEMOS.map((demo) => {
            const maxTotal = 40;
            const totalPct = (demo.total / maxTotal) * 100;
            return (
              <a
                key={demo.name}
                href={demo.href}
                className="block p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14] transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="shrink-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/30 text-sm font-mono">
                    {demo.rank}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <span className="text-white font-medium text-base group-hover:text-white/90">
                        {demo.name}
                      </span>
                      <span className={`text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border ${demo.badgeColor}`}>
                        {demo.badge}
                      </span>
                    </div>
                    <div className="text-white/30 text-xs mb-3">
                      Prompt: <span className="text-white/50 italic">&ldquo;{demo.promptDesc}&rdquo;</span>
                    </div>

                    {/* Score bars */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mb-3">
                      {METRICS.map((m) => {
                        const score = demo.scores[m.key as keyof typeof demo.scores];
                        return (
                          <div key={m.key}>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-white/30">{m.label}</span>
                              <span className="text-white/60 font-mono">{score}/10</span>
                            </div>
                            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${m.color} opacity-70`}
                                style={{ width: `${score * 10}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white/40"
                          style={{ width: `${totalPct}%` }}
                        />
                      </div>
                      <span className="text-white/50 text-xs font-mono shrink-0">
                        {demo.total} / {maxTotal}
                      </span>
                    </div>

                    <p className="mt-3 text-white/35 text-xs leading-relaxed">{demo.why}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Winner deep-dive */}
        <div className="mb-16 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03]">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/[0.08] text-amber-400 text-[10px] font-semibold tracking-widest uppercase">
              Winner Analysis
            </div>
            <span className="text-white/50 text-sm">Text as Terrain — 37/40</span>
          </div>
          <h3 className="text-white text-lg font-medium mb-3">Why &ldquo;Wrong Domain&rdquo; won</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-amber-400/80 text-xs font-semibold mb-2 uppercase tracking-wide">The Insight</div>
              <p className="text-white/50 leading-relaxed">Word width = platform width is a one-to-one mapping that requires zero explanation. The audience &ldquo;gets it&rdquo; within 3 seconds of seeing it.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-amber-400/80 text-xs font-semibold mb-2 uppercase tracking-wide">The Mechanism</div>
              <p className="text-white/50 leading-relaxed">By moving pretext into a game domain, every limitation becomes a feature. Line breaks become gaps. Char widths become terrain height. Constraints = design.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-amber-400/80 text-xs font-semibold mb-2 uppercase tracking-wide">The Hook</div>
              <p className="text-white/50 leading-relaxed">&ldquo;Type your sentence, play it as a game&rdquo; is a single shareable tweet. Every other demo requires more explanation.</p>
            </div>
          </div>
        </div>

        {/* The Winning Prompt Formula */}
        <div className="p-6 rounded-2xl border border-white/[0.10] bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-2 py-0.5 rounded-full border border-blue-400/30 bg-blue-400/[0.08] text-blue-400 text-[10px] font-semibold tracking-widest uppercase">
              Reusable Formula
            </div>
            <span className="text-white/40 text-sm">Apply to any library or concept</span>
          </div>

          <h3 className="text-white text-lg font-medium mb-2">The Winning Prompt Template</h3>
          <p className="text-white/40 text-sm mb-5">
            This formula produced the top-ranked demo. It works for any technical library or concept —
            replace the bracketed tokens with your own context.
          </p>

          <div className="relative">
            <div className="absolute top-3 left-3 text-[10px] text-white/20 font-mono uppercase tracking-widest">prompt</div>
            <pre className="pt-8 pb-5 px-5 rounded-xl bg-black border border-white/[0.10] text-white/60 text-xs leading-relaxed font-mono overflow-x-auto whitespace-pre-wrap">
{WINNING_PROMPT}
            </pre>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-blue-400/70 text-xs font-semibold mb-2 uppercase tracking-wide">Key Unlock #1</div>
              <p className="text-white/40 text-xs leading-relaxed">
                <span className="text-white/60">&ldquo;Pretend it doesn&apos;t exist on the web.&rdquo;</span> Removing the original context forces genuine domain-crossing. Without this, all ideas stay in the familiar lane.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-blue-400/70 text-xs font-semibold mb-2 uppercase tracking-wide">Key Unlock #2</div>
              <p className="text-white/40 text-xs leading-relaxed">
                <span className="text-white/60">&ldquo;5 should feel slightly uncomfortable.&rdquo;</span> Discomfort is the signal that novelty is present. Safe brainstorming produces safe demos. Force the weird ones.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-blue-400/70 text-xs font-semibold mb-2 uppercase tracking-wide">Key Unlock #3</div>
              <p className="text-white/40 text-xs leading-relaxed">
                <span className="text-white/60">&ldquo;One sentence why it&apos;s only possible with [library].&rdquo;</span> Forces specificity. Demos that could work without the library aren&apos;t good demos for the library.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
