// Scene 08: What does PPO pay for this token? (3D PPO clip surface + ratio 1.0 -> 1.5 -> 0.5 + withheld products)
import {
  COSMOS,
  alignmentClipping,
  aura,
  buildPpoClipSurface3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function ppoClipping(s, c) {
  const phase = s.value(0);
  const sOld = s.value(0);
  const sUp = s.value(0);
  const sOffers = s.value(0);
  const sGood = s.value(0);
  const sBad = s.value(0);
  const sDown = s.value(0);
  const sLow = s.value(0);

  const bgAura = aura(420, 20, 560, '#14385c28', '#3c1b4a16');
  const clip3d = buildPpoClipSurface3d(phase, { x: 430, y: 15 });

  const title = heroTitle(['What Does PPO Pay', 'for This Token?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'PPO CLIPPED SURROGATE · RATIO TO PI_OLD & TRUST RAILS [0.8, 1.2]',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ol = Math.max(0.75, sOld.value);
    const up = sUp.value;
    const of = sOffers.value;
    const gd = sGood.value;
    const bd = sBad.value;
    const dn = sDown.value;
    const lw = sLow.value;

    // Current probability: 20% -> 30% (up) -> 10% (down)
    const curProb = 0.2 + 0.1 * up - 0.2 * dn;
    const ratio = curProb / 0.2;
    const pos = alignmentClipping(ratio, 1, 0.2);
    const neg = alignmentClipping(ratio, -1, 0.2);
    const inLowPhase = dn > 0.5;

    const nodes = [
      txt('3D PPO SURROGATE min(rho*A, clip(rho)*A)', 430, -370, 26, COSMOS.cyan, 'mono'),
      txt('Gold rails clamp incentive outside [0.8, 1.2]', 430, 405, 26, COSMOS.muted, 'sans'),

      // Top status bar: pi_old vs pi_theta
      glassCell(-455, -182, 790, 114, COSMOS.cyan, { fill: '#0f2138', glow: 6, opacity: ol }),
      txt(
        `pi_old=20% · pi_cur=${(curProb * 100).toFixed(0)}% · rho=${ratio.toFixed(2)}`,
        -455,
        -202,
        28,
        COSMOS.cyan,
        'mono',
      ),
      txt(
        `clip(rho) = ${pos.clippedRatio.toFixed(2)}  (pi_ref owns KL drift)`,
        -455,
        -152,
        26,
        COSMOS.muted,
        'mono',
      ),

      // Row 1: Advantage A = +1
      glassCell(-455, -22, 790, 156, COSMOS.emerald, {
        fill: '#0e2624',
        glow: gd > 0.3 && !inLowPhase ? 10 * pulse : 4,
      }),
      txt('GOOD TOKEN  (ADVANTAGE A = +1)', -820, -70, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        of > 0.2
          ? `raw = ${pos.raw >= 0 ? '+' : ''}${pos.raw.toFixed(2)}    clipped = ${pos.clipped >= 0 ? '+' : ''}${pos.clipped.toFixed(2)}`
          : 'Compare raw rho*A vs clipped rho*A',
        -820,
        -22,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        inLowPhase
          ? `min(+0.50, +0.80) = +0.50 (harmful drop)`
          : gd > 0.5
            ? `min(+1.50, +1.20) = +1.20 (capped)`
            : of > 0.2
              ? 'Keep smaller: +1.50 or +1.20? [ ? ]'
              : 'At rho = 1.0, both offers equal +1.00',
        -820,
        26,
        26,
        gd > 0.5 || inLowPhase ? COSMOS.gold : COSMOS.amber,
        'mono',
        'left',
      ),

      // Row 2: Advantage A = -1
      glassCell(-455, 162, 790, 156, COSMOS.rose, {
        fill: '#28101a',
        glow: (bd > 0.3 && !inLowPhase) || lw > 0.3 ? 10 * pulse : 4,
      }),
      txt('BAD TOKEN  (ADVANTAGE A = -1)', -820, 114, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        of > 0.2
          ? `raw = ${neg.raw.toFixed(2)}    clipped = ${neg.clipped.toFixed(2)}`
          : 'Opposite advantage flips clipping',
        -820,
        162,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        inLowPhase
          ? lw > 0.5
            ? `min(-0.50, -0.80) = -0.80 (capped)`
            : 'Keep smaller: -0.50 or -0.80? [ ? ]'
          : bd > 0.5
            ? `min(-1.50, -1.20) = -1.50 (full cost)`
            : 'Harmful move unclipped; safe move caps',
        -820,
        210,
        26,
        bd > 0.5 || lw > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    return group(...nodes);
  });

  const eqClip = glowTex(
    'L_t = \\min\\!\\big(\\rho_t \\hat{A}_t,\\; \\operatorname{clip}(\\rho_t, 0.8, 1.2) \\hat{A}_t\\big)',
    {
      x: -465,
      y: 344,
      size: 36,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, clip3d, title, live, eqClip);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, clip3d, { theta: -0.24, phi: 0.92 });

  c.on('clip-old', () => s.play(sOld.to(1, { duration: remainDuration(c, 'clip-old', 0.45) })));
  c.on('clip-up', () => s.play(sUp.to(1, { duration: remainDuration(c, 'clip-up', 0.85) })));
  c.on('clip-offers', () =>
    s.play(sOffers.to(1, { duration: remainDuration(c, 'clip-offers', 0.5) })),
  );
  c.after('clip-good', () =>
    s.play(sGood.to(1, { duration: remainAfterDuration(c, 'clip-good', 0.45) })),
  );
  c.after('clip-bad', () =>
    s.play(sBad.to(1, { duration: remainAfterDuration(c, 'clip-bad', 0.45) })),
  );
  c.on('clip-down', () => s.play(sDown.to(1, { duration: remainDuration(c, 'clip-down', 0.9) })));
  c.after('clip-low', () =>
    s.play(sLow.to(1, { duration: remainAfterDuration(c, 'clip-low', 0.45) })),
  );
}
