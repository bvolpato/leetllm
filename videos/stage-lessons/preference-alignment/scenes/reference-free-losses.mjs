// Scene 31: Dropping the reference changes the objective contract (ORPO SFT + odds ratio vs SimPO avg log-prob + margin)
import {
  COSMOS,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  prefLoss,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function referenceFreeLosses(s, c) {
  const phase = s.value(0);
  const sOrpo = s.value(0);
  const sOdds = s.value(0);
  const sSimpo = s.value(0);
  const sMargin = s.value(0);
  const sSys = s.value(0);

  const bgAura = aura(0, 20, 620, '#14385c26', '#2e1a4a18');
  const title = heroTitle(['Dropping the Reference', 'Changes the Objective Contract'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'REFERENCE-FREE ALIGNMENT · ORPO (ODDS RATIO) & SIMPO (TARGET MARGIN)',
  });

  const simpoZ = 2 * (-0.1 - -0.15) - 0.2; // -0.10
  const simpoL = prefLoss(simpoZ);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const orp = Math.max(0.75, sOrpo.value);
    const odd = sOdds.value;
    const sim = Math.max(0.75, sSimpo.value);
    const mrg = sMargin.value;
    const sys = sSys.value;

    const nodes = [
      // LEFT COLUMN: ORPO
      glassCell(-445, -24, 800, 392, odd > 0.2 ? COSMOS.cyan : COSMOS.blue, {
        fill: '#0e1b30',
        glow: odd > 0.2 ? 9 * pulse : 4,
        opacity: orp,
      }),
      txt('1. ORPO  (ONE-STAGE, NO REF)', -445, -172, 28, COSMOS.cyan, 'mono'),
      txt(
        'Couples chosen SFT CE + weighted odds-ratio penalty',
        -445,
        -120,
        26,
        COSMOS.ink,
        'sans',
      ),

      glassCell(-445, -34, 740, 108, COSMOS.emerald, { fill: '#0e2624', glow: 4 }),
      txt('p(A)=0.20 (odds 0.25) | p(B)=0.10 (odds 0.11)', -445, -56, 26, COSMOS.ink, 'mono'),
      txt('Odds ratio = 2.25 (NOT prob ratio 2.00!)', -445, -12, 26, COSMOS.gold, 'mono'),

      // RIGHT COLUMN: SimPO
      glassCell(445, -24, 800, 392, mrg > 0.2 ? COSMOS.violet : COSMOS.dim, {
        fill: '#1a1430',
        glow: mrg > 0.2 ? 9 * pulse : 4,
        opacity: sim,
      }),
      txt('2. SIMPO  (NO REF, LENGTH-NORMALIZED)', 445, -172, 28, COSMOS.violet, 'mono'),
      txt(
        'Average token log-prob reward - explicit target margin gamma',
        445,
        -120,
        26,
        COSMOS.ink,
        'sans',
      ),

      glassCell(445, -34, 740, 108, COSMOS.amber, { fill: '#241a0f', glow: 4 }),
      txt('mean log p: A=-0.10, B=-0.15 (beta=2, g=0.2)', 445, -56, 26, COSMOS.ink, 'mono'),
      txt(
        `z = 2(-0.10+0.15) - 0.20 = ${simpoZ.toFixed(2)} -> L=${simpoL.toFixed(3)}`,
        445,
        -12,
        26,
        COSMOS.gold,
        'mono',
      ),

      // BOTTOM: Systems & evaluation contract
      glassCell(0, 294, 1690, 162, sys > 0.2 ? COSMOS.emerald : COSMOS.dim, {
        fill: '#12182b',
        glow: sys > 0.2 ? 9 * pulse : 3,
      }),
      txt(
        'SYSTEMS & QUALITY CONTRACT (CHOOSE BY FEEDBACK, VERIFY HELD-OUT)',
        -810,
        248,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Drops reference VRAM & ref forward pass, while trainable policy forward + backward still runs.',
        -810,
        296,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'SimPO != token-averaged DPO; report exact loss, normalization, held-out concision & correctness.',
        -810,
        344,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  const eqOrpo = glowTex(
    'L_{\\text{ORPO}} = L_{\\text{SFT}} - \\lambda \\ln\\sigma\\!\\left(\\ln\\frac{\\operatorname{odds}(A)}{\\operatorname{odds}(B)}\\right)',
    {
      x: -445,
      y: 96,
      size: 28,
      color: COSMOS.cyan,
      glow: 6,
    },
  );

  const eqSimpo = glowTex(
    'L_{\\text{SimPO}} = -\\ln\\sigma\\!\\left(\\frac{\\beta}{|y_w|}\\ln\\pi_w - \\frac{\\beta}{|y_l|}\\ln\\pi_l - \\gamma\\right)',
    {
      x: 445,
      y: 96,
      size: 28,
      color: COSMOS.violet,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqOrpo, eqSimpo);
  runPhase(s, c, phase, 14);

  c.on('reference-free-losses-b0', () =>
    s.play(sOrpo.to(1, { duration: remainDuration(c, 'reference-free-losses-b0', 0.45) })),
  );
  c.on('pa-orpo-odds', () =>
    s.play(sOdds.to(1, { duration: remainDuration(c, 'pa-orpo-odds', 0.5) })),
  );
  c.on('reference-free-losses-b1', () =>
    s.play(sSimpo.to(1, { duration: remainDuration(c, 'reference-free-losses-b1', 0.45) })),
  );
  c.on('pa-simpo-margin', () =>
    s.play(sMargin.to(1, { duration: remainDuration(c, 'pa-simpo-margin', 0.5) })),
  );
  c.on('reference-free-losses-b2', () =>
    s.play(sSys.to(1, { duration: remainDuration(c, 'reference-free-losses-b2', 0.55) })),
  );
}
