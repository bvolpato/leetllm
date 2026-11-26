// Scene 15: state-history - What does Maya need to know now?
// Living incident telemetry spine (540 ms latency vs 500 ms threshold + ordered 4-stage
// state track: requested -> accepted -> completed -> verified):
//   Beats 0-1: Empty history pause -> completed rollback pin lights up -> proposed repeat
//              traces backward into completed work -> next step: verify latency recovery.
//   Beats 2-3: Counterfactual flips ONLY status completed -> accepted (amber, prediction
//              pause!) -> next step shifts to inspect current job status.
//   Beat 4: Ordered redacted history + turn & whole-task evaluation horizon.
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowingTrail,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

const STAGES = ['REQUESTED', 'ACCEPTED', 'COMPLETED', 'VERIFIED'];
const STAGE_XS = [-640, -210, 220, 650];

export default function stateHistory(s, c) {
  const pulse = s.value(0);
  const metricsOn = s.value(0);
  const completedOn = s.value(0);
  const traceBackOn = s.value(0);
  const verifyRecOn = s.value(0);
  const acceptedMode = s.value(0); // flips completed -> accepted counterfactual
  const inspectJobOn = s.value(0);
  const provOn = s.value(0);
  const orderOn = s.value(0);
  const taskTurnOn = s.value(0);

  const header = cinemaHeader(
    'MULTI-TURN STATE & TOOL LOGS',
    'What does Maya need',
    'to know right now?',
    { accent: ROLE.stepwise, size: 50 },
  );

  const stageAura = aura(120, 40, 640, '#5ce1e61c', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const mt = metricsOn.value;
      const cm = completedOn.value;
      const tb = traceBackOn.value;
      const vr = verifyRecOn.value;
      const am = acceptedMode.value;
      const ij = inspectJobOn.value;
      const pv = provOn.value;
      const od = orderOn.value;
      const tt = taskTurnOn.value;
      const nodes = [];

      // Top right: Proposed reply + Latency waveform (540 ms vs 500 ms threshold)
      nodes.push(
        txt(
          'MAYA: “What now?”   ·   ASSISTANT: “Run the rollback procedure.”',
          -840,
          -175,
          28,
          ROLE.stepwise,
          'sans',
          'left',
        ),
      );

      if (mt > 0.05) {
        // Mini glowing latency oscilloscope on top right
        const ox = 250;
        const baseY = -305;
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const u = i / 24;
          const spike = Math.exp(-Math.pow((u - 0.55) / 0.16, 2)) * 75;
          pts.push([ox + u * 540, baseY - 12 - spike + Math.sin(u * 12 + p * 3) * 4]);
        }
        nodes.push(
          line([ox, baseY - 58], [ox + 540, baseY - 58], {
            stroke: ROLE.conflict,
            width: 2,
            dash: [6, 6],
          }).opacity(mt * 0.85),
          glowingTrail(pts, { color: ROLE.conflict, width: 3.4, opacity: mt }),
          txt(
            '540 ms  >  500 ms THRESHOLD',
            ox + 270,
            baseY - 110,
            26,
            ROLE.conflict,
            'mono',
            'center',
          ).opacity(mt),
        );
      }

      // Main Horizontal Incident State Track (y = 25)
      const trackY = 25;
      nodes.push(
        line([STAGE_XS[0], trackY], [STAGE_XS[3], trackY], { stroke: '#2a3a62', width: 6 }),
      );

      const isAcceptedCase = am > 0.45;
      const activeIdx = cm < 0.35 ? -1 : isAcceptedCase ? 1 : 2;

      if (activeIdx >= 0) {
        const endX = STAGE_XS[activeIdx];
        const barCol = isAcceptedCase ? ROLE.verdict : ROLE.ok;
        nodes.push(
          line([STAGE_XS[0], trackY], [endX, trackY], { stroke: barCol, width: 6 }).glow(
            10,
            barCol,
          ),
        );
      }

      STAGES.forEach((st, i) => {
        const x = STAGE_XS[i];
        let col = '#3d4f7a';
        let active = false;
        if (i <= activeIdx) {
          col = isAcceptedCase && i === 1 ? ROLE.verdict : ROLE.ok;
          active = true;
        }
        if (i === 3 && vr > 0.4 && !isAcceptedCase) {
          col = ROLE.ok;
        }
        nodes.push(
          circle(active ? 22 : 18, { fill: '#0b1224', stroke: col, width: active ? 4 : 2.5 })
            .at(x, trackY)
            .glow(active ? 10 : 0, col),
          txt(st, x, trackY - 52, 26, active ? col : COSMOS.dim, 'mono', 'center'),
        );
      });

      // Moving state cursor
      if (activeIdx >= 0) {
        nodes.push(
          glowDot(STAGE_XS[activeIdx], trackY, {
            radius: 9,
            color: isAcceptedCase ? ROLE.verdict : ROLE.ok,
            glow: 14,
          }),
        );
      }

      // Status caption & branching diagnostics below the track
      if (cm < 0.35) {
        nodes.push(
          txt(
            'JOB HISTORY: EMPTY / UNKNOWN',
            0,
            trackY + 76,
            30,
            ROLE.verdict,
            'mono',
            'center',
          ).glow(6, ROLE.verdict),
          txt(
            'Can you tell if “Run rollback” advances the incident?',
            0,
            trackY + 136,
            32,
            COSMOS.ink,
            'serif',
            'center',
          ),
        );
      } else if (!isAcceptedCase) {
        // Completed rollback state (Beat 1): put receipt banner ABOVE track, zero arc crossings!
        nodes.push(
          txt(
            'TRUSTED RECEIPT: status = COMPLETED  (caller · deploy · op · time verified)',
            0,
            trackY - 110,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(cm),
          txt(
            'VERIFIED RECORD: exec_id=rb-41 · no later change',
            0,
            trackY + 265,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(cm),
        );
        if (tb > 0.05) {
          // Red backward arc tracing "Run rollback" back to REQUESTED
          const backArc = quadArcPts([STAGE_XS[2], trackY + 28], [STAGE_XS[0], trackY + 28], 105);
          nodes.push(
            beamWithPhotons(backArc, ROLE.conflict, p * 1.2, { alpha: tb, width: 3.6 }),
            txt('Repeats finished work!', -220, trackY + 172, 28, ROLE.conflict, 'mono', 'center')
              .glow(7, ROLE.conflict)
              .opacity(tb),
          );
        }
        if (vr > 0.05) {
          // Straight glowing emerald advance along track from COMPLETED -> VERIFIED
          nodes.push(
            beamWithPhotons(
              [
                [STAGE_XS[2] + 28, trackY],
                [STAGE_XS[3] - 28, trackY],
              ],
              ROLE.ok,
              p * 1.2 + 0.5,
              { alpha: vr, width: 5 },
            ),
            txt('NEXT: CHECK LATENCY', 450, trackY + 172, 28, ROLE.ok, 'mono', 'center')
              .glow(8, ROLE.ok)
              .opacity(vr),
          );
        }
      } else {
        // Accepted counterfactual (Beats 2-4)
        nodes.push(
          txt(
            'CHANGED FIELD ONLY: status = ACCEPTED  (job may be queued)',
            0,
            trackY + 72,
            28,
            ROLE.verdict,
            'mono',
            'center',
          ).glow(7, ROLE.verdict),
        );
        if (ij < 0.05) {
          // Strict prediction withholding!
          nodes.push(
            txt(
              'What should Maya inspect now to learn if rollback finished?',
              0,
              trackY + 150,
              32,
              ROLE.verdict,
              'serif',
              'center',
            ).glow(6, ROLE.verdict),
          );
        } else {
          nodes.push(
            txt(
              'NEXT STEP: CHECK CURRENT JOB STATUS (BY EXECUTION ID)',
              0,
              trackY + 150,
              30,
              ROLE.stepwise,
              'mono',
              'center',
            )
              .glow(8, ROLE.stepwise)
              .opacity(ij),
          );
        }
        if (pv > 0.05) {
          nodes.push(
            txt(
              'HTTP 200 != COMPLETED · CHECK SERVICE COMPLETION DEFINITION',
              0,
              trackY + 215,
              26,
              COSMOS.muted,
              'mono',
              'center',
            ).opacity(pv),
          );
        }
      }

      // Bottom Beat 4 summary rail
      if (od > 0.05 || tt > 0.05) {
        nodes.push(
          txt(
            tt > 0.4
              ? 'SCORE BOTH: THIS TURN + WHOLE-TASK VERIFIED RECOVERY  (REDACT RESTRICTED DATA)'
              : 'KEEP REQUESTS, TOOL CALLS & TRUSTED RESULTS IN ORDER',
            0,
            375,
            26,
            tt > 0.4 ? ROLE.policy : ROLE.stepwise,
            'mono',
            'center',
          )
            .glow(6, tt > 0.4 ? ROLE.policy : ROLE.stepwise)
            .opacity(Math.max(od, tt)),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('state-repeat', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('state-repeat').start, 0.25) }));
  });
  c.on('state-unknown', () => {
    s.play(pulse.to(0.6, { duration: clampDur(c, c.cue('state-unknown').start, 0.25) }));
  });
  c.on('state-metrics', () => {
    s.play(metricsOn.to(1, { duration: clampDur(c, c.cue('state-metrics').start, 0.35) }));
  });
  c.on('state-completed', () => {
    s.play(completedOn.to(1, { duration: clampDur(c, c.cue('state-completed').start, 0.4) }));
  });
  c.on('trace-repeat', () => {
    s.play(traceBackOn.to(1, { duration: clampDur(c, c.cue('trace-repeat').start, 0.35) }));
  });
  c.on('verify-recovery', () => {
    s.play(verifyRecOn.to(1, { duration: clampDur(c, c.cue('verify-recovery').start, 0.35) }));
  });
  c.on('new-receipt', () => {
    s.play(acceptedMode.to(0.5, { duration: clampDur(c, c.cue('new-receipt').start, 0.25) }));
  });
  c.on('accepted-only', () => {
    s.play(acceptedMode.to(1, { duration: clampDur(c, c.cue('accepted-only').start, 0.35) }));
  });
  c.on('accepted-question', () => {
    s.play(acceptedMode.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding: reveal "Check the current job status" AFTER spoken clause!
  c.after('inspect-job', () => {
    s.play(inspectJobOn.to(1, { duration: clampDur(c, c.cue('inspect-job').end, 0.35) }));
  });
  c.on('receipt-provenance', () => {
    s.play(provOn.to(1, { duration: clampDur(c, c.cue('receipt-provenance').start, 0.35) }));
  });
  c.on('ordered-history', () => {
    s.play(orderOn.to(1, { duration: clampDur(c, c.cue('ordered-history').start, 0.35) }));
  });
  c.on('task-and-turn', () => {
    s.play(taskTurnOn.to(1, { duration: clampDur(c, c.cue('task-and-turn').start, 0.35) }));
  });
}
