// Scene 21: confidence-selection - A stronger evidence rule changes the fleet plan
// 2-mode Wilson Confidence Interval & Fleet Plan Comparator:
//   Mode 0: All-success shortcut n/(n + 2.706) comparing 200/200 (98.7%), 20/20 (88.1%), 190/200 (91.8%)
//           against the 95% gold laser wall
//   Mode 1: Applying Wilson >= 95% to the sweep shifts 1.5 RPS (20 replicas) -> 1.0 RPS (30 replicas),
//           withholding "30 replicas" strictly until AFTER confidence-fleet!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  WILSON_CASES,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  timeAxisNodes,
  txt,
} from '../parts.mjs';

export default function confidenceSelection(s, c) {
  const smallLit = s.value(0);
  const goldWallHi = s.value(0);
  const mode01 = s.value(0); // 0 = Wilson intervals, 1 = 20 vs 30 replica fleet impact
  const revealThirty = s.value(0); // strictly AFTER confidence-fleet!
  const rulesLit = s.value(0);

  const header = cinemaHeader(
    'EVIDENCE RULES & FLEET SIZE',
    'A stronger rule',
    'changes the fleet',
    {
      x: -860,
      y: -435,
      accent: ROLE.slo,
      size: 50,
    },
  );

  const stageAura = aura(140, 15, 680, '#ffd1661c', '#5ce1e61a');

  const wilsonEq = glowTex(
    String.raw`\mathrm{lower} = \frac{n}{n + z^2}, \quad z^2 \approx 2.706`,
    {
      x: 410,
      y: -355,
      size: 36,
      color: ROLE.focus,
      glow: 7,
    },
  );

  // Mode 0: Three Wilson confidence intervals on full 0..1 axis against 95% gold laser
  const view0 = guardedDynamic(
    () => fadeOutHalf(mode01.value),
    (a) => {
      const sl = smallLit.value;
      const gw = goldWallHi.value;

      const xLeft = -460;
      const xRight = 720;
      const xOf = (v) => xLeft + v * (xRight - xLeft);
      const xFloor = xOf(0.95);
      const topY = -125;
      const rowStep = 148;

      const nodes = [
        // Gold 95% threshold laser cutting all 3 rows
        dashedRule(xFloor, topY - 70, xFloor, topY + 2 * rowStep + 70, ROLE.slo, 0.95 * a, 3.8),
        txt('95% FLOOR', xFloor, topY - 96, 26, ROLE.slo, 'mono')
          .glow(gw > 0.2 ? 9 : 5, ROLE.slo)
          .opacity(a),
      ];

      WILSON_CASES.forEach((wc, i) => {
        const yy = topY + i * rowStep;
        const clears = wc.lower >= 0.95;
        const isSmall = i === 1;
        const col = clears ? ROLE.qualified : ROLE.fail;
        const rowAlpha = isSmall ? (0.35 + 0.65 * sl) * a : a;

        nodes.push(
          txt(`${wc.passes} / ${wc.n}`, -840, yy, 36, ROLE.open, 'mono', 'left').opacity(rowAlpha),
          line([xLeft, yy], [xRight, yy], { stroke: '#233254', width: 2.4 }).opacity(rowAlpha),
          glowingTrail(
            [
              [xOf(wc.lower), yy],
              [xOf(1), yy],
            ],
            { color: col, width: 10.0, glow: clears && gw > 0.2 ? 14 : 9, opacity: rowAlpha },
          ),
          glowDot(xOf(wc.lower), yy, { radius: 11, color: col, glow: 12, opacity: rowAlpha }),
          txt(`${(wc.lower * 100).toFixed(1)}%`, xRight + 24, yy, 30, col, 'mono', 'left')
            .glow(6, col)
            .opacity(rowAlpha),
          txt(
            clears ? 'CLEARS 95%' : 'BELOW 95%',
            xLeft + 24,
            yy - 44,
            26,
            col,
            'mono',
            'left',
          ).opacity(rowAlpha),
        );
      });

      nodes.push(
        ...timeAxisNodes(xLeft, xRight, topY + 2 * rowStep + 96, 0, 1, [0, 0.25, 0.5, 0.75, 1], {
          format: (v) => `${Math.round(v * 100)}%`,
          opacity: a,
        }),
        txt(
          gw > 0.2
            ? 'Only 200 / 200 clears the gold 95% wall  ·  Confidence != observed attainment'
            : 'All-success shortcut: 200 / 202.7 = 98.7%   ·   20 / 22.7 = 88.1%',
          0,
          428,
          28,
          gw > 0.2 ? ROLE.slo : COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1: Fleet plan comparison (Observed 95% -> 20 replicas vs Wilson >= 95% -> 30 replicas)
  const view1 = guardedDynamic(
    () => fadeInHalf(mode01.value),
    (a) => {
      const r30 = revealThirty.value;
      const rl = rulesLit.value;

      const leftX = -460;
      const rightX = 430;
      const nodes = [
        // Vertical glowing divider between the two rules
        dashedRule(0, -185, 0, 265, '#2b3d63', 0.8 * a, 2.4),

        // Left column: Observed 95% rule
        txt('OBSERVED >= 95% RULE', leftX, -155, 28, ROLE.open, 'mono')
          .glow(5, ROLE.open)
          .opacity(a),
        txt('1.5 RPS  ·  190 / 200', leftX, -82, 34, COSMOS.ink, 'mono').opacity(a),
        txt('15 active / 3  =  5.0 / replica', leftX, -10, 28, COSMOS.muted, 'mono').opacity(a),
        txt('100 / 5  =  20 REPLICAS', leftX, 118, 42, ROLE.open, 'mono')
          .glow(9, ROLE.open)
          .opacity(a),

        // Right column: Wilson lower >= 95% rule (withhold 30 until AFTER confidence-fleet!)
        txt('WILSON LOWER >= 95% RULE', rightX, -155, 28, ROLE.slo, 'mono')
          .glow(5, ROLE.slo)
          .opacity(a),
        txt('1.0 RPS  ·  200 / 200', rightX, -82, 34, COSMOS.ink, 'mono').opacity(a),
        txt('10 active / 3  =  10/3 / replica', rightX, -10, 28, COSMOS.muted, 'mono').opacity(a),
        txt(
          r30 > 0.2 ? '100 / (10/3)  =  30 REPLICAS' : '100 / (10/3)  =  ? REPLICAS',
          rightX,
          118,
          42,
          ROLE.slo,
          'mono',
        )
          .glow(9, ROLE.slo)
          .opacity(a),
      ];

      if (r30 > 0.2) {
        nodes.push(
          txt('+50% MORE REPLICAS FOR STRONGER EVIDENCE', rightX, 204, 26, ROLE.burst, 'mono')
            .glow(6, ROLE.burst)
            .opacity(a * r30),
        );
      }

      // Bottom methodological guidance (Beat 3)
      if (rl > 0.2) {
        nodes.push(
          txt(
            'PREDECLARE RULE  ·  BLOCK-RESAMPLE CORRELATED BURSTS  ·  FRESH CONFIRMATION RUN',
            0,
            346,
            26,
            ROLE.qualified,
            'mono',
          )
            .glow(5, ROLE.qualified)
            .opacity(a * rl),
          txt(
            'Alternate baseline & candidate order  ·  Separate cold vs warm  ·  Keep rejected runs',
            0,
            406,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(a * rl),
        );
      } else {
        nodes.push(
          txt(
            'Assuming the same 10 s mean residence at 1.0 RPS  ·  Verify on larger fleet with burst margin',
            0,
            378,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, wilsonEq, view0, view1);

  c.on('confidence-selection-beat-0', () => {
    const t = c.cue('confidence-selection-beat-0').start;
    s.play(smallLit.to(0.25, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('confidence-small', () => {
    const t = c.cue('confidence-small').start;
    s.play(smallLit.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('confidence-selection-beat-1', () => {
    const t = c.cue('confidence-selection-beat-1').start;
    s.play(goldWallHi.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.hide('confidence-selection-beat-2', wilsonEq);
  c.on('confidence-selection-beat-2', () => {
    const t = c.cue('confidence-selection-beat-2').start;
    s.play(mode01.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.after('confidence-fleet', () => {
    const t = c.cue('confidence-fleet').end;
    s.play(revealThirty.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('confidence-selection-beat-3', () => {
    const t = c.cue('confidence-selection-beat-3').start;
    s.play(rulesLit.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
