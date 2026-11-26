// Scene 20: Follow the owned gradient through update and gather (Full grad -> Reduce-Scatter -> FP32 Adam on owned slice -> Cast BF16 -> All-Gather; 6 + 12/8 = 7.5 B).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function optimizerStep(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 0=full grads, 1=reduce-scatter, 2=all-gather rebuilt, 3=6+12/D breakdown, 4=D=8 -> 7.5 B

  const bgAura = aura(0, 15, 620, '#34d3991c', '#5ce1e618');
  const title = heroTitle(['Owned Gradient', 'Update & Gather'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dp,
    eyebrow: 'REDUCE-SCATTER · FP32 OWNER STEP · BF16 ALL-GATHER',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    const stages = [
      { k: '1. Local Grads', sub: 'Complete 4-pos buffer', col: ROLE.tp, active: st >= 0 },
      { k: '2. Reduce-Scatter', sub: 'Owned reduced slice', col: ROLE.cp, active: st >= 1 },
      { k: '3. FP32 Update', sub: 'Master W + Adam m, v', col: ROLE.ep, active: st >= 1 },
      { k: '4. Cast + All-Gather', sub: 'BF16 W for next fwd', col: ROLE.dp, active: st >= 2 },
    ];
    stages.forEach((sg, i) => {
      const x = -600 + i * 400;
      nodes.push(
        glassCell(x, -140, 340, 150, sg.active ? sg.col : ROLE.dim, {
          fill: sg.active ? '#101f36' : '#0c111e',
          glow: sg.active ? 9 : 2,
        }),
        txt(sg.k, x, -172, 26, sg.active ? sg.col : COSMOS.muted, 'mono'),
        txt(sg.sub, x, -110, 26, sg.active ? COSMOS.ink : COSMOS.muted, 'sans'),
      );
      if (i < 3) {
        nodes.push(line([x + 170, -140], [x + 230, -140], { color: sg.col, width: 3 }));
      }
    });

    // Bottom ledger: 2B BF16 W + 4B FP32 grad (6B replicated) + (4B master + 8B Adam)/D
    const showLedger = st >= 3;
    nodes.push(
      glassCell(-390, 95, 720, 175, showLedger ? ROLE.tp : ROLE.dim, {
        fill: showLedger ? '#101f38' : '#0d1322',
        glow: showLedger ? 8 : 3,
      }),
      txt('REPLICATED: 6 BYTES / PARAM', -390, 48, 26, ROLE.tp, 'mono'),
      txt('2 B (BF16 param) + 4 B (FP32 main grad)', -390, 118, 26, COSMOS.ink, 'mono'),

      glassCell(390, 95, 720, 175, st >= 4 ? ROLE.good : ROLE.dp, {
        fill: st >= 4 ? '#0e2624' : '#101b2e',
        glow: st >= 4 ? 10 : 5,
      }),
      txt('SHARDABLE: 12 / D BYTES / PARAM', 390, 48, 26, ROLE.dp, 'mono'),
      txt(
        st >= 4 ? 'DP=4 x CP=2 -> D=8 -> 6 + 1.5 = 7.5 B' : '4 B (FP32 master) + 8 B (Adam m, v)',
        390,
        118,
        26,
        st >= 4 ? ROLE.good : COSMOS.ink,
        'mono',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 275, { radius: 6, color: ROLE.dp }),
      txt(
        '1 decimal GB = 10^9 bytes; activations and temporary workspace peaks remain additional',
        0,
        345,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);
  wireStepCues(s, c, step, [
    ['mg-optimizer-step-b0', 0],
    ['mg-reduce-scatter', 1],
    ['mg-all-gather', 2],
    ['mg-optimizer-step-b1', 3],
    ['mg-seven-half-bytes', 4],
  ]);
}
