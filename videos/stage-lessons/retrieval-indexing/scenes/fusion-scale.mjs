// Scene 14: What happens to a score of four? (Score-scale mismatch & min-max outlier collapse)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  minMaxScale,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function fusionScale(s, c) {
  const showRulers = s.value(0);
  const showBefore = s.value(0);
  const showOutlier = s.value(0);
  const showAsk = s.value(0);
  const showAfter = s.value(0);
  const showTie = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a5014');
  const title = heroTitle(['What Happens to', 'a Score of Four?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'SCORE FUSION · INCOMPARABLE RULERS · MIN-MAX OUTLIER COLLAPSE',
  });

  const beforeVals = [1, 2, 4];
  const beforeNorm = minMaxScale(beforeVals);
  const afterVals = [1, 2, 4, 100];
  const afterNorm = minMaxScale(afterVals);

  const live = guardedDynamic(s.value(1), () => {
    const sr = showRulers.value;
    const sb = showBefore.value;
    const so = showOutlier.value;
    const sa = showAsk.value;
    const sf = showAfter.value;
    const st = showTie.value;

    const rx0 = -760;
    const rw = 1520;
    const mapX = (u) => rx0 + u * rw;

    const nodes = [
      // Top band: Incomparable lane rulers (Cosine [-1, 1] vs unbounded BM25)
      glassCell(-445, -140, 810, 102, sr > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sr > 0.3 ? 7 : 2,
      }),
      txt(
        'COSINE RULER:  [-1.0 .. +1.0]  (direction)',
        -820,
        -156,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('BM25 RULER:    corpus & query dependent', -820, -116, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(445, -140, 810, 102, st > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#11182c',
        glow: st > 0.3 ? 7 : 2,
      }),
      txt('EDGE-CASE CONTRACTS REQUIRED', 70, -156, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Span = 0 (all tied), missing lane, & calibration',
        70,
        -116,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Ruler 1: Before outlier [1, 2, 4] -> span = 3 -> score 4 lands at 1.00
      txt(
        'BEFORE OUTLIER:  raw = [1, 2, 4]   span = 4 - 1 = 3',
        rx0,
        -24,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      line([rx0, 32], [rx0 + rw, 32], { stroke: COSMOS.muted, width: 3 }),
      txt('0.00', rx0, 74, 26, COSMOS.muted, 'mono'),
      txt('0.50', mapX(0.5), 74, 26, COSMOS.muted, 'mono'),
      txt('1.00', mapX(1), 74, 26, COSMOS.muted, 'mono'),

      glowDot(mapX(beforeNorm[0]), 32, { radius: 8, color: COSMOS.cyan }),
      txt('raw 1', mapX(beforeNorm[0]) + 18, 0, 26, COSMOS.cyan, 'mono', 'left'),
      glowDot(mapX(beforeNorm[1]), 32, { radius: 8, color: COSMOS.cyan }),
      txt('raw 2 (0.33)', mapX(beforeNorm[1]), -2, 26, COSMOS.cyan, 'mono'),
      glowDot(mapX(beforeNorm[2]), 32, { radius: 11, color: COSMOS.emerald }),
      txt('raw 4 -> 1.00', mapX(beforeNorm[2]) - 12, -2, 28, COSMOS.emerald, 'mono', 'right'),

      // Ruler 2: Outlier 100 arrives -> [1, 2, 4, 100] -> span = 99 -> raw 4 collapses to 0.03!
      txt(
        so > 0.3
          ? 'OUTLIER ARRIVES:  raw = [1, 2, 4, 100]   span = 99'
          : 'WAITING FOR 4th CANDIDATE...',
        rx0,
        152,
        26,
        so > 0.3 ? COSMOS.amber : COSMOS.muted,
        'mono',
        'left',
      ),
      line([rx0, 210], [rx0 + rw, 210], {
        stroke: so > 0.3 ? COSMOS.amber : COSMOS.muted,
        width: 3,
      }),
      txt('0.00', rx0, 252, 26, COSMOS.muted, 'mono'),
      txt('1.00', mapX(1), 252, 26, COSMOS.muted, 'mono'),
    ];

    if (sf > 0.4) {
      const x4 = mapX(afterNorm[2]);
      nodes.push(
        glowDot(mapX(0), 210, { radius: 7, color: COSMOS.cyan }),
        glowDot(x4, 210, { radius: 12, color: COSMOS.rose }),
        txt(
          `raw 4 -> ${afterNorm[2].toFixed(2)} (3/99!)`,
          x4 + 26,
          184,
          30,
          COSMOS.rose,
          'mono',
          'left',
        ).glow(8, COSMOS.rose),
        glowDot(mapX(1), 210, { radius: 11, color: COSMOS.amber }),
        txt('raw 100 -> 1.00', mapX(1) - 12, 184, 28, COSMOS.amber, 'mono', 'right'),
      );
    } else {
      nodes.push(
        glowDot(mapX(0.5), 210, { radius: 10, color: COSMOS.gold, opacity: Math.max(0.6, sa) }),
        txt(
          so > 0.3 ? 'raw 4 -> ?  (where on [0, 1] does it land?)' : 'raw 4 -> ?',
          mapX(0.5),
          172,
          28,
          COSMOS.gold,
          'mono',
        ),
        glowDot(mapX(1), 210, { radius: 10, color: COSMOS.amber, opacity: Math.max(0.5, so) }),
        txt('raw 100 -> 1.00', mapX(1) - 12, 184, 26, COSMOS.amber, 'mono', 'right').opacity(
          Math.max(0.5, so),
        ),
      );
    }

    nodes.push(
      glowDot(-840, 355, { radius: 6, color: sf > 0.4 ? COSMOS.rose : COSMOS.gold }),
      txt(
        sf > 0.4
          ? 'Score 4 collapsed from 1.00 to 0.03 without changing the passage at all!'
          : sb > 0.3
            ? 'Adding one high-scoring outlier stretches the span and compresses every other score'
            : 'Normalized [0, 1] scores are not calibrated probabilities',
        -812,
        357,
        28,
        sf > 0.4 ? COSMOS.rose : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('scale-rulers', () => s.play(showRulers.to(1, { duration: 0.45 })));
  c.on('scale-range', () => s.play(showBefore.to(0.5, { duration: 0.35 })));
  c.on('scale-before', () => s.play(showBefore.to(1, { duration: 0.4 })));
  c.on('scale-extra', () => s.play(showOutlier.to(1, { duration: 0.45 })));
  c.on('scale-ask', () => s.play(showAsk.to(1, { duration: 0.4 })));
  c.after('scale-after', () => s.play(showAfter.to(1, { duration: 0.45 })));
  c.on('scale-span', () => s.play(showTie.to(0.5, { duration: 0.35 })));
  c.on('scale-tie', () =>
    s.play(showTie.to(1, { duration: remainDuration(c, 'scale-tie', 0.45) })),
  );
}
