// Act 3 (Scenes 13-18): July/August Threshold Selection, Selective Labels Bounds,
// Manual-Level Document Splits, 5-Gram Contamination Screen, Counterfactual Positivity, and Source Transfer Finale.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  beatTo,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  rule,
  test,
  txt,
  validation,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 13. selection: One threshold for August
// Cues: july-low, july-middle, july-high
// ---------------------------------------------------------------------------
export function selection(s, c) {
  const jLowP = s.value(0);
  const jMidP = s.value(0);
  const jHiP = s.value(0);
  const augP = s.value(0);
  const augOpenP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.valid, seed: 13 }));
  s.add(decorAura(0, 30, 560, '#ffd1661c', '#a78bfa14'));

  const headline = heroTitle(['Freeze the Threshold', 'Before August Arrives'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.valid,
    eyebrow: 'JULY SELECTION (F1 = 1.00)  →  AUGUST TEST (F1 = 2/3)',
  });

  const live = dynamic(() => {
    const jl = jLowP.value;
    const jm = jMidP.value;
    const jh = jHiP.value;
    const ag = augP.value;
    const ao = augOpenP.value;
    const isAug = ag > 0.3;
    const cut = isAug ? 0.5 : jh > 0.2 ? 0.7 : jm > 0.2 ? 0.5 : 0.3;
    const rows = isAug ? test : validation;
    const rx0 = -740;
    const rx1 = 740;
    const ry = -25;
    const xOf = (p) => mix(rx0, rx1, p);
    const nodes = [];

    nodes.push(
      txt(
        isAug
          ? 'AUGUST FROZEN TEST (CUT = 0.50)'
          : `JULY VALIDATION (TESTING CUT = ${cut.toFixed(1)})`,
        rx0,
        -195,
        30,
        isAug ? ROLE.test : ROLE.valid,
        'mono',
        'left',
      ),
      line([rx0, ry], [rx1, ry], { stroke: '#455a88', width: 3.5 }),
      line([xOf(cut), ry - 90], [xOf(cut), ry + 90], { stroke: ROLE.valid, width: 4 }).glow(
        10,
        ROLE.valid,
      ),
      txt(`cut ${cut.toFixed(2)}`, xOf(cut), ry - 118, 28, ROLE.valid, 'mono'),
    );

    rows.forEach((r, i) => {
      const flagged = r.p >= cut;
      const showLabel = !isAug || ao > 0.2;
      const col = showLabel ? (r.y ? ROLE.leak : ROLE.train) : COSMOS.muted;
      const px = xOf(r.p);
      const nearCut = Math.abs(r.p - cut) < 0.04;
      const lx = nearCut ? (r.p < cut ? px - 18 : px + 18) : px;
      const anchor = nearCut ? (r.p < cut ? 'right' : 'left') : 'center';
      const ly = ry + 62 + (i % 3) * 44;
      nodes.push(
        glowDot(px, ry, { radius: 13, color: flagged ? ROLE.valid : col, glow: flagged ? 12 : 6 }),
        txt(r.p.toFixed(2), lx, ly, 26, col, 'mono', anchor),
      );
    });

    const summary = isAug
      ? ao > 0.2
        ? 'August opened: 0.49 missed + 0.52 false alarm → F1 drops 1.00 → 0.67 (4/6)'
        : 'August decisions locked BEFORE opening labels (0.49 auto-passed)'
      : jh > 0.2
        ? 'July scores:  0.3 → F1 0.75   ·   0.5 → F1 1.00   ·   0.7 → F1 0.50'
        : jm > 0.2
          ? 'At 0.50: 0.31 & 0.42 drop below cut → July F1 = 1.00!'
          : jl > 0.1
            ? 'At 0.30: 3 TP + 2 FP → July F1 = 6/8 = 0.75'
            : 'Testing three candidate thresholds on July requests';
    nodes.push(txt(summary, 0, 260, 30, isAug && ao > 0.2 ? ROLE.leak : ROLE.valid, 'serif'));

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'july-low', jLowP, 1, { dur: 0.7 });
  cueTo(s, c, 'july-middle', jMidP, 1, { dur: 0.7 });
  cueTo(s, c, 'july-high', jHiP, 1, { dur: 0.7 });
  beatTo(s, c, 4, augP, 1);
  beatTo(s, c, 5, augOpenP, 1);
}

