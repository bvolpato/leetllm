// Scene 15: How many SMs bought that bandwidth?
// Historical V2 SM100 EP8 NVLink table: 24 SMs (643 / 675 GB/s) vs 64 SMs (726 / 740 GB/s).
import {
  COSMOS,
  ROLE,
  aura,
  buildStreamOverlapRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function historicalBenchmark(s, c) {
  const phase = s.value(0);
  const smSplit = s.value(0.24);
  const waitGate = s.value(0.8);
  const show64 = s.value(0);

  const bgAura = aura(470, 12, 500, '#fb923c24', '#6ee7b71a');
  const { view: rig3d } = buildStreamOverlapRig3d(smSplit, waitGate, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['How Many SMs', 'Bought That Rate?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.brand,
    eyebrow: 'HISTORICAL V2 · SM100 EP8 NVLINK',
    subtitle: '8,000 tokens · hidden 7,168 · top-8 · FP8 dispatch / BF16 combine',
  });

  const live = guardedDynamic(1, () => {
    const has64 = Math.round(show64.value) >= 1;
    const barMax = 520;
    const w24 = (643 / 800) * barMax;
    const w64 = (726 / 800) * barMax;

    const nodes = [
      txt('3D SM PARTITION: COMM VS EXPERT GEMM', 470, -415, 26, ROLE.brand, 'mono').glow(
        5,
        ROLE.brand,
      ),
      txt(
        has64
          ? '64 SMs -> 726 GB/s (fewer SMs left for experts)'
          : '24 SMs -> 643 GB/s (89% rate, +40 SMs for experts)',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),

      // Row 1: 24 SMs
      glassCell(-440, -56, 840, 154, ROLE.nvlink, { fill: '#0c1f2e', glow: 7 }),
      txt('24 COMM SMs  (overlap mode)', -825, -104, 26, ROLE.nvlink, 'mono', 'left'),
      rect(w24, 38, { fill: '#105066', stroke: ROLE.nvlink, width: 2.2, radius: 6 }).at(
        -825 + w24 * 0.5,
        -52,
      ),
      txt('643 GB/s', -825 + w24 + 22, -52, 28, ROLE.nvlink, 'mono', 'left'),
      txt('Combine: 675 GB/s logical', -825, -4, 26, COSMOS.muted, 'mono', 'left'),
    ];

    // Row 2: 64 SMs
    if (has64) {
      nodes.push(
        glassCell(-440, 122, 840, 154, ROLE.brand, { fill: '#26170e', glow: 7 }),
        txt('64 COMM SMs  (max transport)', -825, 74, 26, ROLE.brand, 'mono', 'left'),
        rect(w64, 38, { fill: '#592e14', stroke: ROLE.brand, width: 2.2, radius: 6 }).at(
          -825 + w64 * 0.5,
          126,
        ),
        txt('726 GB/s', -825 + w64 + 22, 126, 28, ROLE.brand, 'mono', 'left'),
        txt('Combine: 740 GB/s logical', -825, 174, 26, COSMOS.muted, 'mono', 'left'),
      );
    } else {
      nodes.push(
        glassCell(-440, 122, 840, 154, COSMOS.dim, { fill: '#101524', glow: 0 }),
        txt('More comm SMs -> fewer SMs for expert GEMMs', -440, 122, 26, COSMOS.muted, 'sans'),
      );
    }

    nodes.push(
      glassCell(-440, 310, 840, 112, has64 ? ROLE.good : ROLE.token, {
        fill: '#0e1e24',
        glow: 6,
      }),
      txt(
        has64
          ? 'Judge by warm layer time (dispatch -> combine)'
          : 'Reported logical bandwidth on 8-GPU NVLink',
        -440,
        286,
        26,
        has64 ? ROLE.good : ROLE.token,
        'mono',
      ),
      txt(
        has64
          ? 'V2.5 omits this table; measure your own workload & domain'
          : 'Same 8K-token workload keeps routes & precision fixed',
        -440,
        336,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-historical-benchmark-b0', () =>
    s.play(smSplit.to(0.28, { duration: remainDuration(c, 'de-historical-benchmark-b0', 0.65) })),
  );
  c.on('de-historical-benchmark-b1', () => {
    const dur = remainDuration(c, 'de-historical-benchmark-b1', 0.75);
    s.play(show64.to(1, { duration: dur }));
    s.play(smSplit.to(0.68, { duration: dur }));
  });
}
