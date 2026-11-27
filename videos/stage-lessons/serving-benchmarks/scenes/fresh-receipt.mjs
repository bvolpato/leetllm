// Scene 24: fresh-receipt - Would you accept this run?
// Grand Finale Your-Turn 8-request Benchmark Receipt Clock (n1..n8, 2.5 s arrival window, 4.0 s drain):
//   - Strict prediction withholding on Beat 0 -> 4 metrics revealed strictly AFTER each cue in Beat 1
//   - Magnified n2 send vernier (300 -> 345 ms -> Exit 2 -> restored 300 ms -> Exit 0) in Beat 2
//   - Strict rollout verdict withholding -> 75% vs 95% attainment gauge & Hold Rollout AFTER fresh-promise!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  fadeInHalf,
  fadeOutHalf,
  freshServingRows,
  glowBar,
  glowDot,
  glowingTrail,
  guardedDynamic,
  receiptClockNodes,
  servingReceipt,
  servingRequestMetrics,
  txt,
} from '../parts.mjs';

export default function freshReceipt(s, c) {
  const drainProg = s.value(0); // 2500 -> 4000 ms
  // Strictly revealed AFTER each Beat 1 cue:
  const showAtt = s.value(0);
  const showQual = s.value(0);
  const showSucc = s.value(0);
  const showOff = s.value(0);
  // Bottom strip mode: 0 = 4 metrics, 1 = n2 send zoom, 2 = 75% vs 95% rollout gate
  const botMode = s.value(0);
  const n2Shift = s.value(0); // 0 -> 45 ms -> 0
  const showExit2 = s.value(0); // strictly AFTER fresh-invalid
  const showExit0 = s.value(0); // strictly AFTER fresh-valid
  const revealPromise = s.value(0); // strictly AFTER fresh-promise!

  const windowEnd = 2500;
  const horizon = 4000;

  const header = cinemaHeader('YOUR TURN · FRESH RECEIPT', 'Would you accept', 'this run?', {
    x: -860,
    y: -442,
    accent: ROLE.focus,
    size: 46,
  });

  const stageAura = aura(130, 10, 680, '#ffd1661c', '#5ce1e61a');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const dp = drainProg.value;
      const bm = botMode.value;
      const sh = Math.round(n2Shift.value);

      const rows = freshServingRows();
      rows[1].sent += sh;
      const r = servingReceipt(rows, [0, windowEnd]);
      const untilMs = windowEnd + dp * (horizon - windowEnd);

      const nodes = [
        // Top-right SLO promise tag
        txt('PROMISE: >= 95% QUALIFIED', 850, -400, 28, ROLE.slo, 'mono', 'right').glow(
          6,
          ROLE.slo,
        ),

        // 8-request Benchmark Receipt Clock (compact 48 px spacing so bottom strip has generous room!)
        ...receiptClockNodes(rows, {
          xLeft: -680,
          xRight: 440,
          topY: -222,
          spacing: 48,
          windowEnd,
          horizon,
          until: untilMs,
          showOutcomes: true,
          highlightId: bm > 0.5 && bm < 1.5 ? 'n2' : null,
          ticks: [0, 1000, 2000, 3000, 4000],
        }),
      ];

      // Mutually exclusive bottom bands using half-crossfades (zero text overlap in motion!)
      const a0 = fadeOutHalf(Math.min(1, bm));
      const a1 = fadeInHalf(Math.min(1, bm)) * fadeOutHalf(Math.max(0, bm - 1));
      const a2 = fadeInHalf(Math.max(0, bm - 1));

      // Band 0 (Beats 0 & 1): 4 cohort metrics with strict withholding until AFTER each cue!
      if (a0 > 0.02) {
        const metrics = [
          {
            lbl: 'ATTAINMENT',
            show: showAtt.value > 0.5,
            val: `${r.qualified}/${r.offered} = ${Math.round(r.attainment * 100)}%`,
            col: ROLE.qualified,
            x: -660,
          },
          {
            lbl: 'QUALIFIED /s',
            show: showQual.value > 0.5,
            val: `${r.qualified}/4s = ${r.qualifiedRps}`,
            col: ROLE.open,
            x: -220,
          },
          {
            lbl: 'SUCCESS /s',
            show: showSucc.value > 0.5,
            val: `${r.success}/4s = ${r.successRps}`,
            col: COSMOS.ink,
            x: 220,
          },
          {
            lbl: 'OFFERED /s',
            show: showOff.value > 0.5,
            val: `${r.offered}/2.5s = ${r.offeredRps}`,
            col: ROLE.focus,
            x: 660,
          },
        ];
        metrics.forEach(({ lbl, show, val, col, x }) => {
          nodes.push(
            txt(lbl, x, 286, 26, COSMOS.muted, 'mono').opacity(a0),
            txt(show ? val : '?', x, 352, show ? 34 : 42, show ? col : ROLE.focus, 'mono')
              .glow(show ? 7 : 5, show ? col : ROLE.focus)
              .opacity(a0),
          );
        });
        if (showAtt.value < 0.2) {
          nodes.push(
            txt(
              'PREDICT: What fraction of 8 qualified, and how many useful /s including the 4 s drain?',
              0,
              432,
              26,
              ROLE.focus,
              'mono',
            )
              .glow(5, ROLE.focus)
              .opacity(a0),
          );
        }
      }

      // Band 1 (Beat 2): Magnified n2 send vernier (Due 300, limit 320, Sent 300<->345, T1 400)
      if (a1 > 0.02) {
        const n2 = rows[1];
        const m2 = servingRequestMetrics(n2);
        const yV = 330;
        const xL = -520;
        const xR = 300;
        const xV = (ms) => xL + ((ms - 295) / 110) * (xR - xL);
        const lagCol = m2.lag > 20 ? ROLE.fail : ROLE.qualified;

        nodes.push(
          txt('n2 CLOCK', -840, yV - 10, 30, COSMOS.ink, 'mono', 'left').opacity(a1),
          txt('20 ms limit', -840, yV + 34, 26, ROLE.slo, 'mono', 'left').opacity(a1),
          line([xL, yV], [xR, yV], { stroke: '#293a5e', width: 2.8 }).opacity(a1),
          // 20 ms budget notch at 320
          dashedRule(xV(320), yV - 34, xV(320), yV + 40, ROLE.slo, 0.9 * a1, 2.8),
          txt('320 limit', xV(320), yV + 72, 26, ROLE.slo, 'mono').opacity(a1),
          // Due 300
          line([xV(300), yV - 22], [xV(300), yV + 22], { stroke: ROLE.window, width: 4.0 }).opacity(
            a1,
          ),
          txt('Due 300', xV(300) - 20, yV + 72, 26, ROLE.window, 'mono', 'right').opacity(a1),
          // Active spans
          glowingTrail(
            [
              [xV(n2.sent), yV],
              [xV(n2.tokens[0]), yV],
            ],
            { color: ROLE.send, width: 6.0, glow: 8, opacity: a1 },
          ),
          glowDot(xV(n2.sent), yV, { radius: 9.5, color: ROLE.send, glow: 11, opacity: a1 }),
          txt(`Sent ${n2.sent}`, xV(n2.sent), yV - 44, 28, ROLE.send, 'mono').opacity(a1),
          glowDot(xV(n2.tokens[0]), yV, { radius: 9.5, color: COSMOS.ink, glow: 10, opacity: a1 }),
          txt(`T1 ${n2.tokens[0]}`, xV(n2.tokens[0]), yV - 44, 28, COSMOS.ink, 'mono').opacity(a1),
          txt(`TTFT ${m2.ttft} ms`, xV(n2.tokens[0]), yV + 72, 26, ROLE.send, 'mono').opacity(a1),
          txt(`Lag: ${m2.lag} ms`, 430, yV - 36, 30, lagCol, 'mono', 'left')
            .glow(6, lagCol)
            .opacity(a1),
        );

        // Exit code revealed strictly AFTER fresh-invalid / fresh-valid
        if (m2.lag > 20 && showExit2.value > 0.2) {
          nodes.push(
            txt('SCORER EXIT 2', 430, yV + 26, 34, ROLE.fail, 'mono', 'left')
              .glow(8, ROLE.fail)
              .opacity(a1 * showExit2.value),
          );
        } else if (m2.lag === 0 && showExit0.value > 0.2) {
          nodes.push(
            txt('SCORER EXIT 0', 430, yV + 26, 34, ROLE.qualified, 'mono', 'left')
              .glow(8, ROLE.qualified)
              .opacity(a1 * showExit0.value),
            txt(
              'PREDICT: Has fixing the clock earned a capacity number?',
              0,
              442,
              26,
              ROLE.focus,
              'mono',
            )
              .glow(6, ROLE.focus)
              .opacity(a1),
          );
        }
      }

      // Band 2 (Beat 3): Final 75% vs 95% attainment gate & Hold Rollout verdict (AFTER fresh-promise!)
      if (a2 > 0.02) {
        const barL = -700;
        const barW = 980;
        const barY = 335;
        const xFloor = barL + barW * 0.95;
        const revP = revealPromise.value;

        nodes.push(
          glowBar(barL, barY, barW, 34, r.attainment, {
            fill: ROLE.open,
            glow: 9,
            radius: 8,
            opacity: a2,
          }),
          dashedRule(xFloor, barY - 46, xFloor, barY + 46, ROLE.slo, 0.95 * a2, 4.0),
          txt('95% promised', xFloor, barY - 68, 28, ROLE.slo, 'mono')
            .glow(6, ROLE.slo)
            .opacity(a2),
          txt('75% attained (6 / 8)', barL + barW * 0.75, barY + 64, 30, ROLE.open, 'mono')
            .glow(6, ROLE.open)
            .opacity(a2),
        );

        if (revP > 0.2) {
          nodes.push(
            txt('HOLD ROLLOUT', 580, barY - 12, 40, ROLE.fail, 'mono')
              .glow(9, ROLE.fail)
              .opacity(a2 * revP),
            txt('Capacity: unmeasured', 580, barY + 44, 26, COSMOS.muted, 'mono').opacity(
              a2 * revP,
            ),
            txt(
              'Repeat the open-loop load sweep, then validate with an online A/B test',
              0,
              448,
              26,
              ROLE.qualified,
              'sans',
            ).opacity(a2 * revP),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);

  // Beat 0: drain sweep
  c.on('fresh-window', () => {
    const t = c.cue('fresh-window').start;
    s.play(drainProg.to(1, { duration: clampDur(c, t, 1.2) }));
  });

  // Beat 1: strict prediction withholding on all 4 metrics
  c.after('fresh-attainment', () => {
    const t = c.cue('fresh-attainment').end;
    s.play(showAtt.to(1, { duration: clampDur(c, t, 0.3) }));
  });
  c.after('fresh-qualified', () => {
    const t = c.cue('fresh-qualified').end;
    s.play(showQual.to(1, { duration: clampDur(c, t, 0.3) }));
  });
  c.after('fresh-success', () => {
    const t = c.cue('fresh-success').end;
    s.play(showSucc.to(1, { duration: clampDur(c, t, 0.3) }));
  });
  c.after('fresh-offered', () => {
    const t = c.cue('fresh-offered').end;
    s.play(showOff.to(1, { duration: clampDur(c, t, 0.3) }));
  });

  // Beat 2: n2 delay & restore
  c.on('fresh-delay', () => {
    const t = c.cue('fresh-delay').start;
    s.play(botMode.to(1, { duration: clampDur(c, t, 0.35) }));
    s.play(n2Shift.to(45, { duration: clampDur(c, t, 0.85) }));
  });
  c.after('fresh-invalid', () => {
    const t = c.cue('fresh-invalid').end;
    s.play(showExit2.to(1, { duration: clampDur(c, t, 0.3) }));
  });
  c.on('fresh-restore', () => {
    const t = c.cue('fresh-restore').start;
    s.play(n2Shift.to(0, { duration: clampDur(c, t, 0.65) }));
  });
  c.after('fresh-valid', () => {
    const t = c.cue('fresh-valid').end;
    s.play(showExit0.to(1, { duration: clampDur(c, t, 0.3) }));
  });

  // Beat 3: rollout gate revealed strictly AFTER fresh-promise
  c.on('fresh-promise', () => {
    const t = c.cue('fresh-promise').start;
    s.play(botMode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('fresh-promise', () => {
    const t = c.cue('fresh-promise').end;
    s.play(revealPromise.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
