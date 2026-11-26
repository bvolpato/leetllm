// Scene 24: Distinguish a fixed seed from a fixed reduction schedule.
// FP32 24 significand bits: (2^24 + 1) - 2^24 = 0 vs (2^24 - 2^24) + 1 = 1 (zero RNG!).
// use_deterministic_algorithms defaults False; Mega mHC fixed split count; Mega Gate sqrtsoftplus.
import {
  COSMOS,
  FP32_BIG,
  FP32_ORDER_A,
  FP32_ORDER_B,
  ROLE,
  aura,
  buildFp8WgmmaCube3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function determinism(s, c) {
  const phase = s.value(0);
  const kCursor = s.value(0);
  const promoVal = s.value(0.2);
  const step = s.value(0); // 1=order A -> 0, 2=order B -> 1, 3=default False, 4=fixed split, 5=fixed seed != mode, 6=Mega Gate/mHC

  const bgAura = aura(445, 20, 520, '#ff6b8b20', '#60a5fa1a');
  const { view: cube3d } = buildFp8WgmmaCube3d(kCursor, promoVal, phase, {
    x: 455,
    y: 15,
    unit: 94,
  });

  const title = heroTitle(['Fixed Seed !=', 'Fixed Reduction Order'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'FP32 ASSOCIATIVITY · SPLIT SCHEDULE',
    subtitle: 'Changing addition order changes bits even with zero RNG',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D REDUCTION SPLIT SCHEDULE', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        'FP32 has 24 binary significand bits (1 implicit + 23)',
        455,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    // FP32 non-associativity proof (2^24 = 16,777,216)
    nodes.push(
      txt(
        `A = 2^24 = ${FP32_BIG.toLocaleString()} (ROUND-TO-NEAREST-EVEN)`,
        -860,
        -172,
        26,
        ROLE.gold,
        'mono',
        'left',
      ),

      glassCell(-665, -80, 375, 114, st >= 0.6 ? ROLE.bad : COSMOS.dim, {
        fill: '#281320',
        glow: st >= 0.6 ? 9 : 0,
      }),
      txt('ORDER 1: (A + 1) - A', -665, -110, 26, ROLE.bad, 'mono'),
      txt(st >= 0.6 ? `result = ${FP32_ORDER_A}` : 'computing...', -665, -62, 34, ROLE.bad, 'mono'),

      glassCell(-245, -80, 395, 114, st >= 1.6 ? ROLE.good : COSMOS.dim, {
        fill: '#0f2822',
        glow: st >= 1.6 ? 9 : 0,
      }),
      txt('ORDER 2: (A - A) + 1', -245, -110, 26, ROLE.good, 'mono'),
      txt(
        st >= 1.6 ? `result = ${FP32_ORDER_B}` : 'cancel first',
        -245,
        -62,
        34,
        ROLE.good,
        'mono',
      ),
    );

    // Deterministic algorithm flag & Mega mHC split selector
    if (st >= 2.6) {
      nodes.push(
        glassCell(-460, 82, 800, 138, st >= 3.6 ? ROLE.c : ROLE.warn, {
          fill: '#0e1b2d',
          glow: 8,
        }),
        txt(
          'use_deterministic_algorithms(False) [DEFAULT]',
          -830,
          38,
          26,
          ROLE.warn,
          'mono',
          'left',
        ),
        txt(
          st >= 3.6
            ? 'Deterministic = True fixes Mega mHC split count'
            : 'Default varies split count by batch size & SMs',
          -830,
          82,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          st >= 4.6
            ? 'Fixed RNG seed != deterministic splits (test alone vs packed)'
            : 'Different batch context -> different rounding order',
          -830,
          126,
          26,
          st >= 4.6 ? ROLE.gold : COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    // Sept/Oct surrounding fusions: Mega Gate & Mega mHC
    if (st >= 5.6) {
      nodes.push(
        glassCell(-665, 248, 375, 108, ROLE.scale, { fill: '#1c1536', glow: 8 }),
        txt('MEGA GATE', -665, 222, 26, ROLE.scale, 'mono'),
        txt('Routing + sqrtsoftplus', -665, 266, 26, COSMOS.ink, 'sans'),

        glassCell(-245, 248, 395, 108, ROLE.a, { fill: '#101d38', glow: 8 }),
        txt('MEGA mHC', -245, 222, 26, ROLE.a, 'mono'),
        txt('Mixing + RMSNorm', -245, 266, 26, COSMOS.ink, 'sans'),
      );
    }

    nodes.push(
      txt(
        st >= 5.6
          ? 'Mega Gate & Mega mHC have separate contracts (absent from April PR)'
          : 'Re-verify numerical agreement & throughput per hardware/software pin',
        -860,
        378,
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

  c.after('dt-fp32', () => {
    const dur = remainAfterDuration(c, 'dt-fp32', 0.35);
    s.play(step.to(1, { duration: dur }));
    s.play(kCursor.to(1, { duration: dur }));
  });
  c.after('dt-order', () => {
    const dur = remainAfterDuration(c, 'dt-order', 0.35);
    s.play(step.to(2, { duration: dur }));
    s.play(promoVal.to(1, { duration: dur }));
  });
  c.on('dt-default', () => s.play(step.to(3, { duration: remainDuration(c, 'dt-default', 0.45) })));
  c.on('dt-split', () => {
    const dur = remainDuration(c, 'dt-split', 0.45);
    s.play(step.to(4, { duration: dur }));
    s.play(kCursor.to(2, { duration: dur }));
  });
  c.on('dt-seed', () => s.play(step.to(5, { duration: remainDuration(c, 'dt-seed', 0.45) })));
  c.on('dt-fusions', () => s.play(step.to(6, { duration: remainDuration(c, 'dt-fusions', 0.45) })));
}
