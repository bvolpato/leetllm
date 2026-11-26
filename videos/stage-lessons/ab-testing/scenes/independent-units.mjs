// Scene 07 (independent-units): "A duplicated outcome cannot supply new precision"
// 1 incident copied into 4 message rows -> rates unchanged (38%, 42%), SE falsely halves (1.55 -> 0.77 pp), CI falsely shrinks [1.0, 7.0] -> [2.5, 5.5] -> aggregate once per incident!
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  WARN_COLOR,
  aura,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lift,
  liftInterval,
  lumBar,
  rule,
  runAmbientPhase,
  seLift,
  tweenCue,
  txt,
} from '../parts.mjs';

const FALSE_SE = seLift / 2;
const FALSE_LO = lift - 1.96 * FALSE_SE;
const FALSE_HI = lift + 1.96 * FALSE_SE;

export default function independentUnits(s, c) {
  const phase = s.value(0);
  const dupAmt = s.value(0);
  const showFalseSe = s.value(0);
  const showAgg = s.value(0);
  const showFormula = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a183b28', '#133a4a24');
  const title = heroTitle(['The Analysis-Unit Trap:', 'Copying Rows Fakes Precision'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: BAD_COLOR,
    eyebrow: 'RANDOMIZATION UNIT = ANALYSIS UNIT',
  });

  const eqForm = glowTex(
    '\\text{SE} = \\sqrt{\\frac{\\hat p_c(1-\\hat p_c)}{n_c} + \\frac{\\hat p_t(1-\\hat p_t)}{n_t}}, \\quad \\text{margin} = 1.96\\,\\text{SE}',
    { x: 0, y: 315, size: 34, color: COSMOS.cyan, glow: 7 },
  );

  const live = guardedDynamic(s.value(1), () => {
    const d = dupAmt.value;
    const isAgg = showAgg.value > 0.5;
    const nodes = [
      txt(
        '1 RANDOMIZED INCIDENT  →  4 MESSAGE ROWS (SAME OUTCOME)',
        -855,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      lumBar(-680, -130, 320, 108, { color: GOOD_COLOR, fillOpacity: 0.22, glow: 8 }),
      txt('inc-14 (1 unit)', -680, -152, 26, GOOD_COLOR, 'mono'),
      txt('resolved = 1', -680, -108, 26, COSMOS.ink, 'mono'),
    ];

    // Four duplicated message rows fanning out
    [0, 1, 2, 3].forEach((k) => {
      const rx = -240 + k * 295;
      nodes.push(
        lumBar(rx, -130, 255, 86, {
          color: isAgg ? COSMOS.dim : BAD_COLOR,
          fillOpacity: isAgg ? 0.08 : 0.16,
          dash: isAgg ? [7, 5] : undefined,
          glow: isAgg ? 2 : 7,
          opacity: (0.3 + 0.7 * d) * (isAgg ? 0.45 : 1),
        }),
        txt(`msg #${k + 1} (=1)`, rx, -130, 26, isAgg ? COSMOS.muted : BAD_COLOR, 'mono').opacity(
          0.3 + 0.7 * d,
        ),
      );
    });

    // Side-by-side confidence interval comparison (TRUE vs FALSE 4x)
    const axL = -760;
    const axR = 760;
    const xP = (pp) => axL + (pp / 8) * (axR - axL);
    const yTrue = 35;
    const yFalse = 140;

    nodes.push(
      txt(
        'TRUE INCIDENT-LEVEL (n = 2,000/arm):  SE = 1.55 pp',
        -855,
        yTrue - 46,
        26,
        GOOD_COLOR,
        'mono',
        'left',
      ),
      rule(axL, yTrue, axR, yTrue, COSMOS.rule, 2),
      line([xP(liftInterval[0] * 100), yTrue], [xP(liftInterval[1] * 100), yTrue], {
        stroke: GOOD_COLOR,
        width: 8,
      }).glow(8, GOOD_COLOR),
      glowDot(xP(lift * 100), yTrue, { radius: 10, color: GOOD_COLOR, glow: 10 }),
      txt(
        `[+${(liftInterval[0] * 100).toFixed(1)}, +${(liftInterval[1] * 100).toFixed(1)}] pp`,
        xP(liftInterval[1] * 100) + 22,
        yTrue,
        26,
        GOOD_COLOR,
        'mono',
        'left',
      ),

      txt(
        '4× DUPLICATED ROWS (fake n = 8,000/arm):  SE = 0.77 pp (÷√4 = ÷2!)',
        -855,
        yFalse - 46,
        26,
        BAD_COLOR,
        'mono',
        'left',
      ).opacity(0.4 + 0.6 * showFalseSe.value),
      rule(axL, yFalse, axR, yFalse, COSMOS.rule, 2).opacity(0.4 + 0.6 * showFalseSe.value),
      line([xP(FALSE_LO * 100), yFalse], [xP(FALSE_HI * 100), yFalse], {
        stroke: BAD_COLOR,
        width: 8,
        dash: isAgg ? [8, 6] : undefined,
      })
        .glow(8, BAD_COLOR)
        .opacity(0.4 + 0.6 * showFalseSe.value),
      glowDot(xP(lift * 100), yFalse, {
        radius: 10,
        color: BAD_COLOR,
        glow: 10,
        opacity: 0.4 + 0.6 * showFalseSe.value,
      }),
      txt(
        `[+${(FALSE_LO * 100).toFixed(1)}, +${(FALSE_HI * 100).toFixed(1)}] pp (FALSE!)`,
        xP(FALSE_HI * 100) + 22,
        yFalse,
        26,
        BAD_COLOR,
        'mono',
        'left',
      ).opacity(0.4 + 0.6 * showFalseSe.value),
    );

    if (showAgg.value > 0.02) {
      nodes.push(
        txt(
          'Aggregate strictly to ONE row per randomized incident before computing SE',
          -855,
          225,
          28,
          WARN_COLOR,
          'mono',
          'left',
        )
          .glow(6, WARN_COLOR)
          .opacity(showAgg.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'duplicate', dupAmt, 1, { duration: 0.6 });
  tweenCue(s, c, 'false-se', showFalseSe, 1, { duration: 0.5 });
  tweenCue(s, c, 'aggregate', showAgg, 1, { duration: 0.45 });
  c.show('formula', eqForm);
  tweenCue(s, c, 'formula', showFormula, 1, { duration: 0.45 });
}
