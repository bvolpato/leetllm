// Scene 18 (guardrails): "What else changed with the rewrite?"
// Latency (+80 ms <= 150 PASS) & Pages (-0.20 pp PASS) -> Grounding audit (22 vs 23 / 2000 = +0.05 pp, margin ±0.65 pp -> prediction hold -> upper +0.70 pp > +0.50 pp -> HOLD!).
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  WARN_COLOR,
  aura,
  groundingPacket,
  guardedDynamic,
  heroTitle,
  lumBar,
  tweenCue,
  txt,
} from '../parts.mjs';
import { buildAuditRulerNodes } from '../audit-ruler.mjs';

const ORIG = groundingPacket(23);

export default function guardrailsScene(s, c) {
  const showSpeed = s.value(0);
  const showPages = s.value(0);
  const showPoint = s.value(0);
  const showCalc = s.value(0);
  const showAsk = s.value(0);
  const spread = s.value(0);
  const showUpper = s.value(0);
  const showHold = s.value(0);

  const bgAura = aura(0, 20, 640, '#3a183b32', '#133a4a20');
  const title = heroTitle(['Guardrails & Non-Inferiority:', 'Upper Bound vs Budget'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: WARN_COLOR,
    eyebrow: 'LATENCY, PAGES & GROUNDING AUDIT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [
      // Top guardrail strip: Speed (+80 ms PASS) & Pages (-0.20 pp PASS)
      lumBar(-430, -210, 810, 88, {
        color: GOOD_COLOR,
        fillOpacity: 0.14,
        glow: 6,
        opacity: 0.5 + 0.5 * showSpeed.value,
      }),
      txt(
        'p95 Latency:  1,180 → 1,260 ms (+80 ≤ +150 PASS)',
        -805,
        -210,
        26,
        GOOD_COLOR,
        'mono',
        'left',
      ).opacity(0.5 + 0.5 * showSpeed.value),

      lumBar(445, -210, 800, 88, {
        color: GOOD_COLOR,
        fillOpacity: 0.14,
        glow: 6,
        opacity: 0.45 + 0.55 * showPages.value,
      }),
      txt(
        'Human Pages:  310 → 306 (−0.20 pp PASS)',
        75,
        -210,
        26,
        GOOD_COLOR,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showPages.value),

      // Shared grounding non-inferiority ruler (row 1: original 22 vs 23)
      ...buildAuditRulerNodes({
        left: -260,
        right: 820,
        topY: -75,
        axisY: 125,
        rows: [
          {
            y: 35,
            failures: 23,
            label: 'Original Audit (+0.05 pp)',
            color: CTRL_COLOR,
            spread: spread.value,
            showPoint: 0.35 + 0.65 * showPoint.value,
            showUpper: showUpper.value,
            showBadge: showHold.value,
          },
        ],
      }),
    ];

    if (showCalc.value > 0.02) {
      nodes.push(
        txt(
          `SE = ${(ORIG.se * 100).toFixed(2)} pp   ·   1.96 × SE = ±${(ORIG.se * 196).toFixed(2)} pp   ·   Dot = +0.05 pp`,
          -855,
          230,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(showCalc.value),
      );
    }

    // Strict prediction withholding: ask before extending interval to +0.70 pp!
    const askOp = showAsk.value * Math.max(0, 1 - showUpper.value * 2.6);
    if (askOp > 0.02) {
      nodes.push(
        txt(
          'Add ±0.65 pp to +0.05 pp. Does the upper end stay below the +0.50 pp limit?',
          -855,
          330,
          32,
          WARN_COLOR,
          'serif',
          'left',
        )
          .glow(7, WARN_COLOR)
          .opacity(askOp),
      );
    }

    const holdOp = Math.max(0, (showUpper.value - 0.45) / 0.55);
    if (holdOp > 0.02) {
      nodes.push(
        txt(
          'NO: upper tip hits +0.70 pp > +0.50 pp! HOLD THE REWRITE (uncertainty fails non-inferiority).',
          -855,
          330,
          28,
          BAD_COLOR,
          'mono',
          'left',
        )
          .glow(8, BAD_COLOR)
          .opacity(holdOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'speed', showSpeed, 1, { duration: 0.45 });
  tweenCue(s, c, 'pages', showPages, 1, { duration: 0.45 });
  tweenCue(s, c, 'audits', showPoint, 0.5, { duration: 0.35 });
  tweenCue(s, c, 'point', showPoint, 1, { duration: 0.45 });
  tweenCue(s, c, 'variances', showCalc, 0.45, { duration: 0.35 });
  tweenCue(s, c, 'se', showCalc, 0.75, { duration: 0.35 });
  tweenCue(s, c, 'critical', showCalc, 0.9, { duration: 0.35 });
  tweenCue(s, c, 'margin', showCalc, 1, { duration: 0.35 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'extend', spread, 1, { duration: 0.75, after: true });
  tweenCue(s, c, 'upper', showUpper, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'hold', showHold, 1, { duration: 0.45, after: true });
}
