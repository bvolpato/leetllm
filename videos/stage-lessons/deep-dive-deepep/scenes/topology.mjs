// Scene 11: Logical payload and physical links use different ledgers.
// Direct R0->R3 vs Hybrid RDMA rail R0->R2 + NVLink hop R2->R3; 100 MiB logical (104.86 GB/s) vs 50 MiB remote (52.43 GB/s).
import {
  COSMOS,
  ROLE,
  TOPO_LOGICAL_GBS,
  TOPO_LOGICAL_MIB,
  TOPO_REMOTE_GBS,
  TOPO_REMOTE_MIB,
  aura,
  buildFabricTopologyRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function topology(s, c) {
  const phase = s.value(0);
  const hybridMode = s.value(0);
  const fenceVal = s.value(0);
  const railActive = s.value(0);
  const localActive = s.value(0);
  const visFocus = s.value(0);
  const showLedger = s.value(0);
  const revealRates = s.value(0);

  const bgAura = aura(470, 12, 500, '#fb923c24', '#5ce1e61c');
  const { view: rig3d } = buildFabricTopologyRig3d(hybridMode, fenceVal, phase, {
    x: 470,
    y: 12,
    unit: 92,
  });

  const title = heroTitle(['Logical Payload vs.', 'Physical Fabric Links'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.rdma,
    eyebrow: 'DIRECT VS HYBRID · SCALE-OUT + SCALE-UP',
    subtitle: '2 nodes x 2 ranks · Direct flat link vs RDMA rail + NVLink hop',
  });

  const live = guardedDynamic(1, () => {
    const isHybrid = Math.round(hybridMode.value) >= 1;
    const isRail = Math.round(railActive.value) >= 1;
    const isLocal = Math.round(localActive.value) >= 1;
    const isVis = Math.round(visFocus.value) >= 1;
    const isLedger = Math.round(showLedger.value) >= 1;
    const isRates = Math.round(revealRates.value) >= 1;

    const nodes = [
      txt('3D 2-NODE FABRIC: RDMA RAIL + NVLINK', 470, -415, 26, ROLE.rdma, 'mono').glow(
        5,
        ROLE.rdma,
      ),
      txt(
        isHybrid ? 'Hybrid: R0 --RDMA--> R2 --NVLink--> R3' : 'Direct: R0 --flat domain--> R3',
        470,
        435,
        26,
        isHybrid ? ROLE.nvlink : ROLE.rank0,
        'mono',
      ),
    ];

    // Two Node containers on left zone (-855 .. -25)
    nodes.push(
      glassCell(-665, 20, 340, 270, ROLE.rank0, { fill: '#0c182e', glow: 6 }),
      txt('NODE A', -665, -82, 26, ROLE.rank0, 'mono'),
      rect(240, 62, { fill: '#12294a', stroke: ROLE.rank0, width: 2.2, radius: 8 }).at(-665, -20),
      txt('Rank 0 (src)', -665, -20, 26, COSMOS.ink, 'mono'),
      rect(240, 62, { fill: '#0f1c33', stroke: COSMOS.dim, width: 1.8, radius: 8 }).at(-665, 86),
      txt('Rank 1', -665, 86, 26, COSMOS.muted, 'mono'),

      glassCell(-215, 20, 340, 270, ROLE.rank1, { fill: '#18112b', glow: 6 }),
      txt('NODE B', -215, -82, 26, ROLE.rank1, 'mono'),
      rect(240, 62, {
        fill: isRail ? '#3b2110' : '#17142b',
        stroke: isRail ? ROLE.rdma : COSMOS.dim,
        width: 2.2,
        radius: 8,
      }).at(-215, -20),
      txt('Rank 2 (rail)', -215, -20, 26, isRail ? ROLE.rdma : COSMOS.muted, 'mono'),
      rect(240, 62, {
        fill: isLocal || !isHybrid ? '#0e2d3b' : '#17142b',
        stroke: isLocal || !isHybrid ? ROLE.nvlink : COSMOS.dim,
        width: 2.4,
        radius: 8,
      }).at(-215, 86),
      txt('Rank 3 (dst)', -215, 86, 26, isLocal || !isHybrid ? ROLE.nvlink : COSMOS.muted, 'mono'),
    );

    if (!isHybrid) {
      nodes.push(
        line([-540, -10], [-340, 80], { stroke: ROLE.rank0, width: 4.5 }).glow(6, ROLE.rank0),
        txt('Direct', -440, -32, 26, ROLE.rank0, 'mono'),
      );
    } else {
      nodes.push(
        line([-540, -20], [-340, -20], { stroke: ROLE.rdma, width: 5 }).glow(8, ROLE.rdma),
        txt('RDMA', -440, -52, 26, ROLE.rdma, 'mono'),
        line([-215, 14], [-215, 52], { stroke: ROLE.nvlink, width: 5 }).glow(8, ROLE.nvlink),
      );
    }

    // Bottom ledger or visibility status
    if (isLedger) {
      nodes.push(
        glassCell(-440, 255, 820, 142, isRates ? ROLE.good : ROLE.rdma, {
          fill: '#0e1d26',
          glow: 7,
        }),
        txt(
          `Payload: ${TOPO_LOGICAL_MIB} MiB logical  ·  ${TOPO_REMOTE_MIB} MiB remote (1 ms)`,
          -440,
          224,
          26,
          ROLE.token,
          'mono',
        ),
        txt(
          isRates
            ? `Logical: ${TOPO_LOGICAL_GBS.toFixed(2)} GB/s  ·  Remote NIC: ${TOPO_REMOTE_GBS.toFixed(2)} GB/s`
            : 'Computing logical vs remote byte rate...',
          -440,
          286,
          27,
          isRates ? ROLE.good : COSMOS.muted,
          'mono',
        ),
      );
    } else {
      nodes.push(
        glassCell(-440, 255, 820, 108, isVis ? ROLE.token : ROLE.nvlink, {
          fill: '#0e1a2a',
          glow: 6,
        }),
        txt(
          isVis
            ? 'Writes must be visible on Rank 3 before consumer reads'
            : 'Original global src & dst identity survives both hops',
          -440,
          255,
          26,
          isVis ? ROLE.token : ROLE.nvlink,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('topology-direct-domain', () =>
    s.play(hybridMode.to(0, { duration: remainDuration(c, 'topology-direct-domain', 0.35) })),
  );
  c.on('topology-beat-1-focus-2', () =>
    s.play(hybridMode.to(1, { duration: remainDuration(c, 'topology-beat-1-focus-2', 0.45) })),
  );
  c.on('topology-rail-hop', () => {
    const dur = remainDuration(c, 'topology-rail-hop', 0.55);
    s.play(hybridMode.to(1, { duration: 0.25 }));
    s.play(railActive.to(1, { duration: dur }));
  });
  c.on('topology-beat-1-focus-1', () =>
    s.play(localActive.to(1, { duration: remainDuration(c, 'topology-beat-1-focus-1', 0.55) })),
  );
  c.on('topology-beat-2-focus-1', () =>
    s.play(visFocus.to(0.4, { duration: remainDuration(c, 'topology-beat-2-focus-1', 0.4) })),
  );
  c.on('topology-beat-2-focus-2', () => {
    const dur = remainDuration(c, 'topology-beat-2-focus-2', 0.55);
    s.play(visFocus.to(1, { duration: dur }));
    s.play(fenceVal.to(0.6, { duration: dur }));
  });
  c.on('topology-beat-3-focus-1', () => {
    const dur = remainDuration(c, 'topology-beat-3-focus-1', 0.45);
    s.play(showLedger.to(1, { duration: dur }));
    s.play(fenceVal.to(0, { duration: dur }));
  });
  c.on('topology-beat-3-focus-2', () =>
    s.play(showLedger.to(1, { duration: remainDuration(c, 'topology-beat-3-focus-2', 0.3) })),
  );
  c.after('dep-result-topology-rates', () =>
    s.play(
      revealRates.to(1, { duration: remainAfterDuration(c, 'dep-result-topology-rates', 0.3) }),
    ),
  );
}
