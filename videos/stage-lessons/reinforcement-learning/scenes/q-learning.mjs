// Scene 7: q-learning - "What does one observed reply change?"
// Left: Radiant MDP constellation with animated transition photon New -> Evidence.
// Right: Floating transition tuple, 3 luminous Q-slot orbs (only Evidence updates!),
//        glowing TD Step Ruler (0 -> 59 Target, Q gliding halfway to 29.5 after prediction reveal).
import { line } from 'vizmatic/stage';
import {
  ACTIONS,
  ACTION_COLORS,
  COSMOS,
  REWARD,
  ROLE,
  cinemaAtmosphere,
  drawMdpConstellation,
  gamma,
  glowDot,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  playCue,
  returns,
  rule,
  txt,
} from '../parts.mjs';

export default function qLearning(s, c) {
  const title = heroTitle(['What does one observed', 'reply change?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.evidence,
  });

  const showRecord = s.value(0);
  const sampleT = s.value(0);
  const showSample = s.value(0);
  const showRule = s.value(0);
  const showTarget = s.value(0);
  const showQuestion = s.value(0);
  const qVal = s.value(0); // animates 0 -> 29.5 AFTER 'half'
  const showHalf = s.value(0);
  const hiOneCell = s.value(0);
  const hiOffPolicy = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const arrived = sampleT.value > 0.9;
      const moving = sampleT.value > 0.02 && sampleT.value < 0.99;

      const mdpG = drawMdpConstellation({
        cx: -365,
        cy: 65,
        rx: 320,
        ry: 215,
        nodeR: 60,
        values: {
          new: showHalf.value > 0.5 ? '29.5' : '0',
          evidence: showSample.value > 0.5 ? '70' : '',
        },
        activeNode: arrived ? 'evidence' : 'new',
        highlightNode: hiOffPolicy.value > 0.5 ? 'evidence' : null,
        pulseEdge: moving ? 'new->evidence' : null,
        pulseT: sampleT.value,
        alpha,
      });

      const nodes = [
        ...mdpG.nodes,
        rule(115, -280, 115, 420, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      ];

      const rx = 505;

      // 1. Observed transition tuple (floating, zero card chrome)
      nodes.push(
        txt('One observed transition', rx, -350, 30, ROLE.state, 'sans', 'center').opacity(alpha),
      );
      if (showRecord.value > 0.05) {
        nodes.push(
          txt('New  →  Ask  →  Evidence', rx, -295, 30, COSMOS.ink, 'mono', 'center').opacity(
            showRecord.value * alpha,
          ),
        );
      }
      if (showSample.value > 0.05) {
        const offHi = hiOffPolicy.value > 0.5;
        nodes.push(
          txt(
            `r = ${REWARD.ask}   ·   max Q(next) = ${REWARD.evidence}`,
            rx,
            -242,
            28,
            offHi ? ROLE.gold : ROLE.evidence,
            'mono',
            'center',
          )
            .glow(offHi ? 9 : 4, offHi ? ROLE.gold : ROLE.evidence)
            .opacity(showSample.value * alpha),
        );
      }

      // 2. Three luminous Q-table slot orbs for New request (Approve, Evidence, Review)
      const slotXs = [275, 505, 735];
      const slotY = -85;
      nodes.push(
        txt('Q(New request, a)', rx, -172, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
      ACTIONS.forEach((act, i) => {
        const isEvid = i === 1;
        const sx = slotXs[i];
        const qDisplay = showHalf.value > 0.5 ? returns.evidence * 0.5 : qVal.value;
        const valStr = isEvid ? (qDisplay > 0.1 ? qDisplay.toFixed(1) : '0') : '0';
        const lit = isEvid && (showHalf.value > 0.5 || hiOneCell.value > 0.5);
        const op = (isEvid ? 1 : 0.48) * alpha;
        nodes.push(
          glowRing(sx, slotY, 54, ACTION_COLORS[i], {
            width: lit ? 4.4 : 2.6,
            glow: lit ? 14 : 5,
          }).opacity(op),
          txt(valStr, sx, slotY, 34, lit ? ROLE.gold : ACTION_COLORS[i], 'mono', 'center')
            .glow(lit ? 8 : 0, ROLE.gold)
            .opacity(op),
          txt(act, sx, slotY + 80, 26, ACTION_COLORS[i], 'sans', 'center').opacity(op),
        );
      });

      // 3. Glowing TD Step Ruler (0 to 60)
      const x0 = 195;
      const x1 = 815;
      const ry = 165;
      const xOf = (v) => x0 + ((x1 - x0) * v) / 60;

      nodes.push(line([x0, ry], [x1, ry], { stroke: '#3a4a70', width: 4.5 }).opacity(alpha));
      for (const tick of [0, 30, 60]) {
        const tx = xOf(tick);
        nodes.push(
          line([tx, ry], [tx, ry + 14], { stroke: COSMOS.muted, width: 2.5 }).opacity(0.8 * alpha),
          txt(String(tick), tx, ry + 42, 26, COSMOS.muted, 'mono', 'center').opacity(0.85 * alpha),
        );
      }

      // Target beacon at 59 (appears AFTER 'target')
      if (showTarget.value > 0.05) {
        const tx = xOf(returns.evidence);
        nodes.push(
          line([tx, ry - 48], [tx, ry], { stroke: ROLE.gold, width: 3.2, dash: [7, 5] }).opacity(
            showTarget.value * alpha,
          ),
          glowDot(tx, ry, {
            radius: 11,
            color: ROLE.gold,
            glow: 14,
            opacity: showTarget.value * alpha,
          }),
          txt(`Target ${returns.evidence}`, tx - 18, ry - 72, 28, ROLE.gold, 'mono', 'center')
            .glow(6, ROLE.gold)
            .opacity(showTarget.value * alpha),
        );
      }

      // Traveling emerald trail from 0 -> Q_new
      const qx = xOf(qVal.value);
      if (qVal.value > 0.5) {
        nodes.push(
          glowingTrail(
            [
              [xOf(0), ry],
              [qx, ry],
            ],
            { color: ROLE.evidence, width: 6, glow: 10, opacity: alpha },
          ),
        );
      }
      nodes.push(
        glowDot(qx, ry, { radius: 13, color: ROLE.evidence, glow: 14, opacity: alpha }),
        txt(
          `Q = ${(showHalf.value > 0.5 ? returns.evidence * 0.5 : qVal.value) > 0.1 ? (showHalf.value > 0.5 ? returns.evidence * 0.5 : qVal.value).toFixed(1) : '0'}`,
          Math.max(x0 + 55, qx),
          ry - 48,
          30,
          ROLE.evidence,
          'mono',
          'center',
        ).opacity(alpha),
      );

      // 4. Bottom calculation & prediction zone (strictly withholds 29.5 until 'half'!)
      if (showHalf.value > 0.5) {
        nodes.push(
          txt('0 + 0.5 × (59 - 0) = 29.5', rx, 315, 36, ROLE.evidence, 'mono', 'center')
            .glow(8, ROLE.evidence)
            .opacity(showHalf.value * alpha),
          txt(
            'Off-policy: bootstraps max Q(next) even while exploring',
            rx,
            385,
            26,
            ROLE.gold,
            'sans',
            'center',
          ).opacity((0.65 + 0.35 * hiOffPolicy.value) * alpha),
        );
      } else if (showQuestion.value > 0.5) {
        nodes.push(
          txt('α = 0.5 · 0 + 0.5 × (59 - 0) = ?', rx + 10, 315, 30, ROLE.gold, 'mono', 'center')
            .glow(8, ROLE.gold)
            .opacity(showQuestion.value * alpha),
          txt(
            'How far does the entry move?',
            rx + 10,
            385,
            30,
            ROLE.gold,
            'serif',
            'center',
          ).opacity(showQuestion.value * alpha),
        );
      } else if (showTarget.value > 0.5) {
        nodes.push(
          txt(
            `Target = ${REWARD.ask} + ${gamma} × ${REWARD.evidence} = ${returns.evidence}`,
            rx,
            315,
            34,
            ROLE.gold,
            'mono',
            'center',
          )
            .glow(7, ROLE.gold)
            .opacity(showTarget.value * alpha),
        );
      } else if (showRule.value > 0.5) {
        nodes.push(
          txt(
            `Target = ${REWARD.ask} + ${gamma} × ${REWARD.evidence}`,
            rx,
            315,
            34,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(showRule.value * alpha),
        );
      } else {
        nodes.push(
          txt(
            'Opening Q-estimates start at 0.',
            rx,
            315,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.evidence, ROLE.gold), title, layer);

  playCue(s, c, 'record', (d) => s.play(showRecord.to(1, { duration: d })), { dur: 0.4 });
  playCue(
    s,
    c,
    'sample',
    (d) =>
      s.play(sampleT.to(1, { duration: d }), showSample.to(1, { duration: Math.min(0.45, d) })),
    { dur: 1.1 },
  );
  playCue(s, c, 'target-rule', (d) => s.play(showRule.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'target', (d) => s.play(showTarget.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'ask-step', (d) => s.play(showQuestion.to(1, { duration: d })), { dur: 0.4 });

  // Strict prediction reveal AFTER 'half'
  playCue(
    s,
    c,
    'half',
    (d) =>
      s.play(
        qVal.to(returns.evidence * 0.5, { duration: d }),
        showHalf.to(1, { duration: Math.min(0.3, d) }),
      ),
    { after: true, dur: 0.42 },
  );
  playCue(s, c, 'one-cell', (d) => s.play(hiOneCell.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'off-policy', (d) => s.play(hiOffPolicy.to(1, { duration: d })), { dur: 0.4 });
}
