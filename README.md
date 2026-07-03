# SCREAMING SIRENS · Paramedic Edition — Ch 47 (Pediatrics)

A slot-machine-styled active-recall drill for paramedic students, dressed as an
ambulance. You **run calls** instead of pulling a handle; the **Star of Life**
lights only when you answer correctly. It borrows the feel of a classic 3-reel
"sevens" machine — anticipation, instant feedback, a streak to chase — but every
win is earned by knowledge, never chance.

Built to the v2.1 design spec (see `Screaming Sirens Design Doc`).

## What's here

| File | Purpose |
|---|---|
| `ScreamingSirens.jsx` | The game — a single-file React component (default export). Drop into any React app. |
| `demo.html` | Self-contained, pre-bundled build of the same component. Open it directly in any browser — no install, no server. |

## Running it

**Instant:** open `demo.html` in a browser (works from disk, mobile-friendly).

**In a React project:** import the component and render it full-page:

```jsx
import ScreamingSirens from "./ScreamingSirens.jsx";
export default function App() { return <ScreamingSirens />; }
```

No dependencies beyond React itself. All art is CSS + inline SVG (no raster
assets); fonts load from Google Fonts with system fallbacks. State is
session-only React hooks — no localStorage/sessionStorage by design.

## Question bank

`RAW_BANK` in `ScreamingSirens.jsx` contains the **approved 100-question
Chapter 47 bank** (the vetted 63-question exam + 50-question quiz),
transferred verbatim by a mechanical converter and character-audited against
the source file — nothing generated, reworded, or paraphrased, per the design
spec's source-fidelity principle.

To swap in an updated approved bank, replace the lines inside `RAW_BANK` with
the verbatim records — one record per line:

```
category ||| question ||| optionA ||| optionB ||| optionC ||| optionD ||| answerIndex ||| explanation
```

- `answerIndex` is 0-based into the **original** option order; options are
  shuffled on every draw and the correct index is re-mapped at runtime.
- Category codes: `dev anat vitals assess airway resp upper lower shock pals
  neuro gimet tox trauma sids abuse`
- If any record contains the string `[PLACEHOLDER`, the app automatically
  shows a demo-content notice in the footer.

After swapping in the bank, rebuild `demo.html` if you use it:

```
npx esbuild entry.jsx --bundle --minify --define:process.env.NODE_ENV='"production"' --outfile=bundle.js --jsx=automatic
```

(where `entry.jsx` renders the component into `#root`, then inline the bundle
into the HTML shell).

## Game design

- **Skill-weighted randomness** — answers never pick a reel symbol. A correct
  answer tilts that reel's probability weights toward the premium symbols
  (quarter → pulse → Star of Life → seven); the reel then stops randomly from
  its weighted table. Jackpots are impossible on 0-correct rounds and rare
  even on perfect ones.
- **Real economy** — finite bankroll (20 quarters), 1 quarter per spin
  deducted up front, payouts from a visible single-payline paytable, and a
  true Shift Over game-over state at 0 quarters that requires an explicit
  restart. **Practice mode** offers free spins with identical reel logic.
- **Honest presentation** — the displayed outcome is always the raw weighted
  roll: no faked wins, no disguised losses, no engineered near-misses. Streak
  ("Siren heat") is cosmetic only — light tempo and celebration language,
  never odds, payouts, or protection.
- **No dark patterns** — no real-money framing; the transparency line in the
  paytable and footer states plainly that answers improve odds rather than
  selecting symbols.
- **Source fidelity** — questions, options, answers, and rationales render
  verbatim from the bank; the only added flavor is the Dispatch/Protocol-check
  tag, derived from the prompt text itself.
- **Accessibility** — keyboard operable with visible amber focus rings, real
  `<button>` options, large tap targets, high-contrast text, and full
  `prefers-reduced-motion` support (spin and flash effects are skipped; the
  game stays fully playable).

This is educational software — not medical advice, diagnosis, treatment
guidance, or a clinical decision-support tool.
