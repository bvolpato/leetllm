// Act 2 (Scenes 7-12): User Group Splits, Pipeline Scaling Leak, Feature Selection & Cross-Fitting,
// Rolling-Origin Time Splits (3D Temporal Horizon), As-Of Event Arrival, and Nested Selection.
import { circle, dynamic, group, line, rect, surface } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  beatTo,
  cinemaGrid,
  cinematic3d,
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
  orbitScene,
  rule,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. users: A repeated person can cross a row boundary
// Cues: users-beat-1-focus-1, lookup-recognition, users-beat-2-focus-1, lookup-fallback, users-beat-3-focus-1
// ---------------------------------------------------------------------------
export function usersScene(s, c) {
  const rowP = s.value(0);
  const recP = s.value(0);
  const grpP = s.value(0);
  const fbP = s.value(0);
  const retP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.neutral, seed: 7 }));
  s.add(decorAura(0, 30, 560, '#60a5fa1c', '#ff6b8b14'));

  const headline = heroTitle(['Group Splits Keep', 'Users on One Side'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.neutral,
    eyebrow: 'ROW SPLIT (100% MEMORIZED)  VS  USER GROUP SPLIT (50%)',
  });

  const live = dynamic(() => {
    const gr = grpP.value;
    const rc = recP.value;
    const fb = fbP.value;
    const rt = retP.value;
    const nodes = [];

    // 8 users U0..U7 moving smoothly from row-split (every user in BOTH sides) to group-split (U0-U3 train, U4-U7 valid)
    nodes.push(
      txt('TRAINING SIDE', -460, -195, 28, ROLE.train, 'mono'),
      txt('VALIDATION SIDE', 460, -195, 28, ROLE.valid, 'mono'),
      rule(0, -210, 0, 175, '#2a3759', 2),
    );

    for (let u = 0; u < 8; u++) {
      const y = -120 + (u % 4) * 76;
      const col = u % 2 === 0 ? ROLE.train : ROLE.valid;
      // Copy A (row split: left side; group split: left if u<4 else right)
      const xA = mix(-620 + Math.floor(u / 4) * 280, u < 4 ? -620 : 280, gr);
      // Copy B (row split: right side; group split: left if u<4 else right)
      const xB = mix(280 + Math.floor(u / 4) * 280, u < 4 ? -340 : 560, gr);
      nodes.push(
        rect(118, 52, { fill: '#111a30', stroke: col, width: 2.2, radius: 10 }).at(xA, y),
        txt(`U${u}·a`, xA, y, 26, col, 'mono'),
        rect(118, 52, { fill: '#111a30', stroke: col, width: 2.2, radius: 10 }).at(xB, y),
        txt(`U${u}·b`, xB, y, 26, col, 'mono'),
      );
    }

    const msg =
      rt > 0.2
        ? 'Report returning-user and brand-new-user slices separately when both matter'
        : fb > 0.2
          ? 'Group split: U4–U7 unseen → lookup defaults to 0 → 2/4 = 50%!'
          : rc > 0.2
            ? 'Row split: every validation user already in training → lookup scores 100%!'
            : 'Splitting by row puts the same user on both sides';
    nodes.push(
      txt(msg, 0, 275, 32, fb > 0.2 ? ROLE.safe : rc > 0.2 ? ROLE.leak : COSMOS.ink, 'serif'),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'users-beat-1-focus-1', rowP, 1, { dur: 0.7 });
  cueTo(s, c, 'lookup-recognition', recP, 1, { dur: 0.7 });
  cueTo(s, c, 'users-beat-2-focus-1', grpP, 1, { dur: 1.0 });
  cueTo(s, c, 'lookup-fallback', fbP, 1, { dur: 0.7 });
  cueTo(s, c, 'users-beat-3-focus-1', retP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 8. pipeline: A transform can peek before the model fits
// Cues: pipeline-beat-1-focus-1, pipeline-beat-1-focus-2, pipeline-beat-2-focus-1,
//       pipeline-beat-3-focus-1, pipeline-beat-3-focus-2
// ---------------------------------------------------------------------------
export function pipeline(s, c) {
  const f1 = s.value(0);
  const f2 = s.value(0);
  const f3 = s.value(0);
  const sh1 = s.value(0);
  const sh2 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.train, seed: 8 }));
  s.add(decorAura(0, 30, 560, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Fit Transforms Inside', 'Each Training Fold'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.train,
    eyebrow: 'TRAIN MEAN = 4  VS  LEAKED GLOBAL MEAN = 8',
  });

  const live = dynamic(() => {
    const sVal = Math.max(sh1.value, sh2.value);
    const origin = mix(4, 8, sVal);
    const raw = [2, 4, 6, 20];
    const rx0 = -740;
    const rx1 = 740;
    const ry = 0;
    const xOf = (v) => mix(rx0, rx1, (v + 8) / 28);
    const nodes = [];

    nodes.push(
      txt(
        `CENTERING ORIGIN μ = ${origin.toFixed(1)}`,
        rx0,
        -200,
        34,
        sVal > 0.3 ? ROLE.leak : ROLE.train,
        'mono',
        'left',
      ),
      line([rx0, ry], [rx1, ry], { stroke: '#455a88', width: 3.5 }),
      line([xOf(0), ry - 56], [xOf(0), ry + 26], { stroke: ROLE.valid, width: 3.2, dash: [8, 6] }),
      txt('0 (origin)', xOf(0), ry - 86, 26, ROLE.valid, 'mono'),
    );

    raw.forEach((v, i) => {
      const cVal = v - origin;
      const isHeld = i === 3;
      const px = xOf(cVal);
      const col = isHeld ? ROLE.leak : ROLE.train;
      nodes.push(
        glowDot(px, ry, { radius: 13, color: col, glow: 12 }),
        txt(
          isHeld ? `Held 20 → ${cVal.toFixed(0)}` : `${v} → ${cVal.toFixed(0)}`,
          px,
          i % 2 === 0 ? ry + 54 : ry + 96,
          26,
          col,
          'mono',
        ),
      );
    });

    nodes.push(
      txt(
        sVal > 0.85
          ? 'Global scaling shifts every coordinate by −4 using held-out row 20!'
          : 'Training-only scaler fits μ = 4 on [2, 4, 6], then transforms held-out 20 → +16',
        0,
        265,
        30,
        sVal > 0.85 ? ROLE.leak : ROLE.safe,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'pipeline-beat-1-focus-1', f1, 1, { dur: 0.65 });
  cueTo(s, c, 'pipeline-beat-1-focus-2', f2, 1, { dur: 0.65 });
  cueTo(s, c, 'pipeline-beat-2-focus-1', f3, 1, { dur: 0.65 });
  cueTo(s, c, 'pipeline-beat-3-focus-1', sh1, 1, { dur: 0.38 });
  cueTo(s, c, 'pipeline-beat-3-focus-2', sh2, 1, { dur: 0.38 });
}

// ---------------------------------------------------------------------------
// 9. feature-selection: Where can a label enter the fit?
// Cues: t-predictions, l-predictions, l-correct, t-correct, cover-a-fold, encoded-mean, held-out-mapping
// ---------------------------------------------------------------------------
export function featureSelection(s, c) {
  const tPredP = s.value(0);
  const lPredP = s.value(0);
  const lCorP = s.value(0);
  const tCorP = s.value(0);
  const covP = s.value(0);
  const encP = s.value(0);
  const mapP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.leak, seed: 9 }));
  s.add(decorAura(0, 30, 560, '#ff6b8b1c', '#6ee7b714'));

  const headline = heroTitle(['Leaked Feature Selection', '& Target Cross-Fitting'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.leak,
    eyebrow: 'TRAIN-ONLY SELECTS T (2/4)  VS  ALL-ROW SELECTS L (4/4)',
  });

  const view1 = guardedDynamic(
    () => fadeOut(covP.value),
    (vis) => {
      const tp = tPredP.value;
      const lp = lPredP.value;
      const lc = lCorP.value;
      const tc = tCorP.value;
      return group(
        txt(
          'TRAIN-ONLY BRACKET (ROWS 0–3):  T gap = 1.0  >  L gap = 0.5',
          -820,
          -200,
          28,
          ROLE.train,
          'mono',
          'left',
        ),
        glowBar(-820, -135, 580, 38, ROLE.train, { glow: 8 }),
        txt('Train-only picks T', -210, -135, 28, ROLE.train, 'mono', 'left'),

        txt(
          'ALL-ROW LEAKED BRACKET (ROWS 0–7):  L gap = 0.75  >  T gap = 0.50',
          -820,
          -30,
          28,
          ROLE.leak,
          'mono',
          'left',
        ),
        glowBar(-820, 35, 435, 38, ROLE.leak, { glow: 9 }),
        txt('Leaked selector flips to L!', -355, 35, 28, ROLE.leak, 'mono', 'left'),

        txt(
          tc > 0.2
            ? 'Honest T on held rows 4–7:  2 / 4 correct (50%)'
            : tp > 0.1
              ? 'T makes 1 FP and 1 FN on rows 5 & 6'
              : 'Honest T on held rows 4–7:  ?',
          -820,
          165,
          32,
          tc > 0.2 || tp > 0.1 ? ROLE.safe : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          lc > 0.2
            ? 'Leaked L on the very labels it read:  4 / 4 (100% ILLUSION!)'
            : lp > 0.1
              ? 'L reverses both predictions on rows 5 & 6'
              : 'Leaked L on held rows 4–7:  ?',
          -820,
          245,
          32,
          lc > 0.2 || lp > 0.1 ? ROLE.leak : COSMOS.dim,
          'mono',
          'left',
        ).glow(lc > 0.2 ? 8 : 0, ROLE.leak),
      ).opacity(vis);
    },
  );

  const view2 = guardedDynamic(
    () => fadeIn(covP.value),
    (vis) => {
      const en = encP.value;
      const mp = mapP.value;
      return group(
        txt(
          'OUT-OF-FOLD TARGET ENCODING (CROSS-FITTING)',
          -820,
          -200,
          28,
          ROLE.safe,
          'mono',
          'left',
        ),
        txt(
          'Category A appears once (y = 1) → Cover A fold!',
          -820,
          -105,
          32,
          ROLE.valid,
          'sans',
          'left',
        ),
        txt('Remaining folds:  B (y = 1),  D (y = 0)', -820, -25, 32, COSMOS.ink, 'mono', 'left'),
        en > 0.1
          ? txt(
              'Encoded input for A = mean(1, 0) = 0.50  (no self-leak!)',
              -820,
              95,
              34,
              ROLE.safe,
              'mono',
              'left',
            )
              .glow(10, ROLE.safe)
              .opacity(en)
          : txt(
              'What value goes into A input without peeking at A target?',
              -820,
              95,
              32,
              ROLE.valid,
              'serif',
              'left',
            ),
        txt(
          mp > 0.1
            ? 'Held-out rows use the mapping fitted on full training data'
            : 'Cross-fit inside training; fit full map for held-out serving',
          -820,
          210,
          30,
          mp > 0.1 ? COSMOS.ink : COSMOS.dim,
          'serif',
          'left',
        ).opacity(mix(0.65, 1, mp)),
        // Right side: 3-fold out-of-fold visual diagram
        rect(380, 74, { fill: '#2a1220', stroke: ROLE.leak, width: 2.6, radius: 12 }).at(540, -110),
        txt('FOLD 1: A (y=1) COVERED', 540, -110, 26, ROLE.leak, 'mono'),
        rect(380, 74, { fill: '#102421', stroke: ROLE.safe, width: 2.6, radius: 12 }).at(540, -10),
        txt('FOLD 2: B (y = 1)', 540, -10, 28, ROLE.safe, 'mono'),
        rect(380, 74, { fill: '#102421', stroke: ROLE.safe, width: 2.6, radius: 12 }).at(540, 90),
        txt('FOLD 3: D (y = 0)', 540, 90, 28, ROLE.safe, 'mono'),
        txt(
          en > 0.1 ? 'A ← mean(1, 0) = 0.50' : 'A ← mean(B, D) = ?',
          540,
          200,
          32,
          en > 0.1 ? ROLE.safe : ROLE.valid,
          'mono',
        ).glow(en > 0.1 ? 9 : 0, ROLE.safe),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 't-predictions', tPredP, 1, { dur: 0.65 });
  cueTo(s, c, 'l-predictions', lPredP, 1, { dur: 0.65 });
  cueTo(s, c, 'l-correct', lCorP, 1, { dur: 0.65 });
  cueTo(s, c, 't-correct', tCorP, 1, { dur: 0.65 });
  cueTo(s, c, 'cover-a-fold', covP, 1, { dur: 0.85 });
  cueTo(s, c, 'encoded-mean', encP, 1, { dur: 0.7 });
  cueTo(s, c, 'held-out-mapping', mapP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 10. time: Rehearse the next deployment (SIGNATURE 3D TEMPORAL SURFACE)
// (Beat-driven: 0=Jan-Feb->Mar-Apr, 1=Jan-Apr->May-Jun, 2=Jan-Jun/Jul/Aug, 3=Jun 20 request w/ Aug 2 label, 4=leave out)
// ---------------------------------------------------------------------------
export function time(s, c) {
  const b1 = s.value(0);
  const b2 = s.value(0);
  const b3 = s.value(0);
  const b4 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.train, seed: 10 }));
  s.add(decorAura(340, 20, 500, '#5ce1e61e', '#a78bfa14'));

  // Orbiting 3D rolling-origin temporal ramp (time x horizon -> causal visibility)
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.2,
    unit: 108,
    focus: [0, 0, 0.7],
  }).at(380, 20);

  view3d.add(
    surface(
      (u, v) => {
        // u = calendar month, v = model vintage; causal staircase rises only for past training history
        return u < v ? 1.8 + 0.25 * Math.sin(u + v) : 0.25;
      },
      {
        x: [-2.4, 2.4],
        y: [-2.4, 2.4],
        resolution: [30, 30],
        colors: ['#0c1733', '#234278', '#5ce1e6', '#ffd166', '#6ee7b7'],
        mesh: '#8bd8ff',
        meshOpacity: 0.16,
        meshWidth: 0.5,
        opacity: 0.88,
      },
    ),
  );

  const headline = heroTitle(['Rolling-Origin', '& Label Maturity'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.train,
    eyebrow: 'REHEARSE DEPLOYMENT IN STRICT CALENDAR ORDER',
  });

  const leftPanel = dynamic(() => {
    const r2 = b1.value;
    const rel = b2.value;
    const zoom = b3.value;
    const ans = b4.value;
    const x0 = -840;
    const nodes = [
      txt('REHEARSAL 1:  Jan–Feb fit  →  Mar–Apr score', x0, -200, 28, ROLE.train, 'mono', 'left'),
      glowBar(x0, -145, 220, 32, ROLE.train, { glow: 8 }),
      glowBar(x0 + 230, -145, 220, 32, ROLE.valid, { glow: 8 }),
    ];

    if (r2 > 0.1) {
      nodes.push(
        txt('REHEARSAL 2:  Jan–Apr fit  →  May–Jun score', x0, -65, 28, ROLE.train, 'mono', 'left'),
        glowBar(x0, -10, 440, 32, ROLE.train, { glow: 8 }),
        glowBar(x0 + 450, -10, 220, 32, ROLE.valid, { glow: 8 }),
      );
    }

    if (rel > 0.1) {
      nodes.push(
        txt(
          'RELEASE:  Jan–Jun fit · Jul threshold · Aug test',
          x0,
          70,
          28,
          ROLE.test,
          'mono',
          'left',
        ),
        glowBar(x0, 125, 480, 32, ROLE.train, { glow: 7 }),
        glowBar(x0 + 490, 125, 110, 32, ROLE.valid, { glow: 8 }),
        glowBar(x0 + 610, 125, 110, 32, ROLE.test, { glow: 9 }),
      );
    }

    if (zoom > 0.1) {
      nodes.push(
        txt(
          ans > 0.3
            ? 'Jun 20 request + Aug 2 label → EXCLUDE from Jul 1 fit!'
            : 'Jun 20 request gets audit label Aug 2 · Include in Jul 1 fit?',
          x0,
          240,
          28,
          ans > 0.3 ? ROLE.leak : ROLE.valid,
          'serif',
          'left',
        ),
      );
    }

    nodes.push(txt('3D CAUSAL HORIZON STAIRCASE', 380, 395, 26, COSMOS.muted, 'mono'));
    return group(...nodes);
  });

  s.add(view3d, headline, leftPanel);
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.94 });
  livingDrift(s, c, drift, 1);
  beatTo(s, c, 1, b1, 1);
  beatTo(s, c, 2, b2, 1);
  beatTo(s, c, 3, b3, 1);
  beatTo(s, c, 4, b4, 1);
}

