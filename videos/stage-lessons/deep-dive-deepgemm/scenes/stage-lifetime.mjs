// Scene 09: Make each storage handoff wait for its own completion.
// [3,4] strides [8,2] coord [1,3] -> offset 14 vs packed 7; TMA/SMEM/TMEM/Regs lifetimes; commit/wait ordering.
import {
  COSMOS,
  ROLE,
  aura,
  buildTmaTmemPipeline3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function stageLifetime(s, c) {
  const phase = s.value(0);
  const stage3d = s.value(0);
  const step = s.value(0); // 1=stride 14, 2=wrong 7, 3=TMA->SMEM, 4=TMEM vs regs, 5=wait barriers, 6=epilogue release

  const bgAura = aura(445, 20, 520, '#60a5fa20', '#5ce1e61c');
  const { view: pipe3d } = buildTmaTmemPipeline3d(stage3d, phase, { x: 455, y: 15, unit: 92 });

  const title = heroTitle(['Each Storage Handoff', 'Waits for Completion'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.a,
    eyebrow: 'STRIDES & ASYNC LIFETIMES',
    subtitle: 'Physical offset = sum(coord × stride) + explicit commit ordering',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D ASYNC LIFETIME PIPELINE', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        'Each buffer releases only after its consumer signals done',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Stride address calculation: [3,4] strides [8,2] coord [1,3] -> 14 vs 7
    nodes.push(
      txt('LOGICAL SHAPE [3, 4] · COORD [1, 3]', -860, -172, 26, ROLE.gold, 'mono', 'left'),
      glassCell(-660, -90, 390, 96, st >= 0.8 ? ROLE.good : COSMOS.dim, {
        fill: '#0e2420',
        glow: st >= 0.8 ? 8 : 0,
      }),
      txt('Actual strides [8, 2]', -660, -110, 26, COSMOS.muted, 'mono'),
      txt(st >= 0.8 ? '1×8 + 3×2 = offset 14' : '1×8 + 3×2 = ?', -660, -68, 28, ROLE.good, 'mono'),

      glassCell(-245, -90, 390, 96, st >= 1.8 ? ROLE.bad : COSMOS.dim, {
        fill: '#28121f',
        glow: st >= 1.8 ? 8 : 0,
      }),
      txt('Packed row-major [4, 1]', -245, -110, 26, COSMOS.muted, 'mono'),
      txt(st >= 1.8 ? '1×4 + 3×1 = offset 7' : 'wrong descriptor', -245, -68, 28, ROLE.bad, 'mono'),
    );

    // Storage tier lifetimes strip
    const tiers = [
      { id: 'TMA -> SMEM', role: 'Async tile staging', col: ROLE.a, lit: st >= 2.6 },
      { id: 'SMEM -> TMEM', role: 'Scales + FP32 acc', col: ROLE.scale, lit: st >= 3.6 },
      { id: 'REGS', role: 'Thread-local only', col: ROLE.c, lit: st >= 3.6 },
    ];
    tiers.forEach((t, i) => {
      const tx = -725 + i * 268;
      nodes.push(
        glassCell(tx, 58, 250, 96, t.lit ? t.col : COSMOS.dim, {
          fill: '#0e172a',
          glow: t.lit ? 8 : 0,
        }),
        txt(t.id, tx, 38, 26, t.lit ? t.col : COSMOS.muted, 'mono'),
        txt(t.role, tx, 80, 26, COSMOS.ink, 'sans'),
      );
    });

    // Ordering & barrier chain
    if (st >= 4.6) {
      const chain = [
        { label: 'Wait TMA+SF', col: ROLE.scale, x: -725 },
        { label: 'MMA Commit', col: ROLE.gold, x: -455 },
        { label: 'Epilogue Free', col: ROLE.good, x: -185 },
      ];
      chain.forEach((ch, idx) => {
        const active = idx < 2 || st >= 5.5;
        nodes.push(
          glassCell(ch.x, 224, 240, 84, active ? ch.col : COSMOS.dim, {
            fill: '#101d2e',
            glow: active ? 8 : 0,
          }),
          txt(ch.label, ch.x, 224, 26, active ? ch.col : COSMOS.muted, 'mono'),
        );
        if (idx < 2) {
          nodes.push(line([ch.x + 124, 224], [ch.x + 146, 224], { stroke: ch.col, width: 3 }));
        }
      });
    }

    nodes.push(
      txt(
        st >= 5.5
          ? 'Verify which instruction signals completion before reusing storage'
          : 'Materialize the required layout and validate its actual strides',
        -860,
        365,
        26,
        st >= 5.5 ? ROLE.good : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, pipe3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pipe3d, { theta: -0.2, phi: 0.94 });

  c.after('sl-stride', () =>
    s.play(step.to(1, { duration: remainAfterDuration(c, 'sl-stride', 0.35) })),
  );
  c.after('sl-wrong', () =>
    s.play(step.to(2, { duration: remainAfterDuration(c, 'sl-wrong', 0.35) })),
  );
  c.on('sl-tma', () => {
    const dur = remainDuration(c, 'sl-tma', 0.5);
    s.play(step.to(3, { duration: dur }));
    s.play(stage3d.to(1, { duration: dur }));
  });
  c.on('sl-tmem', () => {
    const dur = remainDuration(c, 'sl-tmem', 0.5);
    s.play(step.to(4, { duration: dur }));
    s.play(stage3d.to(2, { duration: dur }));
  });
  c.on('sl-wait', () => s.play(step.to(5, { duration: remainDuration(c, 'sl-wait', 0.45) })));
  c.on('sl-epilogue', () => {
    const dur = remainDuration(c, 'sl-epilogue', 0.5);
    s.play(step.to(6, { duration: dur }));
    s.play(stage3d.to(3, { duration: dur }));
  });
}
