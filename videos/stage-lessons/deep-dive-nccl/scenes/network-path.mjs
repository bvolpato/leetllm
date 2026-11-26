// Scene 16: Which link carries slot 2? 3D Dual-Host NVLink + PCIe + NIC + Fabric bridge; PXN peer forwarding & GPUDirect RDMA zero host copy!
import {
  COSMOS,
  ROLE,
  aura,
  buildHostFabric3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function networkPath(s, c) {
  const phase = s.value(0);
  const pxnVal = s.value(0);
  // step: 0..3=direct PCIe->NIC->Fabric->Host B, 4..7=PXN peer GPU relay + GPUDirect RDMA
  const step = s.value(0);

  const bgAura = aura(450, 25, 540, '#5ce1e620', '#ffd16618');
  const { view: fabric3d } = buildHostFabric3d(pxnVal, phase, { x: 475, y: 25, unit: 88 });

  const title = heroTitle(['Which Link Carries', 'Slot 2 Across Hosts?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.comm,
    eyebrow: 'NVLINK · PCIE · PXN · GPUDIRECT RDMA',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const isPxn = st >= 5;

    const nodes = [
      txt('3D TWO-HOST NVLINK + FABRIC BRIDGE', 475, -390, 26, ROLE.comm, 'mono').glow(
        5,
        ROLE.comm,
      ),
      txt(
        isPxn
          ? 'PXN: R2 -> NVLink -> Peer GPU -> NIC -> Host B'
          : 'Direct: R2 -> PCIe -> NIC -> Fabric -> Host B',
        475,
        405,
        26,
        isPxn ? COSMOS.gold : ROLE.comm,
        'mono',
      ),

      glassCell(-420, -110, 860, 200, !isPxn ? ROLE.comm : COSMOS.dim, {
        fill: !isPxn ? '#0e222e' : '#0b101d',
        glow: !isPxn ? 9 : 2,
      }),
      txt('INTRA-NODE vs INTER-NODE ROUTE', -420, -172, 28, ROLE.comm, 'mono'),
      txt('Same host: NVLink / NVSwitch directly between GPUs', -420, -112, 26, COSMOS.ink, 'sans'),
      txt(
        'Cross-host: PCIe -> NIC A -> IB/RoCE Fabric -> NIC B',
        -420,
        -54,
        26,
        COSMOS.gold,
        'mono',
      ),

      glassCell(-420, 145, 860, 224, isPxn ? ROLE.good : COSMOS.dim, {
        fill: isPxn ? '#0d2624' : '#0a0f1c',
        glow: isPxn ? 10 : 2,
      }),
      txt('PXN & GPUDIRECT RDMA', -420, 74, 28, isPxn ? ROLE.good : COSMOS.dim, 'mono'),
      txt(
        'PXN relays via peer GPU with PIX affinity to NIC',
        -420,
        132,
        26,
        isPxn ? COSMOS.ink : COSMOS.dim,
        'sans',
      ),
      txt(
        'GPUDirect RDMA: NIC reads GPU VRAM (skips CPU copy)',
        -420,
        184,
        26,
        st >= 6 ? ROLE.good : COSMOS.dim,
        'sans',
      ),
      txt(
        'Confirm selected route in transport log & HW counters',
        -420,
        232,
        26,
        COSMOS.muted,
        'mono',
      ),

      txt(
        'Placement, link health, and competing traffic all shape cross-node collective latency',
        -855,
        345,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];
    return group(...nodes);
  });

  s.add(bgAura, fabric3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, fabric3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['nc-network-path-b0-s0', 0],
    ['nc-network-path-b0-s1', 1],
    ['nc-network-path-b0-s2', 2],
    ['nc-network-path-b0-s3', 3],
    ['nc-network-path-b1-s0', 4],
    ['nc-network-path-b1-s1', 5],
    ['nc-network-path-b1-s2', 6],
    ['nc-network-path-b1-s3', 7],
  ]);
  c.on('nc-network-path-b1-s1', () => s.play(pxnVal.to(1, { duration: 0.45 })));
}
