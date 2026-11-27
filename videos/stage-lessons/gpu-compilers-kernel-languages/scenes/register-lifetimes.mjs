// Scene 07: Separate virtual values from simultaneous physical storage: A(0..3->0..5), B(2..6), C(4..7) -> 2 slots -> 3 slots + warp rounding.
import {
  COSMOS,
  RES_32,
  ROLE,
  SLOTS_EXT,
  SLOTS_SHORT,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function registerLifetimes(s, c) {
  const showA = s.value(0);
  const showB = s.value(0);
  const showC = s.value(0);
  const reuse = s.value(0);
  const extA = s.value(0);
  const showThird = s.value(0);
  const showRound = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61e', '#a78bfa18');
  const title = heroTitle(['Virtual Values vs', 'Physical Registers'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.triton,
    eyebrow: 'LIVENESS INTERVALS & SLOT REUSE',
  });

  // Op 0..7 mapped to x in [-620, 430]
  const ox = (op) => -620 + op * 150;

  const live = guardedDynamic(1, () => {
    const sa = showA.value;
    const sb = showB.value;
    const sc = showC.value;
    const ru = reuse.value;
    const ea = extA.value;
    const s3 = showThird.value;
    const sr = showRound.value;

    const aEnd = 3 + ea * 2; // 3 -> 5
    const needed = ea > 0.5 ? SLOTS_EXT.required : SLOTS_SHORT.required;

    const nodes = [line([ox(0), -180], [ox(7), -180], { stroke: COSMOS.rule, width: 2.2 })];
    for (let op = 0; op <= 7; op++) {
      const x = ox(op);
      const isTriple = s3 > 0.5 && (op === 4 || op === 5);
      nodes.push(
        line([x, -192], [x, -168], { stroke: isTriple ? ROLE.fail : COSMOS.muted, width: 2.5 }),
        txt(`op ${op}`, x, -220, 26, isTriple ? ROLE.fail : COSMOS.muted, 'mono'),
      );
    }

    // Intervals A, B, C (always show subtle labeled lanes so frame is balanced from t=0)
    const drawBar = (label, start, end, y, col, vis, slotTag) => {
      nodes.push(
        txt(label, -780, y, 30, vis > 0.02 ? col : COSMOS.dim, 'mono'),
        line([ox(0), y], [ox(7), y], { stroke: COSMOS.rule, width: 2, dash: [8, 8] }).opacity(
          vis > 0.02 ? 0.15 : 0.45,
        ),
      );
      if (vis < 0.02) return;
      const x0 = ox(start);
      const x1 = ox(end);
      const w = Math.max(60, x1 - x0 + 60);
      const cx = (x0 + x1) * 0.5;
      nodes.push(
        rect(w, 60, { fill: '#122038', stroke: col, width: 2.8, radius: 10 })
          .at(cx, y)
          .glow(8, col)
          .opacity(vis),
        txt(slotTag, cx, y, 26, col, 'mono').opacity(vis),
      );
    };

    drawBar('Val A', 0, aEnd, -100, ROLE.host, sa, ru > 0.5 ? 'Slot 0' : `0..${Math.round(aEnd)}`);
    drawBar('Val B', 2, 6, 0, COSMOS.gold, sb, ru > 0.5 ? 'Slot 1' : '2..6');
    drawBar(
      'Val C',
      4,
      7,
      100,
      s3 > 0.5 ? ROLE.fail : ROLE.cubin,
      sc,
      s3 > 0.5 ? 'Slot 2 (NEW!)' : ru > 0.5 ? 'Reuses Slot 0' : '4..7',
    );

    // Right readout: Simultaneous slots needed
    const slotCol = s3 > 0.5 ? ROLE.fail : ROLE.cubin;
    nodes.push(
      glassCell(670, -10, 340, 240, slotCol, {
        fill: s3 > 0.5 ? '#2b101c' : '#0e2424',
        glow: 10,
      }),
      txt('PHYSICAL SLOTS', 670, -82, 26, COSMOS.muted, 'mono'),
      txt(String(needed), 670, 0, 82, slotCol, 'mono').glow(8, slotCol),
      txt(s3 > 0.5 ? 'ops 4-5: 3 live' : 'A & C share Slot 0', 670, 74, 26, slotCol, 'mono'),
    );

    if (sr > 0.02) {
      nodes.push(
        glassCell(0, 290, 1460, 128, ROLE.ir, { fill: '#0e1b30', glow: 8, opacity: sr }),
        txt(
          `32 regs/thread × 32 lanes = ${RES_32.perWarp} regs/warp (4 × 256-reg granules)`,
          0,
          262,
          28,
          ROLE.ir,
          'mono',
        ).opacity(sr),
        txt(
          `× 8 warps/block = ${RES_32.perBlock} regs/block → ${RES_32.blocks} blocks = ${RES_32.warps} resident warps (65,536 SM file)`,
          0,
          316,
          26,
          ROLE.cubin,
          'mono',
        ).opacity(sr),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('lifetime-a', () => s.play(showA.to(1, { duration: remainDuration(c, 'lifetime-a', 0.4) })));
  c.on('lifetime-b', () => s.play(showB.to(1, { duration: remainDuration(c, 'lifetime-b', 0.4) })));
  c.on('lifetime-c', () => s.play(showC.to(1, { duration: remainDuration(c, 'lifetime-c', 0.4) })));
  c.on('reuse-slot', () =>
    s.play(reuse.to(1, { duration: remainDuration(c, 'reuse-slot', 0.45) })),
  );
  c.on('extend-a', () => s.play(extA.to(1, { duration: remainDuration(c, 'extend-a', 0.55) })));
  c.on('third-live', () =>
    s.play(showThird.to(1, { duration: remainDuration(c, 'third-live', 0.45) })),
  );
  c.on('rounded-demand', () =>
    s.play(showRound.to(1, { duration: remainDuration(c, 'rounded-demand', 0.5) })),
  );
}
