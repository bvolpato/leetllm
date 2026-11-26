// Scene 12: Derive which factor moves first: Outer-product gradients + 2-step SGD trace + null-space & both-zero failure cases.
import {
  COSMOS,
  LEARN_STEPS,
  aura,
  fmtNum,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function gradientContract(s, c) {
  const phase = s.value(0);
  const hlZ = s.value(0);
  const hlBOuter = s.value(0);
  const hlAOuter = s.value(0);
  const stage2 = s.value(0);
  const showFirstB = s.value(0);
  const showStep1 = s.value(0);
  const stage3 = s.value(0);
  const showNextErr = s.value(0);
  const showNextA = s.value(0);
  const showNull = s.value(0);

  const s0 = LEARN_STEPS[0];
  const s1 = LEARN_STEPS[1];

  const bgAura = aura(100, 20, 620, '#5ce1e620', '#ffd16618');
  const title = heroTitle(['Derive Which Factor', 'Moves First'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'OUTER-PRODUCT GRADIENT CONTRACT',
  });

  const eqZ = glowTex(String.raw`z = A x`, { x: 200, y: -370, size: 38, color: COSMOS.gold });
  const eqB = glowTex(String.raw`\nabla_B \mathcal{L} = s \, g z^T`, {
    x: 470,
    y: -370,
    size: 38,
    color: COSMOS.cyan,
  });
  const eqA = glowTex(String.raw`\nabla_A \mathcal{L} = s \, (B^T g) x^T`, {
    x: 560,
    y: -285,
    size: 38,
    color: COSMOS.violet,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const b1 = showFirstB.value;
    const st1 = showStep1.value;
    const ne = showNextErr.value;
    const na = showNextA.value;
    const nl = showNull.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [
      // Left column: 2-step SGD numeric trace
      glassCell(-440, -90, 810, 225, st1 > 0.2 ? COSMOS.cyan : COSMOS.blue, {
        fill: '#101c34',
        glow: hlBOuter.value > 0.2 || stage2.value > 0.2 ? 9 : 4,
      }),
      txt('STEP 1  ·  A = 1,  B = 0,  x = 1,  y* = 1', -810, -162, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        b1 > 0.3
          ? `g = −1   ->   ∇B = ${fmtNum(s0.gradB, 2)}   ·   ∇A = ${fmtNum(s0.gradA, 2)}`
          : 'B = 0 blocks ∇A; B moves if s · g · z != 0',
        -810,
        -98,
        30,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        st1 > 0.3
          ? `SGD (lr = 0.1):   B: 0 -> ${fmtNum(s1.b, 2)}   ·   A stays 1`
          : 'Gaussian A (paper) or Kaiming A (PEFT), B = 0',
        -810,
        -32,
        28,
        st1 > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ),

      glassCell(-440, 178, 810, 232, na > 0.3 ? COSMOS.emerald : '#334268', {
        fill: na > 0.3 ? '#0e2528' : '#11182c',
        glow: stage3.value > 0.2 ? 9 * pulse : 3,
      }),
      txt(
        'STEP 2  ·  OUTPUT = 0.1  (NONZERO B UNLOCKS A)',
        -810,
        102,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        ne > 0.3
          ? `Error g = 0.1 − 1 = ${fmtNum(s1.output - 1, 2)}`
          : 'Next forward pass reads B = 0.1',
        -810,
        164,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        na > 0.3
          ? `∇B = ${fmtNum(s1.gradB, 2)}   ·   ∇A = ${fmtNum(s1.gradA, 2)}   (both move!)`
          : 'Waiting for step-2 backward gradients...',
        -810,
        228,
        30,
        na > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ).glow(na > 0.3 ? 6 : 0, COSMOS.emerald),

      // Right column: 3 edge / failure regimes
      glassCell(445, -80, 810, 150, nl > 0.2 ? COSMOS.amber : '#334268', {
        fill: '#231b11',
        glow: nl > 0.2 ? 9 : 3,
      }),
      txt('CASE 1: NULL-SPACE INPUT (Ax = 0)', 75, -120, 26, COSMOS.amber, 'mono', 'left'),
      txt('z = 0  ->  ∇B = 0 for that example', 75, -62, 28, COSMOS.ink, 'mono', 'left'),

      glassCell(445, 98, 810, 150, nl > 0.2 ? COSMOS.rose : '#334268', {
        fill: '#261220',
        glow: nl > 0.2 ? 9 : 3,
      }),
      txt('CASE 2: BOTH ZERO (A = 0, B = 0)', 75, 58, 26, COSMOS.rose, 'mono', 'left'),
      txt('∇A = 0 and ∇B = 0  ->  stuck forever', 75, 116, 28, COSMOS.ink, 'mono', 'left'),

      glassCell(445, 276, 810, 150, hlAOuter.value > 0.2 ? COSMOS.violet : '#334268', {
        fill: '#191430',
        glow: 6,
      }),
      txt('CASE 3: REVERSED (A = 0, B != 0)', 75, 236, 26, COSMOS.violet, 'mono', 'left'),
      txt('A moves first · still preserves step-0 no-op', 75, 294, 28, COSMOS.ink, 'mono', 'left'),

      // Bottom summary
      glowDot(-825, 390, { radius: 6, color: hlZ.value > 0.2 ? COSMOS.gold : COSMOS.cyan }),
      txt(
        'Starting both factors nonzero breaks step-0 checkpoint identity',
        -795,
        390,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eqZ, eqB, eqA, live);
  runPhase(s, c, phase, 14);

  c.on('gradient-contract-1', () => s.play(hlZ.to(0.5, { duration: 0.35 })));
  c.on('gradient-z', () => s.play(hlZ.to(1, { duration: 0.35 })));
  c.on('gradient-b-outer', () => s.play(hlBOuter.to(1, { duration: 0.35 })));
  c.on('gradient-a-outer', () => s.play(hlAOuter.to(1, { duration: 0.35 })));
  c.on('gradient-contract-2', () => s.play(stage2.to(1, { duration: 0.35 })));
  c.on('gradient-first-b', () => s.play(showFirstB.to(1, { duration: 0.35 })));
  c.on('gradient-first-step', () => s.play(showStep1.to(1, { duration: 0.4 })));
  c.on('gradient-contract-3', () => s.play(stage3.to(1, { duration: 0.35 })));
  c.on('gradient-next-error', () => s.play(showNextErr.to(1, { duration: 0.35 })));
  c.on('gradient-next-a', () => s.play(showNextA.to(1, { duration: 0.35 })));
  c.on('gradient-null-cases', () =>
    s.play(showNull.to(1, { duration: remainDuration(c, 'gradient-null-cases', 0.45) })),
  );
}
