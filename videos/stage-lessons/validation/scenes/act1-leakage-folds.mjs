// Act 1 (Scenes 1-6): Intro Rewind Timeline, Target Leak (8 Rows), Empirical vs Population Risk,
// Train/Val/Test Roles, Rotating 5-Fold CV, and One-Fold Calculation & Pooling.
import { arrow, circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  LEAK_ROWS,
  ROLE,
  beatTo,
  cinemaGrid,
  cueTo,
  decorAura,
  foldScores,
  glowBar,
  glowDot,
  glowTex,
  heroTitle,
  livingDrift,
  mix,
  oneFoldModel,
  openingRule,
  rule,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: The request at nine o'clock
// Cues: read-approval, read-audit, rewind-audit, rewind-approval
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const appP = s.value(0);
  const audP = s.value(0);
  const rwAudP = s.value(0);
  const rwAppP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.train, seed: 1 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Rewind the Record', 'to Decision Time'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.train,
    eyebrow: 'TEMPORAL LEAKAGE  ·  CUTOFF 09:00',
  });

  const live = dynamic(() => {
    const ap = appP.value;
    const au = audP.value;
    const rwa = rwAudP.value;
    const rwp = rwAppP.value;
    const nodes = [];

    // Horizontal timeline from 08:59 -> 09:00 (decision cutoff) -> 10:22 -> Jul 15
    const tx0 = -760;
    const tx1 = 760;
    const ty = -85;
    const xOpen = -260;
    const curX = mix(tx1, xOpen, Math.max(rwa * 0.5, rwp));

    nodes.push(
      line([tx0, ty], [tx1, ty], { stroke: '#455a88', width: 3.5 }),
      line([xOpen, ty - 80], [xOpen, 250], { stroke: ROLE.valid, width: 3.5, dash: [10, 7] }).glow(
        9,
        ROLE.valid,
      ),
      txt('09:00 CUTOFF', xOpen, ty - 108, 28, ROLE.valid, 'mono'),
      glowDot(curX, ty, { radius: 13, color: ROLE.train, glow: 14 }),
    );

    const fields = [
      { label: '08:59 · Ambiguity score', x: -640, y: 15, avail: true, col: ROLE.safe },
      { label: '08:59 · Prior exceptions', x: -640, y: 115, avail: true, col: ROLE.safe },
      {
        label: '10:22 · Manager signed (+82m)',
        x: 20,
        y: 15,
        avail: rwp < 0.4,
        show: Math.max(0.4, ap),
        col: ROLE.leak,
      },
      {
        label: 'Jul 15 · Audit revoked access',
        x: 20,
        y: 115,
        avail: rwa < 0.4,
        show: Math.max(0.25, au),
        col: ROLE.leak,
      },
    ];
    fields.forEach((f) => {
      const op = f.avail ? (f.show ?? 1) : 0.25;
      nodes.push(
        group(
          rect(540, 68, {
            fill: f.avail ? '#111d32' : '#0b101f',
            stroke: f.avail ? f.col : '#32405e',
            width: f.avail ? 2.6 : 1.4,
            dash: f.avail ? undefined : [8, 6],
            radius: 12,
          }).at(f.x + 170, f.y),
          txt(
            f.avail ? f.label : `${f.label}  [GONE]`,
            f.x - 80,
            f.y,
            26,
            f.avail ? f.col : COSMOS.dim,
            'mono',
            'left',
          ),
        ).opacity(op),
      );
    });

    nodes.push(
      txt(
        rwp > 0.3
          ? 'Only the two 08:59 fields survive at 09:00 · Save audit for scoring!'
          : 'Which fields survive if we rewind this record to 09:00?',
        0,
        295,
        32,
        rwp > 0.3 ? ROLE.safe : ROLE.valid,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'read-approval', appP, 1, { dur: 0.7 });
  cueTo(s, c, 'read-audit', audP, 1, { dur: 0.7 });
  cueTo(s, c, 'rewind-audit', rwAudP, 1, { dur: 0.85 });
  cueTo(s, c, 'rewind-approval', rwAppP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 2. target-leak: Score the same eight requests twice
// (Beat-driven: 0=copied audit 8/8, 1=disconnect rule, 2=row6 FP, 3=row7 prompt, 4=row7 FN 6/8, 5=summary)
// ---------------------------------------------------------------------------
export function targetLeak(s, c) {
  const b1 = s.value(0);
  const b2 = s.value(0);
  const b3 = s.value(0);
  const b4 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.leak, seed: 2 }));
  s.add(decorAura(0, 30, 560, '#ff6b8b1c', '#5ce1e614'));

  const headline = heroTitle(['Target Leakage vs', 'Opening-Time Features'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.leak,
    eyebrow: 'SAME 8 AUDIT LABELS  ·  8/8 LEAKED VS 6/8 REAL (75%)',
  });

  const live = dynamic(() => {
    const dis = b1.value;
    const r6 = b2.value;
    const r7Ask = b3.value;
    const r7Rev = b4.value;
    const nodes = [];

    nodes.push(
      txt(
        dis > 0.3
          ? 'OPENING RULE:  ambiguity − 0.9 × policy > 0'
          : 'LEAKED RULE:  copies audit label directly (8/8!)',
        -820,
        -205,
        28,
        dis > 0.3 ? ROLE.train : ROLE.leak,
        'mono',
        'left',
      ),
    );

    LEAK_ROWS.forEach((row, i) => {
      const cx = -740 + i * 210;
      const calc = openingRule(row);
      const pred = dis > 0.3 ? (i === 7 && r7Rev < 0.3 ? '?' : calc.prediction) : row.y;
      const isErr = dis > 0.3 && ((i === 6 && r6 > 0.2) || (i === 7 && r7Rev > 0.2));
      const hi = (i === 6 && r6 > 0.2 && r7Ask < 0.2) || (i === 7 && r7Ask > 0.2);

      nodes.push(
        txt(`R${i}`, cx, -125, 28, hi ? ROLE.valid : COSMOS.ink, 'mono'),
        txt(`a=${row.ambiguity.toFixed(1)}`, cx, -75, 26, COSMOS.muted, 'mono'),
        txt(`p=${row.policy}`, cx, -32, 26, COSMOS.muted, 'mono'),
        rect(155, 64, {
          fill: isErr ? '#2b101b' : '#111a30',
          stroke: isErr ? ROLE.leak : hi ? ROLE.valid : ROLE.train,
          width: isErr || hi ? 3.2 : 1.8,
          radius: 10,
        })
          .at(cx, 50)
          .glow(isErr ? 10 : hi ? 8 : 0, isErr ? ROLE.leak : ROLE.valid),
        txt(`pred ${pred}`, cx, 50, 26, isErr ? ROLE.leak : COSMOS.ink, 'mono'),
        txt(`audit ${row.y}`, cx, 128, 26, row.y ? ROLE.valid : COSMOS.dim, 'mono'),
      );
    });

    const footer =
      r7Rev > 0.2
        ? 'Row 7: 0.6 − 0.9 = −0.3 → Auto-pass (MISS!) · Real accuracy = 6/8 (75%)'
        : r7Ask > 0.2
          ? 'Row 7: ambiguity 0.6, policy 1 · Would the rule send it to review?'
          : r6 > 0.2
            ? 'Row 6: 0.3 − 0.0 = +0.3 → Review, but audit = 0 (false alarm!)'
            : 'Disconnecting the audit column exposes real opening-time errors';
    nodes.push(txt(footer, 0, 275, 30, r7Rev > 0.2 ? ROLE.leak : ROLE.valid, 'serif'));

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
// 3. risk: Separate fitted error from the target risk
// Cues: weighted-loss, risk-gap
// ---------------------------------------------------------------------------
export function risk(s, c) {
  const popP = s.value(0);
  const gapP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.valid, seed: 3 }));
  s.add(decorAura(0, 30, 560, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Empirical Risk vs', 'Population Risk'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.valid,
    eyebrow: 'GENERALIZATION GAP = POPULATION − TRAINING',
  });

  const live = dynamic(() => {
    const pp = popP.value;
    const gp = gapP.value;
    const x0 = -760;
    const barW = 1100;
    return group(
      txt(
        '4 TRAINING LOSSES:  [0, 0, 0, 1]  →  EMPIRICAL RISK = 0.25',
        x0,
        -190,
        28,
        ROLE.train,
        'mono',
        'left',
      ),
      glowBar(x0, -110, barW * 0.25, 48, ROLE.train, { glow: 9 }),
      txt('0.25', x0 + barW * 0.25 + 24, -110, 32, ROLE.train, 'mono', 'left'),

      txt(
        'POPULATION:  75% × 0  +  25% × 2  →  EXPECTED LOSS = 0.50',
        x0,
        10,
        28,
        ROLE.valid,
        'mono',
        'left',
      ).opacity(mix(0.45, 1, pp)),
      glowBar(x0, 90, barW * 0.5 * Math.max(0.2, pp), 48, ROLE.valid, {
        glow: 10,
        opacity: mix(0.45, 1, pp),
      }),
      txt(pp > 0.2 ? '0.50' : '?', x0 + barW * 0.5 + 24, 90, 32, ROLE.valid, 'mono', 'left'),

      gp > 0.05
        ? group(
            glowTex('\\text{Generalization gap} = 0.50 - 0.25 = +0.25', {
              x: 0,
              y: 255,
              size: 46,
              color: ROLE.leak,
            }),
            txt(
              'Picking the lowest training error makes empirical risk optimistic on average',
              0,
              340,
              28,
              COSMOS.muted,
              'serif',
            ),
          ).opacity(gp)
        : txt(
            'Weighted future loss minus fitted training mean = generalization gap',
            0,
            265,
            30,
            COSMOS.muted,
            'serif',
          ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'weighted-loss', popP, 1, { dur: 0.8 });
  cueTo(s, c, 'risk-gap', gapP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 4. roles: Separate fitting, choosing, and reporting
// Cues: roles-beat-1-focus-1, roles-beat-2-focus-1, roles-beat-2-focus-2, roles-beat-3-focus-1
// ---------------------------------------------------------------------------
export function roles(s, c) {
  const trP = s.value(0);
  const vaP = s.value(0);
  const teP = s.value(0);
  const leakP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.train, seed: 4 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61c', '#a78bfa16'));

  const headline = heroTitle(['Train, Validate,', 'and Frozen Test'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.train,
    eyebrow: 'JAN–JUN FIT  ·  JUL SELECT  ·  AUG REPORT',
  });

  const live = dynamic(() => {
    const tr = trP.value;
    const va = vaP.value;
    const te = teP.value;
    const lk = leakP.value;
    const blocks = [
      {
        title: 'TRAINING',
        sub: 'Jan – Jun',
        job: 'Fit weights & transforms',
        x: -560,
        w: 500,
        col: ROLE.train,
        hi: tr,
      },
      {
        title: 'VALIDATION',
        sub: 'July',
        job: 'Choose threshold & features',
        x: 20,
        w: 380,
        col: ROLE.valid,
        hi: va,
      },
      {
        title: 'TEST (FROZEN)',
        sub: 'August',
        job: lk > 0.3 ? 'Used to tune B → SPENT!' : 'Report frozen Candidate A',
        x: 540,
        w: 420,
        col: lk > 0.3 ? ROLE.leak : ROLE.test,
        hi: Math.max(te, lk),
      },
    ];
    const nodes = [];

    blocks.forEach((b) => {
      nodes.push(
        rect(b.w, 220, { fill: '#111a30', stroke: b.col, width: b.hi > 0.2 ? 3.5 : 2, radius: 16 })
          .at(b.x, 0)
          .glow(b.hi > 0.2 ? 12 : 4, b.col),
        txt(b.title, b.x, -56, 30, b.col, 'mono'),
        txt(b.sub, b.x, 4, 38, COSMOS.ink, 'serif'),
        txt(b.job, b.x, 66, 26, COSMOS.muted, 'sans'),
      );
    });

    nodes.push(
      arrow([-295, 0], [-185, 0], { stroke: ROLE.train, width: 3.5 }),
      arrow([225, 0], [315, 0], { stroke: ROLE.valid, width: 3.5 }),
      txt(
        lk > 0.3
          ? 'If August errors drive Candidate B, keep August with A and test B on fresh data!'
          : 'Chronological separation + label availability protect the final report',
        0,
        245,
        32,
        lk > 0.3 ? ROLE.leak : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'roles-beat-1-focus-1', trP, 1, { dur: 0.7 });
  cueTo(s, c, 'roles-beat-2-focus-1', vaP, 1, { dur: 0.7 });
  cueTo(s, c, 'roles-beat-2-focus-2', teP, 1, { dur: 0.7 });
  cueTo(s, c, 'roles-beat-3-focus-1', leakP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 5. folds: Refit the pipeline as the held-out role moves
// Cues: folds-beat-1-focus-1, folds-beat-2-focus-1, folds-beat-3-focus-1
// ---------------------------------------------------------------------------
export function folds(s, c) {
  const f1P = s.value(0);
  const f2P = s.value(0);
  const f3P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.neutral, seed: 5 }));
  s.add(decorAura(0, 20, 560, '#60a5fa1c', '#ffd16614'));

  const headline = heroTitle(['5-Fold Rotation', 'Refits Every Time'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.neutral,
    eyebrow: 'FRESH PIPELINE PER FOLD  ·  MEAN = 0.708',
  });

  const live = dynamic(() => {
    const p1 = f1P.value;
    const p2 = f2P.value;
    const p3 = f3P.value;
    const nodes = [];

    const x0 = -720;
    const w = 240;
    for (let iter = 0; iter < 5; iter++) {
      const y = -165 + iter * 86;
      nodes.push(txt(`Fold ${iter + 1}`, -835, y, 26, COSMOS.muted, 'mono', 'left'));
      for (let k = 0; k < 5; k++) {
        const isVal = k === iter;
        const cx = x0 + 120 + k * 252;
        nodes.push(
          rect(w - 14, 58, {
            fill: isVal ? '#2a210d' : '#102238',
            stroke: isVal ? ROLE.valid : ROLE.train,
            width: isVal ? 3 : 1.6,
            radius: 10,
          })
            .at(cx, y)
            .glow(isVal ? 9 : 0, ROLE.valid),
          txt(isVal ? 'VALID' : 'Train', cx, y, 26, isVal ? ROLE.valid : ROLE.train, 'mono'),
        );
      }
      nodes.push(
        txt(
          foldScores[iter].toFixed(2),
          640,
          y,
          30,
          foldScores[iter] < 0.6 ? ROLE.leak : ROLE.safe,
          'mono',
          'left',
        ).opacity(Math.max(0.4, p1)),
      );
    }

    const note =
      p3 > 0.2
        ? 'Stratification balances classes, NOT time or user boundaries'
        : p2 > 0.2
          ? 'Folds share training rows → fold spread is NOT a population CI'
          : 'Mean = 0.708  ·  Every validation row scored by a fit that excluded it';
    nodes.push(txt(note, 0, 315, 32, p3 > 0.2 ? ROLE.valid : COSMOS.ink, 'serif'));

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'folds-beat-1-focus-1', f1P, 1, { dur: 0.85 });
  cueTo(s, c, 'folds-beat-2-focus-1', f2P, 1, { dur: 0.75 });
  cueTo(s, c, 'folds-beat-3-focus-1', f3P, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 6. fold-calculation: From a held-out row to a fold score
// Cues: average-folds, combine-counts, score-pool
// ---------------------------------------------------------------------------
export function foldCalculation(s, c) {
  const b2 = s.value(0);
  const avgP = s.value(0);
  const combP = s.value(0);
  const poolP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.train, seed: 6 }));
  s.add(decorAura(0, 30, 560, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Averaging Fold F1s', 'vs Pooling Predictions'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.train,
    eyebrow: 'CENTERED RULER (MEAN = 6)  ·  3/4 VS 2/3',
  });

  const live = dynamic(() => {
    const rev = b2.value;
    const av = avgP.value;
    const cm = combP.value;
    const pl = poolP.value;
    const nodes = [];

    // Top centered ruler (-6..+6)
    const rx0 = -720;
    const rx1 = 720;
    const ry = -115;
    const xOf = (v) => mix(rx0, rx1, (v + 6) / 12);

    nodes.push(
      txt(
        'CENTERED BY TRAINING MEAN 6  (Class 0 @ −3 · Class 1 @ +3)',
        rx0,
        -205,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      line([rx0, ry], [rx1, ry], { stroke: '#455a88', width: 3.2 }),
      line([xOf(0), ry - 26], [xOf(0), ry + 26], { stroke: COSMOS.dim, width: 2.2, dash: [6, 5] }),
      glowDot(xOf(-3), ry, { radius: 14, color: ROLE.train, glow: 12 }),
      txt('μ₀ = −3', xOf(-3), ry - 48, 28, ROLE.train, 'mono'),
      glowDot(xOf(3), ry, { radius: 14, color: ROLE.leak, glow: 12 }),
      txt('μ₁ = +3', xOf(3), ry - 48, 28, ROLE.leak, 'mono'),
      glowDot(xOf(3), ry + 48, { radius: 11, color: ROLE.valid, glow: 12 }),
      txt(
        rev > 0.2 ? 'x = 9 (+3) → Pred 1, Audit 0 (FP!)' : 'Held-out x = 9 → +3 · Which class?',
        xOf(3),
        ry + 92,
        26,
        ROLE.valid,
        'mono',
      ),
    );

    // Bottom comparison: Macro fold average vs Pooled micro F1
    const yRow = 125;
    nodes.push(
      txt(
        'Fold 1 (4 rows): TP=1, FP=1, FN=1 → F1 = 2/4 = 0.50',
        -800,
        yRow - 50,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        'Fold 2 (1 row):  TP=1, FP=0, FN=0 → F1 = 1.00',
        -800,
        yRow + 5,
        28,
        ROLE.safe,
        'mono',
        'left',
      ),
    );

    if (av > 0.05) {
      nodes.push(
        txt(
          'EQUAL-WEIGHT MEAN:  (0.50 + 1.00) / 2 = 0.75 (3/4)',
          -800,
          yRow + 95,
          32,
          ROLE.valid,
          'mono',
          'left',
        )
          .glow(8, ROLE.valid)
          .opacity(av),
      );
    }
    if (cm > 0.05 || pl > 0.05) {
      nodes.push(
        txt(
          pl > 0.2
            ? 'POOLED COUNTS (TP=2, FP=1, FN=1):  4 / 6 = 0.667 (2/3)'
            : 'Pooling all 5 predictions together: TP=2, FP=1, FN=1',
          -800,
          yRow + 165,
          32,
          ROLE.train,
          'mono',
          'left',
        )
          .glow(8, ROLE.train)
          .opacity(Math.max(cm, pl)),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  beatTo(s, c, 2, b2, 1);
  cueTo(s, c, 'average-folds', avgP, 1, { dur: 0.7 });
  cueTo(s, c, 'combine-counts', combP, 1, { dur: 0.7 });
  cueTo(s, c, 'score-pool', poolP, 1, { dur: 0.7 });
}
