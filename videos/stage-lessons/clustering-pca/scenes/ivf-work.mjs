// Scene 21 (ivf-work): "Count the centroids and the lists actually opened"
// IVF scale math: K + N * nprobe / K (K=4096, nprobe=16 -> 0.39% scan) + uneven lists + ANN vs Semantic recall.
import {
  COSMOS,
  DANGER_COLOR,
  QUERY_COLOR,
  aura,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function ivfWork(s, c) {
  const showPayload = s.value(0);
  const showAll = s.value(0);
  const showCodes = s.value(0);
  const showGrid = s.value(0);
  const showCoarse = s.value(0);
  const showSixteen = s.value(0);
  const showUneven = s.value(0);
  const showAnn = s.value(0);
  const showSemantic = s.value(0);
  const showLatency = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#2a1c4f18');
  const title = heroTitle(['IVF Work Budget', '& Recall Contracts'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'LARGE-SCALE APPROXIMATE SEARCH',
  });

  const eqWork = glowTex('\\text{Work} = K + N \\cdot \\frac{\\text{nprobe}}{K}', {
    x: 470,
    y: -255,
    size: 40,
    color: QUERY_COLOR,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [
      txt(
        '1. CANDIDATE RECOVERY VS DISTANCE PRECISION',
        -855,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Full vectors + probe all K lists  →  recovers exact flat search',
        -855,
        -182,
        28,
        COSMOS.emerald,
        'sans',
        'left',
      ).opacity(0.45 + 0.55 * Math.max(showPayload.value, showAll.value)),
      txt(
        'Compressed IVF codes (PQ/SQ)  →  rankings can still shift even at nprobe = K',
        -855,
        -124,
        26,
        DANGER_COLOR,
        'sans',
        'left',
      ).opacity(0.35 + 0.65 * showCodes.value),
      rule(-855, -72, 855, -72, COSMOS.rule, 2),
    ];

    // Middle visual: 16 of 4,096 cells lattice + uneven list bars
    const gridOp = Math.max(0.35, showGrid.value);
    nodes.push(
      txt(
        '2. BALANCED SCALE EXAMPLE: K = 4,096, nprobe = 16',
        -855,
        -20,
        26,
        QUERY_COLOR,
        'mono',
        'left',
      ).opacity(gridOp),
    );
    // 16 x 4 mini cell visual strip (4 lit cells representing 16/4096)
    for (let i = 0; i < 16; i++) {
      const lit = i < 2;
      nodes.push(
        lumBar(-830 + i * 48, 48, 36, 36, {
          color: lit ? COSMOS.emerald : COSMOS.cyan,
          fillOpacity: lit ? 0.85 : 0.14,
          glow: lit ? 9 : 3,
          opacity: gridOp,
        }),
      );
    }
    if (showSixteen.value > 0.02) {
      nodes.push(
        txt('16 / 4,096 = 0.39% of corpus scanned', -40, 48, 30, COSMOS.emerald, 'mono', 'left')
          .glow(7, COSMOS.emerald)
          .opacity(showSixteen.value),
      );
    }
    if (showCoarse.value > 0.02) {
      nodes.push(
        txt(
          '+ 4,096 coarse centroid comparisons (still costs work!)',
          -855,
          118,
          26,
          QUERY_COLOR,
          'mono',
          'left',
        ).opacity(showCoarse.value),
      );
    }
    if (showUneven.value > 0.02) {
      nodes.push(
        txt(
          'Uneven lists: sum actual opened lengths (scales linearly with N)',
          -855,
          158,
          26,
          COSMOS.amber,
          'mono',
          'left',
        ).opacity(showUneven.value),
      );
    }

    // Bottom: ANN recall vs Semantic recall
    const recOp = Math.max(0.6, showAnn.value);
    nodes.push(
      rule(-855, 200, 855, 200, COSMOS.cyan, 2.2).opacity(0.65),
      txt('3. TWO SEPARATE RECALL METRICS', -855, 242, 26, COSMOS.cyan, 'mono', 'left').opacity(
        recOp,
      ),
      txt(
        'ANN recall: matches exact geometric neighbors of the embedding',
        -855,
        294,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(recOp),
      txt(
        'Semantic recall: matches human-reviewed relevance labels',
        -855,
        344,
        28,
        COSMOS.emerald,
        'sans',
        'left',
      ).opacity(Math.max(0.55, showSemantic.value)),
      txt(
        'Keep flat baseline & measure real end-to-end latency',
        -855,
        396,
        26,
        QUERY_COLOR,
        'mono',
        'left',
      ).opacity(Math.max(0.55, showLatency.value)),
    );

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'payload', showPayload, 1, { duration: 0.45 });
  tweenCue(s, c, 'all', showAll, 1, { duration: 0.45 });
  tweenCue(s, c, 'codes', showCodes, 1, { duration: 0.45 });
  c.show('grid', eqWork);
  tweenCue(s, c, 'grid', showGrid, 1, { duration: 0.45 });
  tweenCue(s, c, 'coarse', showCoarse, 1, { duration: 0.45 });
  tweenCue(s, c, 'sixteen', showSixteen, 1, { duration: 0.45 });
  tweenCue(s, c, 'uneven', showUneven, 1, { duration: 0.45 });
  tweenCue(s, c, 'ann', showAnn, 1, { duration: 0.45 });
  tweenCue(s, c, 'semantic', showSemantic, 1, { duration: 0.45 });
  tweenCue(s, c, 'latency', showLatency, 1, { duration: 0.45 });
}
