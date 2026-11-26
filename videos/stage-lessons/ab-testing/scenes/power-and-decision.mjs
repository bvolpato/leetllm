// Scene 09 (power-and-decision): "Detection probability and launch probability differ"
// Sampling bell centered at true +2.0 pp vs detection cutoff (±1.4 pp) giving 80% detection power vs launch threshold at +2.0 pp (only 50% cross!) + 9,246 vs 9,336.
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  makePlot,
  normalPdf,
  planningPower,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const P9246 = planningPower(9246);
const P9336 = planningPower(9336);

export default function powerAndDecision(s, c) {
  const phase = s.value(0);
  const showScale = s.value(0);
  const showShort = s.value(0);
  const showFuller = s.value(0);
  const showExact = s.value(0);
  const showLaunch = s.value(0);
  const showDiff = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a34', '#261b4f20');
  const title = heroTitle(['Detection Power vs', 'Launch Threshold Probability'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: TRT_COLOR,
    eyebrow: 'MDE, TYPE II ERROR & SHIP BAR',
  });

  const live = guardedDynamic(s.value(1), () => {
    const plot = makePlot(-820, -235, 1120, 460, { x: [-3.5, 5.5], y: [0, 0.62] });
    const sePp = P9336.alternativeSe * 100; // ~0.713 pp
    const critPp = P9336.critical * 100; // ~1.40 pp

    const altPts = [];
    const nullPts = [];
    for (let i = 0; i <= 72; i++) {
      const x = -3.5 + (9.0 * i) / 72;
      altPts.push(plot.pt([x, normalPdf(x, 2.0, sePp)]));
      nullPts.push(plot.pt([x, normalPdf(x, 0.0, P9336.nullSe * 100)]));
    }

    const nodes = [
      ...plot.axesNodes(0.85),
      txt(
        'SAMPLING DISTRIBUTION OF OBSERVED LIFT (TRUE LIFT = +2.0 pp)',
        -820,
        -270,
        26,
        CTRL_COLOR,
        'mono',
        'left',
      ),
      // Null curve (muted dashed ghost) + Alternative curve (bright glowing indigo/cyan)
      glowingTrail(nullPts, { color: COSMOS.muted, width: 2.5, glow: 3, opacity: 0.45 }),
      glowingTrail(altPts, {
        gradientColors: [COSMOS.cyan, TRT_COLOR, GOOD_COLOR],
        width: 4.5,
        glow: 10,
      }),
      // Detection lines (±critPp) in yellow
      line(plot.pt([critPp, 0]), plot.pt([critPp, 0.6]), {
        stroke: WARN_COLOR,
        width: 3.5,
        dash: [9, 6],
      }).glow(7, WARN_COLOR),
      line(plot.pt([-critPp, 0]), plot.pt([-critPp, 0.6]), {
        stroke: WARN_COLOR,
        width: 3.0,
        dash: [9, 6],
      }),
      txt(`+${critPp.toFixed(2)}`, plot.xPx(critPp), plot.top - 14, 26, WARN_COLOR, 'mono'),
      txt('80% detect', plot.xPx(4.0), plot.yPx(0.36), 26, GOOD_COLOR, 'mono'),
      txt('20% Type II', plot.xPx(-2.45), plot.yPx(0.46), 26, BAD_COLOR, 'mono'),
      ...[-2, 0, 2, 4].map((v) =>
        txt(`${v > 0 ? '+' : ''}${v} pp`, plot.xPx(v), plot.bottom + 36, 26, COSMOS.muted, 'mono'),
      ),
    ];

    // Launch threshold vertical line right through center of blue curve (+2.0 pp)
    if (showLaunch.value > 0.02) {
      nodes.push(
        line(plot.pt([2.0, 0]), plot.pt([2.0, 0.6]), { stroke: GOOD_COLOR, width: 4.5 })
          .glow(9, GOOD_COLOR)
          .opacity(showLaunch.value),
        txt(
          'LAUNCH BAR +2.0',
          plot.xPx(2.0) + 18,
          plot.top + 28,
          26,
          GOOD_COLOR,
          'mono',
          'left',
        ).opacity(showLaunch.value),
      );
    }

    // Right ledger: Scaling law & exact sample-size formulas
    const rx = 355;
    nodes.push(
      txt('PLANNING NUMBERS', rx, -225, 26, WARN_COLOR, 'mono', 'left'),
      txt('Halving MDE → 4× traffic', rx, -155, 28, COSMOS.cyan, 'mono', 'left').opacity(
        0.45 + 0.55 * showScale.value,
      ),
      txt('Shortcut: 9,246 / arm', rx, -80, 28, COSMOS.ink, 'mono', 'left').opacity(
        0.4 + 0.6 * showShort.value,
      ),
      txt(
        `→ power = ${(P9246.power * 100).toFixed(1)}%`,
        rx,
        -28,
        28,
        WARN_COLOR,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * showFuller.value),
      txt('Exact 2-prop: 9,336 / arm', rx, 45, 28, GOOD_COLOR, 'mono', 'left').opacity(
        0.35 + 0.65 * showExact.value,
      ),
      txt('→ power = 80.0%', rx, 97, 28, GOOD_COLOR, 'mono', 'left').opacity(
        0.35 + 0.65 * showExact.value,
      ),
    );

    if (showDiff.value > 0.02) {
      nodes.push(
        txt(
          'At true lift = +2.0 pp: 80% clear zero, yet ONLY ~50% clear a +2.0 pp observed launch bar!',
          -855,
          345,
          28,
          GOOD_COLOR,
          'mono',
          'left',
        )
          .glow(7, GOOD_COLOR)
          .opacity(showDiff.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'scaling', showScale, 1, { duration: 0.45 });
  tweenCue(s, c, 'shortcut', showShort, 1, { duration: 0.45 });
  tweenCue(s, c, 'fuller', showFuller, 1, { duration: 0.45 });
  tweenCue(s, c, 'exact', showExact, 1, { duration: 0.45 });
  tweenCue(s, c, 'launch', showLaunch, 1, { duration: 0.55 });
  tweenCue(s, c, 'different', showDiff, 1, { duration: 0.45 });
}
