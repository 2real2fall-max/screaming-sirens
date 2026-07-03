import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════════════
   SCREAMING SIRENS — Paramedic Edition · Ch 47 (Pediatrics)
   Single-file React component. Built to the v2.1 design spec.
   The whole unit renders as a casino-grade slot cabinet dressed as the
   front of an ambulance: backlit marquee lightbox, LED light-bar pod,
   three reel panes as premium glass windshields inside a brushed-metal
   cab, a chrome-collared mechanical RESPOND button, and the run-sheet
   card recessed into the body between gloss-black chevron rails.
   Slot-cadence presentation, skill-only rewards: the Star of Life lights
   exclusively on a correct answer. No chance element, no dark patterns.
   Session-only state (React hooks); no localStorage/sessionStorage.
   All art is CSS + inline SVG — no raster assets.
   ════════════════════════════════════════════════════════════════════════ */

/* ══════════════ APPROVED QUESTION BANK — PLACEHOLDER ══════════════
   The vetted Chapter 47 exam bank was NOT provided with the design
   document. Per spec §3.1 (Source fidelity) nothing may be generated,
   reworded, or paraphrased here, so every record below is a clearly
   marked NON-MEDICAL placeholder that only demonstrates the machine.

   TO LOAD THE REAL BANK: replace the lines inside RAW_BANK with the
   verbatim records from the approved Chapter 47 bank file. Format,
   one record per line:

     category ||| question ||| optionA ||| optionB ||| optionC ||| optionD ||| answerIndex ||| explanation

   - answerIndex is 0-based into the ORIGINAL option order; options are
     shuffled at runtime and the correct index is re-mapped (spec §7).
   - Category codes: dev anat vitals assess airway resp upper lower
     shock pals neuro gimet tox trauma sids abuse
   The in-app demo notice disappears automatically once no record
   contains the string "[PLACEHOLDER". */
const RAW_BANK = `
resp ||| [PLACEHOLDER 1/8 — approved Chapter 47 bank not loaded] This demo record stands in for a verbatim bank question. Which option does this placeholder mark as correct? ||| Placeholder option A ||| Placeholder option B (marked correct) ||| Placeholder option C ||| Placeholder option D ||| 1 ||| [PLACEHOLDER rationale — the approved bank supplies this text verbatim.]
airway ||| [PLACEHOLDER 2/8 — approved Chapter 47 bank not loaded] You are looking at a demo record written to exercise the Dispatch tag heuristic. Which option does this placeholder mark as correct? ||| Placeholder option A (marked correct) ||| Placeholder option B ||| Placeholder option C ||| Placeholder option D ||| 0 ||| [PLACEHOLDER rationale — the approved bank supplies this text verbatim.]
shock ||| [PLACEHOLDER 3/8 — approved Chapter 47 bank not loaded] This demo record stands in for a verbatim bank question. Which option does this placeholder mark as correct? ||| Placeholder option A ||| Placeholder option B ||| Placeholder option C (marked correct) ||| Placeholder option D ||| 2 ||| [PLACEHOLDER rationale — the approved bank supplies this text verbatim.]
anat ||| [PLACEHOLDER 4/8 — approved Chapter 47 bank not loaded] This demo record stands in for a verbatim bank question. Which option does this placeholder mark as correct? ||| Placeholder option A ||| Placeholder option B ||| Placeholder option C ||| Placeholder option D (marked correct) ||| 3 ||| [PLACEHOLDER rationale — the approved bank supplies this text verbatim.]
vitals ||| [PLACEHOLDER 5/8 — approved Chapter 47 bank not loaded] This demo record stands in for a verbatim bank question. Which option does this placeholder mark as correct? ||| Placeholder option A (marked correct) ||| Placeholder option B ||| Placeholder option C ||| Placeholder option D ||| 0 ||| [PLACEHOLDER rationale — the approved bank supplies this text verbatim.]
pals ||| [PLACEHOLDER 6/8 — approved Chapter 47 bank not loaded] This demo record stands in for a verbatim bank question. Which option does this placeholder mark as correct? ||| Placeholder option A ||| Placeholder option B (marked correct) ||| Placeholder option C ||| Placeholder option D ||| 1 ||| [PLACEHOLDER rationale — the approved bank supplies this text verbatim.]
trauma ||| [PLACEHOLDER 7/8 — approved Chapter 47 bank not loaded] This demo record stands in for a verbatim bank question. Which option does this placeholder mark as correct? ||| Placeholder option A ||| Placeholder option B ||| Placeholder option C (marked correct) ||| Placeholder option D ||| 2 ||| [PLACEHOLDER rationale — the approved bank supplies this text verbatim.]
neuro ||| [PLACEHOLDER 8/8 — approved Chapter 47 bank not loaded] This demo record stands in for a verbatim bank question. Which option does this placeholder mark as correct? ||| Placeholder option A (marked correct) ||| Placeholder option B ||| Placeholder option C ||| Placeholder option D ||| 0 ||| [PLACEHOLDER rationale — the approved bank supplies this text verbatim.]
`;

/* ────────────────────────── content plumbing ────────────────────────── */

const CATEGORY_LABELS = {
  dev: "Growth & Development", anat: "Anatomy", vitals: "Vital Signs",
  assess: "Assessment", airway: "Airway & Mgmt", resp: "Respiratory",
  upper: "Upper Airway", lower: "Lower Airway", shock: "Shock",
  pals: "PALS", neuro: "Neuro", gimet: "GI / Metabolic",
  tox: "Toxicology", trauma: "Trauma", sids: "SIDS / BRUE",
  abuse: "Abuse & Neglect",
};

const HIGH_YIELD = new Set([
  "airway", "resp", "upper", "lower", "dev", "anat",
  "vitals", "assess", "shock", "neuro", "gimet", "tox",
]);

/* Dispatch vs Protocol check — spec §10 heuristic. The tag is the entire
   added flavor; never prepend a fabricated scene. */
function isDispatch(prompt) {
  const p = prompt.trim();
  return (
    /\d+\s*-\s*(year|month)\s*-?\s*old/i.test(p) ||
    /^you\b/i.test(p) ||
    /^a\s+(febrile|diabetic|child|toddler|\d)/i.test(p) ||
    /suddenly develops/i.test(p) ||
    /\b(harsh|unilateral|one-sided|congested)\b/i.test(p)
  );
}

function parseBank(raw) {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const f = line.split("|||").map((s) => s.trim());
      if (f.length < 8) return null;
      return {
        id: i,
        category: f[0],
        prompt: f[1],
        options: [f[2], f[3], f[4], f[5]],
        answerIndex: Number(f[6]),
        explanation: f[7],
        dispatch: isDispatch(f[1]),
      };
    })
    .filter(Boolean);
}

const BANK = parseBank(RAW_BANK);
const BANK_IS_PLACEHOLDER = RAW_BANK.includes("[PLACEHOLDER");

/* ─────────────────────── tunable constants (spec §6/§8) ─────────────── */

const T = { TICK_MS: 90, SPIN_MS: 800, BEAT_MS: 640, RESOLVE_MS: 720, FLASH_MS: 560 };
const START_QUARTERS = 20;
const SPIN_COST = 1;
const RESTOCK = 20;
const PAYOUT = [0, 1, 3, 10]; // by stars in a spin
const SPIN_GLYPHS = ["✚", "♥", "◆"];

const BANNERS = [
  "NO STARS — reset and roll again",
  "ONE STAR — on the board",
  "TWO STARS — one reel off the trifecta",
  "CODE 3 — RUNNING HOT · THREE STARS",
];

function heatTier(streak) {
  return streak >= 5 ? "blazing" : streak >= 3 ? "warm" : "cool";
}

function shiftLine(answered, correct) {
  if (!answered) return "Clock in when you’re ready.";
  const pct = (100 * correct) / answered;
  if (pct >= 85) return "Sharp shift. You’re running these cold.";
  if (pct >= 60) return "Solid work — a few reels to firm up and you’re golden.";
  return "Good reps in. Every flatline you cleared is one you won’t miss on the test.";
}

/* ─────────────────────────── small utilities ────────────────────────── */

function shuffleQuestion(q) {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    q,
    options: order.map((o) => q.options[o]),
    correctIndex: order.indexOf(q.answerIndex),
    picked: null,
    result: null, // 'star' | 'flat'
  };
}

function drawThree(bank) {
  const idx = bank.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(3, idx.length)).map((i) => shuffleQuestion(bank[i]));
}

/* Counts a displayed number up one step at a time on increases (the
   quarter counter "ticks up on payout", spec §11); decreases apply
   instantly. Disabled → always instant. */
function useCountUp(target, enabled, msPerStep = 80) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (!enabled || target <= from) {
      setVal(target);
      return;
    }
    setVal(from);
    const iv = setInterval(() => {
      setVal((v) => {
        if (v + 1 >= target) {
          clearInterval(iv);
          return target;
        }
        return v + 1;
      });
    }, msPerStep);
    return () => clearInterval(iv);
  }, [target, enabled]);
  return val;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn);
    return () =>
      mq.removeEventListener ? mq.removeEventListener("change", fn) : mq.removeListener(fn);
  }, []);
  return reduced;
}

