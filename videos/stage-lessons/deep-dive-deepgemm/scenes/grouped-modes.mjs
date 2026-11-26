// Scene 14: Choose the packing contract that matches available counts.
// Alignment math (zero -> 0), Contiguous (128 default vs 256 theoretical SM100), Masked CUDA-graph decode, K-grouped backward.
import {
  COSMOS,
  PACK_128,
  PACK_256,
  ROLE,
  aura,
  buildMoePackSlabs3d,
  counts,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function groupedModes(s, c) {
  const phase = s.value(0);
  const wide = s.value(0); // 0 = align 128, 1 = align 256
  const step = s.value(0); // 1=zero->0, 2=640 vs 1024, 3=contiguous, 4=256 helper, 5=masked, 6=K-grouped

  const widthsFn = () => PACK_128.padded.map((v, i) => v + (PACK_256.padded[i] - v) * wide.value);
  const pinFn = () => {
    const w = widthsFn();
    return w[0] + w[1];
  };

  const bgAura = aura(445, 20, 520, '#5ce1e620', '#a78bfa1c');
  const { view: pack3d } = buildMoePackSlabs3d(counts, widthsFn, pinFn, 1024, phase, {
    x: 455,
    y: 15,
    unit: 92,
  });

  const title = heroTitle(['Match Grouped Mode', 'to Available Counts'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.c,
    eyebrow: 'CONTIGUOUS · MASKED · K-GROUPED',
    subtitle: 'Three grouped GEMM contracts for prefill, decode & backward',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D GROUPED MOE ALIGNMENT', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Configured 128 vs Theoretical SM100 256 alignment', 455, 435, 26, COSMOS.muted, 'sans'),
    ];

    // Top rule strip
    nodes.push(
      glassCell(-460, -138, 800, 96, st >= 0.6 ? ROLE.gold : COSMOS.dim, {
        fill: '#141a2e',
        glow: st >= 0.6 ? 7 : 0,
      }),
      txt('align(n, a) = ceil(n/a) × a · align(0, a) = 0', -460, -158, 26, ROLE.gold, 'mono'),
      txt(
        st >= 1.6
          ? '128 -> 640 (35% pad / 53.8% ovh) · 256 -> 1,024'
          : 'Round each expert independently, then sum',
        -460,
        -116,
        26,
        COSMOS.ink,
        'mono',
      ),
    );

    // Three grouped mode slabs
    const modes = [
      {
        name: '1. CONTIGUOUS (PREFILL / TRAIN)',
        desc:
          st >= 3.5 && st < 4.6
            ? 'Oct default 128 · SM100 theoretical 256 (more pad)'
            : 'CPU knows counts · concat M · keep segment map',
        col: ROLE.c,
        lit: st >= 2.6,
        focus: st >= 2.6 && st < 4.6,
      },
      {
        name: '2. MASKED (CUDA-GRAPH DECODE)',
        desc: 'CPU counts unknown · fixed shape + GPU mask',
        col: ROLE.scale,
        lit: st >= 4.6,
        focus: st >= 4.6 && st < 5.6,
      },
      {
        name: '3. K-GROUPED BACKWARD',
        desc: 'Weight grads · M & N fixed, K axis grouped',
        col: ROLE.good,
        lit: st >= 5.6,
        focus: st >= 5.6,
      },
    ];

    modes.forEach((m, i) => {
      const y = -8 + i * 124;
      const border = m.focus ? ROLE.gold : m.lit ? m.col : COSMOS.dim;
      nodes.push(
        glassCell(-460, y, 800, 98, border, {
          fill: m.focus ? '#132136' : '#0d1528',
          glow: m.focus ? 10 : m.lit ? 4 : 0,
        }),
        txt(m.name, -830, y - 18, 26, m.focus ? ROLE.gold : m.col, 'mono', 'left'),
        txt(m.desc, -830, y + 22, 26, m.lit ? COSMOS.ink : COSMOS.muted, 'sans', 'left'),
      );
    });

    nodes.push(
      txt(
        'Time packing, masks, scale prep & unpack together on the target path',
        -860,
        388,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, pack3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pack3d, { theta: -0.2, phi: 0.94 });

  c.on('gm-align', () => s.play(step.to(1, { duration: remainDuration(c, 'gm-align', 0.45) })));
  c.on('gm-compare', () => {
    const dur = remainDuration(c, 'gm-compare', 0.55);
    s.play(step.to(2, { duration: dur }));
    s.play(wide.to(1, { duration: dur }));
  });
  c.on('gm-contig', () => {
    const dur = remainDuration(c, 'gm-contig', 0.5);
    s.play(step.to(3, { duration: dur }));
    s.play(wide.to(0, { duration: dur }));
  });
  c.on('gm-256', () => {
    const dur = remainDuration(c, 'gm-256', 0.5);
    s.play(step.to(4, { duration: dur }));
    s.play(wide.to(1, { duration: dur }));
  });
  c.on('gm-masked', () => s.play(step.to(5, { duration: remainDuration(c, 'gm-masked', 0.45) })));
  c.on('gm-kgroup', () => s.play(step.to(6, { duration: remainDuration(c, 'gm-kgroup', 0.45) })));
}
