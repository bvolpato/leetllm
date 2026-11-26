// Scene 29: replay-contract: "A seed fixes a stream and leaves the logits as another input"
// View 1 (Beat 0): Same seed receipt with near-tied logits [1.0001, 1.0000] -> greedy A
//   (AFTER dec-replay-first) vs FP drift [0.9999, 1.0000] -> greedy B (AFTER dec-replay-second).
// View 2 (Beats 1-2): Three reproducibility tiers (same text, same token IDs, bitwise tensor state)
//   + vLLM batch-invariance & exact speculative verification scope.
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowVector, lumBar, playCue, swapVis } from '../parts.mjs';

export default function replayContract(s, c) {
  const title = heroTitle(['A seed fixes the draw,', 'not the computed logits'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.heat,
  });

  const vTie = s.value(1);
  const vTiers = s.value(0);

  const firstDone = s.value(0);
  const secondDone = s.value(0);
  const tierSweep = s.value(1);
  const showVllm = s.value(0);

  // VIEW 1: Near-tie flip under floating-point drift with identical seed
  const tieLayer = guardedDynamic(vTie, (alpha) => {
    const nodes = [];
    const f1 = firstDone.value > 0.4;
    const f2 = secondDone.value > 0.4;

    nodes.push(
      lumBar(0, -255, 620, 62, {
        color: ROLE.active,
        fillOpacity: 0.18,
        strokeWidth: 2.2,
        glow: 8,
        radius: 31,
        opacity: alpha,
      }),
      txt('PRNG seed receipt: UNCHANGED', 0, -255, 28, ROLE.active, 'mono', 'center').opacity(
        alpha,
      ),
    );

    const rows = [
      { tag: 'Run 1', a: '1.0001', b: '1.0000', win: 'A', ready: f1, y: -65, col: ROLE.valid },
      {
        tag: 'Run 2 (rounding)',
        a: '0.9999',
        b: '1.0000',
        win: 'B',
        ready: f2,
        y: 155,
        col: ROLE.pruned,
      },
    ];

    rows.forEach((r) => {
      nodes.push(
        txt(r.tag, -830, r.y, 30, r.col, 'mono', 'left').opacity(alpha),
        lumBar(-340, r.y, 290, 86, {
          color: r.ready && r.win === 'A' ? ROLE.valid : ROLE.base,
          fillOpacity: r.ready && r.win === 'A' ? 0.36 : 0.2,
          strokeWidth: 2.4,
          glow: 8,
          radius: 10,
          opacity: alpha,
        }),
        txt(`A: ${r.a}`, -340, r.y, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
        lumBar(0, r.y, 290, 86, {
          color: r.ready && r.win === 'B' ? ROLE.pruned : ROLE.base,
          fillOpacity: r.ready && r.win === 'B' ? 0.36 : 0.2,
          strokeWidth: 2.4,
          glow: 8,
          radius: 10,
          opacity: alpha,
        }),
        txt(`B: ${r.b}`, 0, r.y, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
        glowVector([165, r.y], [315, r.y], {
          color: r.ready ? r.col : COSMOS.dim,
          width: 4,
          glow: 8,
          opacity: alpha,
        }),
        lumBar(555, r.y, 430, 86, {
          color: r.ready ? ROLE.winner : COSMOS.dim,
          fillOpacity: r.ready ? 0.28 : 0.08,
          strokeWidth: r.ready ? 2.8 : 1.8,
          glow: r.ready ? 11 : 2,
          radius: 12,
          opacity: alpha,
        }),
        txt(
          r.ready ? `greedy -> token ${r.win}` : 'greedy -> ?',
          555,
          r.y,
          34,
          r.ready ? ROLE.winner : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(r.ready ? 7 : 0, ROLE.winner)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'A 0.0002 logit rounding shift flips the argmax winner with the exact same seed.',
        0,
        365,
        30,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Reproducibility tiers + vLLM / speculative scope
  const tiersLayer = guardedDynamic(vTiers, (alpha) => {
    const nodes = [];
    const nLit = Math.round(Math.max(1, Math.min(3, tierSweep.value)));
    const vllm = showVllm.value;

    const tiers = [
      { level: '1. Matching text', req: 'Decoded UTF-8 string matches', col: ROLE.base },
      {
        level: '2. Matching token IDs',
        req: 'Same tokenizer, template & choice',
        col: ROLE.active,
      },
      { level: '3. Bitwise tensors', req: 'Same hardware, kernels & batching', col: ROLE.winner },
    ];

    nodes.push(
      txt(
        'Separate the three levels of replay verification',
        0,
        -275,
        32,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    );

    tiers.forEach((t, i) => {
      const y = -150 + i * 145;
      const lit = i < nLit;
      const la = (lit ? 1 : 0.28) * alpha;
      nodes.push(
        lumBar(-455, y, 500, 88, {
          color: t.col,
          fillOpacity: 0.22,
          strokeWidth: 2.4,
          glow: 9,
          radius: 12,
          opacity: la,
        }),
        txt(t.level, -455, y, 28, COSMOS.ink, 'mono', 'center').opacity(la),
        glowVector([-190, y], [-25, y], { color: t.col, width: 4, glow: 9, opacity: la }),
        lumBar(410, y, 810, 88, {
          color: t.col,
          fillOpacity: 0.16,
          strokeWidth: 2.2,
          glow: 8,
          radius: 12,
          opacity: la,
        }),
        txt(t.req, 410, y, 28, t.col, 'mono', 'center').opacity(la),
      );
    });

    if (vllm > 0.15) {
      nodes.push(
        txt(
          'vLLM reproducibility: matching version + hardware + batch-invariant mode  |  speculative preserves distribution, not seeded trace',
          0,
          365,
          26,
          ROLE.valid,
          'sans',
          'center',
        )
          .glow(5, ROLE.valid)
          .opacity(vllm * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.heat, ROLE.active), title, tieLayer, tiersLayer);

  playCue(s, c, 'dec-replay-contract-1', (d) => s.play(firstDone.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-replay-first', (d) => s.play(firstDone.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-replay-second', (d) => s.play(secondDone.to(1, { duration: d })), {
    after: false,
    offset: 0.45,
    dur: 0.5,
  });

  c.onBeat(1, () => s.play(swapVis(vTie, vTiers, 0.55)));
  playCue(s, c, 'dec-replay-contract-2', (d) => s.play(tierSweep.to(3, { duration: d })), {
    dur: 1.1,
  });
  playCue(s, c, 'dec-replay-contract-3', (d) => s.play(showVllm.to(1, { duration: d })), {
    dur: 0.75,
  });
}
