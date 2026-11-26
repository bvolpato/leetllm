// Scene 14: Reconcile byte definitions before comparing bandwidth.
// 50 MiB local + 50 MiB remote = 100 MiB over 1 ms -> 104.86 GB/s logical vs 52.43 GB/s remote.
import {
  COSMOS,
  ROLE,
  TOPO_LOCAL_MIB,
  TOPO_LOGICAL_GBS,
  TOPO_REMOTE_GBS,
  TOPO_REMOTE_MIB,
  aura,
  buildFabricTopologyRig3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function logicalReceipts(s, c) {
  const phase = s.value(0);
  const hybridMode = s.value(1);
  const fenceVal = s.value(0);
  const remoteHighlight = s.value(0);
  const showConvert = s.value(0);
  const bytesDone = s.value(0);
  const timeDone = s.value(0);
  const ratesDone = s.value(0);

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#fb923c1c');
  const { view: rig3d } = buildFabricTopologyRig3d(hybridMode, fenceVal, phase, {
    x: 470,
    y: 12,
    unit: 92,
  });

  const title = heroTitle(['Reconcile Byte', 'Definitions First'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.nvlink,
    eyebrow: 'LOGICAL BANDWIDTH VS NIC COUNTER',
    subtitle: 'Same 100 MiB payload & 1 ms window, two observation boundaries',
  });

  const live = guardedDynamic(1, () => {
    const isRemote = Math.round(remoteHighlight.value) >= 1;
    const isConv = Math.round(showConvert.value) >= 1;
    const hasBytes = Math.round(bytesDone.value) >= 1;
    const hasTime = Math.round(timeDone.value) >= 1;
    const hasRates = Math.round(ratesDone.value) >= 1;

    const nodes = [
      txt('3D LOCAL VS REMOTE PORT TRAFFIC', 470, -415, 26, ROLE.nvlink, 'mono').glow(
        5,
        ROLE.nvlink,
      ),
      txt(
        hasRates
          ? 'Logical 104.86 GB/s  ·  Remote NIC 52.43 GB/s'
          : 'Only the remote half crosses the network port',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
      // Split 100 MiB bar
      rect(400, 88, { fill: '#143866', stroke: ROLE.rank0, width: 2.4, radius: 8 }).at(-650, -72),
      txt(`${TOPO_LOCAL_MIB} MiB local`, -650, -72, 28, COSMOS.ink, 'mono'),
      rect(400, 88, {
        fill: isRemote ? '#592c14' : '#3a1d2e',
        stroke: isRemote ? ROLE.rdma : ROLE.bad,
        width: 2.8,
        radius: 8,
      })
        .at(-235, -72)
        .glow(isRemote ? 8 : 0, ROLE.rdma),
      txt(`${TOPO_REMOTE_MIB} MiB remote`, -235, -72, 28, COSMOS.ink, 'mono'),
      txt(
        'Dispatch counts both halves · NIC sees remote half (+ headers)',
        -860,
        12,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    if (isConv) {
      nodes.push(
        glassCell(-655, 118, 390, 84, hasBytes ? ROLE.nvlink : COSMOS.dim, {
          fill: '#0d1d2e',
          glow: hasBytes ? 6 : 0,
        }),
        txt(
          hasBytes ? '1 MiB = 1,048,576 B' : 'Convert MiB -> bytes',
          -655,
          118,
          26,
          hasBytes ? ROLE.nvlink : COSMOS.muted,
          'mono',
        ),
        glassCell(-225, 118, 390, 84, hasTime ? ROLE.nvlink : COSMOS.dim, {
          fill: '#0d1d2e',
          glow: hasTime ? 6 : 0,
        }),
        txt(
          hasTime ? '1 ms = 0.001 s' : 'Convert ms -> seconds',
          -225,
          118,
          26,
          hasTime ? ROLE.nvlink : COSMOS.muted,
          'mono',
        ),
        glassCell(-655, 260, 390, 122, hasRates ? ROLE.good : COSMOS.dim, {
          fill: hasRates ? '#0d251d' : '#111626',
          glow: hasRates ? 8 : 0,
        }),
        txt('LOGICAL DISPATCH', -655, 228, 26, COSMOS.muted, 'mono'),
        txt(
          hasRates ? `${TOPO_LOGICAL_GBS.toFixed(2)} GB/s` : '? GB/s',
          -655,
          282,
          36,
          hasRates ? ROLE.good : COSMOS.muted,
          'mono',
        ),
        glassCell(-225, 260, 390, 122, hasRates ? ROLE.rdma : COSMOS.dim, {
          fill: hasRates ? '#26170e' : '#111626',
          glow: hasRates ? 8 : 0,
        }),
        txt('REMOTE PAYLOAD', -225, 228, 26, COSMOS.muted, 'mono'),
        txt(
          hasRates ? `${TOPO_REMOTE_GBS.toFixed(2)} GB/s` : '? GB/s',
          -225,
          282,
          36,
          hasRates ? ROLE.rdma : COSMOS.muted,
          'mono',
        ),
      );
    } else {
      nodes.push(
        glowTex(String.raw`\mathrm{GB/s} = \frac{\mathrm{MiB} \times 2^{20}}{0.001 \times 10^9}`, {
          x: -440,
          y: 155,
          size: 40,
          color: ROLE.token,
          glow: 6,
        }),
        txt(
          'Match byte definition & start/end events before comparing runs',
          -860,
          285,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-logical-receipts-b0', () =>
    s.play(remoteHighlight.to(1, { duration: remainDuration(c, 'de-logical-receipts-b0', 0.6) })),
  );
  c.on('de-logical-receipts-b1', () =>
    s.play(showConvert.to(1, { duration: remainDuration(c, 'de-logical-receipts-b1', 0.45) })),
  );
  c.on('de-byte-conversion', () =>
    s.play(bytesDone.to(1, { duration: remainDuration(c, 'de-byte-conversion', 0.45) })),
  );
  c.on('de-time-conversion', () =>
    s.play(timeDone.to(1, { duration: remainDuration(c, 'de-time-conversion', 0.45) })),
  );
  c.after('de-rate-completion', () =>
    s.play(ratesDone.to(1, { duration: remainAfterDuration(c, 'de-rate-completion', 0.35) })),
  );
}
