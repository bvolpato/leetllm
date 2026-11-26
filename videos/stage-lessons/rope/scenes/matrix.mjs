// Scene 9: matrix: Basis arrows rotate to form the 2x2 rotation matrix columns, then rotate q_m and k_n.
import { arrow, dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowDot,
  glowTex,
  heroTitle,
  rotatePair,
  txt,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-matrix-0-0',
  'matrix-rotated-horizontal-basis-b1-1',
  'rp-matrix-0-1',
  'matrix-rotated-vertical-basis-b1-2',
  'rp-matrix-0-2',
  'matrix-rotation-matrix-b2-1',
  'rp-matrix-1-0',
  'rp-matrix-1-1',
  'matrix-rotated-horizontal-basis-b3-1',
  'rp-matrix-2-0',
  'rp-matrix-2-1',
  'rp-matrix-2-2',
  'rp-matrix-2-3',
];

export default function matrix(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 9, ROLE.query);
  const stageAura = cinemaAura(310, 20, 560, '#5ce1e622', '#ffd16614');

  const title = heroTitle(['The matrix is the', 'moving picture'], {
    x: -860,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: ROLE.query,
    eyebrow: '2×2 ROTATION MATRIX',
  });

  const matTex = glowTex(
    String.raw`R(\alpha) = \begin{pmatrix}\cos\alpha & -\sin\alpha \\ \sin\alpha & \cos\alpha\end{pmatrix}`,
    { x: -495, y: -125, size: 40, color: COSMOS.ink, glow: 5 },
  );

  const live = dynamic(() => {
    const st = step.value;
    const alpha = Math.min(0.95, 0.25 + st * 0.14);
    const showQueryKey = Math.max(0, Math.min(1, (st - 7.5) / 1.5));
    const cx = 315;
    const cy = 20;
    const rad = 250;

    const e1 = rotatePair([1, 0], alpha);
    const e2 = rotatePair([0, 1], alpha);
    const qBase = [0.75, 0.48];
    const qRot = rotatePair(qBase, alpha);

    const pt = ([vx, vy]) => [cx + vx * rad, cy - vy * rad];
    const [e1x, e1y] = pt(e1);
    const [e2x, e2y] = pt(e2);
    const [qx, qy] = pt(qRot);

    const nodes = [
      clockDial({
        cx,
        cy,
        radius: rad,
        queryAngle: alpha,
        keyAngle: showQueryKey > 0.3 ? alpha - 0.55 : null,
        showAxes: true,
        showWake: true,
        showAngleArc: showQueryKey > 0.3,
        queryColor: ROLE.query,
        keyColor: ROLE.key,
        title:
          showQueryKey > 0.3 ? 'q_m = R(mθ)q   ·   k_n = R(nθ)k' : `α = ${alpha.toFixed(2)} rad`,
        titleColor: COSMOS.ink,
      }),
      // Rotated vertical basis vector e2 -> (-sin a, cos a) in gold
      arrow([cx, cy], [e2x, e2y], { stroke: ROLE.key, width: 4.4, tip: 16 })
        .opacity(1 - showQueryKey * 0.7)
        .glow(8, ROLE.key),
      glowDot(e2x, e2y, { radius: 6, color: '#ffffff', glow: 12 }).opacity(1 - showQueryKey * 0.7),
      // Linear combination parallelogram for arbitrary vector q = qx*e1 + qy*e2
      line([cx, cy], [cx + qBase[0] * e1[0] * rad, cy - qBase[0] * e1[1] * rad], {
        stroke: ROLE.query,
        width: 2.6,
        dash: [6, 5],
      }).opacity(0.65),
      line([cx + qBase[0] * e1[0] * rad, cy - qBase[0] * e1[1] * rad], [qx, qy], {
        stroke: ROLE.key,
        width: 2.6,
        dash: [6, 5],
      }).opacity(0.65),
      arrow([cx, cy], [qx, qy], { stroke: ROLE.score, width: 4.2, tip: 15 })
        .opacity(0.35 + 0.65 * Math.min(1, Math.max(0, st - 4.5)))
        .glow(8, ROLE.score),
      // Left live column readouts
      txt(
        `col 1 (e₁):  (${e1[0].toFixed(2)}, ${e1[1].toFixed(2)})`,
        -860,
        45,
        30,
        ROLE.query,
        'mono',
        'left',
      ),
      txt(
        `col 2 (e₂):  (${e2[0].toFixed(2)}, ${e2[1].toFixed(2)})`,
        -860,
        102,
        30,
        ROLE.key,
        'mono',
        'left',
      ),
      txt(
        'Query at m → angle m·θ',
        -860,
        215,
        30,
        showQueryKey > 0.2 ? ROLE.query : COSMOS.dim,
        'mono',
        'left',
      ),
      txt(
        'Key at n → angle n·θ',
        -860,
        270,
        30,
        showQueryKey > 0.2 ? ROLE.key : COSMOS.dim,
        'mono',
        'left',
      ),
      txt(
        'Both carry absolute position before dot product',
        -860,
        355,
        27,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(stars, stageAura, title, matTex, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
