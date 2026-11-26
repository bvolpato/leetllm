// Scene 10: A collective has a specific output layout. All-Reduce vs All-Gather -> Reduce-Scatter -> compute vs communication stacked cost chart + 3D ring.
import {
  COSMOS,
  ROLE,
  SHARDS,
  aura,
  buildCluster3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainBeatDuration,
  remainDuration,
  runPhase,
  swapViews,
  txt,
} from '../parts.mjs';

export default function collective(s, c) {
  const phase = s.value(0);
  const showContracts = s.value(1);
  const showRS = s.value(0);
  const showCost = s.value(0);

  const pAR = s.value(0);
  const pAG = s.value(0);
  const pOwn = s.value(0);
  const pGlob = s.value(0);
  const pPart = s.value(0);
  const pComm = s.value(0);
  const pLocal = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#ffd16614');
  const { view: cluster3d } = buildCluster3d(() => 0.55, phase, {
    x: 495,
    y: 45,
    unit: 92,
    gpus: 4,
    radius: 1.9,
    ringColor: COSMOS.gold,
  });

  const title = heroTitle(['A Collective Has a', 'Specific Output Layout'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'ALL-REDUCE · ALL-GATHER · REDUCE-SCATTER',
  });

  const contractsView = guardedDynamic(showContracts, (a) => {
    const ar = pAR.value > 0.3;
    const ag = pAG.value > 0.3;
    const ow = pOwn.value > 0.3;

    const nodes = [
      txt(
        'ALL-REDUCE SUMS  ·  ALL-GATHER CONCATENATES',
        -340,
        -200,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      // All-reduce card
      glassCell(-340, -75, 920, 148, ar ? ROLE.gpu0 : COSMOS.dim, {
        fill: '#10213d',
        glow: ar ? 9 : 3,
        opacity: a,
      }),
      txt('ALL-REDUCE:  [1, 4] + [16, 1]', -340, -110, 30, ROLE.gpu0, 'mono').opacity(a),
      txt(
        ar
          ? `Every GPU receives full sum [${SHARDS.total.join(', ')}]`
          : 'Sums corresponding coordinates',
        -340,
        -44,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),

      // All-gather card
      glassCell(-340, 130, 920, 148, ag ? ROLE.gpu1 : COSMOS.dim, {
        fill: '#0e2b38',
        glow: ag ? 9 : 3,
        opacity: a,
      }),
      txt('ALL-GATHER:  [1, 4]  |  [6, 5]', -340, 95, 30, ROLE.gpu1, 'mono').opacity(a),
      txt(
        ag
          ? `Every GPU receives concat [${SHARDS.y.join(', ')}]`
          : 'Concatenates shards in rank order',
        -340,
        161,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),

      txt(
        ow ? 'Different values and ownership' : 'Same ranks, completely different output contract',
        -340,
        295,
        28,
        ow ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  const rsView = guardedDynamic(showRS, (a) => {
    const gl = pGlob.value > 0.3;
    const pt = pPart.value > 0.4;
    const nodes = [
      txt(
        'REDUCE-SCATTER: SUM THEN PARTITION OWNERSHIP',
        -340,
        -200,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      glassCell(-340, -70, 860, 108, gl ? ROLE.gpu0 : COSMOS.dim, {
        fill: '#10213d',
        glow: gl ? 9 : 3,
        opacity: a,
      }),
      txt(
        `[1, 4] + [16, 1]  =  [${SHARDS.total.join(', ')}]`,
        -340,
        -70,
        34,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glowingArc([-460, -14], [-550, 96], 18, { color: ROLE.gpu1, width: 3.2, opacity: a }),
      glowingArc([-220, -14], [-130, 96], 18, { color: ROLE.expert, width: 3.2, opacity: a }),

      glassCell(-550, 152, 380, 108, pt ? ROLE.gpu1 : COSMOS.dim, {
        fill: '#0e2b38',
        glow: pt ? 9 : 3,
        opacity: a,
      }),
      txt(pt ? 'GPU 0 owns [17]' : 'GPU 0 slice...', -550, 152, 30, ROLE.gpu1, 'mono').opacity(a),

      glassCell(-130, 152, 380, 108, pt ? ROLE.expert : COSMOS.dim, {
        fill: '#1f1538',
        glow: pt ? 9 : 3,
        opacity: a,
      }),
      txt(pt ? 'GPU 1 owns [5]' : 'GPU 1 slice...', -130, 152, 30, ROLE.expert, 'mono').opacity(a),

      txt(
        'Direct ring kernels satisfy this layout without materializing the full vector',
        -340,
        295,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  const costView = guardedDynamic(showCost, (a) => {
    const cm = pComm.value;
    const lc = pLocal.value;
    const groups = [1, 2, 4];
    const local = [4.0, 2.0, 1.0];
    const comm = [0.0, 1.3, 1.8];
    const baseY = 235;
    const unit = 74;

    const nodes = [
      txt(
        'SMALLER LOCAL WORK EXPOSES COLLECTIVE TIME',
        -340,
        -200,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt('■ Local compute', -620, -135, 26, ROLE.gpu0, 'mono', 'left').opacity(a),
      txt('■ Communication', -260, -135, 26, ROLE.bad, 'mono', 'left').opacity(a),
    ];

    groups.forEach((cnt, i) => {
      const cx = -630 + i * 290;
      const lh = local[i] * unit;
      const ch = comm[i] * unit * Math.max(0.3, cm);
      nodes.push(
        rect(170, lh, {
          fill: '#13315c',
          stroke: lc > 0.5 ? COSMOS.gold : ROLE.gpu0,
          width: 2.4,
          radius: 8,
        })
          .at(cx, baseY - lh * 0.5)
          .opacity(a),
        txt(`${local[i].toFixed(0)}u`, cx, baseY - lh * 0.5, 28, COSMOS.ink, 'mono').opacity(a),
      );
      if (comm[i] > 0) {
        nodes.push(
          rect(170, ch, { fill: '#351424', stroke: ROLE.bad, width: 2.6, radius: 8 })
            .at(cx, baseY - lh - ch * 0.5)
            .glow(8, ROLE.bad)
            .opacity(a),
          txt(`+${comm[i]}`, cx, baseY - lh - ch * 0.5, 26, ROLE.bad, 'mono').opacity(a),
        );
      }
      nodes.push(
        txt(`${cnt} GPU${cnt > 1 ? 's' : ''}`, cx, baseY + 42, 28, COSMOS.ink, 'mono').opacity(a),
      );
    });

    nodes.push(
      txt(
        'Normalized cost illustration · measure your real interconnect and topology',
        -340,
        345,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const ringLabel = guardedDynamic(1, () =>
    group(
      txt('3D COLLECTIVE RING', 495, -395, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
      txt('Latency + bandwidth scale with topology', 495, 420, 26, COSMOS.muted, 'sans'),
      glowDot(-820 + ((phase.value * 0.55) % 1) * 960, 420, { radius: 6, color: COSMOS.gold }),
    ),
  );

  s.add(bgAura, cluster3d, title, contractsView, rsView, costView, ringLabel);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cluster3d, { theta: -0.2, phi: 0.92 });

  c.on('all-reduce-contract', () =>
    s.play(pAR.to(1, { duration: remainDuration(c, 'all-reduce-contract', 0.4) })),
  );
  c.on('all-gather-contract', () =>
    s.play(pAG.to(1, { duration: remainDuration(c, 'all-gather-contract', 0.4) })),
  );
  c.on('distinct-ownership', () =>
    s.play(pOwn.to(1, { duration: remainDuration(c, 'distinct-ownership', 0.4) })),
  );
  c.onBeat(1, () => {
    const d = Math.min(0.16, remainBeatDuration(c, 1, 0.16));
    swapViews(s, showContracts, showRS, d, d);
  });
  c.on('global-reduction', () =>
    s.play(pGlob.to(1, { duration: remainDuration(c, 'global-reduction', 0.4) })),
  );
  c.on('partition-result', () =>
    s.play(pPart.to(1, { duration: remainDuration(c, 'partition-result', 0.45) })),
  );
  c.onBeat(2, () => {
    const d = Math.min(0.16, remainBeatDuration(c, 2, 0.16));
    swapViews(s, showRS, showCost, d, d);
  });
  c.on('communication-cost', () =>
    s.play(pComm.to(1, { duration: remainDuration(c, 'communication-cost', 0.45) })),
  );
  c.on('local-compute', () =>
    s.play(pLocal.to(1, { duration: remainDuration(c, 'local-compute', 0.4) })),
  );
}
