// Scene 15: A topology symbol describes a path class (nvidia-smi topo -m 4-GPU matrix: NV4, PIX, PXB, PHB, NODE, SYS; bandwidth stays '?' until measured!).
import {
  COSMOS,
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

export default function topologyMatrix(s, c) {
  const phase = s.value(0);
  // step: 0..3=symbol table & matrix, 4..7=NV4 link count != measured GB/s, 8..10=CSV query selectors & provenance
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#5ce1e618');
  const title = heroTitle(['A Topology Symbol', 'Is a Path Class'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.r0,
    eyebrow: 'NVIDIA-SMI TOPO -M · PATH CLASS VS BANDWIDTH',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    const cols = ['GPU0', 'GPU1', 'GPU2', 'GPU3', 'NIC0', 'NIC1'];
    const rows = [
      ['X', 'NV4', 'SYS', 'SYS', 'PIX', 'SYS'],
      ['NV4', 'X', 'SYS', 'SYS', 'PIX', 'SYS'],
      ['SYS', 'SYS', 'X', 'NV4', 'SYS', 'PIX'],
      ['SYS', 'SYS', 'NV4', 'X', 'SYS', 'PIX'],
    ];

    const nodes = [txt('4-GPU TOPOLOGY MATRIX (ILLUSTRATIVE)', -360, -225, 26, ROLE.r0, 'mono')];

    cols.forEach((cl, j) => {
      nodes.push(txt(cl, -700 + j * 136, -165, 26, COSMOS.muted, 'mono'));
    });

    rows.forEach((row, i) => {
      const y = -98 + i * 86;
      nodes.push(txt(`GPU${i}`, -820, y, 26, ROLE.r0, 'mono'));
      row.forEach((sym, j) => {
        const cx = -700 + j * 136;
        const isNV = sym === 'NV4';
        const isPix = sym === 'PIX';
        const col = isNV ? ROLE.good : isPix ? COSMOS.gold : sym === 'X' ? COSMOS.dim : ROLE.bad;
        nodes.push(
          glassCell(cx, y, 122, 68, col, {
            fill: isNV ? '#0d2924' : isPix ? '#251e0e' : '#0f1626',
            glow: isNV || isPix ? 7 : 1,
          }),
          txt(sym, cx, y, 26, col, 'mono'),
        );
      });
    });

    // Right legend / evidence card
    nodes.push(
      glassCell(495, -80, 680, 224, ROLE.comm, { fill: '#0e202d', glow: 8 }),
      txt('PATH CLASS DEFINITIONS', 495, -156, 26, ROLE.comm, 'mono'),
      txt('NV4: 4 bonded NVLinks (not GB/s!)', 495, -104, 26, ROLE.good, 'mono'),
      txt('PIX/PXB/PHB: 1 switch / multi / bridge', 495, -54, 26, COSMOS.gold, 'mono'),
      txt('NODE: 1 NUMA   ·   SYS: cross-NUMA', 495, -4, 26, ROLE.bad, 'mono'),

      glassCell(495, 165, 680, 178, st >= 8 ? ROLE.good : COSMOS.gold, {
        fill: st >= 8 ? '#0d2624' : '#221b0f',
        glow: 8,
      }),
      txt(
        st >= 8 ? 'REPEATABLE INVENTORY' : 'MEASURED BANDWIDTH',
        495,
        112,
        26,
        st >= 8 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
      txt(
        st >= 8
          ? 'Use CSV query selectors, not table scrape'
          : 'GPU0 <-> GPU1: NV4  |  rate = ? (measure!)',
        495,
        166,
        26,
        COSMOS.ink,
        'mono',
      ),
      txt(
        st >= 8
          ? 'Record GPU, driver, CUDA, NCCL & rank map'
          : 'Verify route selected by NCCL on workload',
        495,
        216,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 295, { radius: 6, color: ROLE.comm }),
      txt(
        'Topology matrices tell you which placements are worth testing; only measurements fill in GB/s',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['nc-topology-matrix-b0-s0', 0],
    ['nc-topology-matrix-b0-s1', 1],
    ['nc-topology-matrix-b0-s2', 2],
    ['nc-topology-matrix-b0-s3', 3],
    ['nc-topology-matrix-b1-s0', 4],
    ['nc-topology-matrix-b1-s1', 5],
    ['nc-topology-matrix-b1-s2', 6],
    ['nc-topology-matrix-b1-s3', 7],
    ['nc-topology-matrix-b2-s0', 8],
    ['nc-topology-matrix-b2-s1', 9],
    ['nc-topology-matrix-b2-s2', 10],
  ]);
}
