// Scene 07: Keep low-bit values attached to their native scales.
// FP8 E4M3, FP4 E2M1, BF16->FP32 acc; SM90 FP32 K=128 vs SM100 packed UE8M0 K=32; arch dispatch & cast cost.
import {
  COSMOS,
  ROLE,
  aura,
  buildFp8WgmmaCube3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function precisionContracts(s, c) {
  const phase = s.value(0);
  const kCursor = s.value(0);
  const promoVal = s.value(0.2);
  const step = s.value(0); // 1=FP8/FP4, 2=BF16, 3=SM90, 4=SM100, 5=arch gate, 6=cast cost

  const bgAura = aura(445, 20, 520, '#a78bfa22', '#ff6b8b18');
  const { view: cube3d } = buildFp8WgmmaCube3d(kCursor, promoVal, phase, {
    x: 455,
    y: 15,
    unit: 94,
  });

  const title = heroTitle(['Low-Bit Values &', 'Native Scales'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.scale,
    eyebrow: 'SM90 HOPPER VS SM100 BLACKWELL',
    subtitle: 'Bit formats and block scales are architecture-specific',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D PRECISION & SCALE DISPATCH', 455, -415, 26, ROLE.scale, 'mono').glow(5, ROLE.scale),
      txt(
        'Wrapper input layout != native tensor-core scale format',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Top row: bit formats
    const fmts = [
      { name: 'FP8 E4M3', spec: '1s · 4e · 3m', col: ROLE.a, x: -735, lit: st >= 0.5 },
      { name: 'FP4 E2M1', spec: '2 vals / byte', col: ROLE.b, x: -465, lit: st >= 0.5 },
      { name: 'BF16 -> FP32', spec: 'FP32 accum', col: ROLE.c, x: -195, lit: st >= 1.5 },
    ];
    fmts.forEach((f) => {
      nodes.push(
        glassCell(f.x, -140, 248, 92, f.lit ? f.col : COSMOS.dim, {
          fill: '#0e1629',
          glow: f.lit ? 8 : 0,
        }),
        txt(f.name, f.x, -158, 26, f.lit ? f.col : COSMOS.muted, 'mono'),
        txt(f.spec, f.x, -116, 26, COSMOS.ink, 'mono'),
      );
    });

    // Middle comparison: SM90 vs SM100
    const sm90Lit = st >= 2.5;
    const sm100Lit = st >= 3.5;
    nodes.push(
      glassCell(-665, 20, 380, 155, sm90Lit ? ROLE.a : COSMOS.dim, {
        fill: '#101d36',
        glow: sm90Lit ? 8 : 0,
      }),
      txt('SM90 (HOPPER)', -665, -28, 26, ROLE.a, 'mono'),
      txt('FP32 scales · K = 128', -665, 16, 26, COSMOS.ink, 'mono'),
      txt('Primary NT FP8 path', -665, 58, 26, COSMOS.muted, 'sans'),

      glassCell(-255, 20, 415, 155, sm100Lit ? ROLE.scale : COSMOS.dim, {
        fill: '#1f1538',
        glow: sm100Lit ? 10 : 0,
      }),
      txt('SM100 (BLACKWELL)', -255, -28, 26, ROLE.scale, 'mono'),
      txt('4× UE8M0 (int32) · K=32', -255, 16, 26, COSMOS.ink, 'mono'),
      txt('FP8×FP4 · NT/TN/NN/TT', -255, 58, 26, ROLE.gold, 'mono'),
    );

    // Bottom contract rules
    if (st >= 4.5) {
      nodes.push(
        glassCell(-460, 218, 780, 96, st >= 5.5 ? ROLE.warn : ROLE.bad, {
          fill: '#241422',
          glow: 8,
        }),
        txt(
          st >= 5.5
            ? 'Profile casts & transposes: prep can exceed GEMM savings'
            : 'SM100 FP4 cannot run on SM90 by changing tile size',
          -460,
          218,
          26,
          st >= 5.5 ? ROLE.warn : ROLE.bad,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        'Check architecture, scale dtype, major order & strides together',
        -860,
        360,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, cube3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cube3d, { theta: -0.2, phi: 0.92 });

  c.on('pc-fp8', () => s.play(step.to(1, { duration: remainDuration(c, 'pc-fp8', 0.45) })));
  c.on('pc-bf16', () => {
    const dur = remainDuration(c, 'pc-bf16', 0.45);
    s.play(step.to(2, { duration: dur }));
    s.play(promoVal.to(0.7, { duration: dur }));
  });
  c.on('pc-sm90', () => {
    const dur = remainDuration(c, 'pc-sm90', 0.45);
    s.play(step.to(3, { duration: dur }));
    s.play(kCursor.to(1, { duration: dur }));
  });
  c.on('pc-sm100', () => {
    const dur = remainDuration(c, 'pc-sm100', 0.5);
    s.play(step.to(4, { duration: dur }));
    s.play(kCursor.to(2, { duration: dur }));
    s.play(promoVal.to(1, { duration: dur }));
  });
  c.on('pc-layout', () => s.play(step.to(5, { duration: remainDuration(c, 'pc-layout', 0.45) })));
  c.on('pc-cast', () => s.play(step.to(6, { duration: remainDuration(c, 'pc-cast', 0.45) })));
}
