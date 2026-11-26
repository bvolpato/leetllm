// Scene 07: Match mathematical shards to stored weight orientation (H=8, I=16, TP=4: math [8,4]/[4,8] vs stored PyTorch [4,8]/[8,4]; max diff < 1e-12!).
import {
  COSMOS,
  LARGE_MLP,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function storedShapes(s, c) {
  const phase = s.value(0);
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#6ee7b718');
  const title = heroTitle(['Math Shards vs', 'Stored Weight Layout'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.tp,
    eyebrow: 'H=8 · I=16 · TP=4 · [OUT, IN] ORIENTATION',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    const maxDiff = Math.max(...LARGE_MLP.output.map((v, i) => Math.abs(v - LARGE_MLP.serial[i])));

    const nodes = [
      glassCell(-430, -80, 760, 224, ROLE.tp, { fill: '#0f1d36', glow: st < 2 ? 10 : 4 }),
      txt('MATH NOTATION (x · W)', -430, -148, 28, ROLE.tp, 'mono'),
      txt('Up shard (Column):   [ 8 × 4 ]', -430, -84, 30, COSMOS.ink, 'mono'),
      txt('Down shard (Row):    [ 4 × 8 ]', -430, -24, 30, COSMOS.ink, 'mono'),

      glassCell(430, -80, 760, 224, st >= 1 ? COSMOS.gold : COSMOS.dim, {
        fill: st >= 1 ? '#241c0f' : '#0a0f1c',
        glow: st >= 1 ? 10 : 2,
      }),
      txt('PYTORCH STORED ([out, in])', 430, -148, 28, COSMOS.gold, 'mono'),
      txt('Up shard stored:     [ 4 × 8 ]', 430, -84, 30, COSMOS.gold, 'mono'),
      txt('Down shard stored:   [ 8 × 4 ]', 430, -24, 30, COSMOS.gold, 'mono'),

      glassCell(0, 165, 1480, 152, st >= 3 ? ROLE.good : COSMOS.dim, {
        fill: st >= 3 ? '#0d2624' : '#0a0f1c',
        glow: st >= 3 ? 10 : 2,
      }),
      txt(
        'CPU TANH-GELU DECOMPOSITION RECEIPT',
        0,
        122,
        28,
        st >= 3 ? ROLE.good : COSMOS.muted,
        'mono',
      ),
      txt(
        `Sum of 4 TP partial vectors vs serial 8-coord output: max diff = ${maxDiff.toExponential(1)} (< 1e-12!)`,
        0,
        180,
        26,
        st >= 3 ? ROLE.good : COSMOS.ink,
        'mono',
      ),
    ];

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 290, { radius: 6, color: st >= 3 ? ROLE.good : ROLE.tp }),
      txt(
        'Transposing math [in, out] to stored [out, in] preserves exact channel ownership; fused GPU kernels set own tolerances',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['mg-stored-shapes-b0', 0],
    ['mg-storage-transpose', 1],
    ['mg-stored-shapes-b1', 2],
    ['mg-stored-output-match', 3],
  ]);
}
