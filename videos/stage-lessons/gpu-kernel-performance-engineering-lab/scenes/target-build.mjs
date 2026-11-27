// Scene 03: Bind every result to the actual target
// Beat 0: Source/header hashes linked to RTX 5070 Ti (CUDA 13.2.78, driver 595.71.05, sm_120).
// Beat 1: ptxas resource table (naive 20 reg/0 B, tiled 30 reg/4096 B/1 bar, padded 30 reg/4224 B/1 bar, broken 32 reg/4224 B/0 bar).
// Beat 2: Exercised boundary shapes (1, 7, 31, 32, 33, 65, 257, 4096) + CPU coordinate check vs GPU timing.
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  par,
  rect,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function targetBuild(s, c) {
  const showTarget = s.value(1);
  const showResources = s.value(0);
  const showShapes = s.value(0);

  const srcGlow = s.value(0);
  const gpuGlow = s.value(0);

  const reg20 = s.value(0);
  const reg30 = s.value(0);
  const reg32 = s.value(0);
  const sharedShow = s.value(0);
  const barShow = s.value(0);

  const shapesProg = s.value(0);
  const checkedShow = s.value(0);
  const cpuShow = s.value(0);

  const bgAura = aura(0, 0, 660, '#5ce1e61c', '#60a5fa18');
  const title = heroTitle(['Bind Every Result', 'to the Actual Target'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.output,
    eyebrow: 'REPRODUCIBLE BUILD · RTX 5070 Ti',
  });

  // Beat 0: Source hashes -> Compiler -> RTX 5070 Ti hardware node
  const targetView = guardedDynamic(showTarget, (a) => {
    const sg = srcGlow.value;
    const gg = gpuGlow.value;

    const nodes = [
      // Source identity panel
      txt('SOURCE + CHECKER HASHES', -525, -210, 26, ROLE.input, 'mono').opacity(a),
      glassCell(-525, 15, 600, 350, sg > 0.3 ? ROLE.gold : ROLE.input, {
        fill: '#0f1a32',
        glow: sg > 0.3 ? 11 : 5,
        opacity: a,
      }),
      txt('transpose_lab.cu', -790, -80, 34, ROLE.input, 'mono', 'left').opacity(a),
      txt('sha256: 2322b4c9c9eb...', -790, -24, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('transpose_checks.hpp', -790, 64, 34, ROLE.input, 'mono', 'left').opacity(a),
      txt('sha256: 1ba87dfc93a5...', -790, 120, 26, COSMOS.muted, 'mono', 'left').opacity(a),

      // Compiler bridge arc (450px open gap between boxes: -225 to +225)
      glowingArc([-210, 15], [210, 15], -45, {
        color: ROLE.gold,
        width: 3.8,
        opacity: 0.85 * a,
      }),
      txt('-O3 -std=c++17', 0, -90, 26, ROLE.gold, 'mono').opacity(a),
      txt('-lineinfo', 0, 82, 26, COSMOS.muted, 'mono').opacity(a),
      txt('-Xptxas=-v', 0, 126, 26, COSMOS.muted, 'mono').opacity(a),

      // Hardware target panel
      txt('NATIVE GPU TARGET', 525, -210, 26, ROLE.output, 'mono').opacity(a),
      glassCell(525, 15, 600, 350, gg > 0.3 ? ROLE.output : COSMOS.rule, {
        fill: '#0d2233',
        glow: gg > 0.3 ? 12 : 5,
        opacity: a,
      }),
      txt('RTX 5070 Ti · CC 12.0', 525, -82, 34, ROLE.output, 'mono')
        .glow(6, ROLE.output)
        .opacity(a),
      txt('CUDA 13.2.78 · sm_120', 525, -8, 28, COSMOS.ink, 'mono').opacity(a),
      txt('Driver 595.71.05', 525, 62, 28, COSMOS.ink, 'mono').opacity(a),
      txt('GDDR7 · set -euo pipefail', 525, 132, 26, COSMOS.muted, 'mono').opacity(a),

      txt(
        'Save compiler resource output and hashes alongside every timing log',
        0,
        340,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // Beat 1: ptxas resource bars
  const resourceView = guardedDynamic(showResources, (a) => {
    const r20 = reg20.value;
    const r30 = reg30.value;
    const r32 = reg32.value;
    const sh = sharedShow.value;
    const br = barShow.value;

    const rows = [
      { name: 'naive', regs: 20, bytes: 0, bars: 0, prog: r20, col: ROLE.input },
      { name: 'tiled', regs: 30, bytes: 4096, bars: 1, prog: r30, col: ROLE.output },
      { name: 'padded', regs: 30, bytes: 4224, bars: 1, prog: r30, col: ROLE.good },
      { name: 'broken', regs: 32, bytes: 4224, bars: 0, prog: r32, col: ROLE.bad },
    ];

    const nodes = [
      txt('PTXAS STATIC KERNEL ALLOCATIONS', 0, -245, 28, ROLE.output, 'mono').opacity(a),
      txt('KERNEL', -755, -170, 26, COSMOS.muted, 'mono').opacity(a),
      txt('REGISTERS / THREAD', -340, -170, 26, COSMOS.muted, 'mono').opacity(a),
      txt('STATIC SHARED MEM', 280, -170, 26, COSMOS.muted, 'mono').opacity(a),
      txt('BARRIER', 745, -170, 26, COSMOS.muted, 'mono').opacity(a),
    ];

    rows.forEach((row, i) => {
      const y = -86 + i * 102;
      const regBarW = Math.max(12, (row.regs / 32) * 320 * Math.max(0.05, row.prog));
      const smemBarW =
        row.bytes > 0 ? Math.max(12, (row.bytes / 4224) * 260 * Math.max(0.05, sh)) : 0;

      nodes.push(
        txt(row.name, -755, y, 32, row.col, 'mono').opacity(a),
        glassCell(-440, y, 350, 58, row.prog > 0.5 ? row.col : COSMOS.rule, {
          fill: '#0e1628',
          glow: 3,
          opacity: a,
        }),
        rect(regBarW, 38, { fill: row.col, stroke: null, radius: 6 })
          .at(-600 + regBarW * 0.5, y)
          .opacity(0.45 * a),
        txt(
          row.prog > 0.7 ? `${row.regs}` : '...',
          -235,
          y,
          30,
          row.prog > 0.7 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ).opacity(a),

        glassCell(200, y, 290, 58, sh > 0.5 ? ROLE.output : COSMOS.rule, {
          fill: '#0e1628',
          glow: 3,
          opacity: a,
        }),
      );
      if (smemBarW > 0) {
        nodes.push(
          rect(smemBarW, 38, { fill: ROLE.output, stroke: null, radius: 6 })
            .at(70 + smemBarW * 0.5, y)
            .opacity(0.42 * a),
        );
      }
      nodes.push(
        txt(
          sh > 0.7 ? `${row.bytes} B` : '...',
          375,
          y,
          28,
          sh > 0.7 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ).opacity(a),
        glassCell(745, y, 150, 58, br > 0.5 ? (row.bars ? ROLE.good : ROLE.bad) : COSMOS.rule, {
          fill: br > 0.5 ? (row.bars ? '#0e2824' : '#2d1120') : '#0e1628',
          glow: br > 0.5 ? 6 : 0,
          opacity: a,
        }),
        txt(
          br > 0.7 ? String(row.bars) : '?',
          745,
          y,
          30,
          br > 0.7 ? (row.bars ? ROLE.good : ROLE.bad) : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    nodes.push(
      txt(
        '0 spill loads / 0 spill stores (naive, tiled, padded) · static allocations, not resident warps',
        0,
        345,
        26,
        ROLE.good,
        'mono',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Beat 2: Exercised boundary shapes grid
  const shapesView = guardedDynamic(showShapes, (a) => {
    const sp = shapesProg.value;
    const ch = checkedShow.value;
    const cp = cpuShow.value;
    const shapes = [1, 7, 31, 32, 33, 65, 257, 4096];
    const litCount = Math.min(8, Math.ceil(sp * 8));

    const nodes = [
      txt('EXERCISED BOUNDARY + TIMED SHAPES (N × N)', 0, -230, 28, ROLE.output, 'mono').opacity(a),
    ];

    shapes.forEach((n, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx = -570 + col * 380;
      const cy = -80 + row * 210;
      const lit = i < litCount;
      const isEdge = n === 31 || n === 32 || n === 33;
      const border = ch > 0.5 ? ROLE.good : lit ? (isEdge ? ROLE.gold : ROLE.output) : COSMOS.rule;

      nodes.push(
        glassCell(cx, cy, 330, 150, border, {
          fill: ch > 0.5 ? '#0e2624' : '#0f1a30',
          glow: lit ? 7 : 0,
          opacity: a,
        }),
        txt(`N = ${n}`, cx, cy - 26, 36, lit ? COSMOS.ink : COSMOS.muted, 'mono').opacity(a),
        txt(
          ch > 0.5 ? '0 mismatches' : isEdge ? 'tile boundary' : 'exact check',
          cx,
          cy + 34,
          26,
          ch > 0.5 ? ROLE.good : COSMOS.muted,
          'sans',
        ).opacity(a),
      );
    });

    nodes.push(
      txt(
        cp > 0.5
          ? 'CPU checks index mapping · GPU runs supply timing · copy keeps indices'
          : 'Copy moves equal logical bytes without transposing',
        0,
        325,
        28,
        cp > 0.5 ? ROLE.output : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, targetView, resourceView, shapesView);

  c.on('gpu-target-build-source', () =>
    s.play(srcGlow.to(1, { duration: remainDuration(c, 'gpu-target-build-source', 0.45) })),
  );
  c.on('gpu-target-build-target', () =>
    s.play(gpuGlow.to(1, { duration: remainDuration(c, 'gpu-target-build-target', 0.45) })),
  );

  c.onBeat(1, () =>
    s.play(
      par(
        showTarget.to(0, { duration: 0.18 }),
        delay(showResources.to(1, { duration: 0.24 }), 0.22),
      ),
    ),
  );
  c.on('gpu-target-build-registers', () =>
    s.play(reg20.to(1, { duration: remainDuration(c, 'gpu-target-build-registers', 0.5) })),
  );
  c.on('gpu-target-build-registers30', () =>
    s.play(reg30.to(1, { duration: remainDuration(c, 'gpu-target-build-registers30', 0.5) })),
  );
  c.on('gpu-target-build-shared', () =>
    s.play(sharedShow.to(1, { duration: remainDuration(c, 'gpu-target-build-shared', 0.5) })),
  );
  c.on('gpu-target-build-barriers', () =>
    s.play(barShow.to(1, { duration: remainDuration(c, 'gpu-target-build-barriers', 0.5) })),
  );
  c.on('gpu-target-build-registers32', () =>
    s.play(reg32.to(1, { duration: remainDuration(c, 'gpu-target-build-registers32', 0.5) })),
  );

  c.onBeat(2, () =>
    s.play(
      par(
        showResources.to(0, { duration: 0.18 }),
        delay(showShapes.to(1, { duration: 0.24 }), 0.22),
      ),
    ),
  );
  c.on('gpu-target-build-shapes', () =>
    s.play(shapesProg.to(1, { duration: remainDuration(c, 'gpu-target-build-shapes', 0.8) })),
  );
  c.after('gpu-target-build-checked', () =>
    s.play(
      checkedShow.to(1, { duration: remainAfterDuration(c, 'gpu-target-build-checked', 0.45) }),
    ),
  );
  c.on('gpu-target-build-cpu', () =>
    s.play(cpuShow.to(1, { duration: remainDuration(c, 'gpu-target-build-cpu', 0.45) })),
  );
}
