// Act 1 (Scenes 1-6): Intro Split, Geometry Limits & Monotone Transforms, Impurity Grid & Curves,
// Criteria Compare (Gini vs Entropy vs MSE), Stump Search, and 3D Overfit Depth Surface.
import { circle, dynamic, group, line, rect, surface } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decorAura,
  entropy,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  orbitScene,
  rows,
  rule,
  stump,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Which review will this split miss?
// Cues: first-divider, name-exception*, all-requests, catch-rthree, joined-queue
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const divP = s.value(0);
  const exP = s.value(0);
  const allP = s.value(0);
  const sweepP = s.value(0);
  const joinP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.cut, seed: 1 }));
  s.add(decorAura(0, 30, 560, '#ffd1661c', '#ff6b8b12'));

  const headline = heroTitle(['How Trees Learn', 'to Divide a Space'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.cut,
    eyebrow: 'AXIS-ALIGNED THRESHOLD SPLITS',
  });

  const live = dynamic(() => {
    const dv = divP.value;
    const ex = exP.value;
    const al = allP.value;
    const sw = sweepP.value;
    const jn = joinP.value;
    const nodes = [];

    const x0 = -760;
    const x1 = 760;
    const axisY = 30;
    const xOf = (amb) => mix(x0, x1, (amb - 0.5) / 4.5);
    const cutVal = mix(3.35, 1.75, sw);
    const cutX = xOf(cutVal);

    nodes.push(
      txt('AMBIGUITY SCORE', 0, axisY + 125, 28, COSMOS.muted, 'mono'),
      line([x0, axisY], [x1, axisY], { stroke: '#455a88', width: 3.5 }),
      txt('1.0', xOf(1), axisY + 62, 26, COSMOS.muted, 'mono'),
      txt('2.0', xOf(2), axisY + 62, 26, COSMOS.muted, 'mono'),
      txt('3.0', xOf(3), axisY + 62, 26, COSMOS.muted, 'mono'),
      txt('4.0', xOf(4), axisY + 62, 26, COSMOS.muted, 'mono'),
    );

    // Yellow vertical divider sweeping left from 3.35 -> 1.75 (height avoids R1..R8 labels at y=-118!)
    if (dv > 0.05) {
      nodes.push(
        line([cutX, -68], [cutX, axisY + 34], { stroke: ROLE.cut, width: 4.5 }).glow(10, ROLE.cut),
        txt(`cut = ${cutVal.toFixed(2)}`, cutX, -185, 28, ROLE.cut, 'mono'),
        txt('AUTO-PASS', cutX - 30, -145, 26, ROLE.routine, 'mono', 'right'),
        txt('TO REVIEW →', cutX + 30, -145, 26, ROLE.review, 'mono', 'left'),
      );
    }

    // Request badges: initial 3 are R1 (idx 0), R3 (idx 2), R4 (idx 3); all 8 appear on all-requests
    const initIndices = new Set([0, 2, 3]);
    rows.forEach((r, idx) => {
      const show = initIndices.has(idx) ? 1 : al;
      if (show < 0.05) return;
      const amb = r[0];
      const isRev = r[2] === 1;
      const col = isRev ? ROLE.review : ROLE.routine;
      const px = xOf(amb);
      const py = axisY - 58;
      const hiR3 = idx === 2 && ex > 0.2;
      const hiJoined = (idx === 6 || idx === 7) && jn > 0.2;
      nodes.push(
        group(
          circle(hiR3 || hiJoined ? 24 : 18, {
            fill: '#121a30',
            stroke: hiJoined ? ROLE.cost : col,
            width: hiR3 || hiJoined ? 3.5 : 2.5,
          })
            .at(px, py)
            .glow(hiR3 || hiJoined ? 12 : 6, hiJoined ? ROLE.cost : col),
          txt(`R${idx + 1}`, px, py - 58, 26, hiJoined ? ROLE.cost : col, 'mono'),
        ).opacity(show),
      );
    });

    // Bottom takeaway
    if (jn > 0.1) {
      nodes.push(
        txt(
          'Catching R3 dragged routine R7 & R8 into review (+2 unnecessary reviews)',
          0,
          275,
          32,
          ROLE.cost,
          'serif',
        )
          .glow(7, ROLE.cost)
          .opacity(jn),
      );
    } else if (ex > 0.1) {
      nodes.push(
        txt('Missed review: R3 (ambiguity = 2.0)', 0, 275, 34, ROLE.review, 'serif')
          .glow(8, ROLE.review)
          .opacity(ex),
      );
    } else {
      nodes.push(
        txt(
          'Two requests needed review · Which one did the split miss?',
          0,
          275,
          32,
          ROLE.cut,
          'serif',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'first-divider', divP, 1, { dur: 0.7 });
  cueTo(s, c, 'name-exception', exP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'all-requests', allP, 1, { dur: 0.8 });
  cueTo(s, c, 'catch-rthree', sweepP, 1, { dur: 1.0 });
  cueTo(s, c, 'joined-queue', joinP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 2. geometry-limits: What happens between two training values?
// Cues: square-endpoints, squared-route*
// ---------------------------------------------------------------------------
export function geometryLimits(s, c) {
  const sqP = s.value(0);
  const routeP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.routine, seed: 2 }));
  s.add(decorAura(-350, 30, 440, '#5ce1e61c', '#07091000'));
  s.add(decorAura(380, 30, 440, '#ffd1661c', '#07091000'));

  const headline = heroTitle(['Axis Staircases &', 'Midpoint Shifts'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.routine,
    eyebrow: 'LINEAR DIAGONAL  VS  TREE STAIRCASE',
  });

  const live = dynamic(() => {
    const sq = sqP.value;
    const rt = routeP.value;
    const nodes = [];

    // Left: 2D diagonal vs axis-aligned staircase
    const gx0 = -800;
    const gx1 = -160;
    const gy0 = 260;
    const gy1 = -190;
    const stair = [];
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const xA = mix(gx0, gx1, i / steps);
      const xB = mix(gx0, gx1, (i + 1) / steps);
      const yA = mix(gy0, gy1, i / steps);
      const yB = mix(gy0, gy1, (i + 1) / steps);
      stair.push([xA, yA], [xB, yA], [xB, yB]);
    }
    nodes.push(
      txt('DIAGONAL RULE VS TREE STAIRCASE', gx0, -225, 26, ROLE.routine, 'mono', 'left'),
      line([gx0, gy0], [gx1, gy0], { stroke: '#3e527e', width: 2.5 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#3e527e', width: 2.5 }),
      line([gx0, gy0], [gx1, gy1], { stroke: ROLE.entropy, width: 3.5, dash: [10, 8] }).glow(
        8,
        ROLE.entropy,
      ),
      glowingTrail(stair, { color: ROLE.cut, width: 3.8, glow: 9 }),
      txt('Ambiguity', (gx0 + gx1) / 2, gy0 + 48, 26, COSMOS.muted, 'sans'),
      txt('Linear = 1 line · Tree = staircase', gx0, gy0 + 96, 26, COSMOS.muted, 'sans', 'left'),
    );

    // Right: Aligned raw x ruler [1..4] vs squared x^2 ruler [1..16]
    const rx0 = 60;
    const rx1 = 820;
    const yRaw = -70;
    const ySq = 155;
    const rawX = (v) => mix(rx0, rx1, (v - 1) / 3);
    const sqX = (v) => mix(rx0, rx1, (v - 1) / 15);

    nodes.push(
      txt(
        'RAW SCALE  x ∈ [1, 4]  ·  MIDPOINT = 2.5',
        rx0,
        yRaw - 95,
        26,
        ROLE.routine,
        'mono',
        'left',
      ),
      line([rx0, yRaw], [rx1, yRaw], { stroke: '#455a88', width: 3.2 }),
      line([rawX(2.5), yRaw - 34], [rawX(2.5), yRaw + 34], { stroke: ROLE.cut, width: 3.5 }),
      txt('1', rx0, yRaw + 52, 26, COSMOS.muted, 'mono'),
      txt('2.5', rawX(2.5), yRaw + 52, 26, ROLE.cut, 'mono'),
      txt('4', rx1, yRaw + 52, 26, COSMOS.muted, 'mono'),
      glowDot(rawX(2.8), yRaw, { radius: 12, color: ROLE.review, glow: 12 }),
      txt('2.8 → RIGHT', rawX(2.8) + 22, yRaw - 48, 28, ROLE.review, 'mono', 'left'),
    );

    if (sq > 0.05) {
      nodes.push(
        group(
          txt(
            'SQUARED SCALE  x² ∈ [1, 16]  ·  MIDPOINT = 8.5',
            rx0,
            ySq - 95,
            26,
            ROLE.cut,
            'mono',
            'left',
          ),
          line([rx0, ySq], [rx1, ySq], { stroke: '#455a88', width: 3.2 }),
          line([sqX(8.5), ySq - 34], [sqX(8.5), ySq + 34], { stroke: ROLE.cut, width: 3.5 }),
          txt('1', rx0, ySq + 52, 26, COSMOS.muted, 'mono'),
          txt('8.5', sqX(8.5), ySq + 52, 26, ROLE.cut, 'mono'),
          txt('16', rx1, ySq + 52, 26, COSMOS.muted, 'mono'),
          rt > 0.2
            ? group(
                glowDot(sqX(7.84), ySq, { radius: 13, color: ROLE.good, glow: 14 }),
                txt(
                  '2.8² = 7.84 → LEFT!',
                  sqX(7.84) - 18,
                  ySq - 48,
                  28,
                  ROLE.good,
                  'mono',
                  'right',
                ),
              )
            : txt(
                'Where does x = 2.8 land after squaring?',
                rx0,
                ySq + 115,
                30,
                ROLE.cut,
                'serif',
                'left',
              ),
        ).opacity(sq),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'square-endpoints', sqP, 1, { dur: 0.85 });
  cueTo(s, c, 'squared-route', routeP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 3. impurity: How mixed is this leaf?
// Cues: impurity-probe-b1-1, gini-rule-b2-1, entropy-example-b3-1
// ---------------------------------------------------------------------------
export function impurity(s, c) {
  const probeP = s.value(0);
  const giniP = s.value(0);
  const entP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.entropy, seed: 3 }));
  s.add(decorAura(340, 20, 480, '#a78bfa1e', '#5ce1e614'));

  const headline = heroTitle(['Gini Impurity', '& Entropy'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.entropy,
    eyebrow: 'DISAGREEMENT RATE  VS  BITS OF UNCERTAINTY',
  });

  const live = dynamic(() => {
    const pr = probeP.value;
    const gn = giniP.value;
    const en = entP.value;
    const nodes = [];

    // Left: 8x8 ordered pair disagreement matrix (32 of 64 lit up!)
    const mx0 = -770;
    const my0 = -155;
    const step = 54;
    nodes.push(
      txt(
        '8 × 8 ORDERED PAIRS  (32 / 64 DISAGREE = 0.50)',
        mx0 - 20,
        -215,
        26,
        ROLE.cut,
        'mono',
        'left',
      ),
    );
    for (let r = 0; r < 8; r++) {
      for (let col = 0; col < 8; col++) {
        const disagree = rows[r][2] !== rows[col][2];
        const lit = disagree && pr > 0.1;
        nodes.push(
          rect(46, 46, {
            fill: lit ? ROLE.cut : '#111a30',
            stroke: lit ? '#fff3cc' : '#263558',
            width: lit ? 1.8 : 1.1,
            radius: 6,
          })
            .at(mx0 + col * step, my0 + r * step)
            .opacity(lit ? 0.9 * pr : 0.6),
        );
      }
    }

    // Right: Gini 2p(1-p) & Entropy -p log2 p - (1-p) log2(1-p) curves
    const gx0 = 60;
    const gx1 = 830;
    const gy0 = 240;
    const gy1 = -190;
    const xOf = (p) => mix(gx0, gx1, p);
    const yOf = (v) => mix(gy0, gy1, v);

    const gPts = [];
    const ePts = [];
    for (let i = 0; i <= 80; i++) {
      const p = i / 80;
      gPts.push([xOf(p), yOf(2 * p * (1 - p))]);
      ePts.push([xOf(p), yOf(entropy(p))]);
    }

    nodes.push(
      line([gx0, gy0], [gx1, gy0], { stroke: '#425582', width: 2.8 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#425582', width: 2.8 }),
      txt('0.0', gx0, gy0 + 44, 26, COSMOS.muted, 'mono'),
      txt('0.5', xOf(0.5), gy0 + 44, 26, ROLE.cut, 'mono'),
      txt('1.0', gx1, gy0 + 44, 26, COSMOS.muted, 'mono'),
      txt('Review share p', (gx0 + gx1) / 2, gy0 + 92, 26, COSMOS.muted, 'sans'),
    );

    if (gn > 0.05) {
      nodes.push(
        glowingTrail(gPts, { color: ROLE.routine, width: 4.5, glow: 10, opacity: gn }),
        txt('Gini = 2p(1−p)  [peak 0.5]', gx1, gy1 - 76, 26, ROLE.routine, 'mono', 'right').opacity(
          gn,
        ),
      );
    }
    if (en > 0.05) {
      nodes.push(
        glowingTrail(ePts, { color: ROLE.review, width: 4.5, glow: 10, opacity: en }),
        txt('Entropy (bits)  [peak 1.0]', gx1, gy1 - 36, 26, ROLE.review, 'mono', 'right').opacity(
          en,
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'impurity-probe-b1-1', probeP, 1, { dur: 0.9 });
  cueTo(s, c, 'gini-rule-b2-1', giniP, 1, { dur: 0.85 });
  cueTo(s, c, 'entropy-example-b3-1', entP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 4. criteria-compare: Which cut wins on the same labels?
// Cues: criterion-gini*, criterion-entropy*, regression-split
// ---------------------------------------------------------------------------
export function criteriaCompare(s, c) {
  const giniP = s.value(0);
  const entP = s.value(0);
  const regP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.routine, seed: 4 }));
  s.add(decorAura(0, 30, 560, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Gini vs Entropy', '& Regression MSE'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.routine,
    eyebrow: 'SAME 24 LABELS  ·  DIFFERENT WINNERS',
  });

  const view1 = guardedDynamic(
    () => fadeOut(regP.value),
    (vis) => {
      const gn = giniP.value;
      const en = entP.value;
      return group(
        // Cut A
        txt('CUT A:  [4 routine]  |  [12 rev, 8 rout]', -820, -185, 30, ROLE.cut, 'mono', 'left'),
        glowBar(-820, -110, 140, 50, ROLE.routine, { glow: 8 }),
        glowBar(-640, -110, 420, 50, ROLE.review, { glow: 8 }),
        glowBar(-214, -110, 280, 50, ROLE.routine, { glow: 8 }),
        // Cut B
        txt(
          'CUT B:  [9 rev, 3 rout]  |  [3 rev, 9 rout]',
          -820,
          35,
          30,
          ROLE.routine,
          'mono',
          'left',
        ),
        glowBar(-820, 110, 315, 50, ROLE.review, { glow: 8 }),
        glowBar(-500, 110, 105, 50, ROLE.routine, { glow: 8 }),
        glowBar(-355, 110, 105, 50, ROLE.review, { glow: 8 }),
        glowBar(-245, 110, 315, 50, ROLE.routine, { glow: 8 }),

        // Right scoreboard (strictly withheld until after cues!)
        rule(140, -200, 140, 260, '#2a3759', 2),
        txt('GAIN SCOREBOARD', 200, -185, 28, COSMOS.muted, 'mono', 'left'),
        gn > 0.05
          ? group(
              txt('GINI GAIN:', 200, -90, 28, ROLE.routine, 'mono', 'left'),
              txt(
                'Cut B = 0.125  >  Cut A = 0.100',
                200,
                -35,
                32,
                ROLE.routine,
                'mono',
                'left',
              ).glow(8, ROLE.routine),
              txt('Gini picks Cut B', 200, 18, 30, COSMOS.ink, 'serif', 'left'),
            ).opacity(gn)
          : group(),
        en > 0.05
          ? group(
              txt('ENTROPY GAIN (BITS):', 200, 115, 28, ROLE.review, 'mono', 'left'),
              txt(
                'Cut A = 0.191  >  Cut B = 0.189',
                200,
                170,
                32,
                ROLE.review,
                'mono',
                'left',
              ).glow(8, ROLE.review),
              txt('Entropy flips to Cut A!', 200, 224, 30, ROLE.review, 'serif', 'left'),
            ).opacity(en)
          : group(),
      ).opacity(vis);
    },
  );

  const view2 = guardedDynamic(
    () => fadeIn(regP.value),
    (vis) => {
      const xs = [-480, -80, 480];
      const ys = [10, 20, 60];
      const yOf = (m) => 220 - (m / 65) * 380;
      const splitPred = [15, 15, 60];
      return group(
        txt('REGRESSION TREE MSE:  [10, 20, 60] MINUTES', -820, -210, 28, ROLE.cut, 'mono', 'left'),
        line([-640, yOf(30)], [640, yOf(30)], { stroke: COSMOS.dim, width: 2.5, dash: [10, 8] }),
        txt('Root mean = 30  (MSE = 466.7)', 640, yOf(30) - 34, 26, COSMOS.dim, 'mono', 'right'),
        line([-640, yOf(15)], [120, yOf(15)], { stroke: ROLE.good, width: 4 }).glow(8, ROLE.good),
        line([280, yOf(60)], [640, yOf(60)], { stroke: ROLE.good, width: 4 }).glow(8, ROLE.good),
        ...xs.flatMap((x, i) => [
          line([x, yOf(ys[i])], [x, yOf(splitPred[i])], { stroke: ROLE.review, width: 3.5 }),
          glowDot(x, yOf(ys[i]), { radius: 13, color: ROLE.cut, glow: 12 }),
          txt(
            `${ys[i]}m`,
            i === 1 ? x + 36 : x,
            i === 0 ? yOf(ys[i]) + 46 : i === 1 ? yOf(ys[i]) : yOf(ys[i]) - 46,
            30,
            ROLE.cut,
            'mono',
            i === 1 ? 'left' : 'center',
          ),
        ]),
        txt('Split MSE = 16.7  →  Saves 450 sq. min!', 0, 295, 36, ROLE.good, 'mono').glow(
          9,
          ROLE.good,
        ),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'criterion-gini', giniP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'criterion-entropy', entP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'regression-split', regP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 5. search: Which gap buys the most agreement?
// Cues: tree-partition-b1-1, split-gain-b2-1, tree-partition-b3-1
// ---------------------------------------------------------------------------
export function search(s, c) {
  const sweepP = s.value(0);
  const gainP = s.value(0);
  const winP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.cut, seed: 5 }));
  s.add(decorAura(0, 30, 560, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Searching Every Gap', 'for Maximum Gain'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.cut,
    eyebrow: 'EXHAUSTIVE STUMP SEARCH',
  });

  const live = dynamic(() => {
    const sw = sweepP.value;
    const gn = gainP.value;
    const wn = winP.value;
    const nodes = [];

    const x0 = -760;
    const x1 = 760;
    const axisY = -35;
    const xOf = (a) => mix(x0, x1, (a - 0.5) / 4.5);
    const activeCut = wn > 0.1 || gn > 0.1 ? 3.35 : mix(1.25, 3.35, sw);

    nodes.push(
      line([x0, axisY], [x1, axisY], { stroke: '#455a88', width: 3.5 }),
      line([xOf(activeCut), axisY - 72], [xOf(activeCut), axisY + 20], {
        stroke: ROLE.cut,
        width: 4.5,
      }).glow(11, ROLE.cut),
      txt(`midpoint = ${activeCut.toFixed(2)}`, xOf(activeCut), -210, 30, ROLE.cut, 'mono'),
    );

    rows.forEach((r, i) => {
      const col = r[2] ? ROLE.review : ROLE.routine;
      const px = xOf(r[0]);
      nodes.push(
        glowDot(px, axisY - 48, { radius: 13, color: col, glow: 10 }),
        txt(`R${i + 1}`, px, axisY - 108, 26, col, 'mono'),
        txt(r[0].toFixed(1), px, axisY + 52, 26, COSMOS.muted, 'mono'),
      );
    });

    nodes.push(
      group(
        txt(
          'LEFT LEAF (5 rows): 1/5 review → Gini = 0.32',
          -760,
          120,
          30,
          ROLE.routine,
          'mono',
          'left',
        ),
        txt(
          'RIGHT LEAF (3 rows): 3/3 review → Gini = 0.00',
          -760,
          178,
          30,
          ROLE.review,
          'mono',
          'left',
        ),
      ).opacity(mix(0.42, 1, gn)),
    );

    if (wn > 0.05) {
      nodes.push(
        group(
          glowTex('\\text{Gain} = 0.50 - \\tfrac{5}{8}(0.32) - \\tfrac{3}{8}(0) = 0.30', {
            x: 0,
            y: 285,
            size: 46,
            color: ROLE.cut,
          }),
          txt(
            'Beats best policy-support split (~0.167) → Keep cut at 3.35',
            0,
            360,
            28,
            ROLE.good,
            'serif',
          ),
        ).opacity(wn),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'tree-partition-b1-1', sweepP, 1, { dur: 1.0 });
  cueTo(s, c, 'split-gain-b2-1', gainP, 1, { dur: 0.75 });
  cueTo(s, c, 'tree-partition-b3-1', winP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 6. depth: Who else lands in R3's leaf? (SIGNATURE 3D OVERFIT PLATEAU)
// Cues: first-inner, second-inner, vtwo-route, vtwo-label*, veight-arrives, veight-route, veight-label*
// ---------------------------------------------------------------------------
export function depth(s, c) {
  const c1P = s.value(0);
  const c2P = s.value(0);
  const v2rP = s.value(0);
  const v2lP = s.value(0);
  const v8aP = s.value(0);
  const v8rP = s.value(0);
  const v8lP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.review, seed: 6 }));
  s.add(decorAura(340, 20, 520, '#ff6b8b20', '#5ce1e614'));

  // 3D Overfit Decision Surface: z = P(review) over Ambiguity (u) & Support (v)
  // Razor-thin plateau carved for R3 in [1.75, 2.40] plus high region > 3.35!
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 0.8],
  }).at(350, 15);

  const surf = surface(
    (u, v) => {
      const amb = 0.8 + ((u + 2.5) / 5) * 4.0;
      const highRegion = amb > 3.35 ? 2.2 : 0.15;
      const r3Spike = amb > 1.75 && amb <= 2.4 ? 2.15 : 0;
      return Math.max(highRegion, r3Spike);
    },
    {
      x: [-2.5, 2.5],
      y: [-2.5, 2.5],
      resolution: [44, 24],
      colors: ['#0c1c3b', '#1b4a7a', '#5ce1e6', '#ffd166', '#ff6b8b'],
      mesh: '#9cd8ff',
      meshOpacity: 0.16,
      meshWidth: 0.5,
      opacity: 0.9,
    },
  );
  view3d.add(surf);

  const headline = heroTitle(['Deep Overfit', 'Carves Fragile Leaves'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.review,
    eyebrow: '3D DECISION SURFACE  ·  R3 ISOLATED IN [1.75, 2.40]',
  });

  const leftPanel = dynamic(() => {
    const c1 = c1P.value;
    const c2 = c2P.value;
    const v2r = v2rP.value;
    const v2l = v2lP.value;
    const v8a = v8aP.value;
    const v8r = v8rP.value;
    const v8l = v8lP.value;
    const nodes = [];

    nodes.push(
      txt('INNER CUTS INSIDE LEFT LEAF (≤ 3.35):', -855, -205, 26, ROLE.cut, 'mono', 'left'),
      txt(
        'Cut 1: amb = 1.75 removes R1, R2',
        -855,
        -150,
        28,
        c1 > 0.2 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'left',
      ),
      txt(
        'Cut 2: amb = 2.40 isolates R3 alone!',
        -855,
        -96,
        28,
        c2 > 0.2 ? ROLE.review : COSMOS.dim,
        'mono',
        'left',
      ),
      txt('Training accuracy: 8 / 8 (100%)', -855, -30, 30, ROLE.good, 'mono', 'left'),
    );

    if (v2r > 0.05) {
      nodes.push(
        txt('V2 (amb 2.1) → SENT TO REVIEW', -855, 65, 30, ROLE.routine, 'mono', 'left').opacity(
          v2r,
        ),
      );
    }
    if (v2l > 0.05) {
      nodes.push(
        txt('Actual: Routine → $18 false alarm', -855, 118, 28, ROLE.cost, 'sans', 'left').opacity(
          v2l,
        ),
      );
    }
    if (v8a > 0.05) {
      nodes.push(
        txt(
          v8r > 0.2 ? 'V8 (amb 2.8) → AUTO-PASSED' : 'V8 arrives at amb = 2.8',
          -855,
          195,
          30,
          ROLE.cut,
          'mono',
          'left',
        ).opacity(v8a),
      );
    }
    if (v8l > 0.05) {
      nodes.push(
        txt(
          'Actual: Review → $120 MISS! (Total $138 vs $240 stump)',
          -855,
          250,
          28,
          ROLE.review,
          'sans',
          'left',
        )
          .glow(7, ROLE.review)
          .opacity(v8l),
      );
    }

    nodes.push(txt('3D STEP-FUNCTION PLATEAU FOR R3', 350, 395, 26, COSMOS.muted, 'mono'));
    return group(...nodes);
  });

  s.add(view3d, headline, leftPanel);
  orbitScene(s, c, view3d, { theta: -0.25, phi: 0.94 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'first-inner', c1P, 1, { dur: 0.7 });
  cueTo(s, c, 'second-inner', c2P, 1, { dur: 0.7 });
  cueTo(s, c, 'vtwo-route', v2rP, 1, { dur: 0.65 });
  cueTo(s, c, 'vtwo-label', v2lP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'veight-arrives', v8aP, 1, { dur: 0.6 });
  cueTo(s, c, 'veight-route', v8rP, 1, { dur: 0.6 });
  cueTo(s, c, 'veight-label', v8lP, 1, { after: true, dur: 0.6 });
}