/* ────────────────────────────── SVG art ─────────────────────────────── */

function StarOfLife({ lit, dim }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={"sol" + (lit ? " lit" : "") + (dim ? " dim" : "")}
      aria-hidden="true"
      focusable="false"
    >
      <g>
        {[0, 60, 120].map((r) => (
          <rect key={r} className="sol-bar" x="41" y="3" width="18" height="94" rx="5"
            transform={`rotate(${r} 50 50)`} />
        ))}
        <circle className="sol-hub" cx="50" cy="50" r="16.5" />
        <path className="sol-rod" d="M50 35.5 V64.5" />
        <path
          className="sol-snake"
          d="M43.5 40 c11 -4.5 15.5 5.5 3 8.5 c-13.5 3 -9 13 3.5 8.5 c11 -4 15 6 3 9"
        />
      </g>
    </svg>
  );
}

function FlatlineX() {
  return (
    <svg viewBox="0 0 100 62" className="flatx" aria-hidden="true" focusable="false">
      <path className="ecg" d="M4 36 H32 L38 14 L45 50 L51 36 H96" />
      <path className="xs" d="M24 12 L76 50" />
      <path className="xs" d="M76 12 L24 50" />
    </svg>
  );
}

function AmbulanceBadge() {
  return (
    <svg viewBox="0 0 128 64" className="amb" aria-hidden="true" focusable="false">
      {/* box body */}
      <rect x="6" y="16" width="76" height="34" rx="4" fill="#f4f8fc" />
      {/* cab */}
      <path d="M82 22 h20 l14 14 v14 h-34 z" fill="#f4f8fc" />
      <path d="M88 26 h12 l9 9 h-21 z" fill="#0a141e" />
      {/* stripe */}
      <rect x="6" y="36" width="110" height="7" fill="#e11d2e" />
      {/* star of life on body */}
      <g transform="translate(38 28)" fill="#2a86ff">
        <rect x="-2.6" y="-9" width="5.2" height="18" rx="1.6" />
        <rect x="-2.6" y="-9" width="5.2" height="18" rx="1.6" transform="rotate(60)" />
        <rect x="-2.6" y="-9" width="5.2" height="18" rx="1.6" transform="rotate(120)" />
        <circle r="4.6" fill="#f4f8fc" />
        <circle r="3.2" fill="#2a86ff" />
      </g>
      {/* roof beacon */}
      <rect x="30" y="10" width="12" height="7" rx="2" fill="#e11d2e" />
      {/* wheels */}
      <circle cx="28" cy="52" r="8.5" fill="#151b22" />
      <circle cx="28" cy="52" r="3.6" fill="#67737f" />
      <circle cx="98" cy="52" r="8.5" fill="#151b22" />
      <circle cx="98" cy="52" r="3.6" fill="#67737f" />
      {/* bumper */}
      <rect x="112" y="44" width="8" height="5" rx="1.5" fill="#9aa6b1" />
    </svg>
  );
}

/* ───────────────────────────── sub-views ────────────────────────────── */

function LightBar({ rave }) {
  const cluster = (bank, k) => (
    <span key={k} className={"lb-cluster " + bank}>
      {Array.from({ length: 5 }).map((_, i) => (
        <i key={i} className="led" />
      ))}
    </span>
  );
  return (
    <div className={"lightbar" + (rave ? " rave" : "")} aria-hidden="true">
      <div className="lb-shell">
        {cluster("red", "r1")}
        {cluster("red", "r2")}
        <span className="lb-center" />
        {cluster("blue", "b1")}
        {cluster("blue", "b2")}
      </div>
    </div>
  );
}

function MarkerLights() {
  return (
    <div className="markers" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="mk" style={{ animationDelay: `${i * 0.28}s` }} />
      ))}
    </div>
  );
}

function Pane({ face, glyph }) {
  return (
    <div className={"pane pane-" + face.kind}>
      {face.kind === "idle" && <span className="coin">25¢</span>}
      {face.kind === "spin" && <span className="glyph">{glyph}</span>}
      {face.kind === "live" && <span className="glyph">{glyph}</span>}
      {face.kind === "pending" && <span className="q bright">?</span>}
      {face.kind === "future" && <span className="q dim">?</span>}
      {face.kind === "star" && <StarOfLife lit />}
      {face.kind === "flat" && <FlatlineX />}
    </div>
  );
}

function Gauge({ label, value, hot, coin }) {
  return (
    <div className={"gauge" + (hot ? " hot" : "")}>
      <span className="g-value">
        {coin && <i className="g-coin" aria-hidden="true" />}
        {value}
      </span>
      <span className="g-label">{label}</span>
    </div>
  );
}

function Paytable() {
  return (
    <div className="paytable">
      <div className="pt-title">Payout — Code 3</div>
      <div className="pt-row"><span className="pt-stars">3 stars</span><span className="pt-pay plus">+10</span></div>
      <div className="pt-row"><span className="pt-stars">2 stars</span><span className="pt-pay plus">+3</span></div>
      <div className="pt-row"><span className="pt-stars">1 star</span><span className="pt-pay plus">+1</span></div>
      <div className="pt-row"><span className="pt-stars">0</span><span className="pt-pay">you keep the lesson</span></div>
    </div>
  );
}

