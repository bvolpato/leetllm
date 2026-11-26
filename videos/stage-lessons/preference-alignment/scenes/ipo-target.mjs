// Scene 29: A finite margin target changes the gradient direction (IPO (m - 5)^2 vs DPO + 3D bowl + bounded KL <= ln 2)
import {
  COSMOS,
  aura,
  buildIpoDpoSurface3d,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  ipoLoss,
  line,
  orbitScene,
  prefLerp,
  prefLoss,
  remainDuration,
  runPhase,
  sampleCurve,
  txt,
} from '../parts.mjs';

export default function ipoTarget(s, c) {
  const phase = s.value(0);
  const sDef = s.value(0);
  const sOver = s.value(0);
  const sReturn = s.value(0);
  const sBound = s.value(0);
  const sKl = s.value(0);

  const bgAura = aura(430, 20, 560, '#14385c28', '#2e1a4a18');
  const ipo3d = buildIpoDpoSurface3d(phase, { x: 465, y: -50, unit: 80 });

  const title = heroTitle(['A Finite Margin Target', 'Changes Gradient Direction'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'IDENTITY PREFERENCE OPTIMIZATION (IPO) · TARGET 1/(2 tau) = 5 & BOUNDED KL',
  });

  // 2D plot on left half: m in [0, 10], L in [0, 30]
  const px0 = -815;
  const px1 = -55;
  const pyBot = 178;
  const pyTop = -175;
  const mapX = (m) => px0 + (m / 10) * (px1 - px0);
  const mapY = (l) => pyBot - (Math.min(30, l) / 30) * (pyBot - pyTop);

  const ipoPts = sampleCurve((m) => ipoLoss(m, 0.1), [0, 10], [0, 30], px0, px1, pyBot, pyTop, 80);
  // Scale DPO -ln sigma(m) x12 visually for clear contrast (or plot true value + note)
  const dpoPts = sampleCurve((m) => prefLoss(m) * 12, [0, 10], [0, 30], px0, px1, pyBot, pyTop, 80);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ov = sOver.value;
    const rt = sReturn.value;
    const kl = sKl.value;

    // Active margin m: starts at 0 -> jumps to overshoot 7.5 -> returns to 5.0
    const m = rt > 0.02 ? prefLerp(7.5, 5.0, rt) : ov > 0.02 ? prefLerp(0.0, 7.5, ov) : 0.0;
    const lVal = ipoLoss(m, 0.1);
    const deriv = 2 * (m - 5);

    const nodes = [
      // Left 2D IPO vs DPO curve plot
      txt(
        'IPO QUADRATIC (tau=0.1, TARGET=5) vs DPO LOGISTIC',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      line([px0, pyBot], [px1, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([px0, pyBot], [px0, pyTop], { stroke: COSMOS.rule, width: 2.2 }),
      line([mapX(5), pyBot], [mapX(5), pyTop], { stroke: COSMOS.gold, width: 2.6, dash: [7, 5] }),
      txt('m=0', mapX(0), pyBot + 36, 26, COSMOS.muted, 'mono'),
      txt('TARGET 5', mapX(5), pyBot + 36, 26, COSMOS.gold, 'mono'),
      txt('m=10', mapX(10), pyBot + 36, 26, COSMOS.muted, 'mono'),
      txt('25', px0 + 18, mapY(25) - 6, 26, COSMOS.cyan, 'mono', 'left'),

      glowingTrail(ipoPts, { color: COSMOS.cyan, width: 4.8, glow: 10 }),
      glowingTrail(dpoPts, {
        color: COSMOS.amber,
        width: 3.4,
        opacity: 0.72,
        glow: 6,
        core: false,
      }),

      // Active sliding bead on IPO parabola
      glowDot(mapX(m), mapY(lVal), { radius: 10, color: COSMOS.emerald, glow: 15 }),
      txt(
        `m=${m.toFixed(1)}  ·  L=${lVal.toFixed(1)}  ·  dL/dm=${deriv >= 0 ? '+' : ''}${deriv.toFixed(1)}`,
        -855,
        -254,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // Bottom left table / bounded KL note
      glassCell(-435, 320, 820, 152, kl > 0.2 ? COSMOS.gold : COSMOS.cyan, {
        fill: '#12182b',
        glow: kl > 0.2 ? 9 * pulse : 4,
      }),
      txt(
        kl > 0.2 || sBound.value > 0.2
          ? 'm=[0, 5, 10] -> IPO [25, 0, 25] | DPO drops'
          : 'm < 5 pushed UP; m > 5 pushed DOWN to 5',
        -435,
        288,
        26,
        COSMOS.gold,
        'mono',
      ),
      txt(
        kl > 0.2
          ? '2-answer ref: m -> inf has forward KL <= ln 2 (0.693)'
          : 'TRL IPO averages tokens (declare convention)',
        -435,
        348,
        26,
        COSMOS.ink,
        'sans',
      ),

      // Right 3D header
      txt('3D IPO PARABOLIC TARGET VALLEY', 465, -365, 26, COSMOS.cyan, 'mono'),
      txt('Quadratic walls pull overshoots back to 1/(2 tau)', 465, 410, 26, COSMOS.muted, 'sans'),
    ];

    return group(...nodes);
  });

  const eqIpo = glowTex(
    '\\mathcal{L}_{\\text{IPO}} = \\left(m - \\frac{1}{2\\tau}\\right)^2, \\qquad \\frac{\\partial L}{\\partial m} = 2(m - 5)',
    {
      x: 465,
      y: 332,
      size: 30,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, ipo3d, title, live, eqIpo);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ipo3d, { theta: -0.22, phi: 0.92 });

  c.on('ipo-target-b0', () =>
    s.play(sDef.to(1, { duration: remainDuration(c, 'ipo-target-b0', 0.45) })),
  );
  c.on('ipo-target-b1', () =>
    s.play(sOver.to(1, { duration: remainDuration(c, 'ipo-target-b1', 0.65) })),
  );
  c.on('pa-ipo-return', () =>
    s.play(sReturn.to(1, { duration: remainDuration(c, 'pa-ipo-return', 0.8) })),
  );
  c.on('ipo-target-b2', () =>
    s.play(sBound.to(1, { duration: remainDuration(c, 'ipo-target-b2', 0.45) })),
  );
  c.on('pa-ipo-kl', () => s.play(sKl.to(1, { duration: remainDuration(c, 'pa-ipo-kl', 0.5) })));
}
