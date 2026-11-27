// Scene 08: Keep group weighting and preference uncertainty explicit: 36:1 vs 1:1, Plackett-Luce 1/3, soft target q.
import {
  COSMOS,
  PL_ORDER_PROB,
  PL_STEP1,
  PL_STEP2,
  PL_STRENGTHS,
  aura,
  circle,
  delay,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  par,
  radialDial,
  rect,
  remainDuration,
  sampleCurve,
  txt,
} from '../parts.mjs';

export default function groupWeightSoftTarget(s, c) {
  const showPart1 = s.value(1);
  const pairMass = s.value(0.35);
  const groupAvg = s.value(0);

  const showPart2 = s.value(0);
  const plStep1 = s.value(0);
  const plRemove = s.value(0);
  const plStep2 = s.value(0);
  const plProd = s.value(0);

  const showPart3 = s.value(0);
  const softOpt = s.value(0);

  const bgAura = aura(120, 10, 560, '#ffd1661c', '#a78bfa18');
  const title = heroTitle(['Group Weights,', 'Rankings & Soft q'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'MULTI-RESPONSE PROMPTS · PLACKETT-LUCE · SOFT BCE',
  });

  // Part 1: 9-answer prompt (36 pairs) vs 2-answer prompt (1 pair)
  const part1 = guardedDynamic(showPart1, (a) => {
    const pm = pairMass.value;
    const ga = groupAvg.value;

    // 9-node ring on left-center (-380, 10)
    const cx9 = -380;
    const cy9 = 35;
    const r9 = 165;
    const pts9 = Array.from({ length: 9 }, (_, i) => {
      const ang = (i / 9) * Math.PI * 2 - Math.PI / 2;
      return [cx9 + Math.cos(ang) * r9, cy9 + Math.sin(ang) * r9];
    });

    const nodes = [
      txt('PROMPT P: 9 ANSWERS → 36 PAIRS', cx9, -180, 26, COSMOS.amber, 'mono').opacity(a),
      txt('PROMPT Q: 2 ANSWERS → 1 PAIR', 110, -180, 26, COSMOS.cyan, 'mono').opacity(a),
    ];

    // All 36 chords of K9
    for (let i = 0; i < 9; i++) {
      for (let j = i + 1; j < 9; j++) {
        nodes.push(
          line(pts9[i], pts9[j], { stroke: COSMOS.amber, width: 1.4 }).opacity(
            0.35 * Math.max(0.4, pm) * a,
          ),
        );
      }
    }
    for (const pt of pts9) {
      nodes.push(
        circle(10, { fill: COSMOS.amber, stroke: COSMOS.bg, width: 2 }).at(pt[0], pt[1]).opacity(a),
      );
    }

    // 2-node edge for Prompt Q at (110, 35)
    nodes.push(
      glowingTrail(
        [
          [20, 35],
          [200, 35],
        ],
        { color: COSMOS.cyan, width: 4.5, opacity: a },
      ),
      circle(16, { fill: COSMOS.cyan, stroke: COSMOS.bg, width: 2 }).at(20, 35).opacity(a),
      circle(16, { fill: COSMOS.cyan, stroke: COSMOS.bg, width: 2 }).at(200, 35).opacity(a),
    );

    // Right side: Loss-mass balance bar transitioning from 36/37 vs 1/37 -> 1/2 vs 1/2
    const bx = 340;
    const bw = 460;
    const fracP = (36 / 37) * (1 - ga) + 0.5 * ga;
    const fracQ = 1 - fracP;
    nodes.push(
      txt(
        ga > 0.5 ? 'PROMPT-GROUP AVERAGING' : 'FLAT PAIR AVERAGING',
        bx + bw * 0.5,
        -125,
        28,
        ga > 0.5 ? COSMOS.emerald : COSMOS.amber,
        'mono',
      )
        .glow(6, ga > 0.5 ? COSMOS.emerald : COSMOS.amber)
        .opacity(a),
      rect(bw * fracP, 62, { fill: COSMOS.amber, stroke: '#ffffff', width: 1.5, radius: 6 })
        .at(bx + bw * fracP * 0.5, -20)
        .opacity(0.9 * a),
      rect(Math.max(14, bw * fracQ), 62, {
        fill: COSMOS.cyan,
        stroke: '#ffffff',
        width: 1.5,
        radius: 6,
      })
        .at(bx + bw * fracP + Math.max(14, bw * fracQ) * 0.5, -20)
        .opacity(0.9 * a),
      txt(
        ga > 0.5 ? 'P: 1/2   |   Q: 1/2' : 'P: 36/37 (36×)   |   Q: 1/37',
        bx + bw * 0.5,
        65,
        30,
        COSMOS.ink,
        'mono',
      ).opacity(a),
      txt(
        ga > 0.5 ? 'Equal loss mass (gradient norms still differ)' : 'First prompt dominates 36:1',
        bx + bw * 0.5,
        125,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
      txt(
        'Score each answer once and reuse across pairs · InstructGPT grouped correlated pairs',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Part 2: Plackett-Luce sequential selection (strengths 3, 2, 1 -> 3/6 * 2/3 = 1/3)
  const part2 = guardedDynamic(showPart2, (a) => {
    const p1 = plStep1.value;
    const rm = plRemove.value;
    const p2 = plStep2.value;
    const pr = plProd.value;

    const nodes = [
      txt(
        'PLACKETT-LUCE RANKING ORDER (A, B, C)',
        -855,
        -185,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),

      // Step 1: Pool {A:3, B:2, C:1} -> 3/6
      radialDial(-565, 55, 152, PL_STEP1 * Math.max(0.25, p1), {
        color: COSMOS.emerald,
        width: 11,
        opacity: a,
      }),
      txt('STEP 1: PICK A', -565, -135, 26, COSMOS.emerald, 'mono').opacity(a),
      txt('A:3  B:2  C:1', -565, 22, 26, COSMOS.ink, 'mono').opacity(a),
      txt('3/6 = 1/2', -565, 72, 30, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(Math.max(0.35, p1) * a),

      // Step 2: Remove A -> Pool {B:2, C:1} -> 2/3
      radialDial(-20, 55, 152, PL_STEP2 * Math.max(0.2, p2), {
        color: COSMOS.cyan,
        width: 11,
        opacity: Math.max(0.4, rm) * a,
      }),
      txt('STEP 2: REMOVE A, PICK B', -20, -135, 26, COSMOS.cyan, 'mono').opacity(
        Math.max(0.4, rm) * a,
      ),
      txt('B:2  C:1', -20, 22, 26, COSMOS.ink, 'mono').opacity(Math.max(0.4, rm) * a),
      txt('2 / 3', -20, 72, 34, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)
        .opacity(Math.max(0.35, p2) * a),

      // Step 3: Multiply -> 1/3
      radialDial(525, 55, 152, PL_ORDER_PROB * Math.max(0.2, pr), {
        color: COSMOS.gold,
        width: 11,
        opacity: Math.max(0.4, pr) * a,
      }),
      txt('COMPLETE ORDER P(A,B,C)', 525, -135, 26, COSMOS.gold, 'mono').opacity(
        Math.max(0.4, pr) * a,
      ),
      txt('3/6 × 2/3', 525, 22, 26, COSMOS.ink, 'mono').opacity(Math.max(0.4, pr) * a),
      txt('= 1 / 3', 525, 72, 38, COSMOS.gold, 'mono')
        .glow(8, COSMOS.gold)
        .opacity(Math.max(0.35, pr) * a),

      // Strength unit pips below
      txt(
        `Strengths: A = ${PL_STRENGTHS[0]},  B = ${PL_STRENGTHS[1]},  C = ${PL_STRENGTHS[2]}   ·   C is the only choice left (1/1)`,
        0,
        320,
        28,
        COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // Part 3: Soft BCE target curve minimized uniquely at p = q
  const part3 = guardedDynamic(showPart3, (a) => {
    const so = softOpt.value;
    const qVal = 0.65;
    const x0 = -300;
    const x1 = 740;
    const y0 = 260;
    const y1 = -160;
    const mapP = (pv) => x0 + pv * (x1 - x0);
    const bce = (pv) => -(qVal * Math.log(pv) + (1 - qVal) * Math.log(1 - pv));
    const mapL = (lv) => y0 - ((lv - 0.5) / 1.4) * (y0 - y1);

    const pts = sampleCurve(bce, 0.08, 0.94, mapP, mapL, 70);
    const optX = mapP(qVal);
    const optY = mapL(bce(qVal));

    const nodes = [
      txt('SOFT TARGET BCE LOSS', -855, -140, 26, COSMOS.violet, 'mono', 'left').opacity(a),
      txt('Fraction q picks A', -855, -80, 38, COSMOS.ink, 'serif', 'left').opacity(a),
      txt('Unique minimum at p = q', -855, -18, 30, COSMOS.emerald, 'mono', 'left')
        .glow(6, COSMOS.emerald)
        .opacity(Math.max(0.45, so) * a),
      txt('Split vote ≠ explicit tie', -855, 85, 28, COSMOS.amber, 'sans', 'left').opacity(a),
      txt('Fix A & B before voting', -855, 138, 26, COSMOS.muted, 'sans', 'left').opacity(a),

      // Axes
      line([x0, y0], [x1, y0], { stroke: '#455885', width: 2.5 }).opacity(a),
      line([x0, y0], [x0, y1], { stroke: '#455885', width: 2.5 }).opacity(a),
      txt('Model forecast p', (x0 + x1) * 0.5, y0 + 58, 26, COSMOS.muted, 'mono').opacity(a),
      txt('BCE(q, p)', x0 - 20, y1 - 24, 26, COSMOS.muted, 'mono', 'right').opacity(a),

      glowingTrail(pts, {
        gradientColors: [COSMOS.rose, COSMOS.violet, COSMOS.emerald, COSMOS.rose],
        width: 4.8,
        glow: 11,
        opacity: a,
      }),
      line([optX, y0], [optX, optY], { stroke: COSMOS.emerald, width: 2.4, dash: [8, 6] }).opacity(
        Math.max(0.45, so) * a,
      ),
      glowDot(optX, optY, { radius: 10, color: COSMOS.emerald, opacity: Math.max(0.45, so) * a }),
      txt('Optimum: p* = q', optX, optY - 46, 30, COSMOS.emerald, 'mono')
        .glow(7, COSMOS.emerald)
        .opacity(Math.max(0.45, so) * a),
    ];

    return group(...nodes);
  });

  const eqSoft = glowTex(String.raw`\mathcal{L}_{\text{soft}}(p) = -q\log p - (1-q)\log(1-p)`, {
    x: 350,
    y: -355,
    size: 34,
    color: COSMOS.violet,
  });

  s.add(bgAura, title, part1, part2, part3);

  c.on('group-pairs', () => s.play(pairMass.to(1, { duration: 0.45 })));
  c.on('group-weights', () => s.play(groupAvg.to(0.65, { duration: 0.4 })));
  c.on('group-weight-soft-target-step-1', () => s.play(groupAvg.to(1, { duration: 0.45 })));

  c.on('pl-first', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.18),
        delay(plStep1.to(1, { duration: 0.4 }), 0.2),
      ),
    );
  });
  c.on('pl-remove', () => s.play(plRemove.to(1, { duration: 0.4 })));
  c.on('pl-second', () => s.play(plStep2.to(1, { duration: 0.4 })));
  c.on('group-weight-soft-target-step-2', () => s.play(plProd.to(0.7, { duration: 0.35 })));
  c.on('pl-product', () => s.play(plProd.to(1, { duration: 0.4 })));

  c.on('group-weight-soft-target-step-3', () => {
    s.play(
      par(
        showPart2.to(0, { duration: 0.2 }),
        delay(showPart3.to(1, { duration: 0.25 }), 0.18),
        delay(softOpt.to(0.6, { duration: 0.35 }), 0.2),
      ),
    );
  });
  c.show('group-weight-soft-target-step-3', eqSoft);
  c.on('soft-optimum', () =>
    s.play(softOpt.to(1, { duration: remainDuration(c, 'soft-optimum', 0.45) })),
  );
}
