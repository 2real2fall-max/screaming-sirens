import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════════════
   SCREAMING SIRENS — Paramedic Edition · Ch 47 (Pediatrics)
   Single-file React component. Built to the v2.1 design spec.
   The whole unit renders as the front of an ambulance: light bar on the
   windshield frame, three reel panes as windshield glass, grille + bumper
   RESPOND button, white run-sheet card in the body.
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
      {Array.from({ length: 5 }).map((_, i) => (
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
      {face.kind === "pending" && <span className="q bright">?</span>}
      {face.kind === "future" && <span className="q dim">?</span>}
      {face.kind === "star" && <StarOfLife lit />}
      {face.kind === "flat" && <FlatlineX />}
    </div>
  );
}

function Gauge({ label, value, hot, amber, coin }) {
  return (
    <div className={"gauge" + (hot ? " hot" : "") + (amber ? " amber" : "")}>
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
        <span className={"tag " + (q.dispatch ? "dispatch" : "protocol")}>
          {q.dispatch ? "Dispatch" : "Protocol check"}
        </span>
        <span className="cat">{cat}</span>
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

function Result({ reels, stars, payout }) {
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
          +{payout} quarter{payout === 1 ? "" : "s"}
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

  /* spin glyph ticker */
  useEffect(() => {
    if (phase !== "spinning") return;
    const iv = setInterval(() => setSpinTick((t) => t + 1), T.TICK_MS);
    return () => clearInterval(iv);
  }, [phase]);

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
      if (phase === "answering") return i === activeReel ? { kind: "pending" } : { kind: "future" };
      return { kind: "idle" };
    });
  }, [phase, reels, activeReel]);

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
        <div className="shell">
          <MarkerLights />

          {/* box-body header: lamp + quarters · marquee screen · stat stack */}
          <div className="head">
            <div className="head-l">
              <span className="corner-lamp" aria-hidden="true" />
              <Gauge label="Quarters" value={quarters} amber coin />
            </div>
            <div className="marquee">
              <h1 className="title">
                SCREAMING SIRENS <AmbulanceBadge />
              </h1>
              <div className="sub">Paramedic Edition</div>
              <div className="chap">Ch 47 — Pediatrics</div>
              <div className="plate">MEDIC 47</div>
            </div>
            <div className="head-r">
              <Gauge label="Siren heat" value={heat} hot={heat >= 3} />
              <Gauge label="Code 3s" value={code3s} />
              <Gauge label="Accuracy" value={accuracy} />
            </div>
          </div>

          {/* cab: light bar mounted on the windshield frame */}
          <LightBar rave={rave} />
          <div className={"cabface" + (flashWin ? " winflash" : "")}>
            <span className="strip left" aria-hidden="true" />
            <div className="windshields">
              {faces.map((f, i) => (
                <Pane key={i} face={f} glyph={SPIN_GLYPHS[(spinTick + i) % SPIN_GLYPHS.length]} />
              ))}
            </div>
            <span className="strip right" aria-hidden="true" />
            {rave && !reduced && <div className="flare" aria-hidden="true" />}
          </div>

          {/* hood: grille slats, bumper button, turn lamps */}
          <div className="hood">
            <div className="grille" aria-hidden="true" />
            <div className="console">
              {consoleBtn}
              <span className="dome-knob" aria-hidden="true" />
            </div>
            <div className="hood-lamps">
              <span className="turn" aria-hidden="true" />
              <div className="subtext" aria-live="polite">{subtext}</div>
              <span className="turn" aria-hidden="true" />
            </div>
          </div>

          {/* body: white run-sheet card between hi-vis chevrons */}
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
                <Result reels={reels} stars={lastStars} payout={lastPayout} />
              )}
              <button type="button" className="endshift" onClick={() => setReportOpen(true)}>
                End shift · view report
              </button>
            </div>
            <span className="chevcol" aria-hidden="true" />
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
  --ink:#16202b; --ink2:#4c5a68;
  --disp:'Saira Condensed','Arial Narrow',Impact,sans-serif;
  --body:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  min-height:100vh; min-height:100dvh;
  display:flex; justify-content:center; align-items:flex-start;
  padding:14px 10px 40px;
  background:radial-gradient(120% 90% at 50% 0%, #131a22 0%, #07090d 65%, #040609 100%);
  font-family:var(--body); color:var(--white);
  -webkit-font-smoothing:antialiased;
}
.ss-stage *,.ss-stage *::before,.ss-stage *::after{box-sizing:border-box;}
.ss-stage button{font:inherit;}