// ---------------------------------------------------------------------------
// 11. as-of-history: What was available by the cutoff?
// (Beat-driven: 0=3 event dots, 1=arrival times, 2=answer 2 ready, 3=user2 activity, 4=purge/embargo)
// ---------------------------------------------------------------------------
export function asOfHistory(s, c) {
  const b1 = s.value(0);
  const b2 = s.value(0);
  const b3 = s.value(0);
  const b4 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.valid, seed: 11 }));
  s.add(decorAura(0, 30, 560, '#ffd1661c', '#ff6b8b14'));

  const headline = heroTitle(['Event Time vs', 'Arrival (As-Of) Time'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.valid,
    eyebrow: 'DECISION CUTOFF:  JUL 1, 00:05',
  });

  const live = dynamic(() => {
    const arr = b1.value;
    const ans = b2.value;
    const u2 = b3.value;
    const emb = b4.value;
    const x0 = -855;
    const xCut = 260;
    const nodes = [
      line([xCut, -200], [xCut, 200], { stroke: ROLE.valid, width: 3.8, dash: [10, 7] }).glow(
        9,
        ROLE.valid,
      ),
      txt('Jul 1 · 00:05 Cutoff', xCut, -228, 28, ROLE.valid, 'mono'),
    ];

    const evs = [
      { name: 'E1 (Jun 29)', ex: -320, ax: -280, y: -105, ok: true },
      { name: 'E2 (Jun 30)', ex: -120, ax: -80, y: 0, ok: true },
      { name: 'E3 (Jun 30 → Jul 1 12:00!)', ex: 40, ax: 640, y: 105, ok: false },
    ];
    evs.forEach((e) => {
      const col = e.ok ? ROLE.safe : arr > 0.2 ? ROLE.leak : ROLE.train;
      nodes.push(
        txt(e.name, x0, e.y, 26, col, 'mono', 'left'),
        glowDot(e.ex, e.y, { radius: 11, color: ROLE.train, glow: 9 }),
      );
      if (arr > 0.1) {
        nodes.push(
          line([e.ex, e.y], [mix(e.ex, e.ax, arr), e.y], { stroke: col, width: 3.5 }),
          glowDot(mix(e.ex, e.ax, arr), e.y, { radius: 12, color: col, glow: 12 }),
        );
      }
    });

    const msg =
      emb > 0.2
        ? 'Purge overlapping label intervals & add embargo buffer after test blocks'
        : u2 > 0.2
          ? 'Unlabeled June request still counts as prior user activity (returning user!)'
          : ans > 0.2
            ? 'As-of count = 2 (NOT 3!) · Require event inside window AND arrival ≤ cutoff'
            : arr > 0.2
              ? 'Event 3 synced 12 hours late · How many events can the router count?'
              : 'All 3 event timestamps fall inside the 7-day window';
    nodes.push(txt(msg, 0, 290, 30, ans > 0.2 ? ROLE.safe : ROLE.valid, 'serif'));

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
// 12. nested-selection: Protect the evaluator from the selection loop
// Cues: refit-threshold, outer-accuracy
// ---------------------------------------------------------------------------
export function nestedSelection(s, c) {
  const refitP = s.value(0);
  const outP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.test, seed: 12 }));
  s.add(decorAura(0, 30, 560, '#a78bfa1e', '#5ce1e614'));

  const headline = heroTitle(['Nested Cross-Validation', 'Shields the Outer Score'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.test,
    eyebrow: 'INNER SELECTION LOOP  ·  OUTER EVALUATION LOOP',
  });

  const live = dynamic(() => {
    const rf = refitP.value;
    const ot = outP.value;
    return group(
      // Inner loop
      rect(680, 270, { fill: '#101b32', stroke: ROLE.train, width: 2.8, radius: 16 })
        .at(-440, 0)
        .glow(8, ROLE.train),
      txt('INNER LOOP (SELECT MODEL)', -440, -90, 28, ROLE.train, 'mono'),
      txt('Rule A: 2 / 2   vs   Rule B: 1 / 2', -440, -15, 30, COSMOS.ink, 'mono'),
      txt(
        rf > 0.2 ? 'Refit winner A on all 4 dev rows: cut 5 → 6' : 'Select A inside inner split',
        -440,
        65,
        28,
        rf > 0.2 ? ROLE.valid : COSMOS.muted,
        'sans',
      ),

      // Outer loop
      rect(680, 270, { fill: '#191430', stroke: ROLE.test, width: 2.8, radius: 16 })
        .at(440, 0)
        .glow(ot > 0.2 ? 12 : 6, ROLE.test),
      txt('OUTER FOLD (LOCKED EVALUATOR)', 440, -90, 28, ROLE.test, 'mono'),
      txt(
        ot > 0.2 ? 'Outer score for A:  2 / 4 (50%)' : '4 outer labels stay covered',
        440,
        -10,
        32,
        ot > 0.2 ? ROLE.safe : COSMOS.muted,
        'mono',
      ),
      txt('Repeat inner search + refit for every outer fold', 440, 68, 26, COSMOS.muted, 'sans'),

      txt(
        'Never tune on outer-fold errors without drawing a fresh test set',
        0,
        255,
        32,
        ROLE.valid,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'refit-threshold', refitP, 1, { dur: 0.75 });
  cueTo(s, c, 'outer-accuracy', outP, 1, { dur: 0.75 });
}
