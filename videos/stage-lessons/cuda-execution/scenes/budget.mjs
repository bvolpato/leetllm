// Scene 12: What stays in memory for one Adam weight? 3D parameter-state memory stack (16 B/param -> 14.90 GiB/1B).
import {
  COSMOS,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function budget(s, c) {
  const phase = s.value(0);
  const wProg = s.value(0);
  const gProg = s.value(0);
  const mProg = s.value(0);
  const scaleLit = s.value(0);
  const extraLit = s.value(0);
  const firstStepLit = s.value(0);

  const bgAura = aura(430, 10, 520, '#ff6b8b22', '#5ce1e616');

  const title = heroTitle(['16 Bytes Per', 'FP32 Adam Parameter'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'TRAINING MEMORY FLOOR · WEIGHT + GRADIENT + MOMENTS',
  });

  // 3D parameter state tower on the right (height proportional to 4B + 4B + 8B)
  const tower3d = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.2,
    unit: 88,
    focus: [0, 0, 0.3],
  }).at(480, 40);

  tower3d.add(
    ...box3d(-1.45, -1.45, -1.75, 2.9, 2.9, 0.9, '#193b6e', COSMOS.blue, 0.78),
    ...box3d(-1.45, -1.45, -0.75, 2.9, 2.9, 0.9, '#144c5c', COSMOS.cyan, 0.78),
    ...box3d(-1.45, -1.45, 0.25, 2.9, 2.9, 1.85, '#591b3b', COSMOS.rose, 0.78),
  );

  const eq1B = glowTex('\\frac{16 \\times 10^9}{1024^3} \\approx 14.90 \\; \\mathrm{GiB}', {
    x: -355,
    y: 232,
    size: 46,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const wp = wProg.value;
    const gp = gProg.value;
    const mp = mProg.value;
    const ex = extraLit.value;
    const fs = firstStepLit.value;
    const totalB = Math.round(4 * wp + 4 * gp + 8 * mp);

    const parts = [
      { label: 'Weight (FP32)', bytes: 4, p: wp, color: COSMOS.blue },
      { label: 'Gradient (FP32)', bytes: 4, p: gp, color: COSMOS.cyan },
      { label: 'Two Adam moments (m, v)', bytes: 8, p: mp, color: COSMOS.rose },
    ];

    const nodes = [
      txt('ONE FULL-PRECISION ADAM PARAMETER', -855, -210, 26, COSMOS.cyan, 'mono', 'left'),
      txt('3D MEMORY FLOOR (4 : 4 : 8 B)', 480, -255, 26, COSMOS.muted, 'mono'),
    ];

    // Stacked horizontal bar on the left
    const barX0 = -855;
    const barY = -95;
    const pxPerByte = 62; // 16 B = 992 px
    nodes.push(
      glassCell(barX0 + 16 * pxPerByte * 0.5, barY, 16 * pxPerByte + 8, 96, COSMOS.rule, {
        fill: '#0c1222',
        glow: 0,
      }),
    );

    let cursorX = barX0;
    parts.forEach((part, idx) => {
      const fullW = part.bytes * pxPerByte;
      const w = fullW * part.p;
      if (w > 2) {
        nodes.push(
          rect(w - 4, 80, { fill: part.color, stroke: null, radius: 6 })
            .at(cursorX + w * 0.5, barY)
            .glow(8, part.color)
            .opacity(0.9),
        );
      }
      const rowY = 22 + idx * 54;
      nodes.push(
        txt(part.label, barX0, rowY, 28, part.p > 0.2 ? part.color : COSMOS.dim, 'sans', 'left'),
        txt(
          part.p > 0.7 ? `${part.bytes} B` : '·',
          barX0 + 540,
          rowY,
          30,
          part.p > 0.7 ? part.color : COSMOS.dim,
          'mono',
          'right',
        ),
      );
      cursorX += fullW;
    });

    nodes.push(
      txt(
        `${totalB} B / param`,
        barX0 + 992,
        barY - 86,
        34,
        totalB === 16 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'right',
      ).glow(6, totalB === 16 ? COSMOS.emerald : COSMOS.gold),
    );

    if (ex > 0.02) {
      nodes.push(
        glassCell(-355, 355, 1000, 88, COSMOS.cyan, {
          fill: '#0e192b',
          glow: 7,
          opacity: ex,
        }),
        txt(
          '+ saved activations + workspaces + allocator overhead',
          -355,
          357,
          28,
          COSMOS.cyan,
          'mono',
        ).opacity(ex),
      );
    }

    if (fs > 0.02) {
      nodes.push(
        txt('Adam allocates m & v on first step with a gradient', 480, 365, 26, COSMOS.rose, 'sans')
          .glow(5, COSMOS.rose)
          .opacity(fs),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, tower3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, tower3d, { theta: -0.22, phi: 0.94 });

  c.on('weight-bytes', () => s.play(wProg.to(1, { duration: 0.5 })));
  c.on('gradient-bytes', () => s.play(gProg.to(1, { duration: 0.5 })));
  c.on('moment-bytes', () => s.play(mProg.to(1, { duration: 0.6 })));
  c.on('scale-budget', () => s.play(scaleLit.to(1, { duration: 0.5 })));
  c.show('scale-budget', eq1B, { fade: 0.35 });
  c.on('activation-budget', () => s.play(extraLit.to(1, { duration: 0.45 })));
  c.on('adam-first-gradient', () =>
    s.play(firstStepLit.to(1, { duration: remainDuration(c, 'adam-first-gradient', 0.45) })),
  );
}