.rig{ width:100%; max-width:560px; --flash:.9s; }
.rig.heat-warm{ --flash:.62s; }
.rig.heat-blazing{ --flash:.36s; }
.rig.code3{ --flash:.16s; }

/* ── the vehicle body ── */
.shell{
  border-radius:28px; padding:10px 12px 14px;
  background:
    linear-gradient(180deg, #eef3f7 0%, #ccd5dd 22%, #a8b3bf 55%, #8d98a4 82%, #7b8692 100%);
  border:1px solid #5f6a76;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.75),
    inset 0 -3px 8px rgba(0,0,0,.35),
    inset 3px 0 6px rgba(255,255,255,.25),
    inset -3px 0 6px rgba(0,0,0,.15),
    0 18px 44px rgba(0,0,0,.7);
  transition:box-shadow .5s ease;
}
.rig.heat-warm .shell{ box-shadow: inset 0 2px 0 rgba(255,255,255,.75), inset 0 -3px 8px rgba(0,0,0,.35), 0 18px 44px rgba(0,0,0,.7), 0 0 38px rgba(255,179,0,.18); }
.rig.heat-blazing .shell{ box-shadow: inset 0 2px 0 rgba(255,255,255,.75), inset 0 -3px 8px rgba(0,0,0,.35), 0 18px 44px rgba(0,0,0,.7), 0 0 58px rgba(255,140,0,.34); }

/* amber clearance markers along the roof edge */
.markers{ display:flex; justify-content:center; gap:22px; padding:3px 0 8px; }
.mk{
  width:9px; height:9px; border-radius:50%;
  background:radial-gradient(circle at 35% 30%, #ffe9a8, var(--amber) 60%, #8a5d00);
  box-shadow:0 0 8px 2px rgba(255,179,0,.45), inset 0 -1px 1px rgba(0,0,0,.4);
  animation:breathe 2.6s ease-in-out infinite;
}
@keyframes breathe{ 0%,100%{opacity:.45; box-shadow:0 0 4px 1px rgba(255,179,0,.2);} 50%{opacity:1; box-shadow:0 0 10px 3px rgba(255,179,0,.55);} }

/* ── box-body header ── */
.head{
  display:grid; grid-template-columns:minmax(76px,92px) 1fr minmax(96px,110px);
  gap:8px; align-items:stretch; padding-bottom:10px;
}
.head-l{ display:flex; flex-direction:column; gap:8px; }
.corner-lamp{
  display:block; height:30px; border-radius:9px;
  background:radial-gradient(120% 160% at 50% 20%, #ff6b74, var(--red) 55%, #6e0410);
  border:2px solid #5f6a76;
  box-shadow:inset 0 2px 3px rgba(255,255,255,.35), inset 0 -3px 5px rgba(0,0,0,.5), 0 0 12px rgba(225,29,46,.5);
}
.head-r{ display:flex; flex-direction:column; gap:8px; }

.gauge{
  flex:1; display:flex; flex-direction:column; justify-content:center;
  border-radius:10px; padding:6px 4px;
  background:linear-gradient(180deg, #101c29, var(--navy2));
  border:1.5px solid #55606c;
  box-shadow:inset 0 2px 6px rgba(0,0,0,.85), 0 1px 0 rgba(255,255,255,.4);
  text-align:center;
}
.g-value{
  display:flex; align-items:center; justify-content:center; gap:5px;
  font-family:var(--disp); font-weight:800; font-size:21px; line-height:1;
  color:#8fc0ff; text-shadow:0 0 9px rgba(42,134,255,.65);
}
.g-label{
  display:block; margin-top:3px;
  font-family:var(--disp); font-weight:700; font-size:9px; letter-spacing:.16em;
  text-transform:uppercase; color:#93a2b2;
}
.gauge.amber .g-value{ color:var(--amber); text-shadow:0 0 9px rgba(255,179,0,.6); font-size:26px; }
.gauge.hot .g-value{ color:#ff8a00; text-shadow:0 0 11px rgba(255,120,0,.8); }
.g-coin{
  width:16px; height:16px; border-radius:50%;
  background:radial-gradient(circle at 35% 30%, #ffe9a8, #e0a400 55%, #8a5d00);
  box-shadow:inset 0 -1px 2px rgba(0,0,0,.5), 0 0 6px rgba(255,179,0,.5);
}

/* marquee screen */
.marquee{
  display:flex; flex-direction:column; justify-content:center; align-items:center; gap:3px;
  border-radius:12px; padding:10px 8px;
  background:linear-gradient(170deg, #0e1c2c 0%, var(--navy) 50%, var(--navy2) 100%);
  border:1.5px solid #55606c;
  box-shadow:inset 0 3px 9px rgba(0,0,0,.85), 0 1px 0 rgba(255,255,255,.4);
  text-align:center;
}
.title{
  margin:0; display:flex; align-items:center; justify-content:center; gap:7px;
  font-family:var(--disp); font-weight:800; font-size:clamp(19px,5.6vw,28px);
  letter-spacing:.05em; line-height:1; color:#ffe2b8;
  text-shadow:0 0 6px rgba(255,157,46,.9), 0 0 16px rgba(225,29,46,.75), 0 0 30px rgba(225,29,46,.45);
}
.title .amb{ width:38px; flex:0 0 auto; filter:drop-shadow(0 0 5px rgba(255,157,46,.55)); }
.sub{
  font-family:var(--disp); font-weight:700; font-size:12px; letter-spacing:.24em;
  text-transform:uppercase; color:#f2e7d4; text-shadow:0 0 8px rgba(255,226,184,.5);
}
.chap{
  font-family:var(--disp); font-weight:700; font-size:12px; letter-spacing:.2em;
  text-transform:uppercase; color:var(--amber); text-shadow:0 0 8px rgba(255,179,0,.55);
}
.plate{
  margin-top:4px; font-family:var(--disp); font-weight:800; font-size:11px; letter-spacing:.12em;
  color:#1c232b; padding:2px 9px; border-radius:5px;
  background:linear-gradient(180deg, var(--chrome1), #aeb8c2 60%, var(--chrome2));
  border:1px solid #525d68; box-shadow:inset 0 1px 0 #fff, 0 1px 3px rgba(0,0,0,.6);
}

/* ── emergency light bar, mounted on the windshield frame ── */
.lightbar{ position:relative; z-index:2; padding:0 26px; margin-bottom:-5px; }
.lb-shell{
  display:flex; align-items:center; justify-content:center; gap:8px;
  padding:5px 10px; border-radius:9px;
  background:linear-gradient(180deg, #3a434d 0%, #1d242c 60%, #12181f 100%);
  border:1px solid #10151b;
  box-shadow:0 3px 8px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.14);
}
.lb-cluster{ display:flex; gap:3px; }
.led{ width:9px; height:15px; border-radius:2.5px; }
.lb-cluster.red .led{
  background:radial-gradient(circle at 50% 25%, #ff9aa0, var(--red) 55%, #7c0812);
  color:var(--red); animation:lbflash var(--flash) linear infinite;
}
.lb-cluster.blue .led{
  background:radial-gradient(circle at 50% 25%, #a5cbff, var(--blue) 55%, #0c3f85);
  color:var(--blue); animation:lbflash var(--flash) linear infinite;
  animation-delay:calc(var(--flash) / -2);
}
@keyframes lbflash{
  0%,42%{ opacity:1; filter:brightness(1.6) drop-shadow(0 0 7px currentColor); }
  50%,92%{ opacity:.25; filter:none; }
  100%{ opacity:1; }
}
.lb-center{
  width:34px; height:17px; border-radius:4px;
  background:linear-gradient(180deg, var(--chrome1), #98a3ae 70%, var(--chrome2));
  box-shadow:inset 0 1px 0 #fff, inset 0 -2px 3px rgba(0,0,0,.4);
}
.lightbar.rave .led{ filter:saturate(1.5); }

/* ── cab face: windshield panes between glowing pillar strips ── */
.cabface{
  position:relative; overflow:hidden; z-index:1;
  display:grid; grid-template-columns:14px 1fr 14px; gap:9px;
  border-radius:18px; padding:12px 10px 12px;
  background:linear-gradient(180deg, #4a5561 0%, #333c46 55%, #262e37 100%);
  border:2px solid #78838f;
  box-shadow:inset 0 2px 4px rgba(255,255,255,.15), inset 0 -4px 9px rgba(0,0,0,.55), 0 5px 12px rgba(0,0,0,.45);
}
.cabface.winflash{ animation:winflash ${T.FLASH_MS}ms ease-out; }
@keyframes winflash{
  0%{ box-shadow:inset 0 2px 4px rgba(255,255,255,.15), 0 0 0 rgba(255,179,0,0); }
  30%{ box-shadow:inset 0 2px 4px rgba(255,255,255,.15), 0 0 32px 7px rgba(255,179,0,.85); }
  100%{ box-shadow:inset 0 2px 4px rgba(255,255,255,.15), 0 0 0 rgba(255,179,0,0); }
}
.strip{
  border-radius:8px; align-self:stretch;
  background:repeating-linear-gradient(180deg, currentColor 0 9px, #0b1420 9px 15px);
  animation:strobe var(--flash) linear infinite;
}
.strip.left{ color:var(--blue); box-shadow:0 0 12px rgba(42,134,255,.55), inset 0 0 3px rgba(0,0,0,.6); }
.strip.right{ color:var(--red); box-shadow:0 0 12px rgba(225,29,46,.6), inset 0 0 3px rgba(0,0,0,.6);
  animation-delay:calc(var(--flash) / -2); }
@keyframes strobe{ 0%,45%{ opacity:1; } 50%,95%{ opacity:.4; } 100%{ opacity:1; } }

.windshields{ display:grid; grid-template-columns:repeat(3,1fr); gap:9px; }
.pane{
  position:relative; aspect-ratio:10/11; border-radius:12px 12px 9px 9px; overflow:hidden;
  background:linear-gradient(165deg, #10202f 0%, var(--navy) 45%, var(--navy2) 100%);
  border:2px solid #6b7682;
  box-shadow:inset 0 5px 13px rgba(0,0,0,.9), inset 0 0 0 1px rgba(130,160,190,.2);
  display:flex; align-items:center; justify-content:center;
}
.pane::after{ /* windshield glass streak */
  content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(115deg, rgba(255,255,255,.13) 0%, rgba(255,255,255,.03) 28%, transparent 45%);
}
.coin{
  font-family:var(--disp); font-weight:800; font-size:clamp(22px,7vw,30px); color:var(--amber);
  text-shadow:0 0 10px rgba(255,179,0,.45);
}
.glyph{
  font-size:clamp(26px,8vw,38px); color:#bcd6f2; filter:blur(2px); opacity:.85;
}
.q{ font-family:var(--disp); font-weight:800; font-size:clamp(30px,9vw,44px); }
.q.bright{ color:#ffe2b8; text-shadow:0 0 8px rgba(255,179,0,.9), 0 0 20px rgba(255,157,46,.6); animation:qpulse 1.1s ease-in-out infinite; }
.q.dim{ color:var(--white); opacity:.22; }
@keyframes qpulse{ 0%,100%{opacity:1;} 50%{opacity:.55;} }

.sol{ width:72%; height:auto; }
.sol .sol-bar{ fill:var(--blue); }
.sol .sol-hub{ fill:#0d2c55; stroke:#9cc6ff; stroke-width:2.5; }
.sol .sol-rod,.sol .sol-snake{ fill:none; stroke:#dceaff; stroke-width:4; stroke-linecap:round; }
.sol.lit{ animation:ignite .45s cubic-bezier(.2,1.6,.4,1); filter:drop-shadow(0 0 9px rgba(42,134,255,.9)) drop-shadow(0 0 20px rgba(255,179,0,.65)); }
.sol.lit .sol-bar{ fill:#4d9dff; }
@keyframes ignite{ 0%{ transform:scale(.25); opacity:0; } 60%{ transform:scale(1.12); opacity:1; } 100%{ transform:scale(1); } }

.flatx{ width:82%; height:auto; }
.flatx .ecg{ fill:none; stroke:#a9c4d8; stroke-width:3.4; stroke-linecap:round; stroke-linejoin:round; opacity:.8;
  stroke-dasharray:220; stroke-dashoffset:220; animation:draw .5s ease-out forwards; }
.flatx .xs{ fill:none; stroke:var(--red); stroke-width:9; stroke-linecap:round;
  stroke-dasharray:80; stroke-dashoffset:80; animation:draw .32s ease-in .3s forwards; }
@keyframes draw{ to{ stroke-dashoffset:0; } }

.flare{
  position:absolute; inset:-40px; pointer-events:none; border-radius:50%;
  background:radial-gradient(circle, rgba(255,179,0,.5) 0%, rgba(225,29,46,.25) 40%, transparent 70%);
  animation:flare 1.1s ease-out forwards;
}
@keyframes flare{ 0%{ opacity:0; transform:scale(.3);} 35%{opacity:1;} 100%{ opacity:0; transform:scale(1.5);} }

/* ── hood: grille, bumper button, turn lamps ── */
.hood{
  margin-top:10px; border-radius:14px; padding:9px 12px 8px;
  background:linear-gradient(180deg, #f0f4f8 0%, #cfd8e0 40%, #a3aeba 100%);
  border:1px solid #78838f;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.8), inset 0 -3px 6px rgba(0,0,0,.25), 0 3px 8px rgba(0,0,0,.35);
}
.grille{
  width:min(72%,300px); height:20px; margin:0 auto 10px; border-radius:6px;
  background:repeating-linear-gradient(180deg, #39424c 0 3.5px, #b9c3cc 3.5px 8px);
  box-shadow:inset 0 1px 3px rgba(0,0,0,.5);
}
.console{ display:flex; align-items:center; gap:10px; }
.btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  flex:1; min-height:58px; padding:12px 18px; border-radius:16px; cursor:pointer;
  font-family:var(--disp); font-weight:800; font-size:20px; letter-spacing:.08em;
  color:var(--white); border:2px solid #8e99a5;
  box-shadow:0 5px 0 rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.4), inset 0 -6px 10px rgba(0,0,0,.3);
  transition:transform .06s ease, filter .15s ease;
}
.btn:active:not(:disabled){ transform:translateY(3px); box-shadow:0 2px 0 rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.3); }
.btn:focus-visible{ outline:3px solid #c77800; outline-offset:3px; }
.btn:disabled{ filter:grayscale(.55) brightness(.75); cursor:default; }
.respond{ background:linear-gradient(180deg, #ff5a63 0%, var(--red) 45%, #8e0d1a 100%); text-shadow:0 1px 2px rgba(0,0,0,.6); }
.runback{ background:linear-gradient(180deg, #5ea4ff 0%, var(--blue) 45%, #0e4a9c 100%); text-shadow:0 1px 2px rgba(0,0,0,.6); }
.restock{ background:linear-gradient(180deg, #ffd166 0%, var(--amber) 45%, #9c6b00 100%); color:#20180a; }
.dome-knob{
  flex:0 0 auto; width:36px; height:36px; border-radius:50%;
  background:radial-gradient(circle at 35% 28%, #ffb3b8, #d81525 55%, #6e0410);
  border:2px solid #8e99a5;
  box-shadow:0 0 10px rgba(255,60,70,.6), inset 0 -3px 4px rgba(0,0,0,.5), 0 3px 4px rgba(0,0,0,.35);
}
.hood-lamps{ display:flex; align-items:center; gap:10px; margin-top:9px; }
.turn{
  flex:0 0 auto; width:34px; height:11px; border-radius:5px;
  background:radial-gradient(120% 160% at 50% 25%, #ff6b74, var(--red) 60%, #6e0410);
  border:1px solid #5f6a76;
  box-shadow:inset 0 -1px 2px rgba(0,0,0,.5), 0 0 7px rgba(225,29,46,.45);
}
.subtext{ flex:1; text-align:center; font-size:13px; font-weight:600; color:#33404c; min-height:18px; }

/* ── body bay: white run-sheet between chevron rails ── */
.bay{
  margin-top:10px;
  display:grid; grid-template-columns:16px 1fr 16px; gap:9px; align-items:stretch;
}
.chevcol{
  border-radius:6px;
  background:repeating-linear-gradient(45deg, var(--hivis) 0 11px, var(--hivis2) 11px 22px);
  box-shadow:inset 0 1px 3px rgba(0,0,0,.35);
}
.sheet{
  border-radius:14px; padding:14px 14px 10px;
  background:linear-gradient(180deg, #ffffff 0%, #f2f5f8 100%);
  border:1px solid #aeb8c2;
  box-shadow:inset 0 1px 0 #fff, inset 0 -2px 5px rgba(0,0,0,.06), 0 3px 9px rgba(0,0,0,.35);
  color:var(--ink);
}

.paytable{ max-width:330px; margin:0 auto; }
.pt-title{
  font-family:var(--disp); font-weight:800; letter-spacing:.16em; text-transform:uppercase;
  color:#b3121f; text-align:center; font-size:14px; padding-bottom:8px;
}
.pt-row{
  display:flex; justify-content:space-between; gap:12px; padding:6px 10px;
  border-top:1px solid #d7dee5; font-size:14px; color:#223140;
}
.pt-stars{ font-weight:600; }
.pt-pay.plus{ color:#9c6b00; font-family:var(--disp); font-weight:800; letter-spacing:.06em; }
.pt-pay{ color:var(--ink2); }

/* question card (on the run sheet) */
.qcard{ text-align:left; }
.q-head{ display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding-bottom:10px; border-bottom:2px solid #223140; margin-bottom:10px; }
.tag{
  font-family:var(--disp); font-weight:700; font-size:11px; letter-spacing:.14em;
  text-transform:uppercase; padding:3px 9px; border-radius:999px; color:#fff;
}
.tag.dispatch{ background:var(--red); }
.tag.protocol{ background:#1766cc; }
.cat{ font-family:var(--disp); font-weight:700; font-size:13px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink); }
.hy{ margin-left:auto; font-family:var(--disp); font-weight:700; font-size:11px; letter-spacing:.14em; color:#9c6b00; }
.prompt{
  margin:0 0 14px; font-size:16px; line-height:1.5; font-weight:500; color:var(--ink);
  overflow-wrap:break-word;
}
.reelpre{ font-weight:700; }
.opts{ display:grid; gap:8px; }
.opt{
  display:flex; align-items:center; gap:11px; width:100%; min-height:52px; padding:10px 12px;
  text-align:left; border-radius:9px; cursor:pointer;
  background:#fff; border:1.5px solid #c6cfd8; color:var(--ink);
  font-size:15px; line-height:1.4; transition:border-color .15s ease, background .15s ease;
  overflow-wrap:anywhere;
}
.opt:hover:not(:disabled){ border-color:#9c6b00; background:#fdf8ef; }
.opt:focus-visible{ outline:3px solid #c77800; outline-offset:2px; }
.opt:disabled{ cursor:default; opacity:.75; }
.opt .key{
  flex:0 0 auto; width:26px; height:26px; border-radius:6px;
  display:inline-flex; align-items:center; justify-content:center;
  font-family:var(--disp); font-weight:800; font-size:14px; color:#20180a;
  background:linear-gradient(180deg, #ffd166, var(--amber)); box-shadow:0 1px 2px rgba(0,0,0,.35);
}
.opt.hit{ border-color:var(--blue); background:rgba(42,134,255,.1); box-shadow:0 0 12px rgba(42,134,255,.3); opacity:1; }
.opt.miss{ border-color:var(--red); background:rgba(225,29,46,.07); opacity:1; }

/* result (on the run sheet) */
.result{ text-align:center; }
.banner{
  font-family:var(--disp); font-weight:800; letter-spacing:.09em; text-transform:uppercase;
  font-size:20px; line-height:1.25; padding:10px 8px; border-radius:10px;
}
.banner.s3{
  color:#fff; font-size:23px;
  background:linear-gradient(180deg, #ff3947, var(--red) 55%, #a30f1c);
  border:1px solid #8e0d1a;
  text-shadow:0 0 12px rgba(255,214,10,.9);
  animation:bannerpulse .8s ease-in-out infinite;
}
@keyframes bannerpulse{ 0%,100%{ filter:brightness(1);} 50%{ filter:brightness(1.3);} }
.banner.s2{ color:#0e4a9c; background:rgba(42,134,255,.12); border:1px solid rgba(42,134,255,.55); }
.banner.s1{ color:#0e4a9c; background:rgba(42,134,255,.08); border:1px solid rgba(42,134,255,.4); }
.banner.s0{ color:var(--ink2); background:#eef2f5; border:1px solid #c6cfd8; }
.payline{
  margin-top:9px; font-family:var(--disp); font-weight:800; font-size:19px; letter-spacing:.08em;
  color:#9c6b00;
}
.sweep{ margin-top:8px; font-size:14px; font-weight:600; color:#9c6b00; }
.missrev{ margin-top:15px; text-align:left; }
.mr-head{
  font-family:var(--disp); font-weight:700; font-size:13px; letter-spacing:.16em;
  text-transform:uppercase; color:#b3121f; padding-bottom:8px;
  border-bottom:1px solid rgba(225,29,46,.3); margin-bottom:10px;
}
.miss{
  border:1px solid #d7dee5; border-left:3px solid var(--red);
  border-radius:8px; padding:10px 12px; margin-bottom:10px; background:#fff;
}
.m-meta{ display:flex; gap:10px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink2); font-family:var(--disp); font-weight:700; padding-bottom:6px; }
.m-q{ margin:0 0 8px; font-size:14px; line-height:1.5; color:#223140; overflow-wrap:break-word; }
.m-a{ margin:0 0 6px; font-size:14px; color:#0e4a9c; overflow-wrap:break-word; }
.m-a strong{ color:var(--ink); }
.m-exp{ margin:0; font-size:13.5px; line-height:1.55; color:var(--ink2); overflow-wrap:break-word; }

.endshift{
  display:block; margin:14px auto 4px; padding:8px 14px; min-height:40px;
  background:none; border:1px solid #aeb8c2; border-radius:999px;
  color:var(--ink2); font-size:13px; cursor:pointer;
}
.endshift:hover{ color:var(--ink); border-color:#67737f; }
.endshift:focus-visible{ outline:3px solid #c77800; outline-offset:2px; }

/* ── bumper & footer ── */
.bumper{
  margin-top:12px; display:flex; align-items:center; gap:10px;
  padding:7px 9px; border-radius:10px;
  background:linear-gradient(180deg, var(--chrome1), #a7b1bb 55%, var(--chrome2));
  border:1px solid #78838f;
  box-shadow:inset 0 1px 0 #fff, 0 3px 6px rgba(0,0,0,.45);
}
.tail{
  flex:0 0 auto; width:30px; height:14px; border-radius:4px;
  background:radial-gradient(circle at 50% 30%, #ff8b93, var(--red) 60%, #7c0812);
  box-shadow:0 0 10px 2px rgba(225,29,46,.65);
}
.chev{
  flex:1; height:16px; border-radius:3px;
  background:repeating-linear-gradient(115deg, var(--hivis) 0 13px, var(--hivis2) 13px 26px);
  box-shadow:inset 0 1px 2px rgba(0,0,0,.4);
}
.footer{
  margin-top:12px; border-radius:12px; padding:11px 12px 6px;
  background:linear-gradient(180deg, #101c29, var(--navy2));
  border:1.5px solid #55606c;
  box-shadow:inset 0 2px 6px rgba(0,0,0,.8);
  text-align:center;
}
.footer p{ margin:0 0 6px; font-size:11.5px; line-height:1.55; color:#93a2b2; }
.demo-note{ color:var(--amber) !important; }

/* ── report overlay ── */
.overlay{
  position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center;
  padding:18px; background:rgba(3,6,10,.78); backdrop-filter:blur(3px);
}
.report{
  width:100%; max-width:400px; border-radius:16px; padding:20px 18px 18px;
  background:linear-gradient(180deg, #14212f, var(--navy2));
  border:1px solid rgba(130,160,190,.35);
  box-shadow:0 18px 50px rgba(0,0,0,.7);
  text-align:center;
}
.r-title{
  margin:0 0 14px; font-family:var(--disp); font-weight:800; font-size:22px;
  letter-spacing:.18em; color:var(--amber);
}
.r-grid{ display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:14px; }
.r-stat{
  border:1px solid rgba(130,160,190,.25); border-radius:10px; padding:10px 6px;
  background:rgba(16,28,40,.7);
}
.r-num{ display:block; font-family:var(--disp); font-weight:800; font-size:26px; color:var(--white); }
.r-lab{ display:block; margin-top:2px; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#8fa0b2; }
.r-line{ margin:0 0 6px; font-size:14.5px; line-height:1.5; color:#dce5ee; }
.r-always{ margin:0 0 14px; font-size:12.5px; color:#9fb0c0; }
.btn.back{ background:linear-gradient(180deg, #5ea4ff 0%, var(--blue) 45%, #0e4a9c 100%); min-height:52px; font-size:17px; width:100%; }
.btn.back:focus-visible{ outline-color:var(--amber); }

/* ── responsive (spec §14) ── */
@media (max-width:420px){
  .head{ grid-template-columns:minmax(64px,78px) 1fr minmax(84px,94px); gap:6px; }
  .title{ font-size:18px; }
  .title .amb{ width:30px; }
  .sub{ font-size:9.5px; letter-spacing:.18em; }
  .chap{ font-size:10px; }
  .g-value{ font-size:17px; }
  .gauge.amber .g-value{ font-size:21px; }
  .g-label{ font-size:7.5px; letter-spacing:.1em; }
  .btn{ font-size:16px; min-height:54px; }
  .bay{ grid-template-columns:12px 1fr 12px; gap:7px; }
  .lightbar{ padding:0 14px; }
}

/* ── reduced motion (spec §14): calm, fully playable ── */
@media (prefers-reduced-motion: reduce){
  .mk,.led,.strip,.q.bright,.banner.s3,.cabface.winflash,.sol.lit,
  .flatx .ecg,.flatx .xs,.flare{ animation:none !important; }
  .flatx .ecg,.flatx .xs{ stroke-dashoffset:0; }
  .flare{ display:none; }
  .glyph{ filter:none; }
  .btn,.opt{ transition:none; }
}
`;
