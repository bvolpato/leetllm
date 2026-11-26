// Scene 03 (algorithm-contract): "Check the matrix before assigning a group"
// Matrix shape contract (N x d vs K x d) + silent NumPy broadcast trap + squared-error gradient -> arithmetic mean.
import {
  COSMOS,
  DANGER_COLOR,
  QUERY_COLOR,
  aura,
  crossSwap,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function algorithmContract(s, c) {
  const phase = s.value(0);
  const vShape = s.value(1);
  const vGrad = s.value(0);

  const showWidth = s.value(0);
  const showReject = s.value(0);
  const showBroadcast = s.value(0);

  const showGrad = s.value(0);
  const showMean = s.value(0);
  const showMetric = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a183b2e', '#133a4a18');
  const title = heroTitle(['Matrix Shape Contract', '& Exact Mean Update'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'INPUT GUARD & OPTIMAL CENTER',
  });

  const eqObj = glowTex('J(c) = \\sum_{i \\in G} \\|x_i - c\\|^2', {
    x: -440,
    y: -155,
    size: 40,
    color: COSMOS.cyan,
    glow: 6,
  });
  const eqGrad = glowTex('\\nabla_c J = -2 \\sum_{i \\in G} (x_i - c) = 0', {
    x: 410,
    y: -155,
    size: 38,
    color: QUERY_COLOR,
    glow: 7,
  });
  const eqMean = glowTex('c^* = \\frac{1}{|G|} \\sum_{i \\in G} x_i', {
    x: 0,
    y: 45,
    size: 52,
    color: COSMOS.emerald,
    glow: 9,
  });

  // View 1: Documents (6 x 2) vs Centers (3 x 2) vs Bad (3 x 1) broadcast trap
  const viewShape = guardedDynamic(vShape, (a) => {
    const nodes = [
      txt('VALID INPUT SHAPES', -855, -240, 26, COSMOS.emerald, 'mono', 'left').opacity(a),
      // N x d matrix slab
      lumBar(-610, -65, 360, 230, { color: COSMOS.cyan, fillOpacity: 0.16, glow: 8, opacity: a }),
      txt('Documents X', -610, -135, 30, COSMOS.cyan, 'mono').opacity(a),
      txt('n × d  (6 × 2)', -610, -68, 34, COSMOS.ink, 'mono').opacity(a),
      txt('all finite floats', -610, 2, 26, COSMOS.muted, 'sans').opacity(a),

      // K x d valid centers
      lumBar(-120, -65, 340, 150, {
        color: COSMOS.emerald,
        fillOpacity: 0.18,
        glow: 8,
        opacity: (0.4 + 0.6 * showWidth.value) * a,
      }),
      txt('Centers C', -120, -96, 30, COSMOS.emerald, 'mono').opacity(
        (0.4 + 0.6 * showWidth.value) * a,
      ),
      txt('k × d  (3 × 2)', -120, -34, 34, COSMOS.ink, 'mono').opacity(
        (0.4 + 0.6 * showWidth.value) * a,
      ),

      // Reject wrong width / NaN on right
      lumBar(485, -65, 560, 230, {
        color: DANGER_COLOR,
        fillOpacity: 0.14,
        dash: [10, 7],
        glow: 7,
        opacity: (0.35 + 0.65 * showReject.value) * a,
      }),
      txt('REJECT BEFORE ASSIGNING', 485, -135, 26, DANGER_COLOR, 'mono').opacity(
        (0.35 + 0.65 * showReject.value) * a,
      ),
      txt('Bad width: k × 1 ≠ d', 485, -70, 30, DANGER_COLOR, 'mono').opacity(
        (0.35 + 0.65 * showReject.value) * a,
      ),
      txt('Nonfinite: NaN or ±∞', 485, -8, 30, DANGER_COLOR, 'mono').opacity(
        (0.35 + 0.65 * showReject.value) * a,
      ),
      rule(-855, 130, 855, 130, COSMOS.cyan, 2.2).opacity(0.6 * a),
      txt(
        'CONTRACT:  assert X.ndim == 2  ·  C.shape[1] == X.shape[1]  ·  all finite',
        -855,
        355,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    if (showBroadcast.value > 0.02) {
      nodes.push(
        txt(
          'NUMPY TRAP:  (6, 1, 2) − (1, 3, 1)  silently broadcasts width 1 across all d features!',
          -855,
          205,
          28,
          QUERY_COLOR,
          'mono',
          'left',
        )
          .glow(7, QUERY_COLOR)
          .opacity(showBroadcast.value * a),
        txt(
          'Code runs with zero crash while comparing wrong columns. Assert C.shape[1] == X.shape[1]!',
          -855,
          272,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showBroadcast.value * a),
      );
    }

    return nodes;
  });

  // View 2: Derivation of arithmetic mean as unique L2 minimizer
  const viewGrad = guardedDynamic(vGrad, (a) => {
    const nodes = [
      txt(
        'FIXED MEMBERSHIPS → SOLVE FOR OPTIMAL CENTER c',
        -855,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      rule(-855, -45, 855, -45, COSMOS.cyan, 2.2).opacity(0.65 * a),
      rule(-855, 222, 855, 222, COSMOS.cyan, 2.0).opacity(0.55 * a),
      txt(
        'OBJECTIVE J(c)  →  SET ∇J = 0  →  UNIQUE L2 ARITHMETIC MEAN',
        0,
        365,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    if (showMean.value > 0.02) {
      nodes.push(
        txt(
          'Unique minimizer for every nonempty group under squared Euclidean distance',
          0,
          172,
          30,
          COSMOS.emerald,
          'sans',
        ).opacity(showMean.value * a),
      );
    }
    if (showMetric.value > 0.02) {
      nodes.push(
        txt(
          'Change the metric (e.g. cosine or L1)  ⇒  update rule must change too (unit mean or median)',
          0,
          275,
          28,
          QUERY_COLOR,
          'mono',
        )
          .glow(6, QUERY_COLOR)
          .opacity(showMetric.value * a),
      );
    }
    return nodes;
  });

  s.add(bgAura, title, viewShape, viewGrad);
  runAmbientPhase(s, c, phase, 2.0);

  tweenCue(s, c, 'width', showWidth, 1, { duration: 0.45 });
  tweenCue(s, c, 'reject', showReject, 1, { duration: 0.45 });
  tweenCue(s, c, 'broadcast', showBroadcast, 1, { duration: 0.5 });

  crossSwap(s, c, 'objective', vShape, vGrad, { duration: 0.55 });
  c.at(c.cue('objective').start - c.start + 0.34, () => {
    s.add(eqObj);
  });
  c.show('gradient', eqGrad);
  tweenCue(s, c, 'gradient', showGrad, 1, { duration: 0.45 });
  c.show('mean', eqMean);
  tweenCue(s, c, 'mean', showMean, 1, { duration: 0.45 });
  tweenCue(s, c, 'metric', showMetric, 1, { duration: 0.45 });
}
