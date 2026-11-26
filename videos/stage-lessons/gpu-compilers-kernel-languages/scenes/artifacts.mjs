// Scene 02: Follow the value written to slot one: Source -> PTX virtual regs (%f1,%f2,%f3) -> Native SASS (R4,R7->R9).
import {
  COSMOS,
  LANE_1,
  ROLE,
  artifactLines,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function artifacts(s, c) {
  const phase = s.value(0);
  const ptxStep = s.value(0); // 1=load-x, 2=load-y, 3=add, 4=store
  const virtFocus = s.value(0);
  const nativeStep = s.value(0); // 1=open, 2=R4&R7, 3=R9, 4=store

  const bgAura = aura(0, 20, 640, '#5ce1e61e', '#6ee7b716');
  const title = heroTitle(['Follow the Value', 'to Slot One'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.ptx,
    eyebrow: 'SOURCE → PTX VIRTUAL → NATIVE CUBIN',
  });

  const sassLines = [
    'LDG.E R4, [x + 4]',
    'LDG.E R7, [y + 4]',
    'FADD  R9, R4, R7',
    'STG.E [out + 4], R9',
  ];
  const vals = [String(LANE_1.x), String(LANE_1.y), String(LANE_1.sum), `out[1] = ${LANE_1.sum}`];

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const ps = ptxStep.value;
    const vf = virtFocus.value;
    const ns = nativeStep.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('CUDA SOURCE', -615, -205, 28, ROLE.host, 'mono'),
      txt('PTX (VIRTUAL REGS)', -45, -205, 28, ROLE.ptx, 'mono'),
      txt('NATIVE SASS (SM_120)', 560, -205, 28, ROLE.cubin, 'mono'),
    ];

    for (let i = 0; i < 4; i++) {
      const y = -110 + i * 116;
      const ptxOn = ps >= i + 0.5;
      const natOn = (i <= 1 && ns >= 1.5) || (i === 2 && ns >= 2.5) || (i === 3 && ns >= 3.5);
      const natOpen = ns >= 0.5;
      const isStore = i === 3;

      // Source column
      nodes.push(
        glassCell(-615, y, 420, 86, ptxOn ? ROLE.host : COSMOS.dim, {
          fill: ptxOn ? '#101f3b' : '#0b101e',
          glow: ptxOn ? 6 : 0,
        }),
        txt(artifactLines.source[i], -615, y, 26, ptxOn ? COSMOS.ink : COSMOS.dim, 'mono'),
      );

      // PTX column
      const ptxStroke =
        vf > 0.5 && ptxOn
          ? COSMOS.gold
          : isStore && ptxOn
            ? ROLE.cubin
            : ptxOn
              ? ROLE.ptx
              : COSMOS.dim;
      nodes.push(
        glassCell(-45, y, 560, 86, ptxStroke, {
          fill: ptxOn ? '#211c11' : '#0b101e',
          glow: ptxOn ? (vf > 0.5 ? 10 * pulse : 6) : 0,
        }),
        txt(
          ptxOn ? artifactLines.ptx[i] : '...',
          -45,
          y,
          26,
          ptxOn ? (isStore ? ROLE.cubin : ROLE.ptx) : COSMOS.dim,
          'mono',
        ),
      );

      // Native SASS column
      const natStroke = natOn
        ? isStore
          ? ROLE.cubin
          : COSMOS.gold
        : natOpen
          ? ROLE.cubin
          : COSMOS.dim;
      nodes.push(
        glassCell(560, y, 510, 86, natStroke, {
          fill: natOn ? '#0d2924' : '#0b101e',
          glow: natOn ? 10 : 0,
        }),
        txt(
          natOpen ? sassLines[i] : 'open cubin...',
          560,
          y - 14,
          26,
          natOn ? ROLE.cubin : COSMOS.muted,
          'mono',
        ),
        txt(
          natOn ? `val: ${vals[i]}` : ptxOn ? `val: ${vals[i]}` : '',
          560,
          y + 22,
          26,
          natOn ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-820 + u * 1640, 342, { radius: 6.5, color: ns >= 3.5 ? ROLE.cubin : ROLE.ptx }),
      txt(
        ns >= 3.5
          ? 'Physical R4 (0.25) + R7 (-2) → R9 (-1.75) → out[1]'
          : vf > 0.5
            ? 'PTX %f1, %f2, %f3 are virtual names; target cubin assigns physical registers'
            : 'Index 1: x[1] = 0.25, y[1] = -2 → sum = -1.75',
        0,
        396,
        28,
        ns >= 3.5 ? ROLE.cubin : COSMOS.gold,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('load-x', () => s.play(ptxStep.to(1, { duration: remainDuration(c, 'load-x', 0.35) })));
  c.on('load-y', () => s.play(ptxStep.to(2, { duration: remainDuration(c, 'load-y', 0.35) })));
  c.on('virtual-add', () =>
    s.play(ptxStep.to(3, { duration: remainDuration(c, 'virtual-add', 0.35) })),
  );
  c.on('virtual-store', () =>
    s.play(ptxStep.to(4, { duration: remainDuration(c, 'virtual-store', 0.35) })),
  );
  c.on('virtual-values', () =>
    s.play(virtFocus.to(1, { duration: remainDuration(c, 'virtual-values', 0.4) })),
  );
  c.on('native-open', () =>
    s.play(nativeStep.to(1, { duration: remainDuration(c, 'native-open', 0.35) })),
  );
  c.on('native-load', () =>
    s.play(nativeStep.to(2, { duration: remainDuration(c, 'native-load', 0.35) })),
  );
  c.on('native-add', () =>
    s.play(nativeStep.to(3, { duration: remainDuration(c, 'native-add', 0.35) })),
  );
  c.on('native-store', () =>
    s.play(nativeStep.to(4, { duration: remainDuration(c, 'native-store', 0.35) })),
  );
}
