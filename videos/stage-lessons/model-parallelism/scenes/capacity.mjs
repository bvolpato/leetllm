// Scene 24: Count the state that each device actually holds. 8 weight units -> 4/GPU + KV (2) + Activations (1) + Workspace (1) = 8 units/GPU, plus 3D 2-GPU cluster & training state note.
import {
  COSMOS,
  ROLE,
  aura,
  buildCluster3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function capacity(s, c) {
  const phase = s.value(0);
  const pState = s.value(0);
  const pShard = s.value(0);
  const pWeights = s.value(0);
  const pTotal = s.value(0);
  const pLink = s.value(0);
  const pTrain = s.value(0);

  const bgAura = aura(440, 20, 560, '#60a5fa1c', '#a78bfa18');
  const { view: cluster3d } = buildCluster3d(() => 0.72, phase, {
    x: 495,
    y: 35,
    unit: 96,
    gpus: 2,
    radius: 1.7,
    ringColor: ROLE.gpu1,
  });

  const title = heroTitle(['Count the State', 'Each GPU Holds'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gpu0,
    eyebrow: 'PER-DEVICE SERVING MEMORY INVENTORY',
  });

  const segments = [
    { label: 'Weights', val: 4, col: ROLE.gpu0, fill: '#122b52' },
    { label: 'KV state', val: 2, col: ROLE.gpu1, fill: '#0e3240' },
    { label: 'Activations', val: 1, col: ROLE.expert, fill: '#22163c' },
    { label: 'Workspace', val: 1, col: COSMOS.gold, fill: '#2b220f' },
  ];

  const live = guardedDynamic(1, () => {
    const st = pState.value > 0.3;
    const sh = pShard.value > 0.3;
    const wt = pWeights.value > 0.3;
    const tot = pTotal.value > 0.5;
    const lk = pLink.value > 0.5;
    const tr = pTrain.value > 0.5;

    const nodes = [
      txt('3D DEVICE STATE STACK', 495, -395, 26, ROLE.gpu1, 'mono').glow(5, ROLE.gpu1),
      txt('Every rank stores more than weights', 495, 420, 26, COSMOS.muted, 'sans'),
      txt(
        wt
          ? '8 WEIGHT UNITS SPLIT EVENLY -> 4 PER GPU + RUNTIME STATE'
          : sh
            ? 'DIFFERENT AXES SHARD DIFFERENT PARTS OF THE INVENTORY'
            : 'WEIGHTS + KV CACHE + ACTIVATIONS + WORKSPACE',
        -350,
        -205,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    const baseY = 235;
    const unitPx = 46; // 8 units = 368 px
    [0, 1].forEach((gpu) => {
      const cx = gpu === 0 ? -575 : -125;
      let cursorY = baseY;
      segments.forEach((seg, idx) => {
        const h = seg.val * unitPx;
        const hi = (idx === 0 && wt) || (idx > 0 && st);
        nodes.push(
          rect(340, h - 4, {
            fill: seg.fill,
            stroke: hi ? seg.col : COSMOS.dim,
            width: hi ? 2.6 : 1.8,
            radius: 8,
          })
            .at(cx, cursorY - h * 0.5)
            .glow(hi ? 7 : 0, seg.col),
          txt(`${seg.label} (${seg.val})`, cx, cursorY - h * 0.5, 26, seg.col, 'mono'),
        );
        cursorY -= h;
      });
      nodes.push(
        txt(
          tot ? `GPU ${gpu} total: 8 units` : `GPU ${gpu}`,
          cx,
          baseY + 42,
          28,
          tot ? COSMOS.gold : COSMOS.ink,
          'mono',
        ),
      );
    });

    const foot = tr
      ? 'Training also adds gradients and optimizer state to every rank ledger'
      : lk
        ? 'Pair TP (fast intra-node links) and PP (stage boundaries) with workload'
        : tot
          ? '4 weights + 2 KV + 1 activations + 1 workspace = 8 units per GPU'
          : 'Weights shard, while KV, activations & workspace stay per GPU';

    nodes.push(
      glassCell(-340, 345, 1020, 76, tr ? ROLE.warn : lk ? ROLE.gpu1 : ROLE.gpu0, {
        fill: '#10182b',
        glow: 7,
      }),
      txt(foot, -340, 345, 26, tr ? ROLE.warn : COSMOS.ink, 'sans'),
      glowDot(-820 + ((phase.value * 0.55) % 1) * 960, 415, { radius: 6, color: ROLE.gpu0 }),
    );
    return group(...nodes);
  });

  s.add(bgAura, cluster3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cluster3d, { theta: -0.22, phi: 0.92 });

  c.on('per-device-state', () =>
    s.play(pState.to(1, { duration: remainDuration(c, 'per-device-state', 0.4) })),
  );
  c.on('inventory-sharding', () =>
    s.play(pShard.to(1, { duration: remainDuration(c, 'inventory-sharding', 0.4) })),
  );
  c.on('sharded-weights', () =>
    s.play(pWeights.to(1, { duration: remainDuration(c, 'sharded-weights', 0.45) })),
  );
  c.on('total-device-state', () =>
    s.play(pTotal.to(1, { duration: remainDuration(c, 'total-device-state', 0.45) })),
  );
  c.on('interconnect-workload', () =>
    s.play(pLink.to(1, { duration: remainDuration(c, 'interconnect-workload', 0.4) })),
  );
  c.on('training-state', () =>
    s.play(pTrain.to(1, { duration: remainDuration(c, 'training-state', 0.4) })),
  );
}
