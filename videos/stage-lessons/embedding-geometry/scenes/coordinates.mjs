// Scene 01: coordinates: "Read the horizontal reach"
// Full-bleed glowing projection geometry + MathJax dot-product formula + withheld result reveal.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  GUIDES,
  QUERY,
  ROLE,
  cinemaAtmosphere,
  dotProd,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';
import { cinemaVectorPlane, guideVectors } from '../guide-plot.mjs';

export default function coordinates(s, c) {
  const plane = cinemaVectorPlane({
    originX: -805,
    originY: 285,
    width: 930,
    height: 520,
    extent: () => 4.6,
  });

  const showFirst = s.value(0);
  const showSecond = s.value(0);
  const vPremise = s.value(1);
  const vAsk = s.value(0);
  const vResult = s.value(0);

  const dotA = dotProd(QUERY, GUIDES[0].vector);
  const dotB = dotProd(QUERY, GUIDES[1].vector);

  const title = heroTitle(['Read the', 'horizontal reach'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.query,
    eyebrow: 'DOT PRODUCT · PROJECTION',
  });

  const formula = glowTex('\\mathbf{q} \\cdot \\mathbf{v} = \\sum_i q_i v_i', {
    x: 520,
    y: -365,
    size: 46,
    color: ROLE.gold,
    glow: 8,
  });

  // Animated projection beams + right-column operand tracks
  const projLayer = dynamic(() => {
    const nodes = [
      rule(185, -395, 185, 395, COSMOS.rule, 1.8).opacity(0.6),
      txt('HORIZONTAL REACH', 235, -245, 26, COSMOS.muted, 'mono', 'left'),
    ];

    // Projection 1: Rotation
    if (showFirst.value > 0.02) {
      const a = showFirst.value;
      const tipA = plane.p(GUIDES[0].vector);
      const footA = plane.p([GUIDES[0].vector[0], 0]);
      nodes.push(
        line(tipA, footA, { stroke: ROLE.A, width: 3.6, dash: [9, 7] })
          .glow(7, ROLE.A)
          .opacity(a),
        glowDot(footA[0], footA[1], { radius: 8, color: ROLE.A, glow: 11, opacity: a }),
        txt('Rotation guide', 235, -175, 36, ROLE.A, 'serif', 'left').glow(5, ROLE.A).opacity(a),
        txt('1 × 1  +  0 × 0.2', 235, -118, 34, COSMOS.ink, 'mono', 'left').opacity(a),
        lumBar(235 + 65 * a, -64, 130 * a, 16, {
          color: ROLE.A,
          fillAlpha: 0.45,
          glow: 7,
          radius: 4,
          opacity: a,
        }),
      );
    }

    // Projection 2: Audit
    if (showSecond.value > 0.02) {
      const a = showSecond.value;
      const tipB = plane.p(GUIDES[1].vector);
      const footB = plane.p([GUIDES[1].vector[0], 0]);
      nodes.push(
        line(tipB, footB, { stroke: ROLE.B, width: 3.6, dash: [9, 7] })
          .glow(7, ROLE.B)
          .opacity(a),
        glowDot(footB[0], footB[1], { radius: 8, color: ROLE.B, glow: 11, opacity: a }),
        txt('Audit guide', 235, 32, 36, ROLE.B, 'serif', 'left').glow(5, ROLE.B).opacity(a),
        txt('1 × 4  +  0 × 2', 235, 88, 34, COSMOS.ink, 'mono', 'left').opacity(a),
        lumBar(235 + 260 * a, 142, 520 * a, 16, {
          color: ROLE.B,
          fillAlpha: 0.45,
          glow: 7,
          radius: 4,
          opacity: a,
        }),
      );
    }

    return group(...nodes);
  });

  // Sequential footer / result states (zero overlap)
  const premiseNode = guardedDynamic(vPremise, (a) =>
    txt('q = [1, 0]  ·  raw dot product', 235, 335, 32, COSMOS.muted, 'mono', 'left').opacity(a),
  );
  const askNode = guardedDynamic(vAsk, (a) =>
    txt('Which guide has the larger dot product?', 235, 335, 34, ROLE.gold, 'serif', 'left')
      .glow(8, ROLE.gold)
      .opacity(a),
  );
  const resultNode = guardedDynamic(vResult, (a) =>
    group(
      txt(`= ${dotA}`, 665, -118, 48, ROLE.A, 'mono', 'left').glow(8, ROLE.A).opacity(a),
      txt(`= ${dotB}`, 665, 88, 48, ROLE.B, 'mono', 'left').glow(9, ROLE.B).opacity(a),
      txt('Audit wins   4 to 1', 235, 335, 42, ROLE.B, 'serif', 'left').glow(9, ROLE.B).opacity(a),
    ),
  );

  s.add(
    cinemaAtmosphere(ROLE.query, ROLE.B),
    title,
    formula,
    plane.grid,
    ...guideVectors(plane),
    projLayer,
    premiseNode,
    askNode,
    resultNode,
  );

  playCue(s, c, 'first', (d) => s.play(showFirst.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'second', (d) => s.play(showSecond.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'ask', (d) => s.play(swapVis(vPremise, vAsk, d)), { dur: 0.55 });
  playCue(s, c, 'result', (d) => s.play(vAsk.to(0, { duration: d })), { dur: 0.28 });
  playCue(s, c, 'result', (d) => s.play(vResult.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
