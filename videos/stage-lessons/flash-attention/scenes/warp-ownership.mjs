// Scene 21: Keep independent output rows with the warps that own them: Split-K reduction vs FA2 Split-Q.
import {
  COSMOS,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function warpOwnership(s, c) {
  const showSplitK = s.value(0.5);
  const showSplitQ = s.value(0);
  const showBench = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#ffd16616');
  const title = heroTitle(['Warp Ownership:', 'Split-K vs Split-Q'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'FLASHATTENTION-2 · WARP PARTITIONING',
  });

  const warpCols = [COSMOS.gold, COSMOS.cyan, COSMOS.violet, COSMOS.emerald];

  const live = guardedDynamic(1, () => {
    const sk = showSplitK.value;
    const sq = showSplitQ.value;
    const bn = showBench.value;

    const nodes = [
      line([0, -245], [0, 255], { stroke: '#253355', width: 2, dash: [8, 8] }).opacity(0.65),

      // LEFT: Split-K (4 warps split keys for SAME Q -> shared-mem sync & merge)
      txt('SPLIT-K (SHARED REDUCTION)', -440, -245, 28, COSMOS.rose, 'mono')
        .glow(6, COSMOS.rose)
        .opacity(sk),
      ...Array.from({ length: 4 }, (_, i) => {
        const wx = -740 + i * 200;
        return group(
          glassCell(wx, -135, 168, 84, warpCols[i], { fill: '#12192e', glow: 6, opacity: sk }),
          txt(`Warp ${i}`, wx, -152, 26, warpCols[i], 'mono').opacity(sk),
          txt(`K slice ${i}`, wx, -114, 26, COSMOS.muted, 'mono').opacity(sk),
          glowingArc([wx, -90], [-440, 48], 20, {
            color: COSMOS.rose,
            width: 3.0,
            opacity: 0.85 * sk,
          }),
        );
      }),
      glassCell(-440, 118, 660, 128, COSMOS.rose, { fill: '#1d111d', glow: 9, opacity: sk }),
      txt('SHARED-MEM SYNC + MERGE REDUCTION', -440, 88, 26, COSMOS.rose, 'mono').opacity(sk),
      txt('Must reconcile common softmax reference m', -440, 140, 26, COSMOS.ink, 'sans').opacity(
        sk,
      ),

      // RIGHT: Split-Q (FA2: each warp owns disjoint output rows locally!)
      txt('SPLIT-Q (FLASHATTENTION-2)', 440, -245, 28, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(Math.max(0.28, sq)),
      ...Array.from({ length: 4 }, (_, i) => {
        const wx = 140 + i * 200;
        const a = Math.max(0.28, sq);
        return group(
          glassCell(wx, -135, 168, 84, warpCols[i], { fill: '#12192e', glow: 7, opacity: a }),
          txt(`Warp ${i}`, wx, -152, 26, warpCols[i], 'mono').opacity(a),
          txt(`Q rows ${i}`, wx, -114, 26, COSMOS.ink, 'mono').opacity(a),
          glowingArc([wx, -90], [wx, 68], 0, { color: warpCols[i], width: 3.4, opacity: 0.9 * a }),
          rect(168, 72, { fill: '#0e2324', stroke: warpCols[i], width: 2.2, radius: 8 })
            .at(wx, 118)
            .glow(7, warpCols[i])
            .opacity(a),
          txt(`O rows ${i}`, wx, 118, 26, warpCols[i], 'mono').opacity(a),
        );
      }),
      txt(
        'Each warp finishes its own rows locally (no output merge barrier)',
        440,
        206,
        26,
        COSMOS.emerald,
        'sans',
      ).opacity(Math.max(0.28, sq)),
    ];

    if (bn > 0.02) {
      nodes.push(
        glassCell(0, 340, 1660, 114, COSMOS.gold, { fill: '#181613', glow: 9, opacity: bn }),
        txt('A100 REPORTED KERNEL BENCHMARK (FA2 PAPER)', 0, 308, 26, COSMOS.muted, 'mono').opacity(
          bn,
        ),
        txt(
          '~2× FA1   ·   50–73% theoretical peak   ·   up to 230 TFLOP/s forward',
          0,
          358,
          30,
          COSMOS.gold,
          'mono',
        )
          .glow(6, COSMOS.gold)
          .opacity(bn),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('warp-ownership-beat-1', () => s.play(showSplitK.to(1, { duration: 0.4 })));
  c.on('warp-ownership-beat-2', () => s.play(showSplitQ.to(0.65, { duration: 0.4 })));
  c.on('fa-split-q', () => s.play(showSplitQ.to(1, { duration: 0.45 })));
  c.on('warp-ownership-beat-3', () =>
    s.play(showBench.to(1, { duration: remainDuration(c, 'warp-ownership-beat-3', 0.45) })),
  );
}
