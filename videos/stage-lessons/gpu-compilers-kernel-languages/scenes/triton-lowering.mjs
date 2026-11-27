// Scene 16: How does a thread read its two values? Triton 3.9 lowering (TTIR -> TTGIR -> LLVM -> PTX -> cubin), 2 elems/thread, 14 regs.
import {
  COSMOS,
  ROLE,
  aura,
  buildLoweringConduit3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tritonLowering(s, c) {
  const stageCursor = s.value(0);
  const phase = s.value(0);
  const showStages = s.value(0);
  const showMask = s.value(0);
  const showLayout = s.value(0);
  const showLoad0 = s.value(0);
  const showLoad1 = s.value(0);
  const showReport = s.value(0);
  const showAsm = s.value(0);

  const bgAura = aura(420, 20, 520, '#a78bfa22', '#5ce1e618');
  const { view: conduit3d } = buildLoweringConduit3d(stageCursor, phase, {
    x: 440,
    y: 25,
    unit: 96,
  });

  const title = heroTitle(['How a Triton Thread', 'Reads Two Values'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.triton,
    eyebrow: 'TRITON 3.9 LOWERING · 256-ELEM BLOCK',
  });

  const live = guardedDynamic(1, () => {
    const st = showStages.value;
    const sm = showMask.value;
    const sl = showLayout.value;
    const l0 = showLoad0.value;
    const l1 = showLoad1.value;
    const sr = showReport.value;
    const sa = showAsm.value;

    const nodes = [
      txt('3D TRITON → PTX → CUBIN CONDUIT', 440, -405, 26, ROLE.triton, 'mono').glow(
        5,
        ROLE.triton,
      ),
      txt(
        sa > 0.5
          ? 'NVIDIA backend invokes toolkit ptxas → cubin'
          : 'TTIR → TTGIR → LLVM IR → PTX → ELF cubin',
        440,
        420,
        26,
        sa > 0.5 ? ROLE.cubin : COSMOS.muted,
        'mono',
      ),

      // Top IR summary
      glassCell(-545, -165, 620, 96, st > 0.5 ? ROLE.triton : COSMOS.dim, {
        fill: '#1a1333',
        glow: st > 0.5 ? 8 : 2,
      }),
      txt('TTIR: arith.addf <256 x f32>', -545, -190, 26, ROLE.triton, 'mono'),
      txt(
        sm > 0.5 ? 'i64 pid widen · < mask on loads & store' : 'block-level tensor IR',
        -545,
        -140,
        26,
        sm > 0.5 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),

      // TTGIR 2 elements per thread layout (4 warps x 32 threads = 128 threads -> 256 elems)
      glassCell(-715, -22, 280, 118, sl > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#0e1f36',
        glow: sl > 0.5 ? 8 : 2,
      }),
      txt('THREAD 0', -715, -52, 26, ROLE.ir, 'mono'),
      txt('offsets 0, 1', -715, -4, 30, COSMOS.ink, 'mono'),

      glassCell(-375, -22, 280, 118, sl > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#0e1f36',
        glow: sl > 0.5 ? 8 : 2,
      }),
      txt('THREAD 1', -375, -52, 26, ROLE.ir, 'mono'),
      txt('offsets 2, 3', -375, -4, 30, COSMOS.ink, 'mono'),

      // Thread 0 PTX guarded loads (+0B and +4B)
      glassCell(-525, 134, 660, 118, l0 > 0.5 ? ROLE.ptx : COSMOS.dim, {
        fill: '#221c10',
        glow: l0 > 0.5 ? 9 : 2,
      }),
      txt('THREAD 0 PTX LOADS (EACH GUARDED)', -525, 102, 26, ROLE.ptx, 'mono'),
      txt(
        l1 > 0.5
          ? 'ld [x+0] (@p0) · ld [x+4] (@p1)'
          : l0 > 0.5
            ? 'ld [x+0] (@p0) · loading +4B...'
            : '4 warps × 32 threads = 256 elements',
        -525,
        154,
        26,
        l0 > 0.5 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),
    ];

    if (sr > 0.02) {
      nodes.push(
        glassCell(-525, 294, 660, 108, ROLE.cubin, { fill: '#0d2623', glow: 9, opacity: sr }),
        txt('TRITON: 14 regs · 0 spills · 0 SMEM', -525, 268, 26, ROLE.cubin, 'mono').opacity(sr),
        txt('CUDA: 12 regs · time both on GPU', -525, 318, 26, COSMOS.ink, 'mono').opacity(sr),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, conduit3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, conduit3d, { theta: -0.2, phi: 0.92 });

  c.on('triton-stages', () => {
    s.play(showStages.to(1, { duration: remainDuration(c, 'triton-stages', 0.4) }));
    s.play(stageCursor.to(1, { duration: remainDuration(c, 'triton-stages', 0.45) }));
  });
  c.on('triton-mask', () =>
    s.play(showMask.to(1, { duration: remainDuration(c, 'triton-mask', 0.4) })),
  );
  c.on('two-per-thread', () => {
    s.play(showLayout.to(1, { duration: remainDuration(c, 'two-per-thread', 0.45) }));
    s.play(stageCursor.to(2, { duration: remainDuration(c, 'two-per-thread', 0.45) }));
  });
  c.on('triton-loads', () =>
    s.play(showLoad0.to(1, { duration: remainDuration(c, 'triton-loads', 0.4) })),
  );
  c.on('next-float', () =>
    s.play(showLoad1.to(1, { duration: remainDuration(c, 'next-float', 0.4) })),
  );
  c.on('triton-report', () =>
    s.play(showReport.to(1, { duration: remainDuration(c, 'triton-report', 0.45) })),
  );
  c.on('toolkit-assembler', () => {
    s.play(showAsm.to(1, { duration: remainDuration(c, 'toolkit-assembler', 0.45) }));
    s.play(stageCursor.to(3, { duration: remainDuration(c, 'toolkit-assembler', 0.45) }));
  });
}
