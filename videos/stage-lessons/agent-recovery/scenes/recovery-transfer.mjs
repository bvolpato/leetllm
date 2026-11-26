// Scene 15: recovery-transfer - "The next call"
// Four cumulative transfer checks with 3 strict prediction holds:
// (1) Deadline check: 1.2s floor + 0.3s jitter vs 1.4s left -> withholds 1.5s / Stop until 'transfer-verdict',
// (2) Freshness check: 40m completed vs 1m policy -> dated + unavailable + keep key,
// (3) 100-run disposition constellation: 60 complete, 12 degraded, 18 handoff (90% acceptable), 10 unresolved,
// (4) Fresh rev-22 timeout + write permission withdrawn -> withholds read-by-key until 'read-key' and
//     withholds "At 14:08, job-7 was running" until 'final-report'!
import { line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  OP,
  ROLE,
  actorOrb,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function recoveryTransfer(s, c) {
  const title = heroTitle(['The next call'], {
    x: -855,
    y: -440,
    size: 56,
    accent: ROLE.sure,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0 = deadline, 1 = 40m stale, 2 = 100 runs, 3 = fresh rev-22

  // Stage 0: 1.2 + 0.3 vs 1.4
  const showWait = s.value(0);
  const showJit = s.value(0);
  const showRem = s.value(0);
  const askDeadline = s.value(0);
  const slideJit = s.value(0);
  const revealVerdict = s.value(0); // STRICTLY AFTER 'transfer-verdict'!

  // Stage 1: 40m completed vs 1m policy
  const showPolicy = s.value(0);
  const showStale = s.value(0);

  // Stage 2: 100-run constellation
  const show60 = s.value(0);
  const show12 = s.value(0);
  const show18 = s.value(0);
  const show10 = s.value(0);
  const showRates = s.value(0);
  const showTraces = s.value(0);

  // Stage 3: Fresh run rev-22 + withdrawn write approval
  const showRev22 = s.value(0);
  const showWithdrawn = s.value(0);
  const askCall = s.value(0);
  const revealRead = s.value(0); // STRICTLY AFTER 'read-key'!
  const showJob7 = s.value(0);
  const askOperator = s.value(0);
  const revealFinal = s.value(0); // STRICTLY AFTER 'final-report'!

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        // Stage 0: New deadline test (1.2s floor + 0.3s jitter vs 1.4s remaining)
        const x0 = -640;
        const x1 = 680;
        const maxS = 1.8;
        const xOf = (sec) => x0 + ((x1 - x0) * sec) / maxS;
        const barY = 0;

        nodes.push(
          txt(
            'ACTIVE REPLAY CONTRACT · CHECK REMAINING DEADLINE',
            0,
            -275,
            27,
            ROLE.agent,
            'mono',
            'center',
          ).opacity(alpha),
          line([x0, 145], [x1, 145], { stroke: '#4a5c88', width: 3.5 }).opacity(alpha),
        );
        for (const t of [0, 0.5, 1.0, 1.4, 1.5, 1.8]) {
          const tx = xOf(t);
          nodes.push(
            line([tx, 145], [tx, 157], { stroke: COSMOS.muted, width: 2.2 }).opacity(alpha),
            txt(
              `${t.toFixed(1)}s`,
              tx,
              185,
              26,
              t === 1.4 ? ROLE.fail : COSMOS.muted,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }

        // Remaining deadline wall at 1.4s
        if (showRem.value > 0.2) {
          const dlX = xOf(1.4);
          nodes.push(
            line([dlX, -145], [dlX, 145], {
              stroke: ROLE.fail,
              width: 4.5,
              dash: [10, 7],
            }).glow(10, ROLE.fail),
            txt('1.4s LEFT', dlX, -172, 26, ROLE.fail, 'mono', 'center').opacity(
              showRem.value * alpha,
            ),
          );
        }

        // 1.2s floor bar
        if (showWait.value > 0.2) {
          const fw = xOf(1.2) - x0;
          nodes.push(
            rect(fw, 54, {
              radius: 8,
              fill: hexAlpha(ROLE.controller, 0.34 * alpha),
              stroke: ROLE.controller,
              width: 2.8,
            }).at(x0 + fw / 2, barY),
            txt('1.2s min wait', x0 + fw / 2, barY, 26, COSMOS.ink, 'mono', 'center').opacity(
              alpha,
            ),
          );
        }

        // 0.3s jitter block: starts floated above until slideJit slides it onto the end of 1.2s!
        if (showJit.value > 0.2) {
          const jw = xOf(0.3) - x0;
          const jStartX = x0 + (xOf(1.2) - x0) * slideJit.value;
          const jY = -92 + 92 * slideJit.value;
          const jCol = revealVerdict.value > 0.5 ? ROLE.fail : ROLE.agent;
          const jitLabelX = slideJit.value > 0.5 ? xOf(1.4) + 84 : jStartX + jw / 2;
          const jitLabelY = slideJit.value > 0.5 ? jY - 54 : jY;
          nodes.push(
            rect(jw, 54, {
              radius: 8,
              fill: hexAlpha(jCol, 0.36 * alpha),
              stroke: jCol,
              width: 2.8,
            })
              .at(jStartX + jw / 2, jY)
              .glow(8, jCol),
            txt('+0.3s', jitLabelX, jitLabelY, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
          );
        }

        const capY = 305;
        if (revealVerdict.value > 0.5) {
          nodes.push(
            glowPill('1.2 + 0.3 = 1.5s (> 1.4s) -> STOP AT DEADLINE', 0, capY, ROLE.fail, {
              size: 28,
              alpha: revealVerdict.value * alpha,
            }),
          );
        } else if (askDeadline.value > 0.4) {
          nodes.push(
            txt(
              '1.2s floor + 0.3s jitter with 1.4s left: can the agent send again?',
              0,
              capY,
              30,
              ROLE.mark,
              'serif',
              'center',
            )
              .glow(7, ROLE.mark)
              .opacity(askDeadline.value * alpha * (0.8 + 0.2 * pulse)),
          );
        } else {
          nodes.push(
            txt(
              'The operation key prevents duplicates, yet every retry still obeys the deadline.',
              0,
              capY,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else if (st === 1) {
        // Stage 1: 40m cached completed observation vs 1m freshness policy
        const tlY = 5;
        nodes.push(
          txt(
            'FRESHNESS POLICY: 1 MINUTE WINDOW VS 40-MINUTE RECORD',
            0,
            -275,
            27,
            ROLE.mark,
            'mono',
            'center',
          ).opacity(alpha),
          line([-660, tlY], [660, tlY], { stroke: '#4a5c88', width: 4.5 }).opacity(alpha),
          glowDot(-660, tlY, { radius: 13, color: ROLE.fail, glow: 14, opacity: alpha }),
          txt('40 MIN AGO', -660, tlY + 46, 26, ROLE.fail, 'mono', 'left').opacity(alpha),
          glowPill('Backup: completed (40m ago)', -380, tlY - 82, ROLE.mark, { size: 27, alpha }),
          rect(44, 48, {
            radius: 6,
            fill: hexAlpha(ROLE.sure, 0.45 * alpha),
            stroke: ROLE.sure,
            width: 2.5,
          }).at(638, tlY),
          txt('1 MIN FRESH', 660, tlY - 68, 26, ROLE.sure, 'mono', 'right').opacity(
            Math.max(0.5, showPolicy.value) * alpha,
          ),
          txt('NOW', 660, tlY + 46, 26, ROLE.sure, 'mono', 'right').opacity(alpha),
          glowPill(
            showStale.value > 0.4
              ? `Current status: UNAVAILABLE · Date 40m record · Keep ${OP.key}`
              : 'Outside the 1-minute live window',
            0,
            205,
            ROLE.fail,
            { size: 27, alpha: Math.max(0.5, showStale.value) * alpha },
          ),
        );
      } else if (st === 2) {
        // Stage 2: 100-run disposition constellation (10x10 glowing dot grid)
        nodes.push(
          txt(
            '100 RUNS NEEDING RECOVERY (UNIQUE RUNS IN DENOMINATOR)',
            0,
            -285,
            27,
            ROLE.agent,
            'mono',
            'center',
          ).opacity(alpha),
        );

        const gx0 = -680;
        const gy0 = -175;
        const cell = 42;
        for (let i = 0; i < 100; i++) {
          const colIdx = i % 10;
          const rowIdx = Math.floor(i / 10);
          let col = '#3d4f78';
          if (i < 60 && show60.value > 0.2) col = ROLE.sure;
          else if (i >= 60 && i < 72 && show12.value > 0.2) col = ROLE.agent;
          else if (i >= 72 && i < 90 && show18.value > 0.2) col = ROLE.mark;
          else if (i >= 90 && show10.value > 0.2) col = ROLE.fail;
          nodes.push(
            glowDot(gx0 + colIdx * cell, gy0 + rowIdx * cell, {
              radius: 10,
              color: col,
              glow: col === '#3d4f78' ? 2 : 7,
              opacity: alpha,
            }),
          );
        }

        // Right-side breakdown legend
        const lx = 265;
        nodes.push(
          glowPill('60 complete task (60%)', lx, -155, ROLE.sure, {
            size: 27,
            alpha: Math.max(0.5, show60.value) * alpha,
          }),
          glowPill('12 accepted degraded', lx, -65, ROLE.agent, {
            size: 27,
            alpha: Math.max(0.35, show12.value) * alpha,
          }),
          glowPill('18 safe human handoff', lx, 25, ROLE.mark, {
            size: 27,
            alpha: Math.max(0.35, show18.value) * alpha,
          }),
          glowPill('10 unresolved', lx, 115, ROLE.fail, {
            size: 27,
            alpha: Math.max(0.35, show10.value) * alpha,
          }),
          txt(
            showRates.value > 0.4
              ? '60% task completion · 90% acceptable disposition (18 still need a person)'
              : 'Count each unique run once, regardless of retry attempts.',
            0,
            295,
            27,
            ROLE.mark,
            'sans',
            'center',
          ).opacity(alpha),
          txt(
            showTraces.value > 0.4
              ? 'Keep operation keys in protected traces, never as high-cardinality metric labels.'
              : 'Track retries, dedup, reconciliation time, unknown writes & cancellations separately.',
            0,
            345,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 3: Fresh run rev-22 timeout + withdrawn write approval (2 strict prediction holds!)
        const ax = -620;
        const cx = 620;
        const topY = -135;
        const botY = 125;
        nodes.push(
          txt(
            'FRESH RUN: ROLLBACK REV-22 TIMEOUT · WRITE APPROVAL WITHDRAWN',
            0,
            -285,
            26,
            ROLE.op,
            'mono',
            'center',
          ).opacity(alpha),
          actorOrb(ax, -20, 66, ROLE.agent, 'Agent', 'rev-22 timed out', { alpha, active: true }),
          actorOrb(cx, -20, 72, ROLE.controller, 'Controller', 'replay active', {
            alpha,
            active: showJob7.value > 0.3,
          }),
        );

        // Upper Write lane: WITHDRAWN!
        nodes.push(
          glowArrow(ax + 115, topY, cx - 115, topY, hexAlpha(ROLE.fail, 0.45 * alpha), {
            width: 3,
            alpha,
            dash: [8, 6],
          }),
          glowPill('WRITE REPLAY: WITHDRAWN', 0, topY - 48, ROLE.fail, {
            size: 26,
            alpha: Math.max(0.5, showWithdrawn.value) * alpha,
          }),
          glowCross(0, topY, 34, ROLE.fail, Math.max(0.4, showWithdrawn.value) * alpha),
        );

        // Lower Read lane: PERMITTED! (Only lights up with 'lookup -> job-7' AFTER 'read-key'!)
        const readActive = revealRead.value > 0.5;
        nodes.push(
          glowArrow(
            ax + 115,
            botY,
            cx - 115,
            botY,
            readActive ? ROLE.sure : hexAlpha(ROLE.agent, 0.45 * alpha),
            {
              width: readActive ? 4.5 : 3,
              alpha,
            },
          ),
          glowPill(
            showJob7.value > 0.4
              ? 'Read by saved key -> job-7 running at 14:08'
              : readActive
                ? 'Read by saved key'
                : 'STATUS READS: ALLOWED',
            0,
            botY + 52,
            readActive ? ROLE.sure : ROLE.agent,
            { size: 26, alpha },
          ),
        );

        // Measured calls badge once observed
        if (showJob7.value > 0.5) {
          nodes.push(
            glowPill('Measured after timeout: 1 read · 0 further writes', 0, 248, ROLE.sure, {
              size: 26,
              alpha: showJob7.value * alpha,
            }),
          );
        }

        // Bottom prompt / final report (strictly withholds final report until revealFinal > 0.5!)
        const capY = 320;
        if (revealFinal.value > 0.5) {
          nodes.push(
            glowPill(
              'At 14:08, job-7 was running · Check worker for final outcome',
              0,
              capY,
              ROLE.sure,
              {
                size: 28,
                alpha: revealFinal.value * alpha,
              },
            ),
          );
        } else if (askOperator.value > 0.4) {
          nodes.push(
            txt(
              'Look at the last reply. What can you tell the operator?',
              0,
              capY,
              32,
              ROLE.mark,
              'serif',
              'center',
            )
              .glow(7, ROLE.mark)
              .opacity(askOperator.value * alpha * (0.8 + 0.2 * pulse)),
          );
        } else if (askCall.value > 0.4 && !readActive) {
          nodes.push(
            txt('Which call can the agent make now?', 0, capY, 34, ROLE.mark, 'serif', 'center')
              .glow(7, ROLE.mark)
              .opacity(askCall.value * alpha * (0.8 + 0.2 * pulse)),
          );
        } else {
          nodes.push(
            txt(
              'Write approval withdrawn, replay contract active, status reads allowed.',
              0,
              capY,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      }

      nodes.push(
        lowerFooter(
          'DEADLINE · FRESHNESS · DISPOSITIONS · PERMISSION',
          st === 3 && revealFinal.value > 0.5
            ? '14:08: JOB-7 RUNNING (1 READ, 0 WRITES)'
            : st === 2
              ? '60% COMPLETE · 90% ACCEPTABLE'
              : 'VERIFY BEFORE ACTING OR REPORTING',
          { accent: ROLE.sure, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.sure, ROLE.agent), title, layer);

  // Stage 0 cues
  playCue(s, c, 'replay-allowed', (d) => s.play(showWait.to(0.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'transfer-wait', (d) => s.play(showWait.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'sampled-jitter', (d) => s.play(showJit.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'remain', (d) => s.play(showRem.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'predict', (d) => s.play(askDeadline.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'transfer-stop', (d) => s.play(slideJit.to(1, { duration: d })), { dur: 0.55 });
  // Strict prediction withholding #1: reveal 1.5s > 1.4s ONLY AFTER 'transfer-verdict'!
  playCue(s, c, 'transfer-verdict', (d) => s.play(revealVerdict.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'separate-permission', (d) => s.play(revealVerdict.to(1, { duration: d })), {
    dur: 0.35,
  });

  // Stage 1 cues
  playCue(
    s,
    c,
    'old-observation',
    (d) => s.play(stage.to(1, { duration: 0.15 }), showPolicy.to(0.5, { duration: d })),
    {
      dur: 0.4,
    },
  );
  playCue(s, c, 'policy', (d) => s.play(showPolicy.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'not-now', (d) => s.play(showStale.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'transfer-stale', (d) => s.play(showStale.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'dated', (d) => s.play(showStale.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'no-new-key', (d) => s.play(showStale.to(1, { duration: d })), { dur: 0.35 });

  // Stage 2 cues
  playCue(s, c, 'hundred-runs', (d) => s.play(stage.to(2, { duration: 0.15 })), { dur: 0.3 });
  playCue(s, c, 'outcomes', (d) => s.play(show60.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'degraded-outcome', (d) => s.play(show12.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'handoff-outcome', (d) => s.play(show18.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'unresolved-outcome', (d) => s.play(show10.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'completion-rate', (d) => s.play(showRates.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'disposition-rate', (d) => s.play(showRates.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'not-erase', (d) => s.play(showRates.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'unique-runs', (d) => s.play(showRates.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'track-separately', (d) => s.play(showTraces.to(0.6, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'protected-traces', (d) => s.play(showTraces.to(1, { duration: d })), { dur: 0.4 });

  // Stage 3 cues
  playCue(
    s,
    c,
    'fresh-run',
    (d) => s.play(stage.to(3, { duration: 0.15 }), showRev22.to(0.5, { duration: d })),
    {
      dur: 0.4,
    },
  );
  playCue(s, c, 'fresh-write', (d) => s.play(showRev22.to(0.8, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'fresh-timeout', (d) => s.play(showRev22.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'contract-live', (d) => s.play(showRev22.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'withdrawn', (d) => s.play(showWithdrawn.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'can-read', (d) => s.play(showWithdrawn.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'choose-call', (d) => s.play(askCall.to(1, { duration: d })), { dur: 0.45 });
  // Strict prediction withholding #2: reveal Read by saved key ONLY AFTER 'read-key'!
  playCue(s, c, 'read-key', (d) => s.play(revealRead.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'observed', (d) => s.play(showJob7.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'harness', (d) => s.play(showJob7.to(0.9, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'measured', (d) => s.play(showJob7.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'tell-operator', (d) => s.play(askOperator.to(1, { duration: d })), { dur: 0.45 });
  // Strict prediction withholding #3: reveal final report ONLY AFTER 'final-report'!
  playCue(s, c, 'final-report', (d) => s.play(revealFinal.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'worker-result', (d) => s.play(revealFinal.to(1, { duration: d })), { dur: 0.35 });
}
