// Scene 13: What costs time in a collective? 160 launches (5us=0.8ms, 20us=3.2ms, +53.3% on 6ms) vs 4-GPU ring payload (64 KiB -> 96 KiB sent -> 0.0524 ms @ 300 GB/s).
import {
  COSMOS,
  RING_ACT_KIB,
  RING_SEND_KIB,
  RING_WIRE_MS,
  ROLE,
  aura,
  buildCluster3d,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  swapViews,
  txt,
} from '../parts.mjs';

export default function startupPayload(s, c) {
  const phase = s.value(0);
  const showLaunch = s.value(1);
  const showRing = s.value(0);

  const p0 = s.value(0);
  const pCalls = s.value(0);
  const pStart = s.value(0);
  const pBase = s.value(0);
  const pAct = s.value(0);
  const pSend = s.value(0);
  const pBw = s.value(0);
  const pPay = s.value(0);

  const bgAura = aura(420, 20, 560, '#ff6b8b1a', '#5ce1e61a');
  const { view: ring3d } = buildCluster3d(() => 0.52, phase, {
    x: 495,
    y: 45,
    unit: 96,
    gpus: 4,
    radius: 1.95,
    ringColor: ROLE.gpu1,
  });

  const title = heroTitle(['What Costs Time', 'in a Collective?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'LAUNCH LATENCY vs WIRE BANDWIDTH · TP = 4 RING',
  });

  const ringEq = glowTex(
    '2\\frac{\\text{TP}-1}{\\text{TP}} \\times 64\\,\\text{KiB} = 96\\,\\text{KiB}',
    {
      x: -340,
      y: 80,
      size: 40,
      color: COSMOS.gold,
    },
  );

  const launchView = guardedDynamic(showLaunch, (a) => {
    const lit = Math.max(p0.value * 0.1, pCalls.value);
    const st = pStart.value > 0.5;
    const bs = pBase.value > 0.5;

    const nodes = [
      txt(
        '160 SERIAL COLLECTIVE LAUNCHES / DECODE STEP',
        -340,
        -210,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    ];

    // 4 rows x 40 compact call cells on the left side
    for (let i = 0; i < 160; i++) {
      const cx = -815 + (i % 40) * 24;
      const cy = -140 + Math.floor(i / 40) * 44;
      const on = i < lit * 160;
      nodes.push(
        rect(18, 30, {
          fill: on ? '#1b4785' : '#0b1222',
          stroke: on ? ROLE.gpu0 : '#24314f',
          width: 1.2,
          radius: 3,
        })
          .at(cx, cy)
          .opacity(a),
      );
    }

    nodes.push(
      glassCell(-340, 108, 920, 92, st ? COSMOS.gold : COSMOS.dim, {
        fill: '#231c0e',
        glow: st ? 9 : 3,
        opacity: a,
      }),
      txt(
        st
          ? '5 µs/call -> 0.8 ms    ·    20 µs/call -> 3.2 ms'
          : 'Launch overhead: 160 × per-call startup',
        -340,
        108,
        28,
        st ? COSMOS.gold : COSMOS.muted,
        'mono',
      ).opacity(a),
    );

    if (bs) {
      nodes.push(
        glassCell(-340, 232, 920, 92, ROLE.bad, { fill: '#301120', glow: 10, opacity: a }),
        txt('6 + 3.2 = 9.2 ms (+53%)', -340, 232, 32, ROLE.bad, 'mono').opacity(a),
      );
    }

    nodes.push(
      txt(
        'Startup latency scales with call count, even for tiny payloads',
        -340,
        345,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const ringView = guardedDynamic(showRing, (a) => {
    const act = pAct.value > 0.5;
    const snd = pSend.value > 0.5;
    const bw = pBw.value > 0.5;
    const pay = pPay.value > 0.5;

    const nodes = [
      txt('4-GPU RING ALL-REDUCE PAYLOAD PER RANK', -340, -210, 28, ROLE.gpu1, 'mono').opacity(a),

      glassCell(-340, -90, 920, 128, act ? ROLE.gpu1 : COSMOS.dim, {
        fill: '#0e2a38',
        glow: act ? 8 : 3,
        opacity: a,
      }),
      txt(
        act
          ? `8 req × 4096 × 2 B  =  ${RING_ACT_KIB} KiB activation`
          : 'Activation buffer: 8 × 4096 × 2 B',
        -340,
        -120,
        28,
        ROLE.gpu1,
        'mono',
      ).opacity(a),
      txt(
        snd
          ? `Reduce-scatter (3/4) + All-gather (3/4) = ${RING_SEND_KIB} KiB sent/rank`
          : 'Each rank sends (TP - 1)/TP twice around the ring',
        -340,
        -58,
        26,
        snd ? COSMOS.gold : COSMOS.muted,
        'mono',
      ).opacity(a),

      glassCell(-340, 238, 920, 118, pay ? ROLE.good : bw ? ROLE.gpu1 : COSMOS.dim, {
        fill: pay ? '#0d2924' : '#0f1d32',
        glow: pay ? 10 : 4,
        opacity: a,
      }),
      txt(
        bw
          ? 'At 300 GB/s sustained per-rank send bandwidth:'
          : 'Wire transfer time across all 160 calls:',
        -340,
        208,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
      txt(
        pay
          ? `160 × 96 KiB / 300 GB/s ≈ ${RING_WIRE_MS.toFixed(4)} ms!`
          : 'pending bandwidth rate...',
        -340,
        268,
        32,
        pay ? ROLE.good : COSMOS.dim,
        'mono',
      ).opacity(a),

      txt(
        pay
          ? '0.0524 ms wire time vs 0.8-3.2 ms launch overhead · check NCCL trace'
          : 'Ring traffic per rank = 2 × (TP - 1) / TP × activation',
        -340,
        355,
        26,
        pay ? ROLE.good : COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  const rightLabel = guardedDynamic(1, () =>
    group(
      txt('3D 4-GPU NVLINK RING', 495, -395, 26, ROLE.gpu1, 'mono').glow(5, ROLE.gpu1),
      txt('Small decode batches are latency-bound', 495, 420, 26, COSMOS.gold, 'mono'),
      glowDot(-820 + ((phase.value * 0.55) % 1) * 960, 420, { radius: 6, color: ROLE.bad }),
    ),
  );

  s.add(bgAura, ring3d, title, launchView, ringView, rightLabel);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.92 });

  c.on('mp-startup-payload-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-startup-payload-0', 0.35) })),
  );
  c.on('mp-startup-payload-calls', () =>
    s.play(pCalls.to(1, { duration: remainDuration(c, 'mp-startup-payload-calls', 0.7) })),
  );
  c.after('mp-startup-payload-startup', () =>
    s.play(pStart.to(1, { duration: remainAfterDuration(c, 'mp-startup-payload-startup', 0.4) })),
  );
  c.on('mp-startup-payload-baseline', () =>
    s.play(pBase.to(1, { duration: remainDuration(c, 'mp-startup-payload-baseline', 0.4) })),
  );
  c.on('mp-startup-payload-1', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-startup-payload-1', 0.16));
    swapViews(s, showLaunch, showRing, d, d);
  });
  c.after('mp-startup-payload-activation', () =>
    s.play(pAct.to(1, { duration: remainAfterDuration(c, 'mp-startup-payload-activation', 0.4) })),
  );
  c.after('mp-startup-payload-send', () =>
    s.play(pSend.to(1, { duration: remainAfterDuration(c, 'mp-startup-payload-send', 0.4) })),
  );
  c.show('mp-startup-payload-send', [ringEq], { after: true });
  c.on('mp-startup-payload-2', () =>
    s.play(pBw.to(1, { duration: remainDuration(c, 'mp-startup-payload-2', 0.4) })),
  );
  c.after('mp-startup-payload-payload', () =>
    s.play(pPay.to(1, { duration: remainAfterDuration(c, 'mp-startup-payload-payload', 0.4) })),
  );
}
