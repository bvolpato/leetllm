// Scene 20: earned-transfer: "Which zero is an observation?" (Grand Finale)
// Dual-stream luminous monitor comparing Run A (length 3, genuine zero observation)
// vs Run B (length 2, padded zero/0.9 filler) across an amber h = 0.50 alert threshold.
// Strictly withholds both prediction outcomes until their exact reveal cues.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_CHANGED,
  FRESH_EVENTS,
  FRESH_LONG,
  FRESH_PREFIX,
  FRESH_WRONG,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function earnedTransfer(s, c) {
  const title = heroTitle(['Which zero is', 'an observation?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const threshold = 0.5;
  const xs = [-400, 20, 440];
  const yBaseA = 15;
  const yTopA = -195;
  const yBaseB = 300;
  const yTopB = 90;

  const ptA = (t, h) => [xs[t], yBaseA - h * (yBaseA - yTopA)];
  const ptB = (t, h) => [xs[t], yBaseB - h * (yBaseB - yTopB)];

  // Animated progress & discrete state flags
  const stepA = s.value(0); // 0 -> 1 -> 2 -> 3
  const stepB = s.value(0); // 0 -> 1 -> 2
  const showSlot3 = s.value(0);
  const showQ1 = s.value(0);
  const showReads = s.value(0); // 1 = valid read rings on A(slot3) & B(slot2)
  const showVerdicts = s.value(0); // 1 = valid verdicts shown
  // bMode: 0 = valid, 1 = detached zero ghost, 2 = detached zero CLEAR verdict, 3 = filler 0.9 changed, 4 = 0.9 ghost FLAG verdict, 5 = verified back to valid
  const bMode = s.value(0);
  const showAlone = s.value(0);
  const fillerIsZero = s.value(1); // 1 = 0.0 padding, 0 = 0.9 padding
  const showMatch = s.value(0);

  function drawStreamTrace(ptFn, values, stepVal, color) {
    const cur = stepVal.value;
    if (cur < 0.05) return [];
    const nodes = [];
    const whole = Math.min(3, Math.floor(cur));
    const frac = cur - whole;
    const pts = [];
    for (let k = 1; k <= whole; k++) pts.push(ptFn(k - 1, values[k]));
    if (whole >= 1 && whole < 3 && frac > 0.01) {
      const a = ptFn(whole - 1, values[whole]);
      const b = ptFn(whole, values[whole + 1]);
      pts.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
    }
    if (pts.length >= 2) {
      nodes.push(glowingTrail(pts, { color, width: 5.5, glow: 11 }));
    }
    for (let k = 1; k <= whole; k++) {
      const p = ptFn(k - 1, values[k]);
      nodes.push(glowDot(p[0], p[1], { radius: 8.5, color, glow: 12 }));
      const offX = k === 1 ? -76 : k === 2 ? 0 : 76;
      const offY = k === 2 ? -48 : 0;
      nodes.push(txt(fmt(values[k], 3), p[0] + offX, p[1] + offY, 30, color, 'mono', 'center'));
    }
    return nodes;
  }

  function verdictBadge(x, y, isFlag, color) {
    return [
      lumBar(x, y, 168, 60, { color, fillOpacity: 0.3, glow: 10 }),
      txt(isFlag ? 'FLAG' : 'CLEAR', x, y, 32, color, 'mono', 'center').glow(6, color),
    ];
  }

  const staticChrome = [
    txt(
      'hₜ = tanh(0.8 xₜ + 0.5 hₜ₋₁)    |    Flag if h ≥ 0.50',
      380,
      -395,
      30,
      ROLE.amber,
      'mono',
      'center',
    ),
    // Run A meta + threshold
    txt('Run A', -790, -110, 34, ROLE.state, 'serif', 'left'),
    txt('length 3', -790, -68, 28, ROLE.gold, 'mono', 'left'),
    line([-555, ptA(0, threshold)[1]], [575, ptA(0, threshold)[1]], {
      stroke: ROLE.amber,
      width: 2.2,
      dash: [10, 8],
    }),
    txt('0.50', -572, ptA(0, threshold)[1], 26, ROLE.amber, 'mono', 'right'),
    // Run B meta + threshold
    txt('Run B', -790, 175, 34, ROLE.state, 'serif', 'left'),
    txt('length 2', -790, 217, 28, ROLE.gold, 'mono', 'left'),
    line([-555, ptB(0, threshold)[1]], [575, ptB(0, threshold)[1]], {
      stroke: ROLE.amber,
      width: 2.2,
      dash: [10, 8],
    }),
    txt('0.50', -572, ptB(0, threshold)[1], 26, ROLE.amber, 'mono', 'right'),
    // Shared real event tokens (slots 1 and 2)
    ...FRESH_EVENTS.slice(0, 2).flatMap((v, i) => [
      tokenPill(`x = ${v.toFixed(1)}`, xs[i], -252, ROLE.input, {
        w: 170,
        h: 46,
        size: 26,
        font: 'mono',
      }),
      tokenPill(`x = ${v.toFixed(1)}`, xs[i], 38, ROLE.input, {
        w: 170,
        h: 46,
        size: 26,
        font: 'mono',
      }),
    ]),
  ];

  const liveLayer = guardedDynamic(
    () => 1,
    () => {
      const bm = Math.round(bMode.value);
      const nodes = [];

      // Slot 3 tokens
      if (showSlot3.value > 0.02) {
        const sA = showSlot3.value;
        nodes.push(
          tokenPill('0.0 measured', xs[2], -252, ROLE.input, {
            w: 224,
            h: 46,
            size: 26,
            font: 'mono',
            opacity: sA,
          }),
        );
        const padLbl = fillerIsZero.value > 0.5 ? '0.0 padding' : '0.9 padding';
        const padCol = fillerIsZero.value > 0.5 ? COSMOS.dim : ROLE.warn;
        nodes.push(
          tokenPill(padLbl, xs[2], 38, padCol, {
            w: 224,
            h: 46,
            size: 26,
            font: 'mono',
            dash: [8, 6],
            opacity: sA,
          }),
        );
      }

      // Main cyan trajectories for A and B
      nodes.push(
        ...drawStreamTrace(ptA, FRESH_LONG, stepA, ROLE.state),
        ...drawStreamTrace(ptB, FRESH_PREFIX, stepB, ROLE.state),
      );

      // Valid read ring + verdict for Run A (always remains intact once revealed)
      if (showReads.value > 0.5) {
        const pA = ptA(2, FRESH_LONG.at(-1));
        nodes.push(glowRing(pA[0], pA[1], 19, ROLE.gold, { width: 3.4, glow: 11 }));
      }
      if (showVerdicts.value > 0.5) {
        nodes.push(...verdictBadge(740, -90, false, ROLE.state));
      }

      // Run B read ring / ghost drift / verdict depending on bMode
      if (bm === 0 || bm === 5) {
        if (showReads.value > 0.5) {
          const pB = ptB(1, FRESH_PREFIX.at(-1));
          nodes.push(glowRing(pB[0], pB[1], 19, ROLE.gold, { width: 3.4, glow: 11 }));
        }
        if (showVerdicts.value > 0.5) {
          nodes.push(...verdictBadge(740, 195, true, ROLE.cell));
        }
      } else if (bm === 1 || bm === 2) {
        // Unmasked zero padding drift on B
        const start = ptB(1, FRESH_PREFIX.at(-1));
        const end = ptB(2, FRESH_LONG.at(-1));
        nodes.push(
          line(start, end, { stroke: ROLE.warn, width: 4, dash: [10, 8] }).glow(8, ROLE.warn),
          glowDot(end[0], end[1], { radius: 8.5, color: ROLE.warn, glow: 12 }),
          txt(fmt(FRESH_LONG.at(-1), 3), end[0] + 76, end[1], 30, ROLE.warn, 'mono', 'center'),
        );
        if (bm === 2) {
          nodes.push(...verdictBadge(740, 195, false, ROLE.warn));
        }
      } else if (bm === 4) {
        // Unmasked 0.9 filler drift on B
        const start = ptB(1, FRESH_PREFIX.at(-1));
        const end = ptB(2, FRESH_WRONG.at(-1));
        nodes.push(
          line(start, end, { stroke: ROLE.warn, width: 4, dash: [10, 8] }).glow(8, ROLE.warn),
          glowDot(end[0], end[1], { radius: 8.5, color: ROLE.warn, glow: 12 }),
          txt(fmt(FRESH_WRONG.at(-1), 3), end[0] + 76, end[1], 30, ROLE.warn, 'mono', 'center'),
        );
        nodes.push(...verdictBadge(740, 195, true, ROLE.warn));
      }

      // Footer prompt / verification readout (strictly mutually exclusive)
      if (showQ1.value > 0.02 && showVerdicts.value < 0.5) {
        nodes.push(
          txt(
            'Do you flag A, B, both, or neither?',
            0,
            385,
            36,
            ROLE.gold,
            'serif',
            'center',
          ).opacity(showQ1.value),
        );
      } else if (bm >= 1 && bm <= 4) {
        nodes.push(
          txt(
            bm === 4
              ? 'Filler changed B from CLEAR to FLAG! Which state should be read?'
              : 'Running B across padding corrupts the classifier decision',
            0,
            385,
            32,
            bm === 4 ? ROLE.gold : ROLE.warn,
            'serif',
            'center',
          ),
        );
      } else if (bm === 5) {
        if (showAlone.value > 0.02) {
          nodes.push(
            txt(
              `B alone = ${fmt(FRESH_PREFIX.at(-1), 3)}`,
              -510,
              385,
              32,
              ROLE.cell,
              'mono',
              'center',
            ).opacity(showAlone.value),
          );
        }
        if (showMatch.value > 0.02) {
          nodes.push(
            txt(
              `B in batch (packed) = ${fmt(FRESH_PREFIX.at(-1), 3)}  (invariant!)`,
              275,
              385,
              30,
              ROLE.gold,
              'mono',
              'center',
            )
              .glow(8, ROLE.gold)
              .opacity(showMatch.value),
          );
        }
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.state), title, ...staticChrome, liveLayer);

  playCue(
    s,
    c,
    'fresh-first',
    (d) => s.play(stepA.to(1, { duration: d }), stepB.to(1, { duration: d })),
    { dur: 0.45 },
  );
  playCue(
    s,
    c,
    'fresh-second',
    (d) => s.play(stepA.to(2, { duration: d }), stepB.to(2, { duration: d })),
    { dur: 0.55 },
  );
  playCue(s, c, 'fresh-zero', (d) => s.play(showSlot3.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'fresh-question', (d) => s.play(showQ1.to(1, { duration: d })), { dur: 0.4 });

  playCue(s, c, 'fresh-real', (d) => s.play(stepA.to(3, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'fresh-read', () => showReads.set(1), { dur: 0.25 });
  playCue(
    s,
    c,
    'fresh-decision',
    () => {
      showQ1.set(0);
      showVerdicts.set(1);
    },
    { after: true, dur: 0.25 },
  );

  playCue(s, c, 'fresh-detach', () => bMode.set(1), { dur: 0.25 });
  playCue(s, c, 'fresh-clear', () => bMode.set(2), { after: true, dur: 0.25 });
  playCue(
    s,
    c,
    'fresh-substitute',
    () => {
      fillerIsZero.set(0);
      bMode.set(3);
    },
    { dur: 0.25 },
  );
  playCue(s, c, 'fresh-junk-result', () => bMode.set(4), { after: true, dur: 0.25 });

  playCue(s, c, 'fresh-verify', () => bMode.set(5), { dur: 0.25 });
  playCue(s, c, 'fresh-alone', (d) => s.play(showAlone.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'fresh-recheck', () => fillerIsZero.set(1), { dur: 0.25 });
  playCue(s, c, 'fresh-match', (d) => s.play(showMatch.to(1, { duration: d })), { dur: 0.45 });

  void FRESH_CHANGED;
}
