// Scene 02: One ticket, two paths through a layer: Orbiting 3D frozen W_0 monolith + 3 task adapters + parallel correction.
import {
  COSMOS,
  aura,
  buildLoraAssembly3d,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const baseLocked = s.value(0);
  const showAdapters = s.value(0);
  const selectPolicy = s.value(0);
  const sendInput = s.value(0);
  const combineOut = s.value(0);

  const bgAura = aura(320, 0, 560, '#60a5fa24', '#ffd16618');
  const assembly3d = buildLoraAssembly3d(phase, sendInput, { x: 350, y: -10, unit: 92 });

  const title = heroTitle(['One Ticket,', 'Two Paths'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'LOW-RANK ADAPTATION (LORA)',
    subtitle: 'Frozen base + tiny trainable pair',
  });

  const eq = glowTex(String.raw`h = W_0 x + \Delta W x`, {
    x: 350,
    y: 405,
    size: 40,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const bl = baseLocked.value;
    const sa = showAdapters.value;
    const sp = selectPolicy.value;
    const si = sendInput.value;
    const co = combineOut.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const adapters = [
      { name: 'Policy (P04)', color: COSMOS.gold, selected: sp > 0.3 },
      { name: 'Code Reviewer', color: COSMOS.cyan, selected: false },
      { name: 'Science Tutor', color: COSMOS.violet, selected: false },
    ];

    const nodes = [
      // 3D labels
      txt('FROZEN W_0', 175, -395, 26, COSMOS.blue, 'mono').glow(6, COSMOS.blue),
      txt('LOW-RANK A -> B', 540, -395, 26, COSMOS.gold, 'mono').glow(6, COSMOS.gold),

      // Frozen base block indicator on left
      glassCell(-555, -132, 595, 114, COSMOS.blue, {
        fill: '#111d38',
        glow: bl > 0.2 ? 10 : 5,
      }),
      txt('FROZEN BASE LAYER  W_0', -825, -162, 26, COSMOS.blue, 'mono', 'left'),
      txt(
        bl > 0.2 ? 'Weights fixed · computes usual P04 reply' : 'Pretrained linear weights',
        -825,
        -108,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),
    ];

    // Three shareable adapter slots
    for (let i = 0; i < adapters.length; i++) {
      const ad = adapters[i];
      const y = 4 + i * 102;
      const alpha = Math.max(0.42, sa);
      const isActive = ad.selected;
      nodes.push(
        glassCell(-555, y, 595, 86, isActive ? ad.color : '#334268', {
          fill: isActive ? '#261f10' : '#12182b',
          glow: isActive ? 11 * pulse : 3,
          opacity: alpha,
        }),
        glowDot(-815, y, {
          radius: isActive ? 8 : 5,
          color: ad.color,
          opacity: alpha,
        }),
        txt(ad.name, -785, y, 28, isActive ? ad.color : COSMOS.ink, 'mono', 'left').opacity(alpha),
        txt(
          isActive ? 'ACTIVE (A, B)' : 'shared base',
          -285,
          y,
          26,
          isActive ? COSMOS.gold : COSMOS.muted,
          'mono',
          'right',
        ).opacity(alpha),
      );
    }

    // Input P04 beam + combined response
    if (si > 0.05) {
      nodes.push(
        glowingArc([-255, -12], [60, -10], -48, {
          color: COSMOS.gold,
          width: 4,
          opacity: si,
        }),
      );
    }

    const outCol = co > 0.4 ? COSMOS.emerald : COSMOS.dim;
    nodes.push(
      glassCell(-555, 346, 595, 118, outCol, {
        fill: co > 0.4 ? '#0e2528' : '#111729',
        glow: co > 0.4 ? 10 : 2,
      }),
      txt('COMBINED LAYER OUTPUT', -825, 314, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        co > 0.4 ? 'base output + policy correction' : 'waiting for parallel branch...',
        -825,
        368,
        28,
        outCol,
        'mono',
        'left',
      ).glow(co > 0.4 ? 6 : 0, outCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, assembly3d, title, eq, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, assembly3d, { theta: -0.22, phi: 0.94 });

  c.on('intro-b1-1', () => s.play(baseLocked.to(1, { duration: 0.45 })));
  c.on('intro-b2-1', () => s.play(showAdapters.to(1, { duration: 0.5 })));
  c.on('intro-select', () => s.play(selectPolicy.to(1, { duration: 0.4 })));
  c.on('intro-send', () => s.play(sendInput.to(1, { duration: 0.5 })));
  c.on('intro-b3-1', () =>
    s.play(combineOut.to(1, { duration: remainDuration(c, 'intro-b3-1', 0.5) })),
  );
}
