// Scene 12 (alpha-spending): "What can we spend before the final look?"
// O'Brien-Fleming cumulative alpha-spending curve (0.5 -> ~0.56%, 1.0 -> 5.0%) + side-by-side 1-look (1.96) vs 6-look (2.045) final z = 2.00 prediction hold!
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  alphaSpend,
  aura,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function alphaSpendingScene(s, c) {
  const spendFrac = s.value(0.05);
  const showFunc = s.value(0);
  const showPlans = s.value(0);
  const showSix = s.value(0);
  const showStat = s.value(0);
  const showQ = s.value(0);
  const showOrd = s.value(0);
  const showSeq = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a32', '#261b4f20');
  const title = heroTitle(['Alpha Spending:', 'Budgeting Error Across Looks'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: CTRL_COLOR,
    eyebrow: 'O’BRIEN–FLEMING GROUP SEQUENTIAL DESIGN',
  });

  const eqSpend = glowTex('\\alpha(t) = 2\\bigl[1 - \\Phi(1.96 / \\sqrt{t})\\bigr]', {
    x: -410,
    y: 255,
    size: 32,
    color: CTRL_COLOR,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const plot = makePlot(-820, -230, 820, 390, { x: [0, 1], y: [0, 0.055] });
    const frac = spendFrac.value;
    const pts = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = (frac * i) / steps;
      pts.push(plot.pt([t, alphaSpend(t)]));
    }

    const nodes = [
      ...plot.axesNodes(0.85),
      txt('CUMULATIVE ALPHA SPENT vs INFO FRACTION t', -820, -265, 26, CTRL_COLOR, 'mono', 'left'),
      glowingTrail(pts, {
        gradientColors: [CTRL_COLOR, TRT_COLOR, WARN_COLOR],
        width: 4.5,
        glow: 10,
      }),
      line(plot.pt([0, 0.05]), plot.pt([1, 0.05]), {
        stroke: WARN_COLOR,
        width: 2.5,
        dash: [8, 6],
      }),
      txt('5.0%', plot.left - 12, plot.yPx(0.05), 26, WARN_COLOR, 'mono', 'right'),
      txt('0', plot.xPx(0), plot.bottom + 36, 26, COSMOS.muted, 'mono'),
      txt('0.5', plot.xPx(0.5), plot.bottom + 36, 26, CTRL_COLOR, 'mono'),
      txt('1.0 (full)', plot.xPx(1.0) - 20, plot.bottom + 36, 26, WARN_COLOR, 'mono'),
    ];

    if (frac >= 0.48) {
      const pHalf = plot.pt([0.5, alphaSpend(0.5)]);
      nodes.push(
        glowDot(pHalf[0], pHalf[1], { radius: 8.5, color: CTRL_COLOR, glow: 10 }),
        txt('t=0.5 → 0.56%', pHalf[0] - 28, pHalf[1] - 44, 26, CTRL_COLOR, 'mono', 'right'),
      );
    }
    if (frac >= 0.98) {
      const pFull = plot.pt([1.0, alphaSpend(1.0)]);
      nodes.push(
        glowDot(pFull[0], pFull[1], { radius: 9, color: WARN_COLOR, glow: 12 }),
        txt('t=1.0 → 5.0%', pFull[0] - 10, pFull[1] - 30, 26, WARN_COLOR, 'mono', 'right'),
      );
    }

    // Right panel: Final-look z comparison (1.96 vs 2.045 against observed z = 2.00)
    const rxL = 115;
    const rxR = 825;
    const xZ = (z) => rxL + ((z - 1.7) / 0.55) * (rxR - rxL);
    const y1 = -95;
    const y6 = 75;

    nodes.push(
      txt(
        'FINAL LOOK BOUNDARIES (OBSERVED z = 2.00)',
        rxL,
        -230,
        26,
        WARN_COLOR,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showPlans.value),
      // Plan A: 1-look (cutoff 1.96)
      txt('1-Look Plan (cutoff 1.96)', rxL, y1 - 58, 26, CTRL_COLOR, 'mono', 'left').opacity(
        0.45 + 0.55 * showPlans.value,
      ),
      rule(rxL, y1, rxR, y1, COSMOS.rule, 3).opacity(0.45 + 0.55 * showPlans.value),
      line([xZ(1.96), y1 - 30], [xZ(1.96), y1 + 30], { stroke: WARN_COLOR, width: 4 }).opacity(
        0.45 + 0.55 * showPlans.value,
      ),
      txt('1.96', xZ(1.96), y1 + 58, 26, WARN_COLOR, 'mono').opacity(0.45 + 0.55 * showPlans.value),

      // Plan B: 6-look OBF (cutoff 2.045)
      txt('6-Look Plan (cutoff 2.045)', rxL, y6 - 58, 26, TRT_COLOR, 'mono', 'left').opacity(
        0.4 + 0.6 * showSix.value,
      ),
      rule(rxL, y6, rxR, y6, COSMOS.rule, 3).opacity(0.4 + 0.6 * showSix.value),
      line([xZ(2.045), y6 - 30], [xZ(2.045), y6 + 30], { stroke: WARN_COLOR, width: 4 }).opacity(
        0.4 + 0.6 * showSix.value,
      ),
      txt('2.045', xZ(2.045), y6 + 58, 26, WARN_COLOR, 'mono').opacity(0.4 + 0.6 * showSix.value),
    );

    if (showStat.value > 0.02) {
      const z2x = xZ(2.0);
      nodes.push(
        glowDot(z2x, y1, {
          radius: 10,
          color: showOrd.value > 0.5 ? GOOD_COLOR : COSMOS.ink,
          glow: 12,
          opacity: showStat.value,
        }),
        glowDot(z2x, y6, {
          radius: 10,
          color: showSeq.value > 0.5 ? BAD_COLOR : COSMOS.ink,
          glow: 12,
          opacity: showStat.value,
        }),
        txt('z = 2.00', z2x, y1 - 92, 26, COSMOS.ink, 'mono').opacity(showStat.value),
      );
    }

    if (showOrd.value > 0.02) {
      nodes.push(
        lumBar(715, y1, 200, 44, {
          color: GOOD_COLOR,
          fillOpacity: 0.2,
          glow: 8,
          opacity: showOrd.value,
        }),
        txt('REJECTS', 715, y1, 26, GOOD_COLOR, 'mono').opacity(showOrd.value),
      );
    }
    if (showSeq.value > 0.02) {
      nodes.push(
        lumBar(715, y6, 200, 44, {
          color: BAD_COLOR,
          fillOpacity: 0.2,
          glow: 8,
          opacity: showSeq.value,
        }),
        txt('STAYS IN', 715, y6, 26, BAD_COLOR, 'mono').opacity(showSeq.value),
      );
    }

    // Strict prediction withholding along bottom
    const qOp = showQ.value * Math.max(0, 1 - showOrd.value * 2.6);
    if (qOp > 0.02) {
      nodes.push(
        txt(
          'Both teams finish with z = 2.00. Which plan rejects the null?',
          -855,
          355,
          32,
          WARN_COLOR,
          'serif',
          'left',
        )
          .glow(7, WARN_COLOR)
          .opacity(qOp),
      );
    }
    const ansOp = Math.max(0, (showOrd.value - 0.45) / 0.55);
    if (ansOp > 0.02) {
      nodes.push(
        txt(
          'ONLY the 1-look plan rejects (2.00 > 1.96). The 6-look plan falls short (2.00 < 2.045)!',
          -855,
          355,
          28,
          GOOD_COLOR,
          'mono',
          'left',
        )
          .glow(6, GOOD_COLOR)
          .opacity(ansOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'half', spendFrac, 0.5, { duration: 0.75 });
  tweenCue(s, c, 'full', spendFrac, 1.0, { duration: 0.75 });
  c.show('function', eqSpend);
  tweenCue(s, c, 'function', showFunc, 1, { duration: 0.45 });
  tweenCue(s, c, 'two-plans', showPlans, 1, { duration: 0.45 });
  tweenCue(s, c, 'six', showSix, 1, { duration: 0.45 });
  tweenCue(s, c, 'statistic', showStat, 1, { duration: 0.45 });
  tweenCue(s, c, 'question', showQ, 1, { duration: 0.45 });
  tweenCue(s, c, 'ordinary', showOrd, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'sequential', showSeq, 1, { duration: 0.45, after: true });
}
