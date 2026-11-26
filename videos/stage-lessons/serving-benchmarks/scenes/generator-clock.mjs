// Scene 4: generator-clock - Where did the wait go?
// Precision vernier oscilloscope for r04 showing schedule lag growing (5 -> 40 ms) while
// send-relative TTFT shrinks (285 -> 250 ms) with strict prediction withholding until verdict.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  glowDot,
  glowingTrail,
  guardedDynamic,
  radialGauge,
  servingClock,
  spanBracket,
  timeAxisNodes,
  txt,
} from '../parts.mjs';

export default function generatorClock(s, c) {
  const phase = s.value(0);
  const baseGlow = s.value(0);
  const shift = s.value(0); // 0 = sent 765, 1 = sent 800
  const revealVerdict = s.value(0); // strictly AFTER generator-verdict
  const backpressure = s.value(0); // generator-backpressure

  const header = cinemaHeader('COORDINATED OMISSION', 'Where did the', 'wait go?', {
    x: -860,
    y: -435,
    accent: ROLE.focus,
    size: 50,
  });

  const stageAura = aura(100, 10, 680, '#ffd16620', '#ff6b8b16');

  const clockView = guardedDynamic(
    () => 1,
    () => {
      const sh = shift.value;
      const rev = revealVerdict.value;
      const bp = backpressure.value;
      const g = servingClock(sh);
      const pulse = 0.72 + 0.28 * Math.sin(phase.value * 4.8);

      // Hide new numbers while sliding during Beat 1 prediction hold until AFTER generator-verdict
      const inPredict = sh > 0.05 && rev < 0.2;
      const showNums = !inPredict;

      const xLeft = -660;
      const xRight = 760;
      const minMs = 740;
      const maxMs = 1080;
      const xOf = (ms) => xLeft + ((ms - minMs) / (maxMs - minMs)) * (xRight - xLeft);
      const railY = -45;

      const lagColor = g.lag > 20 ? ROLE.fail : ROLE.qualified;
      const nodes = [];

      // Top-right radial lag budget dial
      const dialX = 685;
      const dialY = -335;
      const dialFrac = Math.min(1, g.lag / 40);
      nodes.push(
        radialGauge(dialX, dialY, 96, dialFrac, lagColor, {
          width: 9,
          glow: 10,
          markerFrac: 0.5, // 20 ms limit at 50% of 40 ms scale
        }),
        txt(
          showNums ? `${g.lag} ms` : '? ms',
          dialX,
          dialY - 12,
          34,
          showNums ? lagColor : ROLE.focus,
          'mono',
        ).glow(7, showNums ? lagColor : ROLE.focus),
        txt('LAG', dialX, dialY + 32, 26, COSMOS.muted, 'mono'),
        txt('20 ms budget', dialX, dialY + 144, 26, ROLE.focus, 'mono'),
      );

      // Main oscilloscope rail + bottom axis (cleanly separated from rail caption)
      nodes.push(
        txt('r04 CLIENT MONOTONIC CLOCK (MS)', -860, -238, 26, COSMOS.muted, 'mono', 'left'),
        line([xLeft, railY], [xRight, railY], { stroke: '#253456', width: 3.0 }),
        ...timeAxisNodes(xLeft, xRight, 292, minMs, maxMs, [760, 800, 850, 900, 950, 1000, 1050], {
          format: (v) => `${v}`,
        }),
      );

      // Fixed 20 ms budget laser at 780 ms (stops cleanly above the Sent label below the rail!)
      const xBudget = xOf(g.scheduled + 20);
      nodes.push(
        dashedRule(xBudget, railY - 102, xBudget, railY + 24, ROLE.focus, 0.88, 2.6),
        txt('20 ms limit (780)', xBudget, railY - 134, 26, ROLE.focus, 'mono'),
      );

      // Scheduled mark (fixed at 760, label to the left so nothing ever collides)
      const xDue = xOf(g.scheduled);
      nodes.push(
        line([xDue, railY - 30], [xDue, railY + 30], { stroke: ROLE.window, width: 5.0 }).glow(
          7,
          ROLE.window,
        ),
        txt(`Due ${g.scheduled}`, xDue - 18, railY - 56, 28, ROLE.window, 'mono', 'right'),
      );

      // First token mark (fixed at 1050)
      const xFirst = xOf(g.first);
      nodes.push(
        glowDot(xFirst, railY, { radius: 11, color: ROLE.reply, glow: 12 }),
        txt(`First token ${g.first}`, xFirst, railY - 58, 28, ROLE.reply, 'mono').glow(
          5,
          ROLE.reply,
        ),
      );

      // Sliding Sent mark (765 -> 800) with label cleanly BELOW the rail (never crossed by 780 laser!)
      const xSent = xOf(g.sent);
      nodes.push(
        glowingTrail(
          [
            [xDue, railY],
            [xSent, railY],
          ],
          { color: lagColor, width: 7.0, glow: 10 },
        ),
        glowingTrail(
          [
            [xSent, railY],
            [xFirst, railY],
          ],
          { color: ROLE.send, width: 7.0, glow: 10 },
        ),
        glowDot(xSent, railY, { radius: 12, color: ROLE.send, glow: 14 }),
        txt(`Sent ${g.sent}`, xSent + 22, railY + 58, 28, ROLE.send, 'mono', 'left').glow(
          5,
          ROLE.send,
        ),
      );

      // Precision span brackets underneath (well below the 780 laser and Sent label)
      nodes.push(
        ...spanBracket(xDue, xSent, railY + 124, showNums ? `Lag ${g.lag} ms` : 'Lag ?', lagColor, {
          labelSize: 28,
        }),
        ...spanBracket(
          xSent,
          xFirst,
          railY + 216,
          showNums ? `Send-relative TTFT: ${g.ttft} ms` : 'Send-relative TTFT: ?',
          ROLE.send,
          { labelSize: 30 },
        ),
      );

      // Bottom verdict / prediction / backpressure callout
      if (bp > 0.3) {
        nodes.push(
          txt(
            'COORDINATED OMISSION: KEEP DELAYED & UNSENT REQUESTS IN OFFERED COUNT',
            0,
            378,
            26,
            ROLE.open,
            'mono',
          )
            .glow(6, ROLE.open)
            .opacity(bp),
          txt(
            'Check client CPU, sockets & event loop  ·  Use server spans for server queue',
            0,
            432,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(bp),
        );
      } else if (rev > 0.2) {
        nodes.push(
          txt(
            'SCHEDULE INVALID: 40 ms LAG IS 2x BUDGET  ·  KEEP IN REPORT & RERUN',
            0,
            396,
            30,
            ROLE.fail,
            'mono',
          )
            .glow(8, ROLE.fail)
            .opacity(rev),
        );
      } else if (inPredict) {
        nodes.push(
          txt(
            'PREDICT: TTFT looks shorter. Accept this run under a 20 ms lag budget?',
            0,
            396,
            30,
            ROLE.focus,
            'mono',
          )
            .glow(7, ROLE.focus)
            .opacity(pulse),
        );
      } else {
        nodes.push(
          txt(
            baseGlow.value > 0.2
              ? 'Baseline on one client clock: 5 ms lag (valid), 285 ms TTFT'
              : 'All three marks come from one monotonic client clock',
            0,
            396,
            28,
            ROLE.qualified,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, clockView);
  driftValue(s, c, phase, 9, { startOffset: 0.1, endMargin: 0.5 });

  c.on('generator-base', () => {
    const t = c.cue('generator-base').start;
    s.play(baseGlow.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('generator-send-delay', () => {
    const t = c.cue('generator-send-delay').start;
    s.play(shift.to(1, { duration: clampDur(c, t, 0.95) }));
  });
  c.after('generator-verdict', () => {
    const t = c.cue('generator-verdict').end;
    s.play(revealVerdict.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('generator-backpressure', () => {
    const t = c.cue('generator-backpressure').start;
    s.play(backpressure.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
