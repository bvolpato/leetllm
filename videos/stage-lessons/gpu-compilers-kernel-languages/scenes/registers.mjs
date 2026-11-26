// Scene 08: How the register file fills: 3D 65,536-reg SM slab! R=32 (8 blocks) -> R=33 (6 blocks, 4096 free) -> R=40 (still 6!) -> R=41 (5 blocks).
import {
  COSMOS,
  RES_32,
  RES_33,
  RES_40,
  RES_41,
  ROLE,
  aura,
  buildRegisterFile3d,
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

export default function registers(s, c) {
  const blocksVal = s.value(8);
  const phase = s.value(0);
  // stage: 0=R32(8), 1=R33_demand(predict 7th?), 2=R33_answer(6), 3=R40_demand(predict drop?), 4=R40_answer(6), 5=R41(5)
  const stage = s.value(0);
  const showFree = s.value(0);
  const showTip = s.value(0);

  const bgAura = aura(420, 20, 520, '#6ee7b71e', '#ffd16618');
  const { view: reg3d } = buildRegisterFile3d(blocksVal, phase, { x: 430, y: 20, unit: 100 });

  const title = heroTitle(['How the Register', 'File Fills'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: '256-REG WARP GRANULE CLIFFS · 65,536 SM FILE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(stage.value);
    const sf = showFree.value;
    const tip = showTip.value;

    const r = st === 0 ? 32 : st <= 2 ? 33 : st <= 4 ? 40 : 41;
    const res = r === 32 ? RES_32 : r === 33 ? RES_33 : r === 40 ? RES_40 : RES_41;
    const units = res.perWarp / 256; // 4, 5, 5, 6
    const rawWarp = 32 * r;

    const nodes = [
      txt('3D SM REGISTER FILE (65,536 REGS)', 430, -405, 26, ROLE.ir, 'mono').glow(5, ROLE.ir),
      txt(
        st === 1
          ? 'Can a 7th block still fit?'
          : st === 3
            ? 'R = 40: does a block have to leave?'
            : `${res.blocks} resident blocks = ${res.warps} / 64 warps`,
        430,
        420,
        26,
        st === 1 || st === 3 ? COSMOS.gold : ROLE.cubin,
        'mono',
      ),

      // Warp allocation units visual bar (6 slots of 256 regs)
      txt(
        `ONE WARP: 32 × ${r} = ${rawWarp} → ${res.perWarp} regs (${units} units)`,
        -855,
        -190,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
    ];

    for (let u = 0; u < 6; u++) {
      const ux = -780 + u * 116;
      const used = u < units;
      const isPartial = used && u === units - 1 && rawWarp < res.perWarp;
      const fill = !used ? '#0c1120' : isPartial ? '#2c2210' : '#0f332c';
      const stroke = !used ? COSMOS.dim : isPartial ? COSMOS.gold : ROLE.cubin;
      nodes.push(
        rect(104, 68, { fill, stroke, width: 2.2, radius: 8 }).at(ux, -112),
        txt(used ? '256' : 'free', ux, -112, 26, used ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    }

    // Block footprint + residency metrics (strictly withhold answer on st===1 and st===3!)
    const blockLabel =
      st === 1
        ? '? blocks (predict)'
        : st === 3
          ? 'Stay at 6 or drop?'
          : `${res.blocks} blocks (${res.warps} warps)`;
    const blockCol = st === 1 || st === 3 ? COSMOS.gold : st === 5 ? ROLE.warn : ROLE.cubin;

    nodes.push(
      glassCell(-555, 45, 600, 118, ROLE.ir, { fill: '#0e1d34', glow: 6 }),
      txt('BLOCK FOOTPRINT (8 WARPS)', -555, 16, 26, COSMOS.muted, 'mono'),
      txt(`${res.perBlock.toLocaleString()} regs / block`, -555, 68, 34, ROLE.ir, 'mono'),

      glassCell(-555, 200, 600, 118, blockCol, { fill: '#0d2226', glow: 10 }),
      txt('RESIDENT ON 65,536-REG SM', -555, 172, 26, COSMOS.muted, 'mono'),
      txt(blockLabel, -555, 224, 36, blockCol, 'mono').glow(6, blockCol),
    );

    if (sf > 0.02 && st === 2) {
      nodes.push(
        txt(
          '4,096 free regs < 10,240 needed for 7th block',
          -855,
          342,
          28,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(sf),
      );
    } else if (tip > 0.02) {
      nodes.push(
        txt(
          'Check spills & time warmed kernel before capping regs',
          -855,
          342,
          28,
          ROLE.cubin,
          'sans',
          'left',
        ).opacity(tip),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, reg3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, reg3d, { theta: -0.18, phi: 0.9 });

  c.on('register-initial-allocation', () =>
    s.play(stage.to(0, { duration: remainDuration(c, 'register-initial-allocation', 0.35) })),
  );
  c.on('register-add-one', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'register-add-one', 0.4) })),
  );
  c.on('round-unit', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'round-unit', 0.35) })),
  );
  c.after('block-footprint', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'block-footprint', 0.35) })),
  );
  c.after('register-fewer-blocks', () => {
    const dur = remainDuration(c, 'register-fewer-blocks', 0.5);
    s.play(stage.to(2, { duration: dur }));
    s.play(blocksVal.to(6, { duration: dur }));
  });
  c.on('try-seventh', () =>
    s.play(showFree.to(0.5, { duration: remainDuration(c, 'try-seventh', 0.4) })),
  );
  c.after('free-registers', () =>
    s.play(showFree.to(1, { duration: remainDuration(c, 'free-registers', 0.4) })),
  );
  c.on('register-forty', () =>
    s.play(stage.to(3, { duration: remainDuration(c, 'register-forty', 0.4) })),
  );
  c.after('same-step', () =>
    s.play(stage.to(4, { duration: remainDuration(c, 'same-step', 0.4) })),
  );
  c.on('register-next', () =>
    s.play(stage.to(4, { duration: remainDuration(c, 'register-next', 0.35) })),
  );
  c.after('five-blocks', () => {
    const dur = remainDuration(c, 'five-blocks', 0.5);
    s.play(stage.to(5, { duration: dur }));
    s.play(blocksVal.to(5, { duration: dur }));
  });
  c.on('register-resource-reports', () =>
    s.play(showTip.to(1, { duration: remainDuration(c, 'register-resource-reports', 0.45) })),
  );
}
