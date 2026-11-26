// Scene 10: How many sums should one thread keep? 1x4 (0.40 FLOP/B) -> 8x8 (2.0 FLOP/B) + register pressure.
import {
  COSMOS,
  REG_1X1,
  REG_1X4,
  REG_8X8,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function registerBlocking(s, c) {
  const phase = s.value(0);
  const mode = s.value(0); // 1=1x4, 2=8x8
  const rev1x4 = s.value(0);
  const rev8x8 = s.value(0);
  const pressure = s.value(0);

  const bgAura = aura(240, 20, 620, '#5ce1e61e', '#ffd16618');
  const title = heroTitle(['How Many Sums', 'Per Thread?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: '2D REGISTER BLOCKING',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const is8x8 = mode.value >= 1.5;
    const r4 = rev1x4.value;
    const r8 = rev8x8.value;
    const pr = pressure.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [];

    if (!is8x8) {
      // 1x4 register tile on right
      const bx0 = 80;
      const by = -40;
      nodes.push(
        txt('1 × 4 REGISTER TILE (1 THREAD)', 360, -255, 28, ROLE.c, 'mono'),
        glassCell(-60, by, 108, 108, ROLE.a, { fill: '#10203b', glow: 9 }),
        txt('1 A', -60, by, 32, ROLE.a, 'mono'),
      );
      for (let j = 0; j < 4; j++) {
        const cx = bx0 + j * 185;
        nodes.push(
          glassCell(cx, -185, 138, 76, ROLE.b, { fill: '#281122', glow: 7 }),
          txt(`B${j}`, cx, -185, 30, ROLE.b, 'mono'),
          glassCell(cx, by, 152, 108, ROLE.c, { fill: '#0e2334', glow: 9 }),
          txt(`acc[${j}]`, cx, by, 30, ROLE.c, 'mono'),
        );
      }
      const u = (p * 0.7) % 1;
      nodes.push(glowDot(-6 + u * 660, -118, { radius: 7, color: COSMOS.gold }));
      // Lower right: live per-k FMA reuse breakdown (fills visual composition cleanly)
      nodes.push(
        txt('PER-STEP REGISTER TRAFFIC', 340, 108, 26, COSMOS.muted, 'mono'),
        glassCell(140, 210, 310, 112, ROLE.a, { fill: '#10203a', glow: 6 }),
        txt('OPERANDS', 140, 182, 26, ROLE.a, 'mono'),
        txt('1 A + 4 B = 20 B', 140, 232, 28, COSMOS.ink, 'mono'),
        glassCell(540, 210, 310, 112, ROLE.c, { fill: '#0e2434', glow: 8 }),
        txt('ARITHMETIC', 540, 182, 26, ROLE.c, 'mono'),
        txt('4 FMAs = 8 FLOPs', 540, 232, 28, COSMOS.gold, 'mono'),
      );
    } else {
      // 8x8 register tile (64 accumulators) on right
      const cell = 56;
      const gap = 8;
      const stride = cell + gap;
      const gx0 = 140;
      const gy0 = -215;
      nodes.push(
        txt(
          '8 × 8 REGISTER TILE (64 ACCUMULATORS)',
          gx0 + 3.5 * stride,
          gy0 - 154,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
      for (let i = 0; i < 8; i++) {
        nodes.push(
          rect(cell, 34, { fill: '#2c1324', stroke: ROLE.b, width: 1.8, radius: 5 }).at(
            gx0 + i * stride,
            gy0 - 56,
          ),
          rect(34, cell, { fill: '#112340', stroke: ROLE.a, width: 1.8, radius: 5 }).at(
            gx0 - 56,
            gy0 + i * stride,
          ),
        );
      }
      for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
          const isHot = (r + col) % 5 === Math.floor(p * 2) % 5;
          nodes.push(
            rect(cell, cell, {
              fill: pr > 0.5 ? '#2b1e10' : isHot ? '#14394a' : '#0d1e30',
              stroke: pr > 0.5 ? ROLE.warn : ROLE.c,
              width: isHot ? 2.4 : 1.4,
              radius: 6,
            })
              .at(gx0 + col * stride, gy0 + r * stride)
              .glow(isHot ? 7 * pulse : 0, ROLE.c),
          );
        }
      }
      nodes.push(
        txt('8 A (32 B)', gx0 - 56, gy0 + 8 * stride + 12, 26, ROLE.a, 'mono'),
        txt('8 B (32 B)', gx0 + 3.5 * stride, gy0 - 104, 26, ROLE.b, 'mono'),
      );
    }

    // Left comparison bars (floating, clean, zero card boxes)
    const bars = [
      { label: '1 × 1 scalar', val: REG_1X1.ratio, col: COSMOS.muted, vis: 1 },
      { label: '1 × 4 thread', val: REG_1X4.ratio, col: ROLE.c, vis: r4 },
      { label: '8 × 8 thread', val: REG_8X8.ratio, col: ROLE.good, vis: r8 },
    ];
    nodes.push(
      txt('OPERAND INTENSITY (FLOP / BYTE)', -855, -185, 26, COSMOS.muted, 'mono', 'left'),
    );
    bars.forEach((b, idx) => {
      if (b.vis < 0.02) return;
      const y = -105 + idx * 102;
      const barW = Math.max(46, (b.val / 2.0) * 440);
      nodes.push(
        txt(b.label, -855, y - 28, 26, b.col, 'mono', 'left').opacity(b.vis),
        rect(barW, 38, { fill: b.col, stroke: null, radius: 7 })
          .at(-855 + barW * 0.5, y + 14)
          .glow(8, b.col)
          .opacity(0.88 * b.vis),
        txt(
          `${b.val.toFixed(2)} FLOP/B`,
          -855 + barW + 22,
          y + 14,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(b.vis),
      );
    });

    if (r8 > 0.02) {
      nodes.push(
        txt(
          `${REG_8X8.accumulators} FMAs = ${REG_8X8.flops} FLOPs from ${REG_8X8.bytes} B`,
          -855,
          225,
          28,
          ROLE.good,
          'mono',
          'left',
        ).opacity(r8),
      );
    }

    if (pr > 0.02) {
      nodes.push(
        txt(
          '64 live sums + operands → watch register spills & occupancy',
          -855,
          365,
          28,
          ROLE.warn,
          'sans',
          'left',
        )
          .glow(6, ROLE.warn)
          .opacity(pr),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('register-reuse', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'register-reuse', 0.4) })),
  );
  c.after('register-result', () =>
    s.play(rev1x4.to(1, { duration: remainDuration(c, 'register-result', 0.45) })),
  );
  c.on('register-square', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'register-square', 0.5) })),
  );
  c.after('register-result-square', () =>
    s.play(rev8x8.to(1, { duration: remainDuration(c, 'register-result-square', 0.45) })),
  );
  c.on('register-pressure', () =>
    s.play(pressure.to(1, { duration: remainDuration(c, 'register-pressure', 0.45) })),
  );
}
