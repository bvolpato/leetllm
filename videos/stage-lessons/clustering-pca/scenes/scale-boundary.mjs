// Scene 12 (scale-boundary): "Apply the same fitted transform to the query"
// Stored corpus μ=505, σ=326.6 maps 300-char query to z = -0.63; refitting on query alone snaps it to 0 (broken origin!).
import {
  COSMOS,
  DANGER_COLOR,
  QUERY_COLOR,
  aura,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  means,
  rule,
  stds,
  tweenCue,
  txt,
} from '../parts.mjs';

const LEN_MEAN = means[1]; // 505
const LEN_STD = stds[1]; // ~326.64
const Q_LEN = 300;
const Q_Z_STORED = (Q_LEN - LEN_MEAN) / LEN_STD; // -0.6276

export default function scaleBoundary(s, c) {
  const showFit = s.value(0);
  const showQuery = s.value(0);
  const badRefit = s.value(0); // 0 = stored (-0.63), 1 = broken refit (0.00)
  const showWeights = s.value(0);
  const showHeld = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#3a183b18');
  const title = heroTitle(['Apply the Same Fitted', 'Transform to Queries'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'TRAIN / SERVE SCALING BOUNDARY',
  });

  const eqScale = glowTex(
    `z_{\\text{query}} = \\frac{300 - ${LEN_MEAN.toFixed(0)}}{${LEN_STD.toFixed(1)}} = ${Q_Z_STORED.toFixed(2)}`,
    { x: 420, y: -265, size: 38, color: COSMOS.cyan, glow: 7 },
  );

  const live = guardedDynamic(s.value(1), () => {
    const isBad = badRefit.value > 0.5;
    const curZ = Q_Z_STORED * (1 - badRefit.value);

    const axLeft = -780;
    const axRight = 780;
    const axY = 20;
    const xOf = (z) => axLeft + ((z + 1.6) / 3.2) * (axRight - axLeft);

    const nodes = [
      txt(
        `STORED CORPUS FIT:  μ_len = ${LEN_MEAN.toFixed(0)} chars,  σ_len = ${LEN_STD.toFixed(1)}`,
        -855,
        -245,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showFit.value),
      txt('STANDARDIZED LENGTH AXIS (z)', -855, -148, 26, COSMOS.muted, 'mono', 'left'),
      rule(axLeft, axY, axRight, axY, COSMOS.muted, 3),
      txt('−1.5', xOf(-1.5), axY + 42, 26, COSMOS.muted, 'mono'),
      txt('0.0 (corpus mean 505)', xOf(0), axY + 42, 26, COSMOS.muted, 'mono'),
      txt('+1.5', xOf(1.5), axY + 42, 26, COSMOS.muted, 'mono'),
    ];

    // Corpus message dots along z-axis
    const corpusLens = [100, 500, 900];
    corpusLens.forEach((len) => {
      const zv = (len - LEN_MEAN) / LEN_STD;
      nodes.push(
        glowDot(xOf(zv), axY, { radius: 8, color: COSMOS.cyan, glow: 9 }),
        txt(`${len} ch`, xOf(zv), axY - 36, 26, COSMOS.cyan, 'mono'),
      );
    });

    // Live query marker (300 chars -> -0.63 stored vs 0.00 refit bug!)
    if (showQuery.value > 0.02) {
      const qx = xOf(curZ);
      const qCol = isBad ? DANGER_COLOR : QUERY_COLOR;
      nodes.push(
        glowDot(qx, axY, { radius: 11, color: qCol, glow: 14, opacity: showQuery.value }),
        txt(
          isBad ? 'Query refit to 0.00 (WRONG ORIGIN!)' : `Query (300 ch): z = ${curZ.toFixed(2)}`,
          qx,
          axY - 88,
          28,
          qCol,
          'mono',
        )
          .glow(7, qCol)
          .opacity(showQuery.value),
      );
    }

    if (showWeights.value > 0.02) {
      nodes.push(
        txt(
          'For embeddings, follow the model’s exact metric & normalization spec',
          -855,
          205,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(showWeights.value),
      );
    }
    if (showHeld.value > 0.02) {
      nodes.push(
        txt(
          'Save fitted transform for unseen queries; refitting on test queries is transductive evaluation',
          -855,
          285,
          28,
          COSMOS.emerald,
          'sans',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(showHeld.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'fit', showFit, 1, { duration: 0.45 });
  c.show('formula', eqScale);
  tweenCue(s, c, 'query', showQuery, 1, { duration: 0.45 });
  tweenCue(s, c, 'bad', badRefit, 1, { duration: 0.7 });
  tweenCue(s, c, 'restore', badRefit, 0, { duration: 0.7 });
  tweenCue(s, c, 'weights', showWeights, 1, { duration: 0.45 });
  tweenCue(s, c, 'held', showHeld, 1, { duration: 0.45 });
}
