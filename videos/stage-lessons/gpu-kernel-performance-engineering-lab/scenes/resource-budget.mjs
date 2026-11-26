// Scene 14: How many blocks fit?
// Orbiting 3D SM Occupancy Chamber + 3 resource-budget gauges (Registers, Shared mem, Warp limit):
// 40 regs/thread -> min(6, 15, 8) = 6 blocks (48/64 = 75%) -> raise to 56 regs/thread -> 4 blocks (32/64 = 50%).
import {
  COSMOS,
  RES_40,
  RES_56,
  ROLE,
  aura,
  buildOccupancyChamber3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function resourceBudget(s, c) {
  const phase = s.value(0);
  const blocksVal = s.value(0); // animates 0 -> 6 -> 4

  const limitsShow = s.value(0);
  const granShow = s.value(0);
  const wsShow = s.value(0);
  const reg40 = s.value(0);
  const regBlocks1 = s.value(0);
  const smemBlocks = s.value(0);
  const warpBlocks = s.value(0);
  const minShow = s.value(0);
  const frac75 = s.value(0);
  const reg56 = s.value(0);
  const regBlocks2 = s.value(0);
  const frac50 = s.value(0);
  const scopeShow = s.value(0);

  const bgAura = aura(445, 20, 560, '#5ce1e61e', '#6ee7b71a');
  const { view: sm3d } = buildOccupancyChamber3d(blocksVal, phase, { x: 455, y: 20, unit: 96 });

  const title = heroTitle(['How Many Blocks', 'Fit on an SM?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'OCCUPANCY · RESOURCE CEILINGS',
  });

  const live = guardedDynamic(1, () => {
    const is56 = reg56.value > 0.5;
    const model = is56 ? RES_56 : RES_40;
    const rbReady = is56 ? regBlocks2.value > 0.3 : regBlocks1.value > 0.3;
    const sbReady = smemBlocks.value > 0.3;
    const wbReady = warpBlocks.value > 0.3;
    const occReady = is56 ? frac50.value > 0.3 : frac75.value > 0.3;

    const nodes = [
      txt('3D SM OCCUPANCY CHAMBER', 455, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        occReady
          ? `${model.blocks} resident blocks · ${model.warps} / 64 warps (${Math.round(model.fraction * 100)}%)`
          : 'Each glowing slab = 1 resident block (8 warps)',
        455,
        420,
        26,
        occReady ? (is56 ? ROLE.warn : ROLE.good) : COSMOS.muted,
        'mono',
      ),

      // Top worksheet spec line on left
      txt(
        wsShow.value > 0.3
          ? '65,536 regs · 64 KiB shared · 64 warps (256 thr/blk)'
          : granShow.value > 0.3
            ? 'GPU allocates registers & shared mem in chunks'
            : limitsShow.value > 0.3
              ? 'Block must fit threads, regs, shared mem, barriers'
              : 'Whole-block SM resource ceilings',
        -855,
        -210,
        26,
        ROLE.gold,
        'mono',
        'left',
      ),
    ];

    // 3 horizontal resource-limit bars on the left
    const bars = [
      {
        label: is56
          ? 'Registers (56/thr = 14,336/blk)'
          : reg40.value > 0.3
            ? 'Registers (40/thr = 10,240/blk)'
            : 'Registers / SM (65,536)',
        count: model.registerBlocks,
        cap: 16,
        ready: rbReady,
        col: is56 ? ROLE.warn : ROLE.input,
        y: -100,
        isLimiter: true,
      },
      {
        label: 'Shared mem (4,224 B padded tile)',
        count: model.sharedBlocks,
        cap: 16,
        ready: sbReady,
        col: ROLE.output,
        y: 25,
        isLimiter: false,
      },
      {
        label: 'Warp limit (8 warps / block)',
        count: model.warpBlocks,
        cap: 16,
        ready: wbReady,
        col: ROLE.gold,
        y: 150,
        isLimiter: false,
      },
    ];

    bars.forEach((b) => {
      const fillW = b.ready ? Math.max(24, (b.count / b.cap) * 440) : 24;
      nodes.push(
        txt(b.label, -855, b.y - 46, 26, b.col, 'mono', 'left'),
        glassCell(-625, b.y + 8, 460, 58, b.ready && b.isLimiter ? ROLE.good : b.col, {
          fill: '#0d1628',
          glow: b.ready && b.isLimiter ? 8 : 2,
        }),
        rect(fillW, 38, { fill: b.col, stroke: null, radius: 6 })
          .at(-845 + fillW * 0.5, b.y + 8)
          .opacity(b.ready ? 0.48 : 0.12),
        txt(
          b.ready ? `${b.count} blks${b.isLimiter && minShow.value > 0.3 ? ' ← LIM' : ''}` : '...',
          -372,
          b.y + 8,
          28,
          b.ready ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ),
      );
    });

    // Bottom occupancy formula readout
    const summary = occReady
      ? `min(${model.registerBlocks}, 15, 8) = ${model.blocks} blks → ${model.warps}/64 = ${Math.round(model.fraction * 100)}%`
      : minShow.value > 0.3
        ? `Smallest count = ${model.blocks} blocks = ${model.warps} warps`
        : 'Take the minimum across all 3 limits';
    nodes.push(
      txt(
        summary,
        -855,
        275,
        28,
        occReady ? (is56 ? ROLE.warn : ROLE.good) : COSMOS.muted,
        'mono',
        'left',
      ).glow(6, occReady ? (is56 ? ROLE.warn : ROLE.good) : COSMOS.muted),
      txt(
        scopeShow.value > 0.3
          ? 'Read Nsight Occupancy limiter · test each change on its own'
          : 'Before hardware allocation rounding',
        -855,
        355,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, sm3d, title, live);
  runPhase(s, c, phase, 16);
  orbitScene(s, c, sm3d, { theta: -0.18, phi: 0.92 });

  c.on('gpu-resource-budget-limits', () =>
    s.play(limitsShow.to(1, { duration: remainDuration(c, 'gpu-resource-budget-limits', 0.4) })),
  );
  c.on('gpu-resource-budget-granularity', () =>
    s.play(granShow.to(1, { duration: remainDuration(c, 'gpu-resource-budget-granularity', 0.4) })),
  );
  c.on('gpu-resource-budget-worksheet', () =>
    s.play(wsShow.to(1, { duration: remainDuration(c, 'gpu-resource-budget-worksheet', 0.4) })),
  );
  c.on('gpu-resource-budget-registers', () =>
    s.play(reg40.to(1, { duration: remainDuration(c, 'gpu-resource-budget-registers', 0.4) })),
  );
  c.after('gpu-resource-budget-regblocks', () => {
    s.play(
      regBlocks1.to(1, { duration: remainAfterDuration(c, 'gpu-resource-budget-regblocks', 0.4) }),
    );
    s.play(
      blocksVal.to(6, { duration: remainAfterDuration(c, 'gpu-resource-budget-regblocks', 0.65) }),
    );
  });
  c.after('gpu-resource-budget-shared', () =>
    s.play(
      smemBlocks.to(1, { duration: remainAfterDuration(c, 'gpu-resource-budget-shared', 0.4) }),
    ),
  );
  c.after('gpu-resource-budget-warps', () =>
    s.play(
      warpBlocks.to(1, { duration: remainAfterDuration(c, 'gpu-resource-budget-warps', 0.4) }),
    ),
  );
  c.on('gpu-resource-budget-minimum', () =>
    s.play(minShow.to(1, { duration: remainDuration(c, 'gpu-resource-budget-minimum', 0.4) })),
  );
  c.after('gpu-resource-budget-fraction', () =>
    s.play(frac75.to(1, { duration: remainAfterDuration(c, 'gpu-resource-budget-fraction', 0.4) })),
  );
  c.on('gpu-resource-budget-registers2', () =>
    s.play(reg56.to(1, { duration: remainDuration(c, 'gpu-resource-budget-registers2', 0.4) })),
  );
  c.after('gpu-resource-budget-blocks2', () => {
    s.play(
      regBlocks2.to(1, { duration: remainAfterDuration(c, 'gpu-resource-budget-blocks2', 0.4) }),
    );
    s.play(
      blocksVal.to(4, { duration: remainAfterDuration(c, 'gpu-resource-budget-blocks2', 0.65) }),
    );
  });
  c.after('gpu-resource-budget-fraction2', () =>
    s.play(
      frac50.to(1, { duration: remainAfterDuration(c, 'gpu-resource-budget-fraction2', 0.4) }),
    ),
  );
  c.on('gpu-resource-budget-scope', () =>
    s.play(scopeShow.to(1, { duration: remainDuration(c, 'gpu-resource-budget-scope', 0.45) })),
  );
}