// ---------------------------------------------------------------------------
// 14. selective-labels: Who got an audit?
// (Beat-driven: 0=review precision 2/3, 1=cover auto, 2=max recall 2/2, 3=min recall 2/5, 4=sample 0.49)
// ---------------------------------------------------------------------------
export function selectiveLabels(s, c) {
  const b1 = s.value(0);
  const b2 = s.value(0);
  const b3 = s.value(0);
  const b4 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warn, seed: 14 }));
  s.add(decorAura(0, 30, 560, '#fb923c1c', '#5ce1e614'));

  const headline = heroTitle(['Selective Labels Hide', 'True Recall'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warn,
    eyebrow: 'QUEUE PRECISION KNOWN (2/3)  ·  RECALL BOUNDED [2/5, 2/2]',
  });

  const live = dynamic(() => {
    const cov = b1.value;
    const hi = b2.value;
    const lo = b3.value;
    const smp = b4.value;
    const nodes = [];

    // Top lane: Reviewed (0.77 -> 1, 0.66 -> 1, 0.52 -> 0), always audited
    nodes.push(
      txt('AUDITED REVIEW QUEUE  (PRECISION = 2 / 3)', -800, -195, 28, ROLE.safe, 'mono', 'left'),
    );
    [
      { s: '0.77', y: 'TP (1)', col: ROLE.safe },
      { s: '0.66', y: 'TP (1)', col: ROLE.safe },
      { s: '0.52', y: 'FP (0)', col: ROLE.warn },
    ].forEach((r, i) => {
      const cx = -560 + i * 360;
      nodes.push(
        rect(300, 84, { fill: '#111a30', stroke: r.col, width: 2.6, radius: 12 }).at(cx, -95),
        txt(`${r.s} → ${r.y}`, cx, -95, 28, r.col, 'mono'),
      );
    });

    // Bottom lane: Auto-passed (0.49, 0.39, 0.14), covered when only queue is audited!
    nodes.push(
      txt('AUTO-PASSED LANE  (UNAUDITED BY DEFAULT)', -800, 30, 28, ROLE.leak, 'mono', 'left'),
    );
    ['0.49', '0.39', '0.14'].forEach((sc, i) => {
      const cx = -560 + i * 360;
      const revealed = i === 0 && smp > 0.3;
      const label = revealed ? '0.49 → MISS!' : cov > 0.2 ? `${sc} → ?` : `${sc} → audit`;
      const col = revealed ? ROLE.leak : cov > 0.2 ? COSMOS.dim : ROLE.train;
      nodes.push(
        rect(300, 84, {
          fill: revealed ? '#2a101b' : '#0e1424',
          stroke: col,
          width: revealed ? 3.2 : 2,
          dash: cov > 0.2 && !revealed ? [8, 6] : undefined,
          radius: 12,
        })
          .at(cx, 130)
          .glow(revealed ? 10 : 0, ROLE.leak),
        txt(label, cx, 130, 26, col, 'mono'),
      );
    });

    const footer =
      smp > 0.2
        ? 'Random audit of 0.49 uncovers 1 miss · Use randomized sampling to estimate recall'
        : lo > 0.2
          ? '0 to 3 hidden misses → same queue fits recall from 2/2 (100%) down to 2/5 (40%)!'
          : hi > 0.2
            ? 'If all 3 covered rows were routine → recall = 2/2 (100%)'
            : 'Covering automatic outcomes leaves queue precision intact, but hides recall';
    nodes.push(txt(footer, 0, 285, 30, lo > 0.2 ? ROLE.warn : COSMOS.ink, 'serif'));

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  beatTo(s, c, 1, b1, 1);
  beatTo(s, c, 2, b2, 1);
  beatTo(s, c, 3, b3, 1);
  beatTo(s, c, 4, b4, 1);
}

// ---------------------------------------------------------------------------
// 15. documents: Split three manuals
// (Beat-driven: 0=passage split 3 shared, 1=manual split 0 shared, 2=product distinction)
// ---------------------------------------------------------------------------
export function documents(s, c) {
  const b1 = s.value(0);
  const b2 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.train, seed: 15 }));
  s.add(decorAura(0, 30, 560, '#5ce1e61c', '#6ee7b714'));

  const headline = heroTitle(['Split by Source Manual,', 'Not Passage'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.train,
    eyebrow: 'SHARED TEST SOURCES:  3  →  0',
  });

  const live = dynamic(() => {
    const grp = b1.value;
    const prod = b2.value;
    const manuals = [
      { name: 'Access Manual', col: ROLE.train, y: -120, testSide: false },
      { name: 'Incident Manual', col: ROLE.valid, y: 0, testSide: false },
      { name: 'Admins Manual', col: ROLE.test, y: 120, testSide: true },
    ];
    const nodes = [
      txt('TUNING SET', -430, -210, 28, ROLE.train, 'mono'),
      txt('TEST SET', 430, -210, 28, ROLE.test, 'mono'),
      rule(0, -210, 0, 195, '#2a3759', 2),
    ];

    manuals.forEach((m) => {
      const x1 = mix(-560, m.testSide ? 260 : -560, grp);
      const x2 = mix(260, m.testSide ? 560 : -260, grp);
      nodes.push(
        rect(250, 72, { fill: '#111a30', stroke: m.col, width: 2.5, radius: 12 }).at(x1, m.y),
        txt(`${m.name.split(' ')[0]} P1`, x1, m.y, 26, m.col, 'mono'),
        rect(250, 72, { fill: '#111a30', stroke: m.col, width: 2.5, radius: 12 }).at(x2, m.y),
        txt(`${m.name.split(' ')[0]} P2`, x2, m.y, 26, m.col, 'mono'),
      );
    });

    nodes.push(
      txt(
        prod > 0.2
          ? 'Even on a fixed library, hold out evaluation questions & reference answers!'
          : grp > 0.3
            ? 'Manual-level split: 0 test manuals seen in tuning!'
            : 'Passage-level split: ALL 3 test manuals already appeared in tuning!',
        0,
        280,
        32,
        grp > 0.3 ? ROLE.safe : ROLE.leak,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  beatTo(s, c, 1, b1, 1);
  beatTo(s, c, 2, b2, 1);
}

// ---------------------------------------------------------------------------
// 16. benchmark-screen: Compare two versions of a retention rule
// Cues: compare-word-windows, no-shared-window
// ---------------------------------------------------------------------------
export function benchmarkScreen(s, c) {
  const b1 = s.value(0);
  const b2 = s.value(0);
  const cmpP = s.value(0);
  const zeroP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.test, seed: 16 }));
  s.add(decorAura(0, 30, 560, '#a78bfa1c', '#5ce1e614'));

  const headline = heroTitle(['N-Gram Overlap Misses', 'Paraphrased Leaks'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.test,
    eyebrow: '5-WORD CONTAMINATION SCREEN',
  });

  const live = dynamic(() => {
    const para = b2.value > 0.2 || cmpP.value > 0.05;
    const slide = para ? cmpP.value : b1.value;
    const z = zeroP.value;
    const trainWords = ['keep', 'audit', 'records', 'for', 'seven', 'days'];
    const evalWords = para
      ? ['retain', 'audit', 'records', 'for', 'one', 'week']
      : ['keep', 'audit', 'records', 'for', 'seven', 'days'];
    const winX = mix(-620, -400, slide);
    const nodes = [
      txt('TRAINING PASSAGE:', -800, -165, 26, ROLE.train, 'mono', 'left'),
      ...trainWords.map((w, i) => txt(w, -620 + i * 235, -95, 36, ROLE.train, 'serif')),
      txt(
        para ? 'PARAPHRASED TEST PROMPT:' : 'VERBATIM TEST PROMPT:',
        -800,
        35,
        26,
        para ? ROLE.valid : ROLE.leak,
        'mono',
        'left',
      ),
      ...evalWords.map((w, i) =>
        txt(w, -620 + i * 235, 105, 36, para ? ROLE.valid : ROLE.leak, 'serif'),
      ),
      // 5-word highlight underline bars (cleanly below text so no stroke crosses words)
      glowBar(winX - 95, -52, 1130, 8, para ? ROLE.warn : ROLE.leak, { glow: 10 }),
      glowBar(winX - 95, 148, 1130, 8, para ? ROLE.warn : ROLE.leak, { glow: 10 }),
      txt(
        z > 0.2
          ? '0 five-word matches, yet same 7-day rule! Use MinHash/LSH + embeddings.'
          : para
            ? 'Same meaning ("one week" = "seven days") · Will any 5-gram match?'
            : '2 shared 5-word windows → flags verbatim overlap for review',
        0,
        265,
        30,
        z > 0.2 ? ROLE.warn : COSMOS.ink,
        'serif',
      ),
    ];
    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  beatTo(s, c, 1, b1, 1);
  beatTo(s, c, 2, b2, 1);
  cueTo(s, c, 'compare-word-windows', cmpP, 1, { dur: 0.9 });
  cueTo(s, c, 'no-shared-window', zeroP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 17. counterfactual: Show the outcome the log never observed
// (Beat-driven: 0=counterfactual fork, 1=zero support denominator, 2=sequence importance ratio)
// ---------------------------------------------------------------------------
export function counterfactual(s, c) {
  const b1 = s.value(0);
  const b2 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.leak, seed: 17 }));
  s.add(decorAura(0, 30, 560, '#ff6b8b1c', '#5ce1e614'));

  const headline = heroTitle(['Counterfactuals &', 'Zero-Support Logs'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.leak,
    eyebrow: 'IMPORTANCE RATIO  π_new(a|x) / π_old(a|x)',
  });

  const live = dynamic(() => {
    const z = b1.value;
    const seq = b2.value;
    return group(
      rect(340, 100, { fill: '#111a30', stroke: ROLE.train, width: 2.8, radius: 14 }).at(-580, 0),
      txt('Request x', -580, 0, 34, ROLE.train, 'serif'),
      line([-400, -15], [-90, -125], { stroke: ROLE.safe, width: 4 }).glow(8, ROLE.safe),
      line([-400, 15], [-90, 125], { stroke: ROLE.leak, width: 4, dash: [10, 7] }).glow(
        8,
        ROLE.leak,
      ),

      rect(640, 105, { fill: '#102421', stroke: ROLE.safe, width: 2.8, radius: 14 }).at(260, -125),
      txt('Review: π_old = 1.0 → Reward observed', 260, -125, 26, ROLE.safe, 'mono'),

      rect(640, 105, {
        fill: '#2a101b',
        stroke: ROLE.leak,
        width: 3.2,
        dash: [8, 6],
        radius: 14,
      }).at(260, 125),
      txt(
        z > 0.2 ? 'Auto: π_old = 0.0 → ÷ 0!' : 'Auto: outcome never observed',
        260,
        125,
        26,
        ROLE.leak,
        'mono',
      ),

      txt(
        seq > 0.2
          ? 'Off-policy evaluation needs positivity (π_old > 0) at every step, or randomize!'
          : 'Without exploration on the automatic branch, importance sampling divides by zero',
        0,
        295,
        30,
        ROLE.valid,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  beatTo(s, c, 1, b1, 1);
  beatTo(s, c, 2, b2, 1);
}

// ---------------------------------------------------------------------------
// 18. source-transfer: Two answers about retention (FINALE)
// Cues: c-first-passage, c-sibling, c-question, source-group, source-exposed, source-match,
//       source-remove, source-fallback, source-result, page-d-arrives, page-d-predicted,
//       page-d-policy, next-manual
// ---------------------------------------------------------------------------
export function sourceTransfer(s, c) {
  const c1P = s.value(0);
  const c2P = s.value(0);
  const cQP = s.value(0);
  const grpP = s.value(0);
  const expP = s.value(0);
  const matP = s.value(0);
  const remP = s.value(0);
  const fbP = s.value(0);
  const resP = s.value(0);
  const dArrP = s.value(0);
  const dPrdP = s.value(0);
  const dPolP = s.value(0);
  const nxtP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.safe, seed: 18 }));
  s.add(decorAura(0, 20, 580, '#6ee7b71c', '#ffd16614'));

  const headline = heroTitle(['Which Answer Belongs', 'in the Unseen Report?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.safe,
    eyebrow: 'POLICY C (7 DAYS)  VS  UNSEEN POLICY D (30 DAYS)',
  });

  const live = dynamic(() => {
    const rem = remP.value;
    const mat = matP.value;
    const fb = fbP.value;
    const res = resP.value;
    const da = dArrP.value;
    const dp = dPrdP.value;
    const dl = dPolP.value;
    const nx = nxtP.value;
    const nodes = [];

    // Left: Policy C (seen in tuning -> 7d match; held out -> 30d default WRONG!)
    const lx = -430;
    nodes.push(
      rect(720, 290, {
        fill: '#111a30',
        stroke: rem > 0.2 && da < 0.2 ? ROLE.leak : ROLE.valid,
        width: 2.8,
        radius: 16,
      }).at(lx, -10),
      txt('POLICY C  (TRUE = 7 DAYS)', lx, -105, 28, ROLE.valid, 'mono'),
      txt(
        rem > 0.2 && da < 0.2
          ? 'Replay with C held out → fallback 30d (WRONG!)'
          : mat > 0.2
            ? 'C in tuning → lookup returns 7d (MEMORIZED!)'
            : 'Passage 1 in tuning · Sibling Q asks retention',
        lx,
        -20,
        26,
        rem > 0.2 && da < 0.2 ? ROLE.leak : COSMOS.ink,
        'sans',
      ),
      txt(
        da > 0.2
          ? 'Disqualified (seen in tuning)'
          : res > 0.2
            ? 'Stored C entry bought match'
            : 'Keep family together!',
        lx,
        65,
        26,
        COSMOS.muted,
        'mono',
      ),
    );

    // Right: Policy D (genuinely unseen after freeze -> default 30d -> truth 30d -> QUALIFIES!)
    const rx = 430;
    nodes.push(
      rect(720, 290, {
        fill: da > 0.2 ? '#102421' : '#0e1424',
        stroke: dl > 0.2 ? ROLE.safe : '#334466',
        width: dl > 0.2 ? 3.5 : 2,
        radius: 16,
      })
        .at(rx, -10)
        .glow(dl > 0.2 ? 12 : 0, ROLE.safe),
      txt(
        'POLICY D  (ARRIVES AFTER FREEZE)',
        rx,
        -105,
        28,
        da > 0.2 ? ROLE.safe : COSMOS.dim,
        'mono',
      ),
      txt(
        dp > 0.2 ? 'No entry for D → predicts default 30 days' : 'Waiting for fresh manual D...',
        rx,
        -20,
        26,
        da > 0.2 ? COSMOS.ink : COSMOS.dim,
        'sans',
      ),
      txt(
        dl > 0.2 ? 'Opened D: 30 days → QUALIFIES!' : 'Lock prediction before opening policy',
        rx,
        65,
        26,
        dl > 0.2 ? ROLE.safe : COSMOS.dim,
        'mono',
      ),
    );

    nodes.push(
      txt(
        nx > 0.2
          ? 'Freeze rule & metric · Draw fresh unseen manuals for every revision!'
          : dl > 0.2
            ? 'Report D (unseen), NOT C (memorized during tuning)!'
            : da > 0.2
              ? 'Policy D arrives after the freeze: lock its default 30-day prediction first!'
              : rem > 0.2
                ? 'Holding out all of Policy C drops the memorized lookup to 30d (wrong!)'
                : mat > 0.2
                  ? 'Policy C was already seen in tuning, so its 7-day hit is memorized!'
                  : 'Where should a sibling question from Policy C go?',
        0,
        265,
        32,
        dl > 0.2 ? ROLE.safe : rem > 0.2 && da < 0.2 ? ROLE.leak : ROLE.valid,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'c-first-passage', c1P, 1, { dur: 0.55 });
  cueTo(s, c, 'c-sibling', c2P, 1, { dur: 0.55 });
  cueTo(s, c, 'c-question', cQP, 1, { dur: 0.55 });
  cueTo(s, c, 'source-group', grpP, 1, { dur: 0.6 });
  cueTo(s, c, 'source-exposed', expP, 1, { dur: 0.6 });
  cueTo(s, c, 'source-match', matP, 1, { dur: 0.6 });
  cueTo(s, c, 'source-remove', remP, 1, { dur: 0.7 });
  cueTo(s, c, 'source-fallback', fbP, 1, { dur: 0.6 });
  cueTo(s, c, 'source-result', resP, 1, { dur: 0.6 });
  cueTo(s, c, 'page-d-arrives', dArrP, 1, { dur: 0.7 });
  cueTo(s, c, 'page-d-predicted', dPrdP, 1, { dur: 0.65 });
  cueTo(s, c, 'page-d-policy', dPolP, 1, { dur: 0.65 });
  cueTo(s, c, 'next-manual', nxtP, 1, { dur: 0.7 });
}
