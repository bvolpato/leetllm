// Scene 17: Do equal KL values give the same gradient? (Schulman k3 estimator: live weights vs fixed weights)
import {
  COSMOS,
  KL_BASE,
  KL_SHIFT,
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
  txt,
} from '../parts.mjs';

export default function klValueGradient(s, c) {
  const phase = s.value(0);
  const sTerms = s.value(0);
  const sWeights = s.value(0);
  const sShift = s.value(0);
  const sCheaper = s.value(0);
  const sReset = s.value(0);
  const sSlopes = s.value(0);
  const sLive = s.value(0);
  const sFixed = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#331d5214');
  const title = heroTitle(['Do Equal KL Values Give', 'the Same Gradient?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'KL PENALTY · LIVE SAMPLING WEIGHTS vs FROZEN WEIGHTS',
  });

  // Compute exact KL(theta) curve for live vs fixed-at-0.80 around theta0 = ln(4)
  const theta0 = Math.log(4);
  const livePts = [];
  const fixedPts = [];
  const px0 = -760;
  const px1 = -60;
  const pyBot = 240;
  const pyTop = -130;
  const mapX = (th) => px0 + ((th - 0.6) / 1.4) * (px1 - px0);
  const mapY = (kl) => pyBot - (kl / 0.5) * (pyBot - pyTop);

  for (let i = 0; i <= 40; i++) {
    const th = 0.6 + (1.4 * i) / 40;
    const p0 = 1 / (1 + Math.exp(-th));
    const p1 = 1 - p0;
    const ell0 = Math.log(0.5 / p0);
    const ell1 = Math.log(0.5 / p1);
    const k0 = Math.exp(ell0) - ell0 - 1;
    const k1 = Math.exp(ell1) - ell1 - 1;
    const fullVal = p0 * k0 + p1 * k1;
    const fixVal = 0.8 * k0 + 0.2 * k1;
    livePts.push([mapX(th), mapY(fullVal)]);
    fixedPts.push([mapX(th), mapY(fixVal)]);
  }

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const st = Math.max(0.65, sTerms.value);
    const sw = sWeights.value;
    const sh = sShift.value;
    const ch = sCheaper.value;
    const rs = sReset.value;
    const sl = sSlopes.value;
    const lv = sLive.value;
    const fx = sFixed.value;

    const activeTheta = theta0 + 0.2 * sh * (1 - rs);
    const p0 = 1 / (1 + Math.exp(-activeTheta));
    const p1 = 1 - p0;
    const ell0 = Math.log(0.5 / p0);
    const ell1 = Math.log(0.5 / p1);
    const k0 = Math.exp(ell0) - ell0 - 1;
    const k1 = Math.exp(ell1) - ell1 - 1;
    const fullNow = p0 * k0 + p1 * k1;
    const fixNow = 0.8 * k0 + 0.2 * k1;

    const nodes = [
      // Left plot: Live full KL (cyan) vs Frozen-weight surrogate (rose)
      line([px0, pyBot], [px1 + 24, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([px0, pyBot], [px0, pyTop - 24], { stroke: COSMOS.rule, width: 2.2 }),
      txt('KL ESTIMATE', px0, pyTop - 52, 26, COSMOS.muted, 'mono', 'left'),
      txt('LOGIT theta', (px0 + px1) * 0.5, pyBot + 52, 26, COSMOS.muted, 'mono'),

      glowingTrail(livePts, { color: COSMOS.cyan, width: 4.4, opacity: st }),
      glowingTrail(fixedPts, { color: COSMOS.rose, width: 4.4, opacity: Math.max(0.65, sw) }),

      // Active point markers
      glowDot(mapX(activeTheta), mapY(fullNow), { radius: 8, color: COSMOS.cyan }),
      glowDot(mapX(activeTheta), mapY(fixNow), { radius: 8, color: COSMOS.rose }),

      // Right column: Live vs Fixed comparison
      glassCell(430, -108, 760, 146, COSMOS.cyan, {
        fill: '#102138',
        glow: lv > 0.3 ? 10 * pulse : 5,
      }),
      txt('UPPER: LIVE WEIGHTS (FULL KL)', 430, -144, 26, COSMOS.cyan, 'mono'),
      txt(
        lv > 0.3
          ? `KL = ${KL_BASE.full.toFixed(3)}   ·   slope = ${KL_BASE.fullGradient.toFixed(3)}`
          : `p = [${(p0 * 100).toFixed(0)}%, ${(p1 * 100).toFixed(0)}%]  ->  sum = ${fullNow.toFixed(3)}`,
        430,
        -86,
        30,
        COSMOS.cyan,
        'mono',
      ),

      glassCell(430, 74, 760, 146, COSMOS.rose, {
        fill: '#28111a',
        glow: fx > 0.3 ? 10 * pulse : 5,
      }),
      txt('LOWER: FROZEN WEIGHTS [80%, 20%]', 430, 38, 26, COSMOS.rose, 'mono'),
      txt(
        fx > 0.3
          ? `KL = ${KL_BASE.full.toFixed(3)}   ·   slope = ${KL_BASE.fixedGradient.toFixed(3)}`
          : `fixed [80%, 20%]  ->  sum = ${fixNow.toFixed(3)}`,
        430,
        96,
        30,
        COSMOS.rose,
        'mono',
      ),

      txt(
        sl > 0.3
          ? 'Equal value at theta_0 (0.193), DIFFERENT slopes (0.222 vs 0.300)!'
          : ch > 0.3
            ? 'Live copy shifts weight toward cheaper token -> rises LESS!'
            : 'ref = [50%, 50%] · cur = [80%, 20%] · raise logit by +0.2: do they agree?',
        0,
        348,
        28,
        sl > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  const eqKl = glowTex(
    'k_3(\\ell) = e^{\\ell} - \\ell - 1 \\ge 0,\\quad \\ell = \\ln\\frac{\\pi_{\\text{ref}}}{\\pi_\\theta}',
    {
      x: 430,
      y: 235,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqKl);
  runPhase(s, c, phase, 14);

  c.on('kl-input', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('kl-terms', () => s.play(sTerms.to(1, { duration: 0.45 })));
  c.on('kl-weights', () => s.play(sWeights.to(1, { duration: 0.45 })));
  c.after('kl-shift', () => s.play(sShift.to(1, { duration: 0.55 })));
  c.on('kl-cheaper', () => s.play(sCheaper.to(1, { duration: 0.45 })));
  c.on('kl-reset', () => s.play(sReset.to(1, { duration: 0.45 })));
  c.on('kl-slopes', () => s.play(sSlopes.to(1, { duration: 0.45 })));
  c.on('kl-live-value', () => s.play(sLive.to(1, { duration: 0.45 })));
  c.on('kl-fixed-value', () =>
    s.play(sFixed.to(1, { duration: remainDuration(c, 'kl-fixed-value', 0.45) })),
  );
}