function QuestionCard({ reel, index, onPick, locked }) {
  const { q, options } = reel;
  const cat = CATEGORY_LABELS[q.category] || q.category;
  return (
    <div className="qcard">
      <div className="q-head">
        <span className="q-title">
          <span className={"tagword " + (q.dispatch ? "dispatch" : "protocol")}>
            {q.dispatch ? "Dispatch" : "Protocol check"}:
          </span>{" "}
          {cat}
        </span>
        {HIGH_YIELD.has(q.category) && <span className="hy">HIGH-YIELD</span>}
      </div>
      <p className="prompt">
        <strong className="reelpre">Reel {index + 1} of 3:</strong> {q.prompt}
      </p>
      <div className="opts">
        {options.map((opt, i) => {
          let cls = "opt";
          if (reel.picked === i) {
            cls += reel.result === "star" ? " hit" : " miss";
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={locked}
              onClick={() => onPick(i)}
            >
              <span className="key">{"ABCD"[i]}</span>
              <span className="opt-text">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Payout count-up for the result card — animates only for multi-quarter
   wins so small outcomes stay modest; the jackpot gets the full climb. */
function PayCount({ amount, animate }) {
  const [n, setN] = useState(animate ? 0 : amount);
  useEffect(() => {
    if (!animate) {
      setN(amount);
      return;
    }
    setN(0);
    const iv = setInterval(() => {
      setN((v) => {
        if (v + 1 >= amount) {
          clearInterval(iv);
          return amount;
        }
        return v + 1;
      });
    }, 90);
    return () => clearInterval(iv);
  }, [amount, animate]);
  return <>{n}</>;
}

function Result({ reels, stars, payout, reduced }) {
  const misses = reels
    .map((r, i) => ({ ...r, reelNo: i + 1 }))
    .filter((r) => r.result === "flat");
  return (
    <div className="result">
      <div className={"banner s" + stars} role="status">
        {BANNERS[stars]}
      </div>
      {payout > 0 && (
        <div className="payline">
          +<PayCount amount={payout} animate={!reduced && payout > 1} /> quarter
          {payout === 1 ? "" : "s"}
        </div>
      )}
      {stars === 3 && <div className="sweep">Clean trifecta — all three sourced cold. ★</div>}
      {misses.length > 0 && (
        <div className="missrev">
          <div className="mr-head">Clear these before the next run</div>
          {misses.map((m) => (
            <div className="miss" key={m.reelNo}>
              <div className="m-meta">
                <span className="m-reel">Reel {m.reelNo}</span>
                <span className="m-cat">{CATEGORY_LABELS[m.q.category] || m.q.category}</span>
              </div>
              <p className="m-q">{m.q.prompt}</p>
              <p className="m-a">
                <strong>Correct:</strong> {m.options[m.correctIndex]}
              </p>
              <p className="m-exp">{m.q.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportOverlay({ stats, onClose }) {
  const btnRef = useRef(null);
  useEffect(() => {
    btnRef.current && btnRef.current.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const { runs, answered, correct, bestStreak, code3s } = stats;
  const acc = answered ? Math.round((100 * correct) / answered) + "%" : "—";
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Shift Report">
      <div className="report">
        <h2 className="r-title">SHIFT REPORT</h2>
        <div className="r-grid">
          <div className="r-stat"><span className="r-num">{runs}</span><span className="r-lab">runs</span></div>
          <div className="r-stat"><span className="r-num">{acc}</span><span className="r-lab">accuracy</span></div>
          <div className="r-stat"><span className="r-num">{bestStreak}</span><span className="r-lab">best streak</span></div>
          <div className="r-stat"><span className="r-num">{code3s}</span><span className="r-lab">Code 3s</span></div>
        </div>
        <p className="r-line">{shiftLine(answered, correct)}</p>
        <p className="r-always">Good place to clock out — or jump back on the rig.</p>
        <button type="button" ref={btnRef} className="btn back" onClick={onClose}>
          BACK TO THE RIG ▸
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ main component ═══════════════════════════ */

export default function ScreamingSirens() {
  const reduced = usePrefersReducedMotion();

  const [phase, setPhase] = useState("idle"); // idle | spinning | answering | resolved
  const [quarters, setQuarters] = useState(START_QUARTERS);
  const [heat, setHeat] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [code3s, setCode3s] = useState(0);
  const [runs, setRuns] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [reels, setReels] = useState([]);
  const [activeReel, setActiveReel] = useState(0);
  const [spinTick, setSpinTick] = useState(0);
  const [flashWin, setFlashWin] = useState(false);
  const [lastStars, setLastStars] = useState(0);
  const [lastPayout, setLastPayout] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  const lockRef = useRef(false);
  const timers = useRef([]);
  const after = useCallback((ms, fn) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const broke = quarters < SPIN_COST;
  const tier = heatTier(heat);
  const rave = phase === "resolved" && lastStars === 3;
  const shownQuarters = useCountUp(quarters, !reduced);

  /* spin glyph ticker — the active reel keeps rolling while the player
     answers and locks on answer; static bright ? under reduced motion */
  const ticking = phase === "spinning" || (phase === "answering" && !reduced);
  useEffect(() => {
    if (!ticking) return;
    const iv = setInterval(() => setSpinTick((t) => t + 1), T.TICK_MS);
    return () => clearInterval(iv);
  }, [ticking]);

  const respond = useCallback(() => {
    if (phase !== "idle" || quarters < SPIN_COST || BANK.length < 3) return; // spec §17
    setQuarters((q) => q - SPIN_COST);
    setRuns((r) => r + 1);
    setReels(drawThree(BANK));
    setActiveReel(0);
    lockRef.current = false;
    if (reduced) {
      setPhase("answering"); // reduced motion: skip the spin (spec §6)
    } else {
      setPhase("spinning");
      after(T.SPIN_MS, () => setPhase("answering"));
    }
  }, [phase, quarters, reduced, after]);

  const restock = useCallback(() => {
    if (phase !== "idle" || !broke) return;
    setQuarters((q) => q + RESTOCK);
  }, [phase, broke]);

  const resolve = useCallback((finalReels) => {
    const stars = finalReels.filter((r) => r.result === "star").length;
    const pay = PAYOUT[stars];
    setLastStars(stars);
    setLastPayout(pay);
    if (pay) setQuarters((q) => q + pay);
    if (stars === 3) setCode3s((c) => c + 1);
    setPhase("resolved");
  }, []);

  const pick = useCallback(
    (i) => {
      if (phase !== "answering" || lockRef.current) return; // lock after first answer (spec §17)
      lockRef.current = true;
      const reel = reels[activeReel];
      const hit = i === reel.correctIndex;
      const next = reels.map((r, idx) =>
        idx === activeReel ? { ...r, picked: i, result: hit ? "star" : "flat" } : r
      );
      setReels(next);
      setAnswered((a) => a + 1);
      if (hit) {
        setCorrect((c) => c + 1);
        setHeat((h) => {
          const nh = h + 1;
          setBestStreak((b) => Math.max(b, nh));
          return nh;
        });
        setFlashWin(true);
        after(T.FLASH_MS, () => setFlashWin(false));
      } else {
        setHeat(0);
      }
      if (activeReel < 2) {
        after(T.BEAT_MS, () => {
          setActiveReel((r) => r + 1);
          lockRef.current = false;
        });
      } else {
        after(T.RESOLVE_MS, () => {
          resolve(next);
          lockRef.current = false;
        });
      }
    },
    [phase, reels, activeReel, after, resolve]
  );

  const runItBack = useCallback(() => {
    if (phase !== "resolved") return;
    setReels([]);
    setActiveReel(0);
    setPhase("idle");
  }, [phase]);

  /* windshield faces (symbols only — never question text) */
  const faces = useMemo(() => {
    return [0, 1, 2].map((i) => {
      if (phase === "spinning") return { kind: "spin" };
      const r = reels[i];
      if (!r) return { kind: "idle" };
      if (r.result === "star") return { kind: "star" };
      if (r.result === "flat") return { kind: "flat" };
      if (phase === "answering")
        return i === activeReel ? { kind: reduced ? "pending" : "live" } : { kind: "future" };
      return { kind: "idle" };
    });
  }, [phase, reels, activeReel, reduced]);

  const accuracy = answered ? Math.round((100 * correct) / answered) + "%" : "—";

  /* console button + subtext by state */
  let consoleBtn;
  let subtext;
  if (phase === "resolved") {
    consoleBtn = (
      <button type="button" className="btn runback" onClick={runItBack}>
        RUN IT BACK ▸
      </button>
    );
    subtext = "Three fresh calls on deck.";
  } else if (phase === "idle" && broke) {
    consoleBtn = (
      <button type="button" className="btn restock" onClick={restock}>
        RESTOCK THE RIG (+20)
      </button>
    );
    subtext = "Out of quarters — restock and keep rolling, no limit.";
  } else {
    consoleBtn = (
      <button
        type="button"
        className="btn respond"
        onClick={respond}
        disabled={phase !== "idle"}
      >
        ◉ RESPOND · INSERT 25¢
      </button>
    );
    subtext =
      phase === "answering"
        ? "answer to lock the reel"
        : phase === "spinning"
        ? "reels rolling…"
        : "Three calls, three reels — every right answer ignites a Star of Life.";
  }

  return (
    <div className="ss-stage">
      <style>{CSS}</style>
      <div className={`rig heat-${tier}${rave ? " code3" : ""}${reduced ? " rm" : ""}`}>
        <div className="frame">
          <div className="shell">
            <MarkerLights />

            {/* box-body header: lamp + quarters · dominant marquee · stat stack */}
            <div className="head">
              <div className="head-l">
                <span className="corner-lamp" aria-hidden="true" />
                <Gauge label="Quarters" value={shownQuarters} coin />
              </div>
              <div className="marquee">
                <h1 className="title">
                  SCREAMING SIRENS <AmbulanceBadge />
                </h1>
                <div className="sub">Paramedic Edition</div>
                <span className="mq-div" aria-hidden="true" />
                <div className="chap">Chapter 47</div>
                <div className="chap2">Pediatrics</div>
                <div className="plate">MEDIC 47</div>
              </div>
              <div className="head-r">
                <Gauge label="Siren heat" value={heat} hot={heat >= 3} />
                <Gauge label="Code 3s" value={code3s} />
                <Gauge label="Accuracy" value={accuracy} />
              </div>
            </div>

            {/* light-bar pod between marquee and cab */}
            <LightBar rave={rave} />

            {/* cab zone: pillar strips outside the silver cab */}
            <div className="cabzone">
              <span className="strip left" aria-hidden="true" />
              <div className="cab">
                <div className={"bayinset" + (flashWin ? " winflash" : "")}>
                  <i className="rivet r1" aria-hidden="true" />
                  <i className="rivet r2" aria-hidden="true" />
                  <i className="rivet r3" aria-hidden="true" />
                  <i className="rivet r4" aria-hidden="true" />
                  {faces.map((f, i) => (
                    <Pane key={i} face={f} glyph={SPIN_GLYPHS[(spinTick + i) % SPIN_GLYPHS.length]} />
                  ))}
                  {rave && !reduced && <div className="flare" aria-hidden="true" />}
                </div>
                {/* cowl: vents · action button · dome knob */}
                <div className="console">
                  <span className="vents" aria-hidden="true" />
                  {consoleBtn}
                  <span className="dome-knob" aria-hidden="true" />
                </div>
                <div className="hood-lamps">
                  <span className="turn" aria-hidden="true" />
                  <div className="subtext" aria-live="polite">{subtext}</div>
                  <span className="turn" aria-hidden="true" />
                </div>
              </div>
              <span className="strip right" aria-hidden="true" />
            </div>

            {/* body: run-sheet recessed into the cabinet between chevron rails */}
            <div className="bay">
              <span className="chevcol" aria-hidden="true" />
              <div className="sheet">
                {(phase === "idle" || phase === "spinning") && <Paytable />}
                {phase === "answering" && reels[activeReel] && (
                  <QuestionCard
                    reel={reels[activeReel]}
                    index={activeReel}
                    onPick={pick}
                    locked={reels[activeReel].result !== null}
                  />
                )}
                {phase === "resolved" && (
                  <Result reels={reels} stars={lastStars} payout={lastPayout} reduced={reduced} />
                )}
                <button type="button" className="endshift" onClick={() => setReportOpen(true)}>
                  End shift · view report
                </button>
              </div>
              <span className="chevcol flip" aria-hidden="true" />
            </div>

            <div className="bumper" aria-hidden="true">
              <span className="tail" />
              <span className="chev" />
              <span className="tail" />
            </div>

            <div className="footer">
              {BANK_IS_PLACEHOLDER && (
                <p className="demo-note">
                  ⚠ Demo content — the approved Chapter 47 bank file is not loaded; the records
                  shown are clearly marked placeholders, not medical content.
                </p>
              )}
              <p>
                Every Star of Life is earned — correct answers only, never chance. Questions are
                drawn verbatim from your vetted Chapter 47 exam bank. Roll as long as you like.
              </p>
            </div>
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportOverlay
          stats={{ runs, answered, correct, bestStreak, code3s }}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════ styles ═══════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@700;800&family=Inter:wght@400;600;700&display=swap');

.ss-stage{
  --gun1:#2c343d; --gun2:#4a5561;
  --chrome1:#e7edf2; --chrome2:#67737f;
  --blue:#2a86ff; --red:#e11d2e; --amber:#ffb300; --hivis:#ffd60a; --hivis2:#d10a1a;
  --navy:#0a141e; --navy2:#050c14; --white:#f4f8fc;
  --ink:#16202b; --ink2:#4c5a68; --cyan:#8fd0ff;
  --disp:'Saira Condensed','Arial Narrow',Impact,sans-serif;
  --body:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  min-height:100vh; min-height:100dvh;
  display:flex; justify-content:center; align-items:flex-start;
  padding:16px 8px 46px;
  background:
    radial-gradient(85% 55% at 28% 6%, rgba(225,29,46,.075), transparent 60%),
    radial-gradient(85% 55% at 72% 6%, rgba(42,134,255,.075), transparent 60%),
    radial-gradient(120% 90% at 50% 0%, #0c1117 0%, #04070b 60%, #010204 100%);
  font-family:var(--body); color:var(--white);
  -webkit-font-smoothing:antialiased;
}
.ss-stage *,.ss-stage *::before,.ss-stage *::after{box-sizing:border-box;}
.ss-stage button{font:inherit;}

.rig{ width:100%; max-width:560px; --flash:.9s; }
.rig.heat-warm{ --flash:.62s; }
.rig.heat-blazing{ --flash:.36s; }
.rig.code3{ --flash:.16s; }

/* ── piano-black outer rim with chrome edge light ── */
.frame{
  border-radius:34px; padding:9px;
  background:linear-gradient(180deg, #38424d 0%, #171e26 34%, #0a0e13 70%, #05070a 100%);
  border:1px solid #000;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.32),
    inset 0 -1px 0 rgba(0,0,0,.9),
    inset 2px 0 3px rgba(255,255,255,.07),
    inset -2px 0 3px rgba(0,0,0,.5),
    0 26px 60px rgba(0,0,0,.85),
    0 6px 18px rgba(0,0,0,.6);
  transition:box-shadow .5s ease;
}
.rig.heat-warm .frame{ box-shadow: inset 0 1px 0 rgba(255,255,255,.32), inset 0 -1px 0 rgba(0,0,0,.9), 0 26px 60px rgba(0,0,0,.85), 0 0 42px rgba(255,179,0,.2); }
.rig.heat-blazing .frame{ box-shadow: inset 0 1px 0 rgba(255,255,255,.32), inset 0 -1px 0 rgba(0,0,0,.9), 0 26px 60px rgba(0,0,0,.85), 0 0 64px rgba(255,140,0,.38); }
/* jackpot: the whole cabinet glows and pulses — reserved for 3/3 */
.rig.code3 .frame{ animation:cabglow .8s ease-in-out infinite; }
@keyframes cabglow{
  0%,100%{ box-shadow:0 26px 60px rgba(0,0,0,.85), 0 0 46px rgba(225,29,46,.45), 0 0 100px rgba(255,179,0,.24); }
  50%{ box-shadow:0 26px 60px rgba(0,0,0,.85), 0 0 80px rgba(225,29,46,.65), 0 0 150px rgba(255,179,0,.42); }
}

/* ── brushed-metal vehicle face with specular sweep + gold coach line ── */
.shell{
  border-radius:26px; padding:9px 11px 13px;
  background:
    linear-gradient(115deg, rgba(255,255,255,.24) 0%, rgba(255,255,255,0) 26%),
    repeating-linear-gradient(90deg, rgba(255,255,255,.045) 0 1px, rgba(0,0,0,.02) 1px 2px, transparent 2px 4px),
    linear-gradient(180deg, #f0f5f9 0%, #ccd6de 22%, #a2adb9 52%, #808b97 80%, #6c7783 100%);
  border:1px solid #525d68;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.85),
    inset 0 -3px 9px rgba(0,0,0,.4),
    inset 3px 0 7px rgba(255,255,255,.28),
    inset -3px 0 7px rgba(0,0,0,.2),
    0 0 0 1.5px rgba(201,165,76,.4),
    0 0 0 2.5px rgba(0,0,0,.55);
}

/* amber clearance markers along the roof edge */
.markers{ display:flex; justify-content:space-between; padding:2px 18px 8px; }
.mk{
  width:23px; height:9px; border-radius:5px;
  background:
    radial-gradient(45% 40% at 30% 22%, rgba(255,255,255,.85), transparent 60%),
    radial-gradient(120% 170% at 50% 25%, #ffd47a, var(--amber) 55%, #a3410a);
  border:1px solid #4e5864;
  box-shadow:0 0 9px 2px rgba(255,140,40,.55), inset 0 -1px 2px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.4);
  animation:breathe 2.6s ease-in-out infinite;
}
@keyframes breathe{ 0%,100%{opacity:.5; box-shadow:0 0 4px 1px rgba(255,140,40,.25);} 50%{opacity:1; box-shadow:0 0 11px 3px rgba(255,140,40,.65);} }

/* ── box-body header — the marquee dominates ── */
.head{
  display:grid; grid-template-columns:minmax(70px,86px) 1fr minmax(96px,110px);
  gap:9px; align-items:stretch; padding-bottom:10px;
}
.head-l{ display:flex; flex-direction:column; gap:9px; }
.corner-lamp{
  display:block; height:34px; border-radius:9px;
  background:
    radial-gradient(50% 45% at 30% 20%, rgba(255,255,255,.7), transparent 55%),
    repeating-linear-gradient(90deg, transparent 0 7px, rgba(0,0,0,.28) 7px 9px),
    radial-gradient(120% 160% at 50% 20%, #ff6b74, var(--red) 55%, #6e0410);
  border:2px solid #4e5864;
  box-shadow:inset 0 2px 3px rgba(255,255,255,.4), inset 0 -3px 6px rgba(0,0,0,.6), 0 0 14px rgba(225,29,46,.5), 0 1px 0 rgba(255,255,255,.4);
}
.head-r{ display:flex; flex-direction:column; gap:9px; }

/* illuminated glass gauge tiles */
.gauge{
  position:relative; overflow:hidden;
  flex:1; display:flex; flex-direction:column; justify-content:center;
  border-radius:12px; padding:7px 4px;
  background:
    radial-gradient(90% 70% at 50% 100%, rgba(30,90,160,.22), transparent 65%),
    linear-gradient(180deg, #0d1a29, #030910);
  border:1px solid #39434f;
  box-shadow:
    inset 0 2px 9px rgba(0,0,0,.95),
    inset 0 0 24px rgba(25,70,130,.16),
    0 1px 0 rgba(255,255,255,.55),
    0 0 0 2px rgba(15,20,26,.9),
    0 3px 6px rgba(0,0,0,.45);
  text-align:center;
}
.gauge::after{
  content:""; position:absolute; inset:0; pointer-events:none; border-radius:inherit;
  background:linear-gradient(115deg, rgba(255,255,255,.13) 0%, rgba(255,255,255,.02) 30%, transparent 45%);
}
.g-value{
  display:flex; align-items:center; justify-content:center; gap:6px;
  font-family:var(--disp); font-weight:800; font-size:23px; line-height:1;
  color:var(--cyan); text-shadow:0 0 7px rgba(110,190,255,.9), 0 0 20px rgba(60,140,230,.55);
}
.g-label{
  display:block; margin-top:3px;
  font-family:var(--disp); font-weight:700; font-size:9px; letter-spacing:.18em;
  text-transform:uppercase; color:#8b9aac;
}
.gauge.hot .g-value{ color:#ff9d2e; text-shadow:0 0 8px rgba(255,140,0,.95), 0 0 24px rgba(255,100,0,.6); }
.head-l .gauge .g-value{ font-size:27px; flex-direction:column; gap:5px; }
.g-coin{
  width:23px; height:23px; border-radius:50%;
  background:
    radial-gradient(40% 35% at 32% 25%, rgba(255,255,255,.95), transparent 55%),
    radial-gradient(circle at 35% 30%, #ffe9a8, #e0a400 55%, #8a5d00);
  border:1px solid #6e5200;
  box-shadow:inset 0 -2px 3px rgba(0,0,0,.55), 0 0 10px rgba(255,179,0,.6), 0 1px 1px rgba(0,0,0,.5);
}

/* marquee — backlit lightbox with sheen sweep */
.marquee{
  position:relative; overflow:hidden;
  display:flex; flex-direction:column; justify-content:center; align-items:center; gap:3px;
  border-radius:16px; padding:15px 10px 11px;
  background:
    radial-gradient(85% 62% at 50% 36%, rgba(255,110,40,.15), transparent 68%),
    radial-gradient(120% 90% at 50% 108%, rgba(25,70,130,.3), transparent 60%),
    linear-gradient(170deg, #13273c 0%, #0a1828 42%, #030910 100%);
  border:2px solid #39434f;
  box-shadow:
    inset 0 0 0 2px rgba(220,235,250,.09),
    inset 0 5px 18px rgba(0,0,0,.9),
    inset 0 0 70px rgba(18,55,105,.28),
    0 1px 0 rgba(255,255,255,.55),
    0 0 0 2px rgba(15,20,26,.9),
    0 3px 7px rgba(0,0,0,.5);
  text-align:center;
}
.marquee::before{ /* slow sheen pass across the glass */
  content:""; position:absolute; top:-25%; bottom:-25%; left:-45%; width:36%;
  background:linear-gradient(105deg, transparent 0%, rgba(255,255,255,.11) 50%, transparent 100%);
  transform:skewX(-18deg); pointer-events:none;
  animation:sheen 7s ease-in-out infinite;
}
@keyframes sheen{ 0%,58%{ left:-45%; } 82%,100%{ left:118%; } }
.marquee::after{
  content:""; position:absolute; inset:0; pointer-events:none; border-radius:inherit;
  background:linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.02) 24%, transparent 40%);
}
.title{
  margin:0; display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap;
  font-family:var(--disp); font-weight:800; font-size:clamp(22px,6.5vw,33px);
  letter-spacing:.065em; line-height:1; color:#ffdca8;
  text-shadow:0 0 5px rgba(255,170,60,.95), 0 0 16px rgba(255,110,40,.8), 0 0 36px rgba(225,29,46,.55), 0 2px 2px rgba(0,0,0,.8);
  animation:marqueebreathe 3.4s ease-in-out infinite;
}
@keyframes marqueebreathe{
  0%,100%{ text-shadow:0 0 5px rgba(255,170,60,.95), 0 0 16px rgba(255,110,40,.8), 0 0 36px rgba(225,29,46,.55), 0 2px 2px rgba(0,0,0,.8); }
  50%{ text-shadow:0 0 6px rgba(255,190,90,1), 0 0 24px rgba(255,130,50,.95), 0 0 52px rgba(225,29,46,.75), 0 2px 2px rgba(0,0,0,.8); }
}
.title .amb{ width:42px; flex:0 0 auto; filter:drop-shadow(0 0 7px rgba(255,157,46,.7)); }
.sub{
  margin-top:3px;
  font-family:var(--disp); font-weight:700; font-size:13px; letter-spacing:.28em;
  text-transform:uppercase; color:#f7efdf; text-shadow:0 0 12px rgba(255,226,184,.65), 0 1px 1px rgba(0,0,0,.7);
}
.mq-div{
  display:block; width:74%; height:2px; margin:9px 0 8px; border-radius:2px;
  background:linear-gradient(90deg, transparent, rgba(160,190,220,.55) 18%, rgba(160,190,220,.55) 82%, transparent);
  box-shadow:0 0 8px rgba(140,180,220,.35);
}
.chap{
  font-family:var(--disp); font-weight:800; font-size:18px; letter-spacing:.26em;
  text-transform:uppercase; color:var(--amber);
  text-shadow:0 0 8px rgba(255,179,0,.8), 0 0 22px rgba(255,140,0,.45), 0 1px 1px rgba(0,0,0,.7);
}
.chap2{
  font-family:var(--disp); font-weight:700; font-size:14px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--amber);
  text-shadow:0 0 8px rgba(255,179,0,.7), 0 1px 1px rgba(0,0,0,.7);
}
.plate{
  margin-top:8px; font-family:var(--disp); font-weight:800; font-size:11px; letter-spacing:.14em;
  color:#141b22; padding:3px 11px; border-radius:5px;
  background:linear-gradient(180deg, #f4f8fc 0%, #c3ccd6 45%, #8d98a4 90%, #a9b3bd 100%);
  border:1px solid #39434f;
  box-shadow:inset 0 1px 0 #fff, inset 0 -2px 3px rgba(0,0,0,.3), 0 2px 4px rgba(0,0,0,.65);
  text-shadow:0 1px 0 rgba(255,255,255,.5);
}

/* ── light-bar pod between marquee and cab ── */
.lightbar{ position:relative; z-index:2; display:flex; justify-content:center; margin:2px 0 -7px; }
.lb-shell{
  display:flex; align-items:center; justify-content:center; gap:7px;
  width:min(66%,330px); padding:6px 11px; border-radius:10px;
  background:
    linear-gradient(115deg, rgba(255,255,255,.14) 0%, transparent 32%),
    linear-gradient(180deg, #454f5a 0%, #1c232b 55%, #0d1218 100%);
  border:1px solid #05080b;
  box-shadow:
    0 4px 10px rgba(0,0,0,.7),
    0 0 22px rgba(225,29,46,.12),
    0 0 22px rgba(42,134,255,.12),
    inset 0 1px 0 rgba(255,255,255,.22),
    inset 0 -2px 4px rgba(0,0,0,.6);
}
.lb-cluster{ display:flex; gap:3px; }
.led{ width:9px; height:16px; border-radius:3px; border:1px solid rgba(0,0,0,.5); }
.lb-cluster.red .led{
  background:
    radial-gradient(45% 30% at 32% 18%, rgba(255,255,255,.9), transparent 60%),
    radial-gradient(circle at 50% 25%, #ff9aa0, var(--red) 55%, #7c0812);
  color:var(--red); animation:lbflash var(--flash) linear infinite;
}
.lb-cluster.blue .led{
  background:
    radial-gradient(45% 30% at 32% 18%, rgba(255,255,255,.9), transparent 60%),
    radial-gradient(circle at 50% 25%, #a5cbff, var(--blue) 55%, #0c3f85);
  color:var(--blue); animation:lbflash var(--flash) linear infinite;
  animation-delay:calc(var(--flash) / -2);
}
@keyframes lbflash{
  0%,42%{ opacity:1; filter:brightness(1.7) drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor); }
  50%,92%{ opacity:.22; filter:none; }
  100%{ opacity:1; }
}
.lb-center{
  width:32px; height:18px; border-radius:4px;
  background:linear-gradient(180deg, #f4f8fc, #98a3ae 65%, #67737f);
  box-shadow:inset 0 1px 0 #fff, inset 0 -2px 3px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.6);
}
.lightbar.rave .led{ filter:saturate(1.5); }

/* ── cab zone: glass-tube pillar strips outside the cab ── */
.cabzone{
  display:grid; grid-template-columns:13px minmax(0,1fr) 13px; gap:7px; align-items:stretch;
}
.strip{
  border-radius:10px; margin:18px 0 26px;
  background:
    linear-gradient(90deg, rgba(255,255,255,.32), rgba(255,255,255,0) 55%),
    repeating-linear-gradient(180deg, currentColor 0 9px, #070d16 9px 15px);
  border:1px solid rgba(0,0,0,.65);
  animation:strobe var(--flash) linear infinite;
}
.strip.left{ color:var(--blue); box-shadow:0 0 15px rgba(42,134,255,.65), inset 0 0 4px rgba(0,0,0,.7), 0 1px 0 rgba(255,255,255,.25); }
.strip.right{ color:var(--red); box-shadow:0 0 15px rgba(225,29,46,.7), inset 0 0 4px rgba(0,0,0,.7), 0 1px 0 rgba(255,255,255,.25);
  animation-delay:calc(var(--flash) / -2); }
@keyframes strobe{ 0%,45%{ opacity:1; } 50%,95%{ opacity:.4; } 100%{ opacity:1; } }

/* the brushed-metal cab: one mass — windshield bay + cowl */
.cab{
  border-radius:28px 28px 18px 18px; padding:12px 11px 10px;
  background:
    linear-gradient(115deg, rgba(255,255,255,.2) 0%, rgba(255,255,255,0) 30%),
    repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, #e3eaf0 0%, #b6c0c9 35%, #929daa 70%, #7e8995 100%);
  border:1px solid #4e5864;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.8),
    inset 0 -3px 8px rgba(0,0,0,.35),
    0 6px 16px rgba(0,0,0,.55),
    0 1px 0 rgba(255,255,255,.15);
}
/* near-black reel bay with corner rivets */
.bayinset{
  position:relative; overflow:hidden;
  display:grid; grid-template-columns:repeat(3,1fr); gap:10px;
  border-radius:18px 18px 12px 12px; padding:12px;
  background:linear-gradient(180deg, #1d232b 0%, #0e1319 55%, #06090d 100%);
  border:1px solid #000;
  box-shadow:
    inset 0 5px 16px rgba(0,0,0,.95),
    inset 0 -1px 0 rgba(255,255,255,.06),
    inset 0 1px 0 rgba(255,255,255,.05),
    0 1px 0 rgba(255,255,255,.35);
}
.rivet{
  position:absolute; width:7px; height:7px; border-radius:50%; z-index:1;
  background:radial-gradient(circle at 35% 30%, #f4f8fc, #808b97 55%, #2c343d);
  box-shadow:0 1px 2px rgba(0,0,0,.8), inset 0 -1px 1px rgba(0,0,0,.5);
}
.rivet.r1{ top:6px; left:7px; } .rivet.r2{ top:6px; right:7px; }
.rivet.r3{ bottom:6px; left:7px; } .rivet.r4{ bottom:6px; right:7px; }
.bayinset.winflash{ animation:winflash ${T.FLASH_MS}ms ease-out; }
@keyframes winflash{
  0%{ box-shadow:inset 0 5px 16px rgba(0,0,0,.95), 0 0 0 rgba(255,179,0,0); }
  30%{ box-shadow:inset 0 5px 16px rgba(0,0,0,.95), 0 0 36px 8px rgba(255,179,0,.9); }
  100%{ box-shadow:inset 0 5px 16px rgba(0,0,0,.95), 0 0 0 rgba(255,179,0,0); }
}

/* premium glass reel windows */
.pane{
  position:relative; aspect-ratio:10/11; border-radius:12px; overflow:hidden;
  background:
    radial-gradient(130% 95% at 50% 118%, rgba(22,65,120,.3), transparent 55%),
    linear-gradient(rgba(140,190,240,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(140,190,240,.05) 1px, transparent 1px),
    radial-gradient(150% 130% at 50% -8%, #0d1e30 0%, #06111d 52%, #020810 100%);
  background-size:100% 100%, 15px 15px, 15px 15px, 100% 100%;
  border:2px solid #4e5864;
  box-shadow:
    inset 0 7px 18px rgba(0,0,0,.95),
    inset 0 -3px 10px rgba(0,0,0,.7),
    inset 0 1px 0 rgba(255,255,255,.1),
    0 1px 0 rgba(255,255,255,.22),
    0 0 0 1px #0a0e13;
  display:flex; align-items:center; justify-content:center;
}
.pane::after{ /* curved glass reflections */
  content:""; position:absolute; inset:0; pointer-events:none;
  background:
    linear-gradient(115deg, rgba(255,255,255,.17) 0%, rgba(255,255,255,.03) 24%, transparent 38%),
    linear-gradient(295deg, rgba(255,255,255,.06) 0%, transparent 20%);
}
.coin{
  font-family:var(--disp); font-weight:800; font-size:clamp(22px,7vw,31px); color:var(--amber);
  text-shadow:0 0 8px rgba(255,179,0,.7), 0 0 24px rgba(255,140,0,.4), 0 2px 2px rgba(0,0,0,.8);
}
.glyph{
  font-size:clamp(26px,8vw,38px); color:#bcd6f2; filter:blur(2px); opacity:.85;
  text-shadow:0 0 14px rgba(120,180,240,.6);
}
.q{ font-family:var(--disp); font-weight:800; font-size:clamp(30px,9vw,46px); }
.q.bright{ color:#ffe2b8; text-shadow:0 0 8px rgba(255,179,0,.95), 0 0 24px rgba(255,157,46,.7); animation:qpulse 1.1s ease-in-out infinite; }
.q.dim{ color:#9cc6ff; opacity:.55; text-shadow:0 0 14px rgba(90,150,220,.6); animation:qwait 2.8s ease-in-out infinite; }
@keyframes qpulse{ 0%,100%{opacity:1;} 50%{opacity:.55;} }
@keyframes qwait{ 0%,100%{opacity:.4;} 50%{opacity:.65;} }

/* the reel being answered right now: still spinning, brighter pane,
   subtle pulse, wake-in (pane-pending is the reduced-motion variant) */
.pane-live,
.pane-pending{
  border-color:var(--amber);
  background:
    radial-gradient(130% 95% at 50% 118%, rgba(120,80,20,.28), transparent 55%),
    linear-gradient(rgba(170,200,235,.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(170,200,235,.07) 1px, transparent 1px),
    radial-gradient(150% 130% at 50% -8%, #17293c 0%, #0c1a2a 52%, #061020 100%);
  background-size:100% 100%, 15px 15px, 15px 15px, 100% 100%;
  animation:panewake .3s ease-out, panepulse 1.6s ease-in-out .3s infinite;
}
@keyframes panewake{ 0%{ filter:brightness(.7); } 100%{ filter:brightness(1); } }
@keyframes panepulse{
  0%,100%{ box-shadow:inset 0 7px 18px rgba(0,0,0,.95), 0 0 12px rgba(255,179,0,.4); }
  50%{ box-shadow:inset 0 7px 18px rgba(0,0,0,.95), 0 0 24px rgba(255,179,0,.75); }
}
/* locked results glow inside their glass */
.pane-star{ box-shadow:inset 0 7px 18px rgba(0,0,0,.95), inset 0 0 34px rgba(42,134,255,.22), 0 1px 0 rgba(255,255,255,.22); }
.pane-flat{ box-shadow:inset 0 7px 18px rgba(0,0,0,.95), inset 0 0 26px rgba(120,20,30,.16), 0 1px 0 rgba(255,255,255,.22); }

.sol{ width:72%; height:auto; }
.sol .sol-bar{ fill:var(--blue); }
.sol .sol-hub{ fill:#0d2c55; stroke:#9cc6ff; stroke-width:2.5; }
.sol .sol-rod,.sol .sol-snake{ fill:none; stroke:#dceaff; stroke-width:4; stroke-linecap:round; }
.sol.lit{ animation:ignite .45s cubic-bezier(.2,1.6,.4,1); filter:drop-shadow(0 0 10px rgba(42,134,255,1)) drop-shadow(0 0 26px rgba(255,179,0,.7)); }
.sol.lit .sol-bar{ fill:#4d9dff; }
@keyframes ignite{ 0%{ transform:scale(.25); opacity:0; } 60%{ transform:scale(1.12); opacity:1; } 100%{ transform:scale(1); } }

.flatx{ width:82%; height:auto; }
.flatx .ecg{ fill:none; stroke:#a9c4d8; stroke-width:3.4; stroke-linecap:round; stroke-linejoin:round; opacity:.8;
  stroke-dasharray:220; stroke-dashoffset:220; animation:draw .5s ease-out forwards; }
.flatx .xs{ fill:none; stroke:var(--red); stroke-width:9; stroke-linecap:round;
  stroke-dasharray:80; stroke-dashoffset:80; animation:draw .32s ease-in .3s forwards;
  filter:drop-shadow(0 0 6px rgba(225,29,46,.5)); }
@keyframes draw{ to{ stroke-dashoffset:0; } }

.flare{
  position:absolute; inset:-40px; pointer-events:none; border-radius:50%;
  background:radial-gradient(circle, rgba(255,179,0,.55) 0%, rgba(225,29,46,.28) 40%, transparent 70%);
  animation:flare 1.1s ease-out forwards;
}
@keyframes flare{ 0%{ opacity:0; transform:scale(.3);} 35%{opacity:1;} 100%{ opacity:0; transform:scale(1.5);} }

/* cowl: vents · chrome-collared mechanical action button · dome knob */
.console{ display:flex; align-items:center; gap:11px; margin-top:12px; padding:0 3px; }
.vents{
  flex:0 0 auto; width:46px; height:27px; border-radius:5px;
  background:repeating-linear-gradient(180deg, #2c343d 0 3.5px, #aeb8c2 3.5px 5px, #808b97 5px 8px);
  box-shadow:inset 0 1px 3px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.4);
}
.btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  flex:1; min-width:0; min-height:58px; padding:12px 10px; border-radius:999px; cursor:pointer;
  white-space:nowrap;
  font-family:var(--disp); font-weight:800; font-size:19px; letter-spacing:.07em;
  color:var(--white); border:0;
  transition:transform .06s ease, filter .15s ease;
}
.btn:focus-visible{ outline:3px solid #c77800; outline-offset:5px; }
.btn:disabled{ filter:grayscale(.55) brightness(.72); cursor:default; animation:none; }
.respond{
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.32), transparent 45%),
    linear-gradient(180deg, #ff5560 0%, #d5121f 44%, #96101c 78%, #6f0812 100%);
  text-shadow:0 1px 2px rgba(0,0,0,.8), 0 0 10px rgba(120,10,20,.6);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 7px 0 #55060e,
    0 13px 24px rgba(0,0,0,.65),
    inset 0 2px 1px rgba(255,255,255,.55),
    inset 0 -11px 16px rgba(0,0,0,.45);
}
.respond:not(:disabled){ animation:beckon 2.4s ease-in-out infinite; }
@keyframes beckon{
  0%,100%{ filter:drop-shadow(0 0 6px rgba(255,60,70,.25)); }
  50%{ filter:drop-shadow(0 0 16px rgba(255,60,70,.6)); }
}
.respond:active:not(:disabled){
  transform:translateY(5px);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 2px 0 #55060e,
    0 6px 12px rgba(0,0,0,.55),
    inset 0 2px 1px rgba(255,255,255,.4),
    inset 0 -6px 12px rgba(0,0,0,.5);
}
.runback{
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.5), transparent 45%),
    linear-gradient(180deg, #5ea4ff 0%, var(--blue) 44%, #145bb6 78%, #0c3a7c 100%);
  text-shadow:0 1px 1px rgba(0,0,0,.6), 0 0 14px rgba(140,190,255,.5);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 7px 0 #082f66,
    0 13px 24px rgba(0,0,0,.65),
    inset 0 2px 1px rgba(255,255,255,.55),
    inset 0 -11px 16px rgba(0,0,0,.45);
}
.runback:active{
  transform:translateY(5px);
  box-shadow:0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864, 0 2px 0 #082f66, 0 6px 12px rgba(0,0,0,.55), inset 0 2px 1px rgba(255,255,255,.4), inset 0 -6px 12px rgba(0,0,0,.5);
}
.restock{
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.6), transparent 45%),
    linear-gradient(180deg, #ffd166 0%, var(--amber) 44%, #c07f00 78%, #8a5d00 100%);
  color:#241a06; text-shadow:0 1px 0 rgba(255,255,255,.35);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 7px 0 #5f4300,
    0 13px 24px rgba(0,0,0,.65),
    inset 0 2px 1px rgba(255,255,255,.6),
    inset 0 -11px 16px rgba(0,0,0,.35);
}
.restock:active{
  transform:translateY(5px);
  box-shadow:0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864, 0 2px 0 #5f4300, 0 6px 12px rgba(0,0,0,.55), inset 0 2px 1px rgba(255,255,255,.5), inset 0 -6px 12px rgba(0,0,0,.4);
}
.dome-knob{
  flex:0 0 auto; width:38px; height:38px; border-radius:50%;
  background:
    radial-gradient(40% 32% at 32% 24%, rgba(255,255,255,.95), transparent 55%),
    radial-gradient(circle at 35% 28%, #ffb3b8, #d81525 55%, #6e0410);
  border:2px solid #67737f;
  box-shadow:0 0 12px rgba(255,60,70,.65), inset 0 -4px 6px rgba(0,0,0,.55), 0 4px 6px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.4);
}
.hood-lamps{ display:flex; align-items:center; gap:10px; margin-top:11px; }
.turn{
  flex:0 0 auto; width:34px; height:11px; border-radius:5px;
  background:
    radial-gradient(45% 40% at 30% 22%, rgba(255,255,255,.7), transparent 60%),
    radial-gradient(120% 160% at 50% 25%, #ff6b74, var(--red) 60%, #6e0410);
  border:1px solid #4e5864;
  box-shadow:inset 0 -1px 2px rgba(0,0,0,.55), 0 0 8px rgba(225,29,46,.5), 0 1px 0 rgba(255,255,255,.35);
}
.subtext{
  flex:1; text-align:center; font-size:13px; font-weight:600; color:#2b3540;
  text-shadow:0 1px 0 rgba(255,255,255,.55); min-height:18px;
}

/* ── body bay: run-sheet recessed under a chrome lip, gloss chevron rails ── */
.bay{
  margin-top:11px;
  display:grid; grid-template-columns:17px minmax(0,1fr) 17px; gap:9px; align-items:stretch;
}
.chevcol{
  border-radius:8px;
  background-color:#39424c;
  background-image:
    linear-gradient(90deg, rgba(255,255,255,.16), rgba(255,255,255,0) 55%),
    repeating-linear-gradient(45deg, transparent 0 7px, #10161d 7px 14px),
    repeating-linear-gradient(135deg, transparent 0 7px, #10161d 7px 14px);
  background-size:100% 100%, 50% 100%, 50% 100%;
  background-position:left top, left top, right top;
  background-repeat:no-repeat;
  border:1px solid #1a2129;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18), inset 0 -3px 5px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.25);
}
.chevcol.flip{
  background-image:
    linear-gradient(90deg, rgba(255,255,255,0) 45%, rgba(255,255,255,.16)),
    repeating-linear-gradient(135deg, transparent 0 7px, #10161d 7px 14px),
    repeating-linear-gradient(45deg, transparent 0 7px, #10161d 7px 14px);
  background-position:right top, right top, left top;
}
.sheet{
  position:relative;
  border-radius:13px; padding:15px 15px 11px;
  background:linear-gradient(180deg, #fdfeff 0%, #edf1f5 100%);
  border:1px solid #808b97;
  box-shadow:
    0 0 0 3px #c3ccd6, 0 0 0 4.5px #4e5864,
    0 7px 16px rgba(0,0,0,.5),
    inset 0 1px 0 #fff;
  color:var(--ink);
}
.sheet::after{ /* the paper sits recessed behind the cabinet lip */
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  box-shadow:
    inset 0 14px 22px -14px rgba(10,22,38,.55),
    inset 0 -12px 20px -16px rgba(10,22,38,.45),
    inset 3px 0 10px -8px rgba(10,22,38,.35),
    inset -3px 0 10px -8px rgba(10,22,38,.35);
}

.paytable{ max-width:330px; margin:0 auto; }
.pt-title{
  font-family:var(--disp); font-weight:800; letter-spacing:.18em; text-transform:uppercase;
  color:#b3121f; text-align:center; font-size:15px; padding-bottom:8px;
  text-shadow:0 1px 0 rgba(255,255,255,.8);
}
.pt-row{
  display:flex; justify-content:space-between; gap:12px; padding:7px 10px;
  border-top:1px solid #d3dae1; font-size:14px; color:#223140;
}
.pt-stars{ font-weight:600; }
.pt-pay.plus{ color:#9c6b00; font-family:var(--disp); font-weight:800; font-size:15px; letter-spacing:.06em; }
.pt-pay{ color:var(--ink2); }

/* question card (on the run sheet) */
.qcard{ text-align:left; }
.q-head{
  display:flex; align-items:baseline; gap:10px; padding-bottom:8px;
  border-bottom:2px solid #2b4257; margin-bottom:11px;
}
.q-title{
  font-family:var(--disp); font-weight:700; font-size:15px; letter-spacing:.07em;
  text-transform:uppercase; color:var(--ink);
}
.tagword{ font-style:normal; }
.tagword.dispatch{ color:#b3121f; }
.tagword.protocol{ color:#1766cc; }
.hy{
  margin-left:auto; flex:0 0 auto;
  font-family:var(--disp); font-weight:700; font-size:12px; letter-spacing:.14em;
  color:#67737f;
}
.prompt{
  margin:0 0 14px; font-size:16px; line-height:1.5; font-weight:500; color:var(--ink);
  overflow-wrap:break-word;
}
.reelpre{ font-weight:700; }
.opts{ display:grid; gap:9px; }
.opt{
  display:flex; align-items:center; gap:11px; width:100%; min-height:52px; padding:10px 12px;
  text-align:left; border-radius:10px; cursor:pointer;
  background:linear-gradient(180deg, #ffffff, #f1f4f8);
  border:1px solid #b3bdc7; color:var(--ink);
  font-size:15px; line-height:1.4;
  box-shadow:0 2px 3px rgba(20,32,44,.12), inset 0 1px 0 #fff;
  transition:border-color .15s ease, background .15s ease, box-shadow .15s ease;
  overflow-wrap:anywhere;
}
.opt:hover:not(:disabled){ border-color:#5f6a76; box-shadow:0 3px 6px rgba(20,32,44,.18), inset 0 1px 0 #fff; }
.opt:focus-visible{ outline:3px solid #c77800; outline-offset:2px; }
.opt:disabled{ cursor:default; opacity:.75; }
.opt .key{
  flex:0 0 auto; width:27px; height:27px; border-radius:7px;
  display:inline-flex; align-items:center; justify-content:center;
  font-family:var(--disp); font-weight:800; font-size:14px; color:#223140;
  background:linear-gradient(180deg, #f6f9fb, #d5dde4 60%, #c3ccd6);
  border:1px solid #9aa5b1;
  box-shadow:inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,.2);
  text-shadow:0 1px 0 rgba(255,255,255,.7);
}
.opt.hit{ border-color:var(--blue); background:linear-gradient(180deg, #f3f8ff, #e3efff); box-shadow:0 0 14px rgba(42,134,255,.35), inset 0 1px 0 #fff; opacity:1; }
.opt.miss{ border-color:var(--red); background:linear-gradient(180deg, #fff5f6, #fdeaec); opacity:1; }

/* result (on the run sheet) */
.result{ text-align:center; }
.banner{
  font-family:var(--disp); font-weight:800; letter-spacing:.09em; text-transform:uppercase;
  font-size:20px; line-height:1.25; padding:11px 8px; border-radius:10px;
}
.banner.s3{
  color:#fff; font-size:24px;
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.35), transparent 45%),
    linear-gradient(180deg, #ff3947, var(--red) 55%, #a30f1c);
  border:1px solid #7c0812;
  box-shadow:0 0 24px rgba(225,29,46,.45), inset 0 1px 0 rgba(255,255,255,.4);
  text-shadow:0 0 14px rgba(255,214,10,.95), 0 1px 1px rgba(0,0,0,.6);
  animation:bannerpulse .8s ease-in-out infinite;
}
@keyframes bannerpulse{ 0%,100%{ filter:brightness(1);} 50%{ filter:brightness(1.3);} }
.banner.s2{ color:#0e4a9c; font-size:20px; background:rgba(42,134,255,.14); border:1.5px solid rgba(42,134,255,.6); box-shadow:0 0 14px rgba(42,134,255,.2); }
.banner.s1{ color:#1d5ba8; font-size:18px; background:rgba(42,134,255,.07); border:1px solid rgba(42,134,255,.35); }
.banner.s0{ color:var(--ink2); font-size:17px; background:#eef2f5; border:1px solid #c6cfd8; }
.payline{
  margin-top:9px; font-family:var(--disp); font-weight:800; font-size:20px; letter-spacing:.08em;
  color:#9c6b00; text-shadow:0 1px 0 rgba(255,255,255,.7);
}
.sweep{ margin-top:8px; font-size:14px; font-weight:600; color:#9c6b00; }
.missrev{ margin-top:15px; text-align:left; }
.mr-head{
  font-family:var(--disp); font-weight:700; font-size:13px; letter-spacing:.16em;
  text-transform:uppercase; color:#b3121f; padding-bottom:8px;
  border-bottom:1px solid rgba(225,29,46,.3); margin-bottom:10px;
}
.miss{
  border:1px solid #d3dae1; border-left:3px solid var(--red);
  border-radius:8px; padding:10px 12px; margin-bottom:10px;
  background:linear-gradient(180deg, #fff, #f8fafc);
  box-shadow:0 1px 3px rgba(20,32,44,.1);
}
.m-meta{ display:flex; gap:10px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink2); font-family:var(--disp); font-weight:700; padding-bottom:6px; }
.m-q{ margin:0 0 8px; font-size:14px; line-height:1.5; color:#223140; overflow-wrap:break-word; }
.m-a{ margin:0 0 6px; font-size:14px; color:#0e4a9c; overflow-wrap:break-word; }
.m-a strong{ color:var(--ink); }
.m-exp{ margin:0; font-size:13.5px; line-height:1.55; color:var(--ink2); overflow-wrap:break-word; }

.endshift{
  display:block; margin:14px auto 4px; padding:8px 15px; min-height:40px;
  background:linear-gradient(180deg, #fff, #eef2f6);
  border:1px solid #9aa5b1; border-radius:999px;
  color:var(--ink2); font-size:13px; cursor:pointer;
  box-shadow:0 1px 2px rgba(20,32,44,.15), inset 0 1px 0 #fff;
}
.endshift:hover{ color:var(--ink); border-color:#5f6a76; }
.endshift:focus-visible{ outline:3px solid #c77800; outline-offset:2px; }

/* ── bumper & footer ── */
.bumper{
  margin-top:12px; display:flex; align-items:center; gap:10px;
  padding:8px 10px; border-radius:11px;
  background:
    linear-gradient(115deg, rgba(255,255,255,.45) 0%, transparent 38%),
    linear-gradient(180deg, #f0f5f9, #a2adb9 55%, #6c7783);
  border:1px solid #4e5864;
  box-shadow:inset 0 1px 0 #fff, inset 0 -2px 4px rgba(0,0,0,.35), 0 4px 8px rgba(0,0,0,.5);
}
.tail{
  flex:0 0 auto; width:30px; height:15px; border-radius:4px;
  background:
    radial-gradient(45% 40% at 30% 22%, rgba(255,255,255,.8), transparent 60%),
    radial-gradient(circle at 50% 30%, #ff8b93, var(--red) 60%, #7c0812);
  border:1px solid #4e5864;
  box-shadow:0 0 12px 3px rgba(225,29,46,.7), inset 0 -1px 2px rgba(0,0,0,.5);
}
.chev{
  flex:1; height:17px; border-radius:4px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.25), transparent 45%),
    repeating-linear-gradient(115deg, var(--hivis) 0 13px, var(--hivis2) 13px 26px);
  box-shadow:inset 0 1px 2px rgba(0,0,0,.45), inset 0 -1px 2px rgba(0,0,0,.3);
  border:1px solid rgba(0,0,0,.35);
}
.footer{
  margin-top:12px; border-radius:15px; padding:12px 12px 7px;
  background:
    radial-gradient(90% 80% at 50% 120%, rgba(25,70,130,.16), transparent 60%),
    linear-gradient(180deg, rgba(13,24,38,.96), rgba(3,8,14,.98));
  border:1px solid #2c3640;
  box-shadow:inset 0 2px 8px rgba(0,0,0,.85), inset 0 0 0 1px rgba(220,235,250,.05), 0 1px 0 rgba(255,255,255,.35);
  text-align:center;
}
.footer p{ margin:0 0 6px; font-size:11.5px; line-height:1.55; color:#8b9aac; }
.demo-note{ color:var(--amber) !important; }

/* ── report overlay ── */
.overlay{
  position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center;
  padding:18px; background:rgba(2,4,8,.82); backdrop-filter:blur(4px);
}
.report{
  width:100%; max-width:400px; border-radius:18px; padding:22px 18px 18px;
  background:
    radial-gradient(85% 60% at 50% 0%, rgba(30,80,150,.22), transparent 60%),
    linear-gradient(180deg, #13212f, #04090f);
  border:1px solid #39434f;
  box-shadow:
    0 0 0 3px rgba(220,235,250,.06),
    0 24px 60px rgba(0,0,0,.8),
    inset 0 1px 0 rgba(255,255,255,.12);
  text-align:center;
}
.r-title{
  margin:0 0 14px; font-family:var(--disp); font-weight:800; font-size:23px;
  letter-spacing:.2em; color:var(--amber);
  text-shadow:0 0 10px rgba(255,179,0,.6), 0 0 26px rgba(255,140,0,.3);
}
.r-grid{ display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:14px; }
.r-stat{
  border:1px solid #2c3640; border-radius:11px; padding:11px 6px;
  background:linear-gradient(180deg, rgba(18,32,48,.85), rgba(6,12,20,.9));
  box-shadow:inset 0 2px 6px rgba(0,0,0,.7), inset 0 0 18px rgba(25,70,130,.12);
}
.r-num{ display:block; font-family:var(--disp); font-weight:800; font-size:27px; color:var(--cyan); text-shadow:0 0 8px rgba(110,190,255,.7); }
.r-lab{ display:block; margin-top:2px; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#8b9aac; }
.r-line{ margin:0 0 6px; font-size:14.5px; line-height:1.5; color:#dce5ee; }
.r-always{ margin:0 0 14px; font-size:12.5px; color:#9fb0c0; }
.btn.back{
  width:100%; min-height:52px; font-size:17px;
  background:
    radial-gradient(120% 90% at 50% -12%, rgba(255,255,255,.5), transparent 45%),
    linear-gradient(180deg, #5ea4ff 0%, var(--blue) 44%, #145bb6 78%, #0c3a7c 100%);
  box-shadow:
    0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864,
    0 6px 0 #082f66, 0 11px 20px rgba(0,0,0,.6),
    inset 0 2px 1px rgba(255,255,255,.55), inset 0 -9px 14px rgba(0,0,0,.45);
  text-shadow:0 1px 1px rgba(0,0,0,.6);
}
.btn.back:active{ transform:translateY(4px); box-shadow:0 0 0 3px #dfe7ee, 0 0 0 5px #4e5864, 0 2px 0 #082f66, 0 5px 10px rgba(0,0,0,.5), inset 0 2px 1px rgba(255,255,255,.4), inset 0 -5px 10px rgba(0,0,0,.5); }
.btn.back:focus-visible{ outline-color:var(--amber); }

/* ── responsive (spec §14) ── */
@media (max-width:420px){
  .head{ grid-template-columns:minmax(60px,74px) 1fr minmax(84px,94px); gap:6px; }
  .title{ font-size:20px; }
  .title .amb{ width:32px; }
  .sub{ font-size:10px; letter-spacing:.2em; }
  .chap{ font-size:14px; letter-spacing:.18em; }
  .chap2{ font-size:11px; letter-spacing:.22em; }
  .g-value{ font-size:19px; }
  .head-l .gauge .g-value{ font-size:22px; }
  .g-coin{ width:18px; height:18px; }
  .g-label{ font-size:7.5px; letter-spacing:.1em; }
  .btn{ font-size:14px; min-height:54px; letter-spacing:.05em; padding:10px 6px; gap:6px; }
  .vents{ width:30px; }
  .dome-knob{ width:32px; height:32px; }
  .console{ gap:7px; }
  .bay{ grid-template-columns:13px minmax(0,1fr) 13px; gap:6px; }
  .cabzone{ grid-template-columns:11px minmax(0,1fr) 11px; gap:5px; }
}
@media (max-width:350px){
  .btn{ font-size:12.5px; letter-spacing:.03em; }
  .vents{ display:none; }
}

/* ── reduced motion (spec §14): calm, fully playable ── */
@media (prefers-reduced-motion: reduce){
  .mk,.led,.strip,.q.bright,.q.dim,.pane-live,.pane-pending,.banner.s3,
  .bayinset.winflash,.sol.lit,.flatx .ecg,.flatx .xs,.flare,
  .rig.code3 .frame,.marquee::before,.title,.respond{ animation:none !important; }
  .flatx .ecg,.flatx .xs{ stroke-dashoffset:0; }
  .flare,.marquee::before{ display:none; }
  .glyph{ filter:none; }
  .btn,.opt{ transition:none; }
}
`;
