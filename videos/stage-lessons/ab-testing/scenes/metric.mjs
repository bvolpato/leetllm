// Scene 04 (metric): "Decide what a resolved incident means"
// Primary metric timeline [0 -> 10 min]: usable mark + no new page + full denominator -> maturity wait -> proxy vs guardrails.
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  WARN_COLOR,
  aura,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function metric(s, c) {
  const phase = s.value(0);
  const showUsable = s.value(0);
  const showNoPage = s.value(0);
  const showDenom = s.value(0);
  const clockT = s.value(0);
  const showProxy = s.value(0);
  const showFail = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#133a3d18');
  const title = heroTitle(['Lock One Primary Metric', 'Before Traffic Arrives'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: GOOD_COLOR,
    eyebrow: 'PRIMARY OUTCOME & MATURITY RULE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const tLeft = -780;
    const tRight = 780;
    const tY = -125;
    const xT = (m) => tLeft + (m / 12) * (tRight - tLeft);
    const curM = clockT.value * 10;

    const nodes = [
      txt('TEN-MINUTE RESOLUTION WINDOW', -855, -245, 26, COSMOS.cyan, 'mono', 'left'),
      rule(tLeft, tY, tRight, tY, COSMOS.muted, 3.5),
      // Deadline marker at t = 10 min
      line([xT(10), tY - 62], [xT(10), tY + 62], {
        stroke: WARN_COLOR,
        width: 4,
        dash: [9, 6],
      }).glow(7, WARN_COLOR),
      txt('0 min', xT(0), tY + 46, 26, COSMOS.muted, 'mono'),
      txt('8 min', xT(8), tY + 46, 26, GOOD_COLOR, 'mono'),
      txt('10 min DEADLINE', xT(10), tY - 82, 26, WARN_COLOR, 'mono'),
      // Live clock cursor moving from 0 -> 10 min
      line([xT(0), tY], [xT(curM), tY], { stroke: GOOD_COLOR, width: 7 }).glow(8, GOOD_COLOR),
      glowDot(xT(curM), tY, { radius: 10, color: GOOD_COLOR, glow: 12 }),

      // Two joint clauses required for Resolved = 1
      lumBar(-430, 55, 810, 96, {
        color: GOOD_COLOR,
        fillOpacity: 0.16,
        glow: 7,
        opacity: 0.5 + 0.5 * showUsable.value,
      }),
      txt(
        '1. Usable answer marked within 10 min',
        -805,
        55,
        28,
        GOOD_COLOR,
        'mono',
        'left',
      ).opacity(0.5 + 0.5 * showUsable.value),

      lumBar(445, 55, 800, 96, {
        color: CTRL_COLOR,
        fillOpacity: 0.16,
        glow: 7,
        opacity: 0.45 + 0.55 * showNoPage.value,
      }),
      txt(
        '2. Zero new human escalation pages ≤ 10 min',
        75,
        55,
        28,
        CTRL_COLOR,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showNoPage.value),

      // Denominator + Guardrail reminder bar
      lumBar(0, 195, 1690, 82, {
        color: WARN_COLOR,
        fillOpacity: 0.12,
        glow: 6,
        opacity: 0.45 + 0.55 * showDenom.value,
      }),
      txt(
        'DENOMINATOR RULE:  Every enrolled incident stays in its assigned arm (wait until all 10-min windows mature)',
        0,
        195,
        26,
        WARN_COLOR,
        'mono',
      ).opacity(0.45 + 0.55 * showDenom.value),
    ];

    if (showProxy.value > 0.02) {
      nodes.push(
        txt(
          'Proxy warning: an answer can look usable while service stays down',
          -855,
          312,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(showProxy.value),
      );
    }
    if (showFail.value > 0.02) {
      nodes.push(
        txt(
          'Keep Grounding, Latency & Human Pages as separate guardrails!',
          -855,
          375,
          28,
          BAD_COLOR,
          'mono',
          'left',
        )
          .glow(6, BAD_COLOR)
          .opacity(showFail.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'usable', showUsable, 1, { duration: 0.45 });
  tweenCue(s, c, 'no-page', showNoPage, 1, { duration: 0.45 });
  tweenCue(s, c, 'denominator', showDenom, 1, { duration: 0.45 });
  tweenCue(s, c, 'mature', clockT, 1, { duration: 0.9 });
  tweenCue(s, c, 'proxy', showProxy, 1, { duration: 0.45 });
  tweenCue(s, c, 'failure', showFail, 1, { duration: 0.45 });
}
