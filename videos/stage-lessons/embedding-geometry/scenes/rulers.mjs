// Scene 02: rulers: "Two ways to compare the same arrows"
// Smooth transition from glowing Cosine angle fans to Euclidean L2 straight-line chord beams.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  GUIDES,
  METRICS,
  QUERY,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  norm,
  playCue,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';
import { cinemaVectorPlane, guideVectors } from '../guide-plot.mjs';
import { glowArc } from '../parts.mjs';

export default function rulers(s, c) {
  const plane = cinemaVectorPlane({
    originX: -805,
    originY: 285,
    width: 930,
    height: 520,
    extent: () => 4.6,
  });

  const vCos = s.value(1);
  const vGap = s.value(0);
  const angleSweep = s.value(0);
  const showCosA = s.value(0);
  const showCosB = s.value(0);
  const showGapA = s.value(0);
  const showGapB = s.value(0);

  const angA = Math.atan2(GUIDES[0].vector[1], GUIDES[0].vector[0]);
  const angB = Math.atan2(GUIDES[1].vector[1], GUIDES[1].vector[0]);

  const title = heroTitle(['Two ways to compare', 'the same arrows'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'COSINE ANGLE  vs  EUCLIDEAN L2',
  });

  const cosFormula = glowTex(
    '\\cos(\\mathbf{q},\\mathbf{v}) = \\frac{\\mathbf{q}\\cdot\\mathbf{v}}{\\|\\mathbf{q}\\|\\,\\|\\mathbf{v}\\|}',
    { x: 525, y: -345, size: 40, color: ROLE.code, glow: 7 },
  );
  const gapFormula = glowTex('\\|\\mathbf{q} - \\mathbf{v}\\|_2 = \\sqrt{\\sum_i (q_i - v_i)^2}', {
    x: 525,
    y: -345,
    size: 38,
    color: ROLE.gold,
    glow: 7,
  });

  // View 1: Cosine angle fans + luminous score gauges
  const cosLayer = guardedDynamic(vCos, (alpha) => {
    const sw = angleSweep.value;
    const nodes = [
      rule(185, -395, 185, 395, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('COMPARE DIRECTIONS (ANGLE)', 235, -225, 26, ROLE.code, 'mono', 'left').opacity(alpha),
    ];

    if (sw > 0.02) {
      nodes.push(
        glowArc(plane.origin[0], plane.origin[1], 125, -angA * sw, 0, {
          color: ROLE.A,
          width: 6,
          glow: 9,
          opacity: alpha,
        }),
        glowArc(plane.origin[0], plane.origin[1], 165, -angB * sw, 0, {
          color: ROLE.B,
          width: 5.5,
          glow: 9,
          opacity: alpha,
        }),
      );
    }

    if (showCosA.value > 0.02) {
      const a = showCosA.value * alpha;
      const m = METRICS[0];
      nodes.push(
        txt('Rotation (A)', 235, -145, 34, ROLE.A, 'serif', 'left').glow(5, ROLE.A).opacity(a),
        txt(
          `${m.dot} / (1 × ${norm(m.vector).toFixed(3)}) ≈ ${m.cosine.toFixed(3)}`,
          235,
          -92,
          32,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        lumBar(235 + (m.cosine * 560) / 2, -40, m.cosine * 560, 18, {
          color: ROLE.A,
          fillAlpha: 0.45,
          glow: 8,
          opacity: a,
        }),
      );
    }

    if (showCosB.value > 0.02) {
      const a = showCosB.value * alpha;
      const m = METRICS[1];
      nodes.push(
        txt('Audit (B)', 235, 45, 34, ROLE.B, 'serif', 'left').glow(5, ROLE.B).opacity(a),
        txt(
          `${m.dot} / (1 × ${norm(m.vector).toFixed(3)}) ≈ ${m.cosine.toFixed(3)}`,
          235,
          98,
          32,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        lumBar(235 + (m.cosine * 560) / 2, 150, m.cosine * 560, 18, {
          color: ROLE.B,
          fillAlpha: 0.45,
          glow: 8,
          opacity: a,
        }),
        // Cosine reference scale [-1, 0, +1]
        line([235, 295], [795, 295], { stroke: '#4d608e', width: 3 }).opacity(a),
        glowDot(235, 295, { radius: 6, color: ROLE.warn, glow: 6, opacity: a }),
        glowDot(515, 295, { radius: 6, color: COSMOS.muted, glow: 6, opacity: a }),
        glowDot(795, 295, { radius: 6, color: ROLE.A, glow: 8, opacity: a }),
        txt('-1 opposite', 235, 342, 26, ROLE.warn, 'mono', 'left').opacity(a),
        txt('0 right angle', 515, 342, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('+1 match', 795, 342, 26, ROLE.A, 'mono', 'right').opacity(a),
      );
    }

    return group(...nodes);
  });

  // View 2: Euclidean L2 straight-line chord beams from q's tip
  const gapLayer = guardedDynamic(vGap, (alpha) => {
    const qPt = plane.p(QUERY);
    const nodes = [
      rule(185, -395, 185, 395, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('MEASURE FROM q TIP (L2 GAP)', 235, -225, 26, ROLE.gold, 'mono', 'left').opacity(alpha),
      glowDot(qPt[0], qPt[1], { radius: 9, color: ROLE.gold, glow: 12, opacity: alpha }),
    ];

    if (showGapA.value > 0.02) {
      const a = showGapA.value * alpha;
      const m = METRICS[0];
      const pA = plane.p(m.vector);
      nodes.push(
        line(qPt, pA, { stroke: ROLE.gold, width: 5, dash: [8, 6] })
          .glow(9, ROLE.gold)
          .opacity(a),
        txt('Rotation (A)', 235, -135, 34, ROLE.A, 'serif', 'left').glow(5, ROLE.A).opacity(a),
        txt(`L2 = ${m.distance.toFixed(2)}`, 235, -75, 42, ROLE.gold, 'mono', 'left')
          .glow(8, ROLE.gold)
          .opacity(a),
        lumBar(235 + 22, -20, 44, 18, { color: ROLE.A, fillAlpha: 0.5, glow: 8, opacity: a }),
      );
    }

    if (showGapB.value > 0.02) {
      const a = showGapB.value * alpha;
      const m = METRICS[1];
      const pB = plane.p(m.vector);
      nodes.push(
        line(qPt, pB, { stroke: ROLE.gold, width: 5, dash: [10, 7] })
          .glow(9, ROLE.gold)
          .opacity(a),
        txt('Audit (B)', 235, 65, 34, ROLE.B, 'serif', 'left').glow(5, ROLE.B).opacity(a),
        txt(`L2 = √13 ≈ ${m.distance.toFixed(2)}`, 235, 125, 42, ROLE.gold, 'mono', 'left')
          .glow(8, ROLE.gold)
          .opacity(a),
        lumBar(235 + 280, 180, 560, 18, { color: ROLE.B, fillAlpha: 0.45, glow: 8, opacity: a }),
        txt(
          'Smaller Euclidean gap ranks first',
          235,
          330,
          30,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(
    cinemaAtmosphere(ROLE.code, ROLE.gold),
    title,
    cosFormula,
    plane.grid,
    ...guideVectors(plane),
    cosLayer,
    gapLayer,
  );

  playCue(s, c, 'angle', (d) => s.play(angleSweep.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'a', (d) => s.play(showCosA.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'b', (d) => s.play(showCosB.to(1, { duration: d })), { after: true, dur: 0.4 });

  c.swap('gap', cosFormula, gapFormula);
  playCue(s, c, 'gap', (d) => s.play(swapVis(vCos, vGap, d)), { dur: 0.65 });
  playCue(s, c, 'short', (d) => s.play(showGapA.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'long', (d) => s.play(showGapB.to(1, { duration: d })), { after: true, dur: 0.4 });
}
