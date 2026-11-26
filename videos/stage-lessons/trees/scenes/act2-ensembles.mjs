// Act 2 (Scenes 7-13): Random Forest & OOB, Gradient Boosting Residuals, Newton Logit Steps,
// Evaluation & Cost Bills, Permutation vs MDI & Shapley, Missing Values & Bias-Variance, Transfer Finale.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  boost,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  firstNewtonLeaves,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  policyCosts,
  rule,
  sigmoid,
  stumpBill,
  targets,
  txt,
  validationAfterBoosting,
  validationRows,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. forest: Which trees can score R3?
// Cues: outer-leaves, middle-leaf, forest-mean*, exclude-middle, oob-score*
// ---------------------------------------------------------------------------
export function forest(s, c) {
  const outP = s.value(0);
  const midP = s.value(0);
  const meanP = s.value(0);
  const exclP = s.value(0);
  const oobP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.routine, seed: 7 }));
  s.add(decorAura(0, 30, 560, '#5ce1e61c', '#ffd16614'));

  const headline = heroTitle(['Random Forests', '& Out-of-Bag Scoring'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.routine,
    eyebrow: '3 BOOTSTRAP TREES SCORING R3 (amb=2, sup=3)',
  });

  const live = dynamic(() => {
    const ot = outP.value;
    const md = midP.value;
    const mn = meanP.value;
    const ex = exclP.value;
    const ob = oobP.value;
    const treesData = [
      { name: 'Tree 1 (amb)', score: 0, x: -560, inBag: false, show: ot },
      { name: 'Tree 2 (sup · 3× R3)', score: 1, x: 0, inBag: true, show: md },
      { name: 'Tree 3 (amb)', score: 0, x: 560, inBag: false, show: ot },
    ];
    const nodes = [];

    treesData.forEach((t) => {
      const dimOut = t.inBag && ex > 0.2;
      const col = dimOut ? COSMOS.dim : t.score === 1 ? ROLE.review : ROLE.routine;
      nodes.push(
        group(
          txt(t.name, t.x, -165, 28, col, 'mono'),
          circle(68, {
            fill: '#111a30',
            stroke: col,
            width: 3.2,
            dash: dimOut ? [10, 7] : undefined,
          })
            .at(t.x, -40)
            .glow(dimOut ? 0 : 9, col),
          txt(t.show > 0.2 ? String(t.score) : '?', t.x, -40, 48, col, 'mono'),
          txt(
            dimOut
              ? 'EXCLUDED (trained on R3)'
              : t.show > 0.2
                ? t.score
                  ? 'Review leaf'
                  : 'Routine leaf'
                : 'Bootstrap fit',
            t.x,
            72,
            26,
            col,
            'sans',
          ),
        ).opacity(dimOut ? 0.35 : 1),
      );
    });

    if (ob > 0.05) {
      nodes.push(
        group(
          txt('OUT-OF-BAG SCORE (TREES 1 & 3 ONLY)', 0, 195, 28, ROLE.routine, 'mono'),
          txt('(0 + 0) / 2  =  0.00', 0, 265, 58, ROLE.routine, 'mono').glow(12, ROLE.routine),
        ).opacity(ob),
      );
    } else if (mn > 0.05) {
      nodes.push(
        group(
          txt('FULL FOREST MEAN', 0, 195, 28, ROLE.cut, 'mono'),
          txt('(0 + 1 + 0) / 3  =  1/3', 0, 265, 58, ROLE.cut, 'mono').glow(12, ROLE.cut),
        ).opacity(mn),
      );
    } else {
      nodes.push(
        txt('What average score goes to the routing policy?', 0, 240, 34, ROLE.cut, 'serif'),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'outer-leaves', outP, 1, { dur: 0.7 });
  cueTo(s, c, 'middle-leaf', midP, 1, { dur: 0.7 });
  cueTo(s, c, 'forest-mean', meanP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'exclude-middle', exclP, 1, { dur: 0.75 });
  cueTo(s, c, 'oob-score', oobP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 8. boosting: How far should the next tree move the prediction?
// Cues: first-gaps, add-correction*, measure-again, remaining-gap, next-rounds
// ---------------------------------------------------------------------------
export function boosting(s, c) {
  const gapP = s.value(0);
  const addP = s.value(0);
  const measP = s.value(0);
  const remP = s.value(0);
  const rndP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.boost, seed: 8 }));
  s.add(decorAura(0, 20, 560, '#60a5fa1e', '#ff6b8b14'));

  const headline = heroTitle(['Gradient Boosting', 'Chases Residuals'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.boost,
    eyebrow: 'LEARNING RATE η = 0.1  ·  HANDLING TIMES [10, 20, 60]',
  });

  const live = dynamic(() => {
    const gp = gapP.value;
    const ad = addP.value;
    const ms = measP.value;
    const rm = remP.value;
    const rn = rndP.value;
    const nodes = [];

    const roundIdx = rn > 0.05 ? Math.min(4, 1 + Math.round(rn * 3)) : ad > 0.2 ? 1 : 0;
    const preds = boost[roundIdx];
    const xs = [-520, -40, 500];
    const yOf = (m) => 255 - (m / 65) * 410;

    nodes.push(
      txt(`ROUND ${roundIdx}  (η = 0.1)`, 820, -375, 34, ROLE.cut, 'mono', 'right').glow(
        7,
        ROLE.cut,
      ),
      line([-680, yOf(0)], [680, yOf(0)], { stroke: '#3c4e78', width: 2.5 }),
    );

    targets.forEach((y, i) => {
      const p = preds[i];
      const resid = y - p;
      const x = xs[i];
      nodes.push(
        // Residual stem
        line([x, yOf(p)], [x, yOf(y)], {
          stroke: ROLE.review,
          width: gp > 0.2 || ms > 0.2 ? 5 : 3,
        }).glow(9, ROLE.review),
        // True target dot (label placed cleanly away from prediction bar and baseline!)
        glowDot(x, yOf(y), { radius: 13, color: ROLE.cut, glow: 12 }),
        txt(
          `y = ${y}m`,
          i < 2 ? x + 34 : x,
          i < 2 ? yOf(y) : yOf(y) - 46,
          28,
          ROLE.cut,
          'mono',
          i < 2 ? 'left' : 'center',
        ),
        // Current prediction bar & dot
        line([x - 70, yOf(p)], [x + 70, yOf(p)], { stroke: ROLE.routine, width: 5 }).glow(
          8,
          ROLE.routine,
        ),
        txt(`ŷ = ${p.toFixed(1)}`, x + 92, yOf(p), 28, ROLE.routine, 'mono', 'left'),
        txt(
          `${resid >= 0 ? '+' : ''}${resid.toFixed(1)}`,
          x - 90,
          (yOf(y) + yOf(p)) / 2,
          28,
          ROLE.review,
          'mono',
          'right',
        ),
      );
    });

    nodes.push(
      txt(
        rn > 0.2
          ? `Round ${roundIdx}: predictions tighten each step ([${preds.map((v) => v.toFixed(1)).join(', ')}])`
          : rm > 0.2
            ? 'Updated 60m prediction = 33.0m · Remaining gap = +27.0m for next tree'
            : ad > 0.2
              ? '30 + 0.1 × (+30) = 33.0m  ·  Left leaf: 30 + 0.1 × (−15) = 28.5m'
              : 'Leaf proposes +30m at η = 0.1 · Where does the 60m prediction land?',
        0,
        325,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'first-gaps', gapP, 1, { dur: 0.7 });
  cueTo(s, c, 'add-correction', addP, 1, { after: true, dur: 0.75 });
  cueTo(s, c, 'measure-again', measP, 1, { dur: 0.6 });
  cueTo(s, c, 'remaining-gap', remP, 1, { dur: 0.6 });
  cueTo(s, c, 'next-rounds', rndP, 1, { dur: 1.2 });
}

// ---------------------------------------------------------------------------
// 9. classification: How much should R3's leaf move?
// Cues: left-step*, right-step*, scale-logits, compare-rounds
// ---------------------------------------------------------------------------
export function classification(s, c) {
  const leftP = s.value(0);
  const rightP = s.value(0);
  const scaleP = s.value(0);
  const rndP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 9 }));
  s.add(decorAura(0, 30, 560, '#6ee7b71e', '#ffd16614'));

  const headline = heroTitle(['Log-Loss Newton', 'Leaf Steps'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'RESIDUAL SUM ÷ CURVATURE SUM  IN LOGIT SPACE',
  });

  const live = dynamic(() => {
    const lf = leftP.value;
    const rt = rightP.value;
    const sc = scaleP.value;
    const rn = rndP.value;
    const [L0, R0] = firstNewtonLeaves;
    const pLeft = sigmoid(0.1 * L0.step); // 0.4700
    const pRight = sigmoid(0.1 * R0.step); // 0.5498
    const loss1 = validationAfterBoosting(1).loss;
    const loss4 = validationAfterBoosting(4).loss;
    const nodes = [];

    // Left leaf vs Right leaf Newton quotients
    nodes.push(
      txt('LEFT LEAF (5 rows, R3 + 4 routine)', -820, -200, 28, ROLE.routine, 'mono', 'left'),
      glowTex(
        lf > 0.2 ? '\\frac{-1.5}{5 \\times 0.25} = -1.2' : '\\frac{-1.5}{5 \\times 0.25} = \\;?',
        { x: -480, y: -95, size: 48, color: lf > 0.2 ? ROLE.cut : COSMOS.ink },
      ),
      txt('RIGHT LEAF (3 reviews)', 120, -200, 28, ROLE.review, 'mono', 'left'),
      glowTex(rt > 0.2 ? '\\frac{+1.5}{3 \\times 0.25} = +2.0' : '\\frac{+1.5}{3 \\times 0.25}', {
        x: 420,
        y: -95,
        size: 48,
        color: rt > 0.2 ? ROLE.cut : COSMOS.muted,
      }),
    );

    // Probability ruler moving from 0.50 -> 0.470 / 0.550 on scale-logits
    const rx0 = -720;
    const rx1 = 720;
    const ry = 105;
    const xOf = (p) => mix(rx0, rx1, (p - 0.35) / 0.3);
    const curL = mix(0.5, pLeft, sc);
    const curR = mix(0.5, pRight, sc);

    nodes.push(
      txt('SIGMOID PROBABILITY RULER  (η = 0.1)', rx0, ry - 72, 26, ROLE.good, 'mono', 'left'),
      line([rx0, ry], [rx1, ry], { stroke: '#455a88', width: 3.5 }),
      line([xOf(0.5), ry - 26], [xOf(0.5), ry + 26], {
        stroke: COSMOS.muted,
        width: 2.5,
        dash: [6, 5],
      }),
      txt('0.50', xOf(0.5), ry + 54, 26, COSMOS.muted, 'mono'),
      glowDot(xOf(curL), ry, { radius: 13, color: ROLE.routine, glow: 12 }),
      txt(`Left: ${curL.toFixed(3)}`, xOf(curL) - 18, ry - 44, 28, ROLE.routine, 'mono', 'right'),
      glowDot(xOf(curR), ry, { radius: 13, color: ROLE.review, glow: 12 }),
      txt(`Right: ${curR.toFixed(3)}`, xOf(curR) + 18, ry - 44, 28, ROLE.review, 'mono', 'left'),
    );

    if (rn > 0.05) {
      nodes.push(
        txt(
          `Rounds 1 → 4 validation log-loss drops: ${loss1.toFixed(3)} → ${loss4.toFixed(3)} (V3 & V8 still missed at 0.5)`,
          0,
          285,
          30,
          ROLE.cut,
          'mono',
        )
          .glow(7, ROLE.cut)
          .opacity(rn),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'left-step', leftP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'right-step', rightP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'scale-logits', scaleP, 1, { dur: 0.85 });
  cueTo(s, c, 'compare-rounds', rndP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 10. evaluate: What did the review queue cost?
// Cues: validation-misses*, strict-total*, lower-threshold, extra-reviews*, permute-ambiguity
// ---------------------------------------------------------------------------
export function evaluate(s, c) {
  const missP = s.value(0);
  const totP = s.value(0);
  const lowP = s.value(0);
  const extP = s.value(0);
  const permP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.cost, seed: 10 }));
  s.add(decorAura(0, 30, 560, '#fb923c1e', '#ff6b8b14'));

  const headline = heroTitle(['Price the Mistakes,', 'Not Just F1'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.cost,
    eyebrow: '8 VALIDATION REQUESTS  ·  MISS = $120  ·  EXTRA = $18',
  });

  const live = dynamic(() => {
    const ms = missP.value;
    const tt = totP.value;
    const lw = lowP.value;
    const ex = extP.value;
    const pm = permP.value;
    const strictEntries = stumpBill(0.5, 120).entries;
    const wideEntries = stumpBill(0.2, 120).entries;
    const nodes = [];

    // 8 fixed validation columns V1..V8
    strictEntries.forEach((e, i) => {
      const cx = -740 + i * 210;
      const isMiss = !e.review && e.row[2] === 1; // V3, V8
      const isWideExtra = wideEntries[i].review && !e.row[2];
      const col = e.row[2] ? ROLE.review : ROLE.routine;

      nodes.push(
        txt(e.id, cx, -195, 30, COSMOS.ink, 'mono'),
        txt(e.row[2] ? 'REV' : 'rout', cx, -142, 26, col, 'mono'),
        txt(e.score.toFixed(1), cx, -88, 28, COSMOS.muted, 'mono'),
        // Strict >= 0.5 row
        rect(155, 62, {
          fill: isMiss && ms > 0.2 ? '#2c101b' : '#111a30',
          stroke: isMiss && ms > 0.2 ? ROLE.review : '#32446c',
          width: isMiss && ms > 0.2 ? 3.2 : 1.8,
          radius: 10,
        })
          .at(cx, 0)
          .glow(isMiss && ms > 0.2 ? 10 : 0, ROLE.review),
        txt(
          isMiss && ms > 0.2 ? 'MISS $120' : e.review ? 'Review' : 'Auto',
          cx,
          0,
          26,
          isMiss && ms > 0.2 ? ROLE.review : COSMOS.ink,
          'mono',
        ),
      );

      // Wide >= 0.2 row (quiet placeholder slots when lw <= 0.1 so bottom half stays balanced)
      if (pm < 0.3) {
        nodes.push(
          group(
            rect(155, 62, {
              fill: lw > 0.1 ? (isWideExtra ? '#281e10' : '#102421') : '#0d1424',
              stroke: lw > 0.1 ? (isWideExtra ? ROLE.cost : ROLE.good) : '#222f4d',
              width: lw > 0.1 ? 2.2 : 1.6,
              radius: 10,
            }).at(cx, 118),
            txt(
              lw > 0.1 ? (isWideExtra ? 'Extra $18' : 'Review') : '?',
              cx,
              118,
              26,
              lw > 0.1 ? (isWideExtra ? ROLE.cost : ROLE.good) : COSMOS.dim,
              'mono',
            ),
          ).opacity(mix(0.55, 1, lw)),
        );
      }
    });

    // Bottom bills or permutation shock
    if (pm > 0.1) {
      nodes.push(
        txt('PERMUTED AMBIGUITY COLUMN:  Bill surges $240 → $516!', 0, 265, 38, ROLE.review, 'mono')
          .glow(10, ROLE.review)
          .opacity(pm),
      );
    } else {
      nodes.push(
        txt(
          tt > 0.1 ? 'Cutoff ≥ 0.5: 2 misses = $240' : 'Cutoff ≥ 0.5 total bill:  ?',
          -820,
          265,
          32,
          tt > 0.1 ? ROLE.review : COSMOS.dim,
          'mono',
          'left',
        ).opacity(mix(0.65, 1, tt)),
        txt(
          ex > 0.1 ? 'Cutoff ≥ 0.2: 4 extras = $72 (same F1!)' : 'Cutoff ≥ 0.2 total bill:  ?',
          820,
          265,
          32,
          ex > 0.1 ? ROLE.good : COSMOS.dim,
          'mono',
          'right',
        )
          .glow(ex > 0.1 ? 8 : 0, ROLE.good)
          .opacity(mix(0.65, 1, ex)),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'validation-misses', missP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'strict-total', totP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'lower-threshold', lowP, 1, { dur: 0.75 });
  cueTo(s, c, 'extra-reviews', extP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'permute-ambiguity', permP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 11. importance-explanation: What explains a score of one fifth?
// Cues: shuffle-features, shap-contribution
// ---------------------------------------------------------------------------
export function importanceExplanation(s, c) {
  const shufP = s.value(0);
  const shapP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.cut, seed: 11 }));
  s.add(decorAura(0, 30, 560, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['MDI Bias, Permutation', '& Shapley Attribution'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.cut,
    eyebrow: 'FEATURE IMPORTANCE  &  R3 EXPLANATION',
  });

  const live = dynamic(() => {
    const sh = shufP.value;
    const sp = shapP.value;
    const nodes = [];

    // Left: Training MDI (Noise 92%, Binary 8%) vs Held-out Permutation Drop
    const lx = -810;
    nodes.push(
      txt('TRAINING MDI (BIASED TOWARD NOISE)', lx, -205, 26, ROLE.review, 'mono', 'left'),
      txt('Noise: 92%', lx, -130, 28, ROLE.review, 'mono', 'left'),
      glowBar(lx + 260, -130, 470, 38, ROLE.review, { glow: 9 }),
      txt('Signal: 8%', lx, -62, 28, ROLE.good, 'mono', 'left'),
      glowBar(lx + 260, -62, 46, 38, ROLE.good, { glow: 9 }),
    );

    if (sh > 0.05) {
      nodes.push(
        group(
          txt('HELD-OUT PERMUTATION F1 DROP', lx, 55, 26, ROLE.routine, 'mono', 'left'),
          txt('Noise: ~0.00', lx, 130, 28, COSMOS.dim, 'mono', 'left'),
          glowBar(lx + 260, 130, 14, 38, COSMOS.dim, { glow: 0 }),
          txt('Signal: −0.10', lx, 198, 28, ROLE.good, 'mono', 'left'),
          glowBar(lx + 260, 198, 430 * sh, 38, ROLE.good, { glow: 11 }),
        ).opacity(sh),
      );
    }

    nodes.push(rule(20, -210, 20, 300, '#2a3759', 2));

    // Right: Shapley ruler for R3 (baseline 0.50 -> amb=-0.30 -> 0.20; support=0)
    const rx0 = 110;
    const rx1 = 820;
    const ry = 20;
    const xOf = (v) => mix(rx0, rx1, v);
    const pos = mix(0.5, 0.2, sp);
    nodes.push(
      txt('SHAPLEY EXPLANATION FOR R3', rx0, -205, 26, ROLE.cut, 'mono', 'left'),
      line([rx0, ry], [rx1, ry], { stroke: '#455a88', width: 3.5 }),
      txt('0.0', rx0, ry + 52, 26, COSMOS.muted, 'mono'),
      txt('0.2', xOf(0.2), ry + 52, 28, ROLE.cut, 'mono'),
      txt('0.5', xOf(0.5), ry + 52, 28, COSMOS.ink, 'mono'),
      txt('1.0', rx1, ry + 52, 26, COSMOS.muted, 'mono'),
      glowDot(xOf(0.5), ry, { radius: 9, color: COSMOS.muted, glow: 5 }),
      glowDot(xOf(pos), ry, { radius: 13, color: ROLE.cut, glow: 14 }),
      txt(
        sp > 0.2 ? 'Ambiguity = −0.30  ·  Support = 0.00' : 'Baseline mean = 0.50',
        rx0,
        155,
        30,
        ROLE.cut,
        'mono',
        'left',
      ),
      txt(
        sp > 0.2 ? '0.50 − 0.30 = 0.20 (R3 score)' : 'Fix ambiguity = 2.0',
        rx0,
        220,
        30,
        COSMOS.ink,
        'serif',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'shuffle-features', shufP, 1, { dur: 0.85 });
  cueTo(s, c, 'shap-contribution', shapP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 12. missing-contract: What can change a tree's prediction?
// Cues: densify-missing
// ---------------------------------------------------------------------------
export function missingContract(s, c) {
  const densP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.entropy, seed: 12 }));
  s.add(decorAura(0, 30, 560, '#a78bfa1e', '#fb923c14'));

  const headline = heroTitle(['Missing Values &', 'Bias-Variance Decomposition'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.entropy,
    eyebrow: 'ABSENT VS STORED ZERO  ·  E[(y − ŷ)²]',
  });

  const live = dynamic(() => {
    const dn = densP.value;
    const ph = drift.value;
    const pulse = 1 + 0.08 * Math.sin(ph * Math.PI * 8);
    const cellVal = dn > 0.4 ? '0 (filled!)' : 'NaN / absent';
    const route = dn > 0.4 ? '→ AUTO-PASS (same as 0!)' : '→ REVIEW BRANCH';
    const routeCol = dn > 0.4 ? ROLE.cost : ROLE.review;

    return group(
      // Left: Missing vs stored zero
      txt('MISSING VALUE REPRESENTATION', -820, -195, 26, ROLE.cut, 'mono', 'left'),
      rect(340, 80, { fill: '#121a30', stroke: routeCol, width: 3, radius: 12 })
        .at(-650, -75)
        .glow(9, routeCol),
      txt(cellVal, -650, -75, 30, routeCol, 'mono'),
      txt(route, -445, -75, 30, routeCol, 'mono', 'left'),
      rect(340, 80, { fill: '#121a30', stroke: ROLE.routine, width: 2.4, radius: 12 }).at(-650, 55),
      txt('Stored 0', -650, 55, 30, ROLE.routine, 'mono'),
      txt('→ AUTO-PASS', -445, 55, 30, ROLE.routine, 'mono', 'left'),
      txt(
        'Densifying empty cells silently reroutes predictions',
        -820,
        185,
        28,
        COSMOS.muted,
        'serif',
        'left',
      ),

      // Bottom/Right: Bias^2 + Variance + Noise
      glowTex(
        '\\mathbb{E}[(y - \\hat{y})^2] = \\text{Bias}^2 + \\text{Variance} + \\sigma_{\\text{noise}}^2',
        {
          x: 0,
          y: 300,
          size: 46,
          color: ROLE.entropy,
          glow: 8 * pulse,
        },
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'densify-missing', densP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 13. transfer: Where does the next request go? (FINALE TRANSFER TEST)
// Cues: ticket-score*, forty-price, forty-extra*, forty-misses*, forty-choice*, forty-route*,
//       reprice, thirty-choice*, thirty-misses*, thirty-route*, open-ticket*, book-miss*, caught-review
// ---------------------------------------------------------------------------
export function transfer(s, c) {
  const scP = s.value(0);
  const fPriceP = s.value(0);
  const fExtP = s.value(0);
  const fMisP = s.value(0);
  const fChP = s.value(0);
  const fRtP = s.value(0);
  const repP = s.value(0);
  const tChP = s.value(0);
  const tMisP = s.value(0);
  const tRtP = s.value(0);
  const openP = s.value(0);
  const bookP = s.value(0);
  const cgtP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.cut, seed: 13 }));
  s.add(decorAura(0, 20, 580, '#ffd1661e', '#6ee7b714'));

  const headline = heroTitle(['Same Model, Same Score,', 'Different Decision'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.cut,
    eyebrow: 'FRESH REQUEST AT EXACT CUT  amb = 3.35',
  });

  const live = dynamic(() => {
    const sc = scP.value;
    const fp = fPriceP.value;
    const fe = fExtP.value;
    const fm = fMisP.value;
    const fc = fChP.value;
    const fr = fRtP.value;
    const rp = repP.value;
    const tc = tChP.value;
    const tm = tMisP.value;
    const tr = tRtP.value;
    const op = openP.value;
    const bk = bookP.value;
    const cg = cgtP.value;
    const nodes = [];

    // Left: Frozen fresh ticket
    const tx = -510;
    nodes.push(
      txt('FRESH REQUEST TICKET', tx, -200, 26, ROLE.routine, 'mono'),
      rect(620, 240, {
        fill: '#11192e',
        stroke: op > 0.2 ? ROLE.review : ROLE.routine,
        width: 3.2,
        radius: 16,
      })
        .at(tx, -35)
        .glow(10, op > 0.2 ? ROLE.review : ROLE.routine),
      txt('amb = 3.35  (≤ 3.35 → left leaf)', tx, -105, 26, COSMOS.muted, 'mono'),
      txt(sc > 0.2 ? 'Leaf score: 1/5 = 0.20' : 'Leaf score: ?', tx, -30, 38, ROLE.cut, 'mono'),
      txt(
        op > 0.2
          ? 'OPENED LABEL: NEEDED REVIEW!'
          : tr > 0.2
            ? 'Route ($30 miss): AUTO-PASS'
            : fr > 0.2 && rp < 0.3
              ? 'Route ($40 miss): TO REVIEW'
              : 'Waiting for policy cutoff',
        tx,
        42,
        28,
        op > 0.2 ? ROLE.review : tr > 0.2 ? ROLE.cost : ROLE.good,
        'mono',
      ),
    );

    // Right: Policy cost scoreboard ($40 miss -> $30 miss)
    const rx = 120;
    const isThirty = rp > 0.3;
    const missPrice = isThirty ? 30 : 40;
    const showForty = fp > 0.1 && !isThirty;
    nodes.push(
      txt(
        fp > 0.1
          ? `VALIDATION BILLS (MISS = $${missPrice} · EXTRA = $18)`
          : 'FROZEN STUMP · 8 VALIDATION ROWS',
        rx,
        -200,
        26,
        ROLE.cut,
        'mono',
        'left',
      ),
    );

    if (showForty) {
      if (fe > 0.1) {
        nodes.push(
          txt(
            'Cutoff ≥ 0.2 (4 extras):  $72',
            rx,
            -90,
            34,
            fc > 0.2 ? ROLE.good : COSMOS.ink,
            'mono',
            'left',
          ),
        );
      }
      if (fm > 0.1) {
        nodes.push(txt('Cutoff ≥ 0.5 (2 misses):  $80', rx, -15, 34, COSMOS.muted, 'mono', 'left'));
      }
      if (fc > 0.1) {
        nodes.push(
          txt('WINNER: Cutoff ≥ 0.2 ($72 < $80)', rx, 85, 34, ROLE.good, 'mono', 'left').glow(
            9,
            ROLE.good,
          ),
        );
      }
    } else if (isThirty) {
      if (tm > 0.1) {
        nodes.push(
          txt(
            'Cutoff ≥ 0.5 (2 misses):  $60',
            rx,
            -90,
            34,
            tc > 0.2 ? ROLE.good : COSMOS.ink,
            'mono',
            'left',
          ),
        );
        nodes.push(txt('Cutoff ≥ 0.2 (4 extras):  $72', rx, -15, 34, COSMOS.muted, 'mono', 'left'));
      } else {
        nodes.push(
          txt('Which cutoff is cheaper at $30/miss?', rx, -55, 32, ROLE.cut, 'serif', 'left'),
        );
      }
      if (tc > 0.1) {
        nodes.push(
          txt('WINNER FLIPS: Cutoff ≥ 0.5 ($60 < $72)', rx, 85, 34, ROLE.good, 'mono', 'left').glow(
            9,
            ROLE.good,
          ),
        );
      }
    }

    if (bk > 0.1 || cg > 0.1) {
      nodes.push(
        txt(
          cg > 0.2
            ? 'Half cutoff booked a $30 miss · 1/5 cutoff would have caught it!'
            : 'Half cutoff books a $30 miss!',
          0,
          275,
          32,
          ROLE.review,
          'serif',
        ).glow(8, ROLE.review),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'ticket-score', scP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'forty-price', fPriceP, 1, { dur: 0.65 });
  cueTo(s, c, 'forty-extra', fExtP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'forty-misses', fMisP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'forty-choice', fChP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'forty-route', fRtP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'reprice', repP, 1, { dur: 0.7 });
  cueTo(s, c, 'thirty-choice', tChP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'thirty-misses', tMisP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'thirty-route', tRtP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'open-ticket', openP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'book-miss', bookP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'caught-review', cgtP, 1, { dur: 0.6 });
}
