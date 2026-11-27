// Scene 14: Measure the boundary each byte crosses: NVLink/NVL72 vs PCIe, 400Gbps=50GB/s, 800Gbps=100GB/s, GPUDirect RDMA hop.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function topologyLinks(s, c) {
  const phase = s.value(0);
  const rdmaStep = s.value(0); // 1=read GPU, 2=cross net, 3=write GPU

  const bgAura = aura(0, 20, 640, '#5ce1e61e', '#6ee7b718');
  const title = heroTitle(['Measure the Boundary', 'Each Byte Crosses'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.comm,
    eyebrow: 'NVLINK · INFINIBAND · GPUDIRECT RDMA',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const rs = Math.round(rdmaStep.value);
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Top bandwidth conversion rulers (bits -> bytes / 8)
      glassCell(-430, -145, 740, 128, ROLE.comm, { fill: '#0e1f36', glow: 8 }),
      txt('400 Gb/s PORT  ÷ 8  =  50 GB/s (unidir)', -430, -172, 26, ROLE.comm, 'mono'),
      txt('800 Gb/s PORT  ÷ 8  =  100 GB/s (unidir)', -430, -118, 26, ROLE.good, 'mono'),

      glassCell(430, -145, 740, 128, COSMOS.gold, { fill: '#221c10', glow: 7 }),
      txt('DOMAIN PLACEMENT', 430, -172, 26, COSMOS.gold, 'mono'),
      txt('NVLink / NVL72 (fast)  vs  PCIe / Cross-Node NIC', 430, -118, 26, COSMOS.ink, 'sans'),

      // Bottom GPUDirect RDMA 4-hop pipeline: GPU A -> NIC A -> Fabric -> NIC B -> GPU B
      txt('GPUDIRECT RDMA CROSS-NODE SHARD HOP (BYPASSES HOST CPU)', 0, -12, 26, ROLE.good, 'mono'),
    ];

    const hops = [
      { label: 'GPU A VRAM', x: -640, col: ROLE.weights, on: rs >= 1 },
      { label: 'NIC A (RDMA)', x: -215, col: ROLE.comm, on: rs >= 1 },
      { label: 'NIC B (RDMA)', x: 215, col: ROLE.comm, on: rs >= 2 },
      { label: 'GPU B VRAM', x: 640, col: ROLE.good, on: rs >= 3 },
    ];
    hops.forEach((h, i) => {
      nodes.push(
        glassCell(h.x, 108, 320, 124, h.on ? h.col : COSMOS.dim, {
          fill: h.on ? '#112238' : '#0b101d',
          glow: h.on ? 10 * pulse : 2,
        }),
        txt(h.label, h.x, 108, 28, h.on ? h.col : COSMOS.muted, 'mono'),
      );
      if (i < hops.length - 1) {
        const x1 = h.x + 164;
        const x2 = hops[i + 1].x - 164;
        nodes.push(
          glowingArc([x1, 108], [x2, 108], -22, {
            color: h.on ? COSMOS.gold : COSMOS.dim,
            width: 3.6,
            opacity: h.on ? 0.92 : 0.35,
          }),
        );
      }
    });

    nodes.push(
      txt(
        'Compare unidirectional rates, shared ports & contention · time GPU-host-storage offload separately',
        0,
        325,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('rdma-read', () =>
    s.play(rdmaStep.to(1, { duration: remainDuration(c, 'rdma-read', 0.4) })),
  );
  c.on('rdma-network', () =>
    s.play(rdmaStep.to(2, { duration: remainDuration(c, 'rdma-network', 0.4) })),
  );
  c.on('rdma-write', () =>
    s.play(rdmaStep.to(3, { duration: remainDuration(c, 'rdma-write', 0.4) })),
  );
}
