// Scene 14 (cuped-adjustment): "Subtract predictable variation without conditioning on treatment"
// Incident 1 dot sliding from 1.000 -> 0.747 + orbiting 3D bivariate density ridge + toy variance 9 -> 6.75 (25% drop) + 20,000-unit sim (rho=0.470, 22.1% drop, margin 1.36 -> 1.20 pp)!
import { line } from 'vizmatic/stage';
import {
  AB_VISUAL_FIXTURES,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  buildCupedCloud3d,
  cupedVariance,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

const C = AB_VISUAL_FIXTURES.cuped;
const TOY_RES = cupedVariance(9, 4, 3); // 6.75

export default function cupedAdjustment(s, c) {
  const adjustAmt = s.value(0);
  const showToy = s.value(0);
  const showSim = s.value(0);
  const showMargins = s.value(0);

  const bgAura = aura(445, 20, 540, '#133a4a36', '#133a3d20');
  const { view: cloud3d } = buildCupedCloud3d({ x: 445, y: 15 });

  const title = heroTitle(['CUPED Variance Reduction:', 'Subtract Pre-Experiment Noise'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: GOOD_COLOR,
    eyebrow: 'CONTROLLED-EXPERIMENT USING PRE-EXPERIMENT DATA',
  });

  const eqCuped = glowTex(
    'Y_{\\text{adj}} = Y - \\theta(X - \\bar X), \\quad \\theta^* = \\frac{\\operatorname{Cov}(Y,X)}{\\operatorname{Var}(X)}',
    { x: -440, y: 245, size: 30, color: WARN_COLOR, glow: 7 },
  );

  const live = guardedDynamic(s.value(1), () => {
    const adj = adjustAmt.value;
    const axL = -820;
    const axR = -40;
    const xS = (val) => axL + ((val + 0.4) / 1.8) * (axR - axL);
    const yRow = -120;
    const firstVal = 1.0 + (C.sampleRows[0].adjusted - 1.0) * adj;

    const nodes = [
      txt(
        'INCIDENT #1: RAW OUTCOME Y = 1  →  ADJUSTED Y_adj = 0.747',
        -855,
        -245,
        26,
        CTRL_COLOR,
        'mono',
        'left',
      ),
      rule(axL, yRow, axR, yRow, COSMOS.muted, 2.5),
      ...[-0.25, 0, 0.5, 0.75, 1.0, 1.25].map((v) =>
        txt(v.toFixed(2), xS(v), yRow + 38, 26, COSMOS.muted, 'mono'),
      ),
      // 12 sample dots sliding smoothly from Y to Y_adj
      ...C.sampleRows.slice(0, 12).map((r, i) => {
        const cur = r.y + (r.adjusted - r.y) * adj;
        const jitterY = ((i % 3) - 1) * 20;
        const col = r.arm ? TRT_COLOR : CTRL_COLOR;
        return glowDot(xS(cur), yRow - 48 + jitterY, {
          radius: i === 0 ? 10 : 6.5,
          color: i === 0 ? WARN_COLOR : col,
          glow: i === 0 ? 14 : 7,
        });
      }),
      txt(`Inc #1 = ${firstVal.toFixed(3)}`, xS(firstVal), yRow - 92, 26, WARN_COLOR, 'mono'),

      // Toy numerical example & 20,000-unit simulation margins
      txt(
        `Toy check: Var(Y)=9, Var(X)=4, Cov=3 → θ = 0.75 → Var = ${TOY_RES.toFixed(2)} (−25%)`,
        -855,
        -15,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(0.4 + 0.6 * showToy.value),

      txt(
        `20k sim (ρ = ${C.correlation.toFixed(3)}):  variance cut ${(C.varianceReduction * 100).toFixed(1)}%`,
        -855,
        45,
        28,
        GOOD_COLOR,
        'mono',
        'left',
      )
        .glow(6, GOOD_COLOR)
        .opacity(0.35 + 0.65 * showSim.value),

      txt('3D (X, Y) COVARIANCE DOME', 445, -395, 26, CTRL_COLOR, 'mono').glow(6, CTRL_COLOR),
      txt('Subtracting θ(X − X̄) shrinks spread by (1 − ρ²)', 445, 430, 26, WARN_COLOR, 'sans'),
    ];

    // Margin contraction visual bars (Raw ±1.36 pp vs CUPED ±1.20 pp)
    if (showMargins.value > 0.02) {
      const mx = -430;
      const rawHalf = 220;
      const adjHalf = (C.adjustedSe / C.rawSe) * rawHalf;
      nodes.push(
        txt('Raw lift +4.68 ± 1.36 pp', -855, 118, 26, CTRL_COLOR, 'mono', 'left').opacity(
          showMargins.value,
        ),
        line([mx - rawHalf + 180, 118], [mx + rawHalf + 180, 118], {
          stroke: CTRL_COLOR,
          width: 7,
        }).opacity(showMargins.value),

        txt('CUPED +4.39 ± 1.20 pp', -855, 168, 26, GOOD_COLOR, 'mono', 'left').opacity(
          showMargins.value,
        ),
        line([mx - adjHalf + 180, 168], [mx + adjHalf + 180, 168], {
          stroke: GOOD_COLOR,
          width: 7,
        })
          .glow(8, GOOD_COLOR)
          .opacity(showMargins.value),
      );
    }

    nodes.push(
      txt(
        'NEVER adjust for post-assignment variables (like live latency): only frozen pre-experiment X!',
        -855,
        355,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return nodes;
  });

  s.add(bgAura, cloud3d, title, live);
  orbitScene(s, c, cloud3d, { theta: 0.48, phi: 0.96 });

  tweenCue(s, c, 'incident', adjustAmt, 0.08, { duration: 0.35 });
  tweenCue(s, c, 'common', adjustAmt, 0.35, { duration: 0.35 });
  tweenCue(s, c, 'adjusted', adjustAmt, 1, { duration: 0.65 });
  c.show('theta', eqCuped);
  tweenCue(s, c, 'example', showToy, 0.7, { duration: 0.4 });
  tweenCue(s, c, 'variance', showToy, 1, { duration: 0.4 });
  tweenCue(s, c, 'simulation', showSim, 0.7, { duration: 0.4 });
  tweenCue(s, c, 'reduction', showSim, 1, { duration: 0.4 });
  tweenCue(s, c, 'raw-lift', showMargins, 0.5, { duration: 0.35 });
  tweenCue(s, c, 'lab', showMargins, 0.85, { duration: 0.35 });
  tweenCue(s, c, 'margins', showMargins, 1, { duration: 0.45 });
}
