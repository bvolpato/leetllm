// Scene 04: What can the native listing establish? Captured sm_120 disassembly, prediction hold before R9=-1.75, 12 regs + 5 shapes.
import {
  COSMOS,
  LANE_1,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function capturedNative(s, c) {
  const showLabels = s.value(0);
  const showInputs = s.value(0);
  const loadRegs = s.value(0);
  const revR9 = s.value(0);
  const storeR9 = s.value(0);
  const showRes = s.value(0);
  const showShapes = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71c', '#5ce1e618');
  const title = heroTitle(['What Can the Native', 'Listing Establish?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.cubin,
    eyebrow: 'CAPTURED SM_120 DISASSEMBLY · CUDA 13.2',
  });

  const live = guardedDynamic(1, () => {
    const sl = showLabels.value;
    const si = showInputs.value;
    const lr = loadRegs.value;
    const r9 = revR9.value;
    const st = storeR9.value;
    const rs = showRes.value;
    const sh = showShapes.value;

    const nodes = [
      // Top-right build identity strip
      glassCell(410, -355, 860, 86, sl > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#0f1c33',
        glow: sl > 0.5 ? 8 : 2,
      }),
      txt(
        'CUDA 13.2 · CC 12.0 · cubin sm_120 · PTX sm_90 / 9.2',
        410,
        -355,
        26,
        COSMOS.ink,
        'mono',
      ),
    ];

    // Left: 4 byte-offset disassembly rows
    const rows = [
      {
        off: '0x0e0',
        op: 'LDG.E R4, [x + 4]',
        reg: lr > 0.5 ? `R4 = ${LANE_1.x}` : 'R4',
        on: lr > 0.5,
        col: ROLE.host,
      },
      {
        off: '0x100',
        op: 'LDG.E R7, [y + 4]',
        reg: lr > 0.5 ? `R7 = ${LANE_1.y}` : 'R7',
        on: lr > 0.5,
        col: ROLE.host,
      },
      {
        off: '0x130',
        op: 'FADD  R9, R4, R7',
        reg: r9 > 0.5 ? `R9 = ${LANE_1.sum}` : 'R? = ?',
        on: r9 > 0.5,
        col: r9 > 0.5 ? ROLE.cubin : COSMOS.gold,
      },
      {
        off: '0x150',
        op: 'STG.E [out + 4], R9',
        reg: st > 0.5 ? `out[1] = ${LANE_1.sum}` : 'pending',
        on: st > 0.5,
        col: ROLE.cubin,
      },
    ];

    nodes.push(
      txt('OFFSET', -775, -195, 26, COSMOS.muted, 'mono'),
      txt('NATIVE SM_120 SASS', -445, -195, 26, ROLE.ir, 'mono'),
      txt('REGISTER / SLOT', 25, -195, 26, COSMOS.gold, 'mono'),
    );

    rows.forEach((row, idx) => {
      const y = -112 + idx * 108;
      const stroke = row.on ? row.col : si > 0.5 ? COSMOS.rule : COSMOS.dim;
      nodes.push(
        txt(row.off, -775, y, 26, COSMOS.muted, 'mono'),
        glassCell(-445, y, 470, 82, stroke, {
          fill: row.on ? '#0e252e' : '#0c1221',
          glow: row.on ? 8 : 0,
        }),
        txt(row.op, -445, y, 26, row.on ? COSMOS.ink : COSMOS.muted, 'mono'),
        glassCell(25, y, 360, 82, stroke, {
          fill: row.on ? '#102824' : '#0c1221',
          glow: row.on ? 9 : 0,
        }),
        txt(row.reg, 25, y, 28, row.on ? row.col : COSMOS.gold, 'mono'),
      );
    });

    // Right column: Prediction prompt -> Resource report -> 5 NaN-poisoned shapes
    if (lr > 0.5 && r9 < 0.5) {
      nodes.push(
        txt('PREDICT', 560, -140, 26, COSMOS.gold, 'mono'),
        txt('Where is the sum', 560, -80, 34, COSMOS.gold, 'serif'),
        txt('just before 0x150?', 560, -32, 34, COSMOS.gold, 'serif').glow(6, COSMOS.gold),
      );
    }

    if (rs > 0.02) {
      nodes.push(
        glassCell(560, -85, 560, 148, ROLE.cubin, { fill: '#0d2424', glow: 8, opacity: rs }),
        txt('PTXAS RESOURCE REPORT', 560, -125, 26, ROLE.cubin, 'mono').opacity(rs),
        txt('12 regs · 0 stack B · 0 spills', 560, -68, 28, COSMOS.ink, 'mono').opacity(rs),
      );
    }

    if (sh > 0.02) {
      nodes.push(
        glassCell(560, 125, 560, 168, ROLE.ir, { fill: '#0e1e34', glow: 9, opacity: sh }),
        txt('5 SHAPES · NaN-POISONED', 560, 72, 26, ROLE.ir, 'mono').opacity(sh),
        txt('n = 1, 255, 256, 257, 1000', 560, 124, 28, COSMOS.gold, 'mono').opacity(sh),
        txt('Exact match · 0 memcheck errors', 560, 174, 26, ROLE.cubin, 'mono').opacity(sh),
      );
    }

    nodes.push(
      txt(
        sh > 0.5
          ? 'Skipped store leaves NaN behind · all 5 finite & verified'
          : 'Offsets + lineinfo bind disassembly to this exact build',
        0,
        396,
        28,
        sh > 0.5 ? ROLE.cubin : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('capture-labels', () =>
    s.play(showLabels.to(1, { duration: remainDuration(c, 'capture-labels', 0.4) })),
  );
  c.on('capture-inputs', () =>
    s.play(showInputs.to(1, { duration: remainDuration(c, 'capture-inputs', 0.4) })),
  );
  c.on('load-r4', () => s.play(loadRegs.to(1, { duration: remainDuration(c, 'load-r4', 0.45) })));
  c.after('add-r9', () => s.play(revR9.to(1, { duration: remainDuration(c, 'add-r9', 0.45) })));
  c.on('store-r9', () => s.play(storeR9.to(1, { duration: remainDuration(c, 'store-r9', 0.4) })));
  c.on('resource-twelve', () =>
    s.play(showRes.to(1, { duration: remainDuration(c, 'resource-twelve', 0.45) })),
  );
  c.on('shape-fixtures', () =>
    s.play(showShapes.to(1, { duration: remainDuration(c, 'shape-fixtures', 0.45) })),
  );
}
