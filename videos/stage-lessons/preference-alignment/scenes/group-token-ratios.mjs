// Scene 33: Token clipping and sequence clipping are different operations (1.10 avg vs 1.21->1.20 seq + Schulman k3 KL)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  sampleCurve,
  txt,
} from '../parts.mjs';

export default function groupTokenRatios(s, c) {
  const phase = s.value(0);
  const sTok = s.value(0);
  const sTokVal = s.value(0);
  const sSeq = s.value(0);
  const sSeqVal = s.value(0);
  const sKl = s.value(0);
  const sKlForm = s.value(0);
  const sTrainer = s.value(0);

  const bgAura = aura(0, 20, 620, '#14385c26', '#2e1a4a18');
  const title = heroTitle(['Token Clipping & Sequence', 'Clipping Are Different Operations'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'GRPO IMPORTANCE RATIOS · TOKEN AVERAGE (1.10) vs SEQUENCE PRODUCT (1.20) & k_3 KL',
  });

  // k3(ell) = exp(ell) - ell - 1 plot in bottom-right: ell in [-1.2, 1.2], y in [0, 1.2]
  const px0 = 120;
  const px1 = 820;
  const pyBot = 330;
  const pyTop = 78;
  const mapX = (ell) => px0 + ((ell + 1.2) / 2.4) * (px1 - px0);
  const mapY = (v) => pyBot - (Math.min(1.2, v) / 1.2) * (pyBot - pyTop);
  const k3Pts = sampleCurve(
    (e) => Math.exp(e) - e - 1,
    [-1.2, 1.2],
    [0, 1.2],
    px0,
    px1,
    pyBot,
    pyTop,
    70,
  );

  const ell0 = Math.log(0.5 / 0.8); // -0.470
  const ell1 = Math.log(0.5 / 0.2); // +0.916
  const k0 = Math.exp(ell0) - ell0 - 1;
  const k1 = Math.exp(ell1) - ell1 - 1;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const tv = Math.max(0.75, sTokVal.value);
    const sv = sSeqVal.value;
    const kl = sKlForm.value;
    const tr = sTrainer.value;

    const nodes = [
      // TOP LEFT: Tokenwise GRPO clipping (1.10, 1.10 -> 1.10)
      glassCell(-445, -104, 800, 198, COSMOS.emerald, {
        fill: '#0e2824',
        glow: sTok.value > 0.2 ? 8 * pulse : 4,
        opacity: tv,
      }),
      txt(
        '1. ORIGINAL TOKENWISE CLIP (A = +1, eps = 0.2)',
        -810,
        -166,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt('Token ratios: rho_0 = 1.10, rho_1 = 1.10', -810, -112, 28, COSMOS.ink, 'mono', 'left'),
      txt(
        'avg(min(1.10, 1.20), min(1.10, 1.20)) = 1.10',
        -810,
        -56,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // TOP RIGHT: Sequence-level product clipping (1.10 * 1.10 = 1.21 -> 1.20)
      glassCell(445, -104, 800, 198, sv > 0.2 || sSeq.value > 0.2 ? COSMOS.rose : COSMOS.dim, {
        fill: sv > 0.2 ? '#29101a' : '#12182b',
        glow: sv > 0.2 ? 10 * pulse : 4,
        opacity: Math.max(0.75, sSeq.value),
      }),
      txt(
        '2. SEQUENCE PRODUCT CLIP (DIFFERENT EQUATION!)',
        80,
        -166,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        'Sequence ratio:  rho_seq = 1.10 x 1.10 = 1.21',
        80,
        -112,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt('min(1.21, 1.20) = 1.20   !=   1.10', 80, -56, 28, COSMOS.rose, 'mono', 'left'),

      // BOTTOM LEFT: Separate KL + Trainer config table
      glassCell(-445, 204, 800, 318, tr > 0.2 ? COSMOS.gold : COSMOS.violet, {
        fill: '#13182b',
        glow: kl > 0.2 || tr > 0.2 ? 8 * pulse : 4,
      }),
      txt(
        tr > 0.2
          ? '3. INSPECTED TRAINER CHOICES (RECORD EXPLICITLY)'
          : '3. SEPARATE NONNEGATIVE SAMPLE KL (k_3)',
        -810,
        92,
        26,
        tr > 0.2 ? COSMOS.gold : COSMOS.violet,
        'mono',
        'left',
      ),
      txt(
        tr > 0.2
          ? '· Ratio & normalization: selectable (changes objective)'
          : '· Added OUTSIDE group reward standardization',
        -810,
        148,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        tr > 0.2
          ? '· Reward scaling: group, batch, or none'
          : '· ell = ln(pi_ref / pi_cur) -> exp(ell) - ell - 1 >= 0',
        -810,
        198,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      txt(
        tr > 0.2
          ? '· Default beta = 0 -> no reference loaded for KL'
          : '· E_pi[k_3] = forward KL (0.193 on [0.8, 0.2] vs [0.5, 0.5])',
        -810,
        248,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),
      txt(
        'Verify ratio, scaling & beta before comparing runs',
        -810,
        304,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // BOTTOM RIGHT: k3(ell) convex nonnegative curve
      txt('NONNEGATIVE SAMPLE KL:  k_3(ell) = e^ell - ell - 1', 470, 52, 26, COSMOS.cyan, 'mono'),
      line([px0, pyBot], [px1, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([mapX(0), pyBot], [mapX(0), pyTop], { stroke: COSMOS.rule, width: 2, dash: [6, 6] }),
      txt('ell = 0 (k_3 = 0)', mapX(0), pyBot + 36, 26, COSMOS.gold, 'mono'),

      glowingTrail(k3Pts, { color: COSMOS.cyan, width: 4.5, glow: 9 }),
      glowDot(mapX(ell0), mapY(k0), { radius: 8.5, color: COSMOS.emerald, glow: 13 }),
      glowDot(mapX(ell1), mapY(k1), { radius: 8.5, color: COSMOS.rose, glow: 13 }),
      txt('p=0.8', mapX(ell0) + 18, mapY(k0) - 42, 26, COSMOS.emerald, 'mono', 'left'),
      txt('p=0.2', mapX(ell1) - 24, mapY(k1) - 22, 26, COSMOS.rose, 'mono', 'right'),
    ];

    return group(...nodes);
  });

  const eqK3 = glowTex('k_3(\\ell) = e^{\\ell} - \\ell - 1 \\ge 0', {
    x: 470,
    y: 404,
    size: 32,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, title, live, eqK3);
  runPhase(s, c, phase, 14);

  c.on('group-token-ratios-b0', () =>
    s.play(sTok.to(1, { duration: remainDuration(c, 'group-token-ratios-b0', 0.45) })),
  );
  c.on('pa-group-token', () =>
    s.play(sTokVal.to(1, { duration: remainDuration(c, 'pa-group-token', 0.45) })),
  );
  c.on('group-token-ratios-b1', () =>
    s.play(sSeq.to(1, { duration: remainDuration(c, 'group-token-ratios-b1', 0.45) })),
  );
  c.on('pa-group-sequence', () =>
    s.play(sSeqVal.to(1, { duration: remainDuration(c, 'pa-group-sequence', 0.5) })),
  );
  c.on('group-token-ratios-b2', () =>
    s.play(sKl.to(1, { duration: remainDuration(c, 'group-token-ratios-b2', 0.45) })),
  );
  c.on('pa-group-kl', () =>
    s.play(sKlForm.to(1, { duration: remainDuration(c, 'pa-group-kl', 0.5) })),
  );
  c.on('group-token-ratios-b3', () =>
    s.play(sTrainer.to(1, { duration: remainDuration(c, 'group-token-ratios-b3', 0.55) })),
  );
}
