// Scene 18: batch-recovery - Keep expiry and recovery inside one deadline
// Mode 0: 48h timeline horizon (24h provider batch window + 4h recovery reserve; $2.82 warm / $5.70 cold).
// Mode 1: 10-job expiry constellation (6 emerald COMPLETE locked in bill, 4 rose EXPIRED detaching to recovery).
// Mode 2: 3h remaining < 4h recovery reserve -> clock breach warning + cold-input recovery pricing.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  coldEvaluationMicro,
  dashedRule,
  driftValue,
  evaluationMicro,
  fadeInHalf,
  fadeOutHalf,
  glowBar,
  guardedDynamic,
  txt,
  usd,
} from '../parts.mjs';

export default function batchRecovery(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = 48h horizon, 1 = 10-job partial expiry, 2 = 3h < 4h breach
  const p0 = s.value(0);
  const p1 = s.value(0);
  const p2 = s.value(0);

  const header = cinemaHeader('BATCH EXPIRY & RECOVERY', 'Budget recovery', 'inside the deadline', {
    x: -860,
    y: -415,
    accent: ROLE.batch,
    size: 52,
  });

  const sceneAura = aura(0, 50, 700, '#60a5fa20', '#ff6b8b1a');

  // Mode 0: 48h Internal Deadline Horizon
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const u = p0.value;
      const barX = -820;
      const barW = 1640;
      const x24 = barX + barW * 0.5;
      const x28 = barX + barW * (28 / 48);

      const nodes = [
        txt('INTERNAL TASK DEADLINE: 48 HOURS', -820, -180, 30, COSMOS.ink, 'mono', 'left').opacity(
          a,
        ),

        // Base 48h track
        rect(barW, 74, { fill: '#0f172b', stroke: '#34466e', width: 2.2, radius: 12 })
          .at(0, -60)
          .opacity(a),

        // 24h provider batch window (blue)
        rect(barW * 0.5 * Math.max(0.25, u), 66, {
          fill: '#142d52',
          stroke: ROLE.batch,
          width: 2.6,
          radius: 10,
        })
          .at(barX + barW * 0.25 * Math.max(0.25, u), -60)
          .glow(9, ROLE.batch)
          .opacity(a),
        txt('24h Provider Window', barX + barW * 0.25, -130, 28, ROLE.batch, 'mono').opacity(a),

        // 4h recovery reserve (amber)
        rect((barW * 4) / 48, 66, { fill: '#3d2810', stroke: ROLE.held, width: 2.6, radius: 8 })
          .at(x24 + (barW * 2) / 48, -60)
          .glow(9, ROLE.held)
          .opacity(Math.max(0.25, u) * a),

        // Hour markers
        dashedRule(x24, -108, x24, 18, ROLE.batch, { width: 2, opacity: a }),
        dashedRule(x28, -108, x28, 18, ROLE.held, { width: 2, opacity: a }),
        txt('0 h', barX, 42, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('24 h', x24, 42, 26, ROLE.batch, 'mono').opacity(a),
        txt('28 h (+4h recovery)', x28 + 14, 42, 26, ROLE.held, 'mono', 'left').opacity(a),
        txt('48 h', barX + barW, 42, 26, ROLE.ok, 'mono', 'right').opacity(a),

        txt(
          'Offline task + supported model/endpoint + deadline covering provider + recovery',
          0,
          178,
          28,
          ROLE.cached,
          'sans',
        ).opacity(a),
        txt(
          `Estimate: ${usd(evaluationMicro)} warm  ·  ${usd(coldEvaluationMicro)} cold`,
          0,
          288,
          38,
          ROLE.ok,
          'mono',
        )
          .glow(8, ROLE.ok)
          .opacity(Math.max(0.3, u) * a),
        txt(
          'Verify actual service rates & cache reads when receipts arrive',
          0,
          378,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  // Modes 1 & 2: 10-Job Expiry Constellation -> 3h remaining vs 4h reserve
  const mode12 = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const isBeat2 = mode.value > 1.5;
      const u1 = p1.value;
      const u2 = p2.value;

      const nodes = [
        txt(
          isBeat2
            ? 'CLOCK CHECK BEFORE RETRY: 3 HOURS REMAINING'
            : 'BATCH EXPIRY: 6 COMPLETED  ·  4 MISSING',
          -840,
          -195,
          28,
          isBeat2 ? ROLE.fail : ROLE.cached,
          'mono',
          'left',
        )
          .glow(6, isBeat2 ? ROLE.fail : ROLE.cached)
          .opacity(a),
      ];

      // 10 jobs in 2 rows of 5
      for (let i = 0; i < 10; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const cx = -670 + col * 335;
        const cy = -88 + row * 150;
        const ok = i < 6;
        const stroke = ok ? ROLE.ok : isBeat2 ? ROLE.fail : ROLE.output;
        const fill = ok ? '#0d2620' : '#351324';

        nodes.push(
          rect(280, 102, { fill, stroke, width: 2.4, radius: 12 })
            .at(cx, cy)
            .glow(ok ? 6 : 9, stroke)
            .opacity(a),
          txt(`Job ${i + 1}`, cx, cy - 18, 28, stroke, 'mono').opacity(a),
          txt(ok ? 'BILLED · DONE' : 'EXPIRED', cx, cy + 22, 26, COSMOS.ink, 'mono').opacity(a),
        );

        // Detach only the 4 expired jobs into recovery queue
        if (!ok && (u1 > 0.2 || isBeat2)) {
          const recAlpha = isBeat2 ? a : u1 * a;
          nodes.push(
            txt(
              isBeat2 ? 'HOLD · MISSES SLA' : 'RECOVER ONLY',
              cx,
              cy + 88,
              26,
              isBeat2 ? ROLE.fail : ROLE.held,
              'mono',
            ).opacity(recAlpha),
          );
        }
      }

      if (isBeat2) {
        nodes.push(
          glowBar(-810, 275, 1620, 32, 3 / 4, {
            fill: ROLE.fail,
            border: ROLE.held,
            glow: 10,
            opacity: Math.max(0.3, u2) * a,
          }),
          txt(
            '3 h remaining  <  4 h recovery reserve  ->  CANNOT USE BATCH',
            0,
            348,
            34,
            ROLE.fail,
            'mono',
          )
            .glow(8, ROLE.fail)
            .opacity(Math.max(0.3, u2) * a),
          txt(
            'Price any eligible recovery route with cold input',
            0,
            412,
            26,
            ROLE.cached,
            'sans',
          ).opacity(a),
        );
      } else {
        nodes.push(
          txt(
            'Keep the 6 completed receipts & IDs  ·  resubmit only the 4 expired jobs',
            0,
            325,
            30,
            ROLE.cached,
            'sans',
          ).opacity(a),
          txt(
            'Any recovery call needs its own budget & error check',
            0,
            392,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode12);
  driftValue(s, c, pulseT, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('te-batch-recovery-0', () => {
    const t = c.cue('te-batch-recovery-0').start;
    s.play(p0.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-batch-recovery-1', () => {
    const t = c.cue('te-batch-recovery-1').start;
    s.play(p1.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-batch-recovery-2', () => {
    const t = c.cue('te-batch-recovery-2').start;
    s.play(p2.to(1, { duration: clampDur(c, t, 0.6) }));
  });
}
