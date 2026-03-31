# Experiment Results: 5 Prompts. 5 Demos. Ranked.

Each demo was generated from a single brainstorming prompt. Scored across four metrics — novelty, stop-scroll factor, pretext clarity, and interactivity — out of 10 each (max 40).

---

## Leaderboard

| Rank | Demo | Prompt | Novelty | Stop-Scroll | Pretext Clarity | Interactivity | Total |
|------|------|--------|---------|-------------|-----------------|---------------|-------|
| 1 | Text as Terrain | Wrong Domain | 10 | 10 | 7 | 10 | **37** |
| 2 | Text Seismograph | Sensory Translation | 9 | 9 | 7 | 9 | **34** |
| 2 | Predictive Ghost Layout | What Was Impossible Before | 8 | 7 | 10 | 9 | **34** |
| 4 | Typography Physics | Physics Was Wrong | 9 | 8 | 6 | 9 | **32** |
| 4 | Million-Row Precision Scroll | 5000× Faster = What's Now Possible | 7 | 7 | 10 | 8 | **32** |

---

## Metric Definitions

- **Novelty** — Has anyone seen this before?
- **Stop-Scroll** — Would someone pause on Twitter/X?
- **Pretext Clarity** — Does it show *why* pretext specifically enables this?
- **Interactivity** — Can the user play with it?

---

## Demo Breakdowns

### 1. Text as Terrain — 37/40 · WINNER
**Prompt:** *"Pretend pretext exists in a platformer game. What would it solve?"*

Word width = platform width. Line breaks = gaps the character must jump over. The terrain IS the text.

**Why it won:** The mapping is one-to-one and requires zero explanation. Audiences "get it" within 3 seconds. "Type your sentence, play it as a game" is a single shareable tweet. Every other demo requires more explanation. Moving pretext into a game domain made every constraint a feature — line breaks became gaps, char widths became elevation.

---

### 2. Text Seismograph — 34/40 · RUNNER UP
**Prompt:** *"What if text metrics drove something non-visual?"*

Each character's pixel width becomes the Y displacement on a scrolling waveform. Line-break thresholds trigger a red flash. The waveform IS the text's DNA.

**Why it scored high:** Seeing a legal contract vs a haiku produce visibly different signals makes the concept viscerally obvious. Highest stop-scroll potential after the winner.

---

### 3. Predictive Ghost Layout — 34/40 · BEST PRETEXT CLARITY
**Prompt:** *"Know exact layout BEFORE the words are typed."*

As you type, a ghost panel shows the paragraph's final shape 50 words ahead — computed by pretext before the browser has seen those words.

**Why it scored high:** Best demo for explaining *why* pretext matters. Score of 10/10 on pretext clarity — the ghost panel showing layout before words exist is the clearest demonstration of the core value proposition.

---

### 4. Typography Physics — 32/40
**Prompt:** *"Character pixel-width = its mass in a physics simulation."*

Characters fall on a canvas. W and M are heavy — fall fast, bounce low. i and l are light — drift down, bounce high.

**Why it scored well:** Pure novelty play. Watching text obey its own laws of physics creates an immediate aha moment. Slightly lower on pretext clarity since physics is metaphorical, not direct.

---

### 5. Million-Row Precision Scroll — 32/40 · MOST PRACTICAL
**Prompt:** *"Pre-compute 10,000 row heights with zero DOM elements."*

10,000 tweet-like items. All heights measured by pretext before any DOM exists. Binary search over cumulative heights for O(1) scroll position. A minimap shows all 10,000 height variations.

**Why it scored well:** Most production-relevant demo. Every developer who has fought virtual scroll estimation bugs will immediately understand the value. Lower novelty because the concept is familiar — the execution is the differentiator.

---

## Winner Analysis: Why "Wrong Domain" Wins

The top-ranked demo came from a single prompt strategy: **remove the tool from its original context**.

| What it does | Why it works |
|---|---|
| Forces domain-crossing | Without native context, all familiar solutions disappear |
| Constraints become features | Line breaks → gaps, widths → elevation, not problems to solve |
| Creates a one-sentence pitch | "Your text is the map" needs no further explanation |
| Produces inherent shareability | Game demos get shared; benchmark demos get bookmarked then forgotten |

---

## The Winning Prompt Formula

Applicable to any library or technical concept:

```
[Unusual constraint] × [Familiar medium] × [Unexpected audience/context]

"I have [library/tool] that does [core capability] in [what makes it unique].

Pretend it doesn't exist on the web.
What problems would it solve if it existed in [completely different domain]?
Now bring those answers BACK to the browser as an interactive demo.

Rules:
- No dashboard, no playground, no benchmark
- Must work interactively in a browser
- Must make a developer say 'I never thought [X] could do that'
- Give 10 directions. 5 should feel slightly uncomfortable or wrong.
- For each: one sentence concept + one sentence why it's only possible with [library]"
```

### The Three Key Unlocks

**1. "Pretend it doesn't exist on the web."**
Removing the original context forces genuine domain-crossing. Without this constraint, all ideas stay in the familiar lane.

**2. "5 should feel slightly uncomfortable or wrong."**
Discomfort is the signal that novelty is present. Safe brainstorming produces safe demos. The weird ideas are the ones worth building.

**3. "One sentence why it's only possible with [library]."**
Forces specificity. Demos that could work without the library aren't good demos *for* the library.

---

## Applied to Other Concepts

The formula generalises. Examples:

| Library / Concept | Wrong Domain | Resulting Demo Idea |
|---|---|---|
| A CSS animation library | "Exists in music production software" | Song structure visualised as animated CSS transitions — tempo = duration, pitch = transform |
| A graph database | "Exists in urban planning" | City layout as a live queryable graph — roads = edges, intersections = nodes |
| A WebSocket library | "Exists in a postal system from 1850s" | Letters (messages) physically travel across a canvas map between sender and recipient nodes |
| A diff algorithm | "Exists in archaeology" | Strata layers showing what changed between two versions of a document, as geological sediment |
