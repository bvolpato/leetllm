// Scene 06 (lift): "Read the rate difference in the right units"
// 760/2000 (38%) vs 840/2000 (42%) -> +4.0 pp absolute vs +10.5% relative -> SE = 1.55 pp -> 95% CI [+1.0, +7.0] pp!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lift,
  liftInterval,
  lumBar,
  rate,
  report,
  rule,
  runAmbientPhase,
  seLift,
  tweenCue,
  txt,
} from '../parts.mjs';

const PC = rate(report.control); // 0.38
const PT = rate(report.treatment); // 0.42
const REL = lift / PC; // 0.10526

export default function liftScene(s, c) {
  const phase = s.value(0);
  const showCtrl = s.value(0);
  const showTrt = s.value(0);
  const showAbs = s.value(0);
  const showRel = s.value(0);
  const showSe = s.value(0);
  const showCi = s.value(0);

  const bgAura = aura(0, 20, 640, '#133a4a36', '#133a3d20');
  const title = heroTitle(['Absolute vs Relative Lift', '& 95% Confidence Interval'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: GOOD_COLOR,
    eyebrow: 'TWO-PROPORTION ESTIMATOR',
  });

  const eqSe = glowTex(
    `\\text{SE} = \\sqrt{\\frac{0.38(0.62)}{2000} + \\frac{0.42(0.58)}{2000}} = ${(seLift * 100).toFixed(2)}\\text{ pp}`,
    { x: 430, y: 120, size: 32, color: WARN_COLOR, glow: 7 },
  );

  const live = guardedDynamic(s.value(1), () => {
    const bwMax = 430;
    const cW = PC * bwMax * (0.35 + 0.65 * showCtrl.value);
    const tW = PT * bwMax * (0.35 + 0.65 * showTrt.value);

    const nodes = [
      txt(
        'MATURED RESOLUTION RATES (2,000 INCIDENTS PER ARM)',
        -855,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('Control (raw):', -855, -160, 28, CTRL_COLOR, 'mono', 'left'),
      lumBar(-575 + cW / 2, -160, cW, 44, { color: CTRL_COLOR, fillOpacity: 0.72, glow: 8 }),
      txt(
        `${report.control.resolved} / ${report.control.n}  =  ${(PC * 100).toFixed(1)}%`,
        -555 + cW,
        -160,
        28,
        CTRL_COLOR,
        'mono',
        'left',
      ),

      txt('Treatment:', -855, -88, 28, TRT_COLOR, 'mono', 'left'),
      lumBar(-575 + tW / 2, -88, tW, 44, { color: TRT_COLOR, fillOpacity: 0.72, glow: 8 }),
      txt(
        `${report.treatment.resolved} / ${report.treatment.n}  =  ${(PT * 100).toFixed(1)}%`,
        -555 + tW,
        -88,
        28,
        TRT_COLOR,
        'mono',
        'left',
      ),

      // Side-by-side absolute vs relative readout
      lumBar(-455, 55, 760, 124, {
        color: GOOD_COLOR,
        fillOpacity: 0.16,
        glow: 8,
        opacity: 0.45 + 0.55 * showAbs.value,
      }),
      txt('ABSOLUTE LIFT (pp)', -805, 22, 26, GOOD_COLOR, 'mono', 'left').opacity(
        0.45 + 0.55 * showAbs.value,
      ),
      txt(
        `42.0% − 38.0% = +${(lift * 100).toFixed(1)} pp`,
        -805,
        76,
        36,
        GOOD_COLOR,
        'mono',
        'left',
      )
        .glow(8, GOOD_COLOR)
        .opacity(0.45 + 0.55 * showAbs.value),

      lumBar(495, -130, 680, 124, {
        color: COSMOS.cyan,
        fillOpacity: 0.14,
        glow: 7,
        opacity: 0.4 + 0.6 * showRel.value,
      }),
      txt('RELATIVE LIFT (%)', 180, -162, 26, COSMOS.cyan, 'mono', 'left').opacity(
        0.4 + 0.6 * showRel.value,
      ),
      txt(`+4.0 / 38.0 = +${(REL * 100).toFixed(1)}%`, 180, -108, 36, COSMOS.cyan, 'mono', 'left')
        .glow(7, COSMOS.cyan)
        .opacity(0.4 + 0.6 * showRel.value),
    ];

    // Bottom percentage-point confidence interval ruler [-1 .. +9 pp]
    const axL = -760;
    const axR = 760;
    const axY = 295;
    const xP = (pp) => axL + ((pp + 1) / 10) * (axR - axL);
    const estX = xP(lift * 100);
    const loX = xP(lift * 100 - (lift - liftInterval[0]) * 100 * showCi.value);
    const hiX = xP(lift * 100 + (liftInterval[1] - lift) * 100 * showCi.value);

    nodes.push(
      txt(
        '95% CONFIDENCE INTERVAL ON LIFT (PERCENTAGE POINTS)',
        -855,
        210,
        26,
        WARN_COLOR,
        'mono',
        'left',
      ),
      rule(axL, axY, axR, axY, COSMOS.muted, 3),
      line([xP(0), axY - 45], [xP(0), axY + 20], { stroke: COSMOS.rose, width: 3, dash: [8, 6] }),
      ...[-1, 0, 1, 2, 4, 7, 9].map((v) =>
        txt(
          `${v > 0 ? '+' : ''}${v}`,
          xP(v),
          axY + 42,
          26,
          v === 0 ? COSMOS.rose : COSMOS.muted,
          'mono',
        ),
      ),
      line([loX, axY - 22], [hiX, axY - 22], { stroke: WARN_COLOR, width: 8 })
        .glow(9, WARN_COLOR)
        .opacity(0.35 + 0.65 * showCi.value),
      glowDot(estX, axY - 22, { radius: 11, color: GOOD_COLOR, glow: 12 }),
    );

    if (showCi.value > 0.3) {
      nodes.push(
        txt(
          `[+${(liftInterval[0] * 100).toFixed(1)}, +${(liftInterval[1] * 100).toFixed(1)}] pp  (entirely above 0)`,
          estX,
          axY - 64,
          28,
          WARN_COLOR,
          'mono',
        )
          .glow(6, WARN_COLOR)
          .opacity(showCi.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'control', showCtrl, 1, { duration: 0.45 });
  tweenCue(s, c, 'treatment', showTrt, 1, { duration: 0.45 });
  tweenCue(s, c, 'absolute', showAbs, 1, { duration: 0.45 });
  tweenCue(s, c, 'relative', showRel, 1, { duration: 0.45 });
  c.show('se', eqSe);
  tweenCue(s, c, 'se', showSe, 1, { duration: 0.45 });
  tweenCue(s, c, 'interval', showCi, 1, { duration: 0.7 });
}
