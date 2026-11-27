// Scene 21 (fresh-grounding): "Where will the second interval end?"
// Dual audit ruler: Original 22 vs 23 (HOLD +0.70 pp) on top + Practice 22 vs 18 (-0.20 pp, margin ±0.62 pp -> prediction hold -> upper +0.42 pp < +0.50 pp -> PASS!) -> Counterfactual finale!
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
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

const FRESH = groundingPacket(18);

export default function freshGrounding(s, c) {
  const showRow2 = s.value(0);
  const showCenter = s.value(0);
  const showMargin = s.value(0);
  const showAsk = s.value(0);
  const spread2 = s.value(0);
  const showTip = s.value(0);
  const showPass = s.value(0);
  const toCounter = s.value(0);
  const showMissing = s.value(0);

  const bgAura = aura(0, 20, 640, '#133a4a36', '#133a3d22');
  const title = heroTitle(['Transfer Check &', 'The Unseen Counterfactual'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: GOOD_COLOR,
    eyebrow: 'PRACTICE NON-INFERIORITY GATE · FINALE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [];

    // Part 1: Dual audit ruler (Original row 1 stays HELD; Practice row 2 decides at 18/2000)
    const p1Op = Math.max(0, 1 - toCounter.value * 2.6);
    if (p1Op > 0.02) {
      nodes.push(
        ...buildAuditRulerNodes({
          left: -240,
          right: 820,
          topY: -205,
          axisY: 165,
          rows: [
            {
              y: -95,
              failures: 23,
              label: 'Original Audit · HOLD',
              color: CTRL_COLOR,
              spread: 1,
              showPoint: 1,
              showUpper: 1,
              showBadge: 1,
              opacity: p1Op,
            },
            {
              y: 55,
              failures: 18,
              label: showPass.value > 0.5 ? 'Practice Audit · PASS' : 'Practice Audit (18/2000)',
              color: TRT_COLOR,
              spread: spread2.value,
              showPoint: showCenter.value,
              showUpper: showTip.value,
              showBadge: showPass.value,
              opacity: (0.35 + 0.65 * showRow2.value) * p1Op,
            },
          ],
        }),
      );

      if (showMargin.value > 0.02) {
        nodes.push(
          txt(
            `Practice delta = −0.20 pp   ·   1.96 × SE = ±${(FRESH.se * 196).toFixed(2)} pp`,
            -855,
            255,
            28,
            TRT_COLOR,
            'mono',
            'left',
          ).opacity(showMargin.value * p1Op),
        );
      }

      // Strict prediction withholding before extending interval to +0.42 pp!
      const askOp = showAsk.value * Math.max(0, 1 - showTip.value * 2.6) * p1Op;
      if (askOp > 0.02) {
        nodes.push(
          txt(
            'Start at −0.20 pp and add ±0.62 pp. Where does the upper tip land? Does it clear +0.50 pp?',
            -855,
            345,
            30,
            WARN_COLOR,
            'serif',
            'left',
          )
            .glow(7, WARN_COLOR)
            .opacity(askOp),
        );
      }

      const passOp = Math.max(0, (showTip.value - 0.45) / 0.55) * p1Op;
      if (passOp > 0.02) {
        nodes.push(
          txt(
            'Upper tip = +0.42 pp < +0.50 pp → Practice PASSES! (Original report stays HELD.)',
            -855,
            345,
            30,
            GOOD_COLOR,
            'mono',
            'left',
          )
            .glow(7, GOOD_COLOR)
            .opacity(passOp),
        );
      }
    }

    // Part 2: Counterfactual finale: returning to the opening canary incident!
    const p2Op = Math.max(0, (toCounter.value - 0.45) / 0.55);
    if (p2Op > 0.02) {
      nodes.push(
        txt(
          'OPENING CANARY INCIDENT: FUNDAMENTAL PROBLEM OF CAUSAL INFERENCE',
          -855,
          -245,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(p2Op),
        lumBar(-430, -45, 810, 210, {
          color: TRT_COLOR,
          fillOpacity: 0.18,
          glow: 8,
          opacity: p2Op,
        }),
        txt('OBSERVED: TREATMENT (REWRITE)', -805, -105, 26, TRT_COLOR, 'mono', 'left').opacity(
          p2Op,
        ),
        txt('Engineer clicked USABLE', -805, -45, 34, GOOD_COLOR, 'serif', 'left').opacity(p2Op),
        txt('1 resolved · 1 grounding fail', -805, 18, 26, COSMOS.muted, 'mono', 'left').opacity(
          p2Op,
        ),

        lumBar(445, -45, 800, 210, {
          color: WARN_COLOR,
          fillOpacity: 0.1,
          dash: [10, 7],
          glow: 6,
          opacity: p2Op,
        }),
        txt('UNSEEN: CONTROL (RAW QUERY)', 75, -105, 26, WARN_COLOR, 'mono', 'left').opacity(p2Op),
        txt('?  Counterfactual missing  ?', 75, -45, 36, WARN_COLOR, 'serif', 'left')
          .glow(7, WARN_COLOR)
          .opacity(p2Op),
        txt(
          'Never observed for this same incident',
          75,
          18,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(p2Op),
      );

      if (showMissing.value > 0.02) {
        nodes.push(
          txt(
            'Randomization bridges the missing outcome across groups. Next: causal inference WITHOUT random assignment!',
            -855,
            235,
            28,
            GOOD_COLOR,
            'sans',
            'left',
          )
            .glow(6, GOOD_COLOR)
            .opacity(showMissing.value * p2Op),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'eighteen', showRow2, 1, { duration: 0.45 });
  tweenCue(s, c, 'center', showCenter, 1, { duration: 0.45 });
  tweenCue(s, c, 'margin', showMargin, 1, { duration: 0.45 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'extend', spread2, 1, { duration: 0.75, after: true });
  tweenCue(s, c, 'tip', showTip, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'pass', showPass, 0.85, { duration: 0.45, after: true });
  tweenCue(s, c, 'next', showPass, 1, { duration: 0.35 });
  tweenCue(s, c, 'return', toCounter, 0.85, { duration: 0.55 });
  tweenCue(s, c, 'unseen', toCounter, 1, { duration: 0.35 });
  tweenCue(s, c, 'missing', showMissing, 0.8, { duration: 0.4, after: true });
  tweenCue(s, c, 'across', showMissing, 1, { duration: 0.4 });
}
