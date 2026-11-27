// Scene 04: normalize: "Put both tips on the unit circle"
// Zooming 2D unit-circle collapse + orbiting 3D unit hypersphere with geodesic great-circle arcs
// + glowing MathJax chord identity.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  GUIDES,
  QUERY,
  ROLE,
  SCALED_A,
  UNIT_METRICS,
  buildUnitSphere3d,
  cinemaAtmosphere,
  glowTex,
  guardedDynamic,
  heroTitle,
  normalized,
  orbitScene,
  playCue,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';
import { cinemaVectorPlane, guideVectors } from '../guide-plot.mjs';

export default function normalize(s, c) {
  const progress = s.value(0);
  const extent = s.value(10.6);
  const showChords = s.value(0);
  const vAssume = s.value(1);
  const vFormula = s.value(0);
  const vDivA = s.value(1);
  const vScoreA = s.value(0);
  const vDivB = s.value(1);
  const vScoreB = s.value(0);

  const raw = [SCALED_A, GUIDES[1].vector];
  const unit = raw.map(normalized);
  const currentVecs = () =>
    raw.map((v, i) => v.map((x, j) => x + progress.value * (unit[i][j] - x)));

  const plane = cinemaVectorPlane({
    originX: -795,
    originY: 280,
    width: 900,
    height: 510,
    extent: () => extent.value,
  });

  // Orbiting 3D unit hypersphere showing the exact unit-shell geometry in 3D
  const { view: sphere3d } = buildUnitSphere3d({
    x: 560,
    y: -235,
    radius: 1.55,
    unit: 92,
    distance: 13.5,
    theta: -0.78,
    phi: 1.05,
    vectors: [
      { dir: [1, 0, 0.14], color: ROLE.query, width: 4.2 },
      { dir: [unit[0][0], unit[0][1], 0.14], color: ROLE.A, width: 4.2 },
      { dir: [unit[1][0], unit[1][1], 0.14], color: ROLE.B, width: 4.2 },
    ],
    geodesics: [
      { a: [1, 0, 0.14], b: [unit[0][0], unit[0][1], 0.14], color: ROLE.gold, width: 3.4 },
      { a: [1, 0, 0.14], b: [unit[1][0], unit[1][1], 0.14], color: ROLE.gold, width: 3.0 },
    ],
  });

  const title = heroTitle(['Put both tips on', 'the unit circle'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.code,
    eyebrow: 'L2 NORMALIZATION',
  });

  const chordOverlay = guardedDynamic(showChords, (a) => {
    const vecs = currentVecs();
    const qPt = plane.p(QUERY);
    return group(
      line(qPt, plane.p(vecs[0]), { stroke: ROLE.gold, width: 4.8, dash: [9, 6] })
        .glow(8, ROLE.gold)
        .opacity(a),
      line(qPt, plane.p(vecs[1]), { stroke: ROLE.gold, width: 4.8, dash: [9, 6] })
        .glow(8, ROLE.gold)
        .opacity(a),
    );
  });

  // Right-bottom telemetry column
  const staticRight = group(
    rule(180, -395, 180, 395, COSMOS.rule, 1.8).opacity(0.6),
    txt('UNIT HYPERSPHERE', 560, -420, 26, ROLE.code, 'mono'),
    txt('Query length = 1', 225, -4, 30, ROLE.query, 'mono', 'left'),
  );

  const divALayer = guardedDynamic(vDivA, (a) =>
    group(
      txt('Rotation (A)', 225, 62, 34, ROLE.A, 'serif', 'left').glow(5, ROLE.A).opacity(a),
      txt('[10, 2] / √104', 225, 114, 34, COSMOS.ink, 'mono', 'left').opacity(a),
    ),
  );
  const scoreALayer = guardedDynamic(vScoreA, (a) =>
    group(
      txt('Rotation (A) · unit', 225, 58, 32, ROLE.A, 'serif', 'left').glow(5, ROLE.A).opacity(a),
      txt(
        `dot = cos ≈ ${UNIT_METRICS[0].score.toFixed(3)}`,
        225,
        106,
        32,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
      txt(
        `gap² ≈ ${UNIT_METRICS[0].squaredDistance.toFixed(3)}`,
        225,
        152,
        32,
        ROLE.gold,
        'mono',
        'left',
      )
        .glow(6, ROLE.gold)
        .opacity(a),
    ),
  );

  const divBLayer = guardedDynamic(vDivB, (a) =>
    group(
      txt('Audit (B)', 225, 224, 34, ROLE.B, 'serif', 'left').glow(5, ROLE.B).opacity(a),
      txt('[4, 2] / √20', 225, 276, 34, COSMOS.ink, 'mono', 'left').opacity(a),
    ),
  );
  const scoreBLayer = guardedDynamic(vScoreB, (a) =>
    group(
      txt('Audit (B) · unit', 225, 222, 32, ROLE.B, 'serif', 'left').glow(5, ROLE.B).opacity(a),
      txt(
        `dot = cos ≈ ${UNIT_METRICS[1].score.toFixed(3)}`,
        225,
        270,
        32,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
      txt(
        `gap² ≈ ${UNIT_METRICS[1].squaredDistance.toFixed(3)}`,
        225,
        316,
        32,
        ROLE.gold,
        'mono',
        'left',
      )
        .glow(6, ROLE.gold)
        .opacity(a),
    ),
  );

  const assumeLayer = guardedDynamic(vAssume, (a) =>
    txt('Each arrow keeps its direction', -340, 412, 30, COSMOS.muted, 'sans').opacity(a),
  );
  const formulaNode = glowTex(
    '\\|\\hat{\\mathbf{q}} - \\hat{\\mathbf{v}}\\|_2^2 = 1 + 1 - 2\\,(\\hat{\\mathbf{q}}\\cdot\\hat{\\mathbf{v}})',
    {
      x: -310,
      y: 412,
      size: 34,
      color: ROLE.gold,
      glow: 7,
    },
  );

  s.add(
    cinemaAtmosphere(ROLE.code, ROLE.A),
    title,
    plane.grid,
    plane.unitArc,
    ...guideVectors(plane, {
      vectors: currentVecs,
      queryOffset: [16, 44],
      aOffset: [30, -30],
      bOffset: [36, -54],
    }),
    chordOverlay,
    sphere3d,
    staticRight,
    divALayer,
    scoreALayer,
    divBLayer,
    scoreBLayer,
    assumeLayer,
  );

  orbitScene(s, c, sphere3d, { theta: 0.48, phi: 0.96 });

  playCue(s, c, 'divide', (d) => s.play(progress.to(1, { duration: d })), { dur: 2.2 });
  playCue(s, c, 'closer', (d) => s.play(extent.to(1.32, { duration: d })), { dur: 1.4 });
  playCue(s, c, 'chords', (d) => s.play(showChords.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'identity', (d) => s.play(vAssume.to(0, { duration: d })), { dur: 0.2 });
  c.show('identity', formulaNode, { after: true });
  playCue(s, c, 'a', (d) => s.play(swapVis(vDivA, vScoreA, d)), { after: true, dur: 0.45 });
  playCue(s, c, 'b', (d) => s.play(swapVis(vDivB, vScoreB, d)), { after: true, dur: 0.45 });
}
