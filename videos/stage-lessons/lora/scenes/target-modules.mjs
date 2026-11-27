// Scene 15: Choose where the new capacity enters: Transformer block token flow -> Q/V adapters -> all attention + MLP -> inspect shapes & vocab.
import {
  COSMOS,
  arrow,
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

export default function targetModules(s, c) {
  const phase = s.value(0);
  const showQV = s.value(0);
  const showAll = s.value(0);
  const showInspect = s.value(0);

  const bgAura = aura(120, 10, 620, '#5ce1e61e', '#ffd16618');
  const title = heroTitle(['Choose Where', 'Capacity Enters'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'TRANSFORMER BLOCK INJECTION POINTS',
  });

  const attnMods = [
    { name: 'q_proj', role: 'query routing', qv: true },
    { name: 'k_proj', role: 'key address', qv: false },
    { name: 'v_proj', role: 'value payload', qv: true },
    { name: 'o_proj', role: 'head mix', qv: false },
  ];
  const mlpMods = [
    { name: 'gate_proj', role: 'SwiGLU gate' },
    { name: 'up_proj', role: 'feature expand' },
    { name: 'down_proj', role: 'residual project' },
  ];

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const qv = showQV.value;
    const all = showAll.value;
    const ins = showInspect.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Section headings
      txt('SELF-ATTENTION PROJECTIONS', -450, -210, 26, COSMOS.cyan, 'mono'),
      txt('FEED-FORWARD (MLP) PROJECTIONS', 460, -210, 26, COSMOS.violet, 'mono'),
      arrow([-40, 20], [100, 20], { stroke: COSMOS.cyan, width: 4.5, tip: 14 }).glow(
        8,
        COSMOS.cyan,
      ),
    ];

    // 4 Attention slabs on left
    attnMods.forEach((mod, i) => {
      const x = -665 + (i % 2) * 395;
      const y = -80 + Math.floor(i / 2) * 200;
      const adapted = (mod.qv && qv > 0.2) || (!mod.qv && all > 0.2);
      const col = adapted ? COSMOS.gold : COSMOS.blue;
      nodes.push(
        glassCell(x, y, 355, 148, col, {
          fill: adapted ? '#221d11' : '#101b35',
          glow: adapted ? 10 * pulse : 4,
        }),
        txt(mod.name, x, y - 34, 30, col, 'mono'),
        txt(mod.role, x, y + 10, 26, COSMOS.muted, 'sans'),
        txt(
          adapted ? '+ LoRA (A, B)' : 'frozen W_0',
          x,
          y + 48,
          26,
          adapted ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      );
    });

    // 3 MLP slabs on right
    mlpMods.forEach((mod, i) => {
      const x = 460;
      const y = -110 + i * 142;
      const adapted = all > 0.2;
      const col = adapted ? COSMOS.emerald : COSMOS.violet;
      nodes.push(
        glassCell(x, y, 580, 114, col, {
          fill: adapted ? '#0f2429' : '#181430',
          glow: adapted ? 10 * pulse : 4,
        }),
        txt(mod.name, x - 140, y - 10, 28, col, 'mono'),
        txt(mod.role, x - 140, y + 26, 26, COSMOS.muted, 'sans'),
        txt(
          adapted ? '+ LoRA (A, B)' : 'frozen W_0',
          x + 150,
          y + 6,
          26,
          adapted ? COSMOS.emerald : COSMOS.dim,
          'mono',
        ),
      );
    });

    // Bottom inspection & vocabulary contract strip
    const botCol = ins > 0.2 ? COSMOS.amber : COSMOS.cyan;
    nodes.push(
      glassCell(0, 358, 1660, 122, botCol, { fill: '#11192e', glow: ins > 0.2 ? 10 : 5 }),
      txt(
        ins > 0.2
          ? 'INSPECT MATCHED MODULES & SHAPES · NEW VOCABULARY NEEDS EMBEDDING / LM_HEAD ROWS'
          : all > 0.2
            ? 'ALL-LINEAR COVERAGE ADAPTS ATTENTION ROUTING + TOKEN MLP TRANSFORMS'
            : 'ORIGINAL LORA BASELINE: Q + V PROJECTIONS',
        0,
        358,
        26,
        botCol,
        'mono',
      ),
      glowingArc([-470, 235], [-160, 295], 20, { color: COSMOS.gold, width: 3, opacity: 0.7 }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('target-modules-b1-1', () => s.play(showQV.to(1, { duration: 0.45 })));
  c.on('target-modules-b2-1', () => s.play(showAll.to(1, { duration: 0.55 })));
  c.on('target-modules-b3-1', () =>
    s.play(showInspect.to(1, { duration: remainDuration(c, 'target-modules-b3-1', 0.45) })),
  );
}
