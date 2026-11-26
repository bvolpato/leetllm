// Scene 1: intro - When can the next question leave?
// Signature dual-mode cinema opener: glowing client/help-desk signal exchange crossfading into
// a dual-channel Closed-Loop vs Open-Loop arrival oscilloscope with strict prediction withholding.
import { circle, group, line, par, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  arrivalComparison,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowingTrail,
  guardedDynamic,
  radialGauge,
  timeAxisNodes,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const replyProg = s.value(0);
  const followProg = s.value(0);
  const chartMode = s.value(0); // 0 = live client/desk exchange, 1 = oscilloscope comparison
  const slowdown = s.value(0); // 0 = fast replies, 1 = slow replies
  const revealCutoff = s.value(0); // strictly AFTER desk-cutoff
  const revealCount = s.value(0); // strictly AFTER desk-count
  const openSweep = s.value(0); // 0 -> 1 during desk-schedule
  const revealSix = s.value(0); // strictly AFTER desk-six
  const replayFocus = s.value(0); // desk-replay

  const header = cinemaHeader('OPEN-LOOP VS CLOSED-LOOP', 'When can the next', 'question leave?', {
    x: -860,
    y: -435,
    accent: ROLE.open,
    size: 50,
  });

  const bgAura = aura(160, 20, 680, '#5ce1e622', '#a78bfa18');

  // Mode 0: Glowing signal exchange between Test Client and Help Desk
  const exchangeView = guardedDynamic(
    () => fadeOutHalf(chartMode.value),
    (a) => {
      const rp = replyProg.value;
      const fp = followProg.value;
      const ph = phase.value;
      const nodes = [];

      // Left node: Help Desk server tower beacon
      const deskX = -500;
      const deskY = 70;
      nodes.push(
        radialGauge(deskX, deskY, 118, 0.35 + 0.55 * rp, ROLE.reply, {
          width: 8,
          glow: 10,
          opacity: a,
        }),
        txt('HELP DESK', deskX, deskY - 14, 28, ROLE.reply, 'mono')
          .glow(6, ROLE.reply)
          .opacity(a),
        txt('SERVER', deskX, deskY + 26, 26, COSMOS.muted, 'mono').opacity(a),
      );

      // Right node: Test Client emitter beacon
      const cliX = 500;
      const cliY = 70;
      nodes.push(
        radialGauge(cliX, cliY, 118, 0.5 + 0.45 * fp, ROLE.send, {
          width: 8,
          glow: 10,
          opacity: a,
        }),
        txt('TEST CLIENT', cliX, cliY - 14, 28, ROLE.send, 'mono')
          .glow(6, ROLE.send)
          .opacity(a),
        txt('1 SLOT', cliX, cliY + 26, 26, COSMOS.muted, 'mono').opacity(a),
      );

      // Upper beam: Client -> Desk ("Is checkout down?")
      const q1Pts = [
        [cliX - 132, deskY - 96],
        [0, deskY - 160],
        [deskX + 132, deskY - 96],
      ];
      nodes.push(
        beamWithPhotons(q1Pts, ROLE.send, ph * 0.7, {
          width: 4.0,
          glow: 9,
          photonCount: 2,
          alpha: a,
        }),
        txt('"Is checkout down?"', 0, deskY - 196, 36, ROLE.send, 'sans')
          .glow(6, ROLE.send)
          .opacity(a),
      );

      // Middle beam: Desk -> Client ("Yes.") when replyProg > 0
      if (rp > 0.04) {
        const rx = deskX + 132 + (cliX - deskX - 264) * rp;
        nodes.push(
          glowingTrail(
            [
              [deskX + 132, deskY],
              [rx, deskY],
            ],
            { color: ROLE.reply, width: 5.0, glow: 10, opacity: a * rp },
          ),
          glowDot(rx, deskY, { radius: 8, color: '#ffffff', glow: 12, opacity: a * rp }),
          txt('"Yes."', 0, deskY - 42, 36, ROLE.reply, 'sans')
            .glow(6, ROLE.reply)
            .opacity(a * rp),
        );
      } else {
        // Pulsing wait indicator at Desk
        for (let i = 0; i < 3; i++) {
          const lift = Math.max(0, Math.sin(ph * 5.2 - i * 0.85));
          nodes.push(
            glowDot(-36 + i * 36, deskY - 12 * lift, {
              radius: 7,
              color: ROLE.reply,
              glow: 8,
              opacity: a * 0.85,
            }),
          );
        }
        nodes.push(txt('Waiting for reply...', 0, deskY + 42, 26, COSMOS.muted, 'mono').opacity(a));
      }

      // Lower beam: Next question ("Since when?") held as draft until followProg > 0
      const q2Y = deskY + 185;
      if (fp < 0.05) {
        nodes.push(
          dashedRule(deskX + 132, q2Y, cliX - 132, q2Y, COSMOS.dim, 0.6 * a, 2.4),
          txt('DRAFT READY: "Since when?"', 0, q2Y + 46, 30, COSMOS.muted, 'mono').opacity(a),
        );
      } else {
        const fx = cliX - 132 - (cliX - deskX - 264) * fp;
        nodes.push(
          glowingTrail(
            [
              [cliX - 132, q2Y],
              [fx, q2Y],
            ],
            { color: ROLE.send, width: 5.0, glow: 10, opacity: a * fp },
          ),
          glowDot(fx, q2Y, { radius: 8, color: '#ffffff', glow: 12, opacity: a * fp }),
          txt('SENT: "Since when?"', 0, q2Y + 46, 32, ROLE.send, 'mono')
            .glow(6, ROLE.send)
            .opacity(a * fp),
        );
      }

      nodes.push(
        txt(
          'Closed-loop client: the previous reply releases the next send',
          0,
          420,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1: Dual-channel Arrival Oscilloscope (Closed-Loop vs Open-Loop)
  const oscView = guardedDynamic(
    () => fadeInHalf(chartMode.value),
    (a) => {
      const slow = slowdown.value;
      const cutRev = revealCutoff.value;
      const cntRev = revealCount.value;
      const oSw = openSweep.value;
      const sixRev = revealSix.value;
      const repFoc = replayFocus.value;

      const traffic = arrivalComparison(slow);
      const xLeft = -455;
      const xRight = 775;
      const maxMs = 3000;
      const xOf = (ms) => xLeft + (ms / maxMs) * (xRight - xLeft);
      const xCut = xOf(traffic.horizon);
      const nodes = [];

      // Cutoff laser curtain at 2.0 s (split across upper and lower lanes so it never touches axis labels)
      nodes.push(
        dashedRule(xCut, -240, xCut, -6, ROLE.window, 0.9 * a, 3.0),
        txt('2.0 s WINDOW CLOSES', xCut, -274, 26, ROLE.window, 'mono')
          .glow(6, ROLE.window)
          .opacity(a),
      );

      // UPPER LANE: One waiting client (closed-loop)
      const topBaseY = -165;
      const rowStep = 40;
      nodes.push(
        txt('ONE WAITING CLIENT', -860, topBaseY + 12, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('Closed-loop handoff', -860, topBaseY + 56, 26, ROLE.reply, 'sans', 'left').opacity(a),
      );

      const inWindow = traffic.closed.filter((r) => r.start < traffic.horizon);
      const visibleClosed = cutRev > 0.2 ? inWindow : traffic.closed.slice(0, 3);

      visibleClosed.forEach((r, i) => {
        const yy = topBaseY + i * rowStep;
        // Before desk-cutoff, withhold R3's reply completion so viewer predicts whether R4 fits!
        const endMs = i === 2 && cutRev < 0.2 ? r.start + 12 : r.end;
        nodes.push(
          line([xLeft, yy], [xRight, yy], { stroke: '#19233c', width: 1.6 }).opacity(a),
          txt(r.id, xLeft - 24, yy, 26, COSMOS.muted, 'mono', 'right').opacity(a),
        );
        if (endMs > r.start + 1) {
          nodes.push(
            glowingTrail(
              [
                [xOf(r.start), yy],
                [xOf(endMs), yy],
              ],
              { color: ROLE.workload, width: 6.0, glow: 8, opacity: a },
            ),
          );
        }
        nodes.push(
          glowDot(xOf(r.start), yy, { radius: 6.8, color: ROLE.send, glow: 9, opacity: a }),
        );
        if (i !== 2 || cutRev >= 0.2) {
          nodes.push(
            glowDot(xOf(r.end), yy, { radius: 6.5, color: ROLE.reply, glow: 9, opacity: a }),
          );
        }
        if (i > 0) {
          nodes.push(
            line([xOf(r.start), yy - rowStep], [xOf(r.start), yy], {
              stroke: ROLE.reply,
              width: 2.6,
            }).opacity(0.85 * a),
          );
        }
      });

      // Prediction prompt before desk-cutoff
      if (cutRev < 0.2) {
        const r3 = traffic.closed[2];
        const pulse = 0.72 + 0.28 * Math.sin(phase.value * 5.0);
        nodes.push(
          txt(
            `R3 leaves at 1.0 s  ·  reply takes ${r3.end - r3.start} ms`,
            -520,
            132,
            34,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a),
          txt(
            'PREDICT: Can R4 leave before 2.0 s closes?',
            -520,
            196,
            34,
            ROLE.focus,
            'mono',
            'left',
          )
            .glow(7, ROLE.focus)
            .opacity(a * pulse),
        );
      }

      // Strictly AFTER desk-cutoff: show R4 landing right at 2.0 s
      if (cutRev >= 0.2) {
        const nextR = traffic.closed[inWindow.length];
        if (nextR) {
          const yy = topBaseY + inWindow.length * rowStep;
          nodes.push(
            line([xOf(nextR.start), yy - rowStep], [xOf(nextR.start), yy], {
              stroke: ROLE.fail,
              width: 3.0,
            }).opacity(a * cutRev),
            glowDot(xOf(nextR.start), yy, {
              radius: 7.5,
              color: ROLE.fail,
              glow: 10,
              opacity: a * cutRev,
            }),
            txt('R4 at 2.0 s cutoff', xOf(nextR.start) + 24, yy, 26, ROLE.fail, 'mono', 'left')
              .glow(5, ROLE.fail)
              .opacity(a * cutRev),
          );
        }
      }

      // Strictly AFTER desk-count: reveal 3 sends count
      if (cntRev > 0.05) {
        nodes.push(
          txt(
            `ONLY ${inWindow.length} SENDS COUNT`,
            420,
            topBaseY + 12,
            30,
            ROLE.fail,
            'mono',
            'left',
          )
            .glow(7, ROLE.fail)
            .opacity(a * cntRev),
        );
      }

      nodes.push(
        ...timeAxisNodes(xLeft, xRight, 12, 0, maxMs, [0, 1000, 2000, 3000], {
          format: (v) => `${v / 1000}s`,
          opacity: a,
        }),
      );

      // LOWER LANE: Help desk schedule (open-loop) revealed once cutoff is resolved
      if (cutRev > 0.1) {
        const botBaseY = 120;
        const botStep = 36;
        const maxOpenEnd = Math.max(...traffic.open.map((r) => r.end));
        const openNow = oSw * maxOpenEnd;
        const laneAlpha = a * cutRev;

        nodes.push(
          dashedRule(xCut, botBaseY - 24, xCut, botBaseY + 206, ROLE.window, 0.9 * laneAlpha, 3.0),
          txt('HELP DESK CLOCK', -860, botBaseY + 24, 28, ROLE.open, 'mono', 'left')
            .glow(5, ROLE.open)
            .opacity(laneAlpha),
          txt('Open-loop: 3 req/s', -860, botBaseY + 68, 26, COSMOS.muted, 'sans', 'left').opacity(
            laneAlpha,
          ),
        );

        traffic.open.forEach((r, i) => {
          const yy = botBaseY + i * botStep;
          nodes.push(
            line([xLeft, yy], [xRight, yy], { stroke: '#19233c', width: 1.5 }).opacity(laneAlpha),
            line([xOf(r.start), yy - 9], [xOf(r.start), yy + 9], {
              stroke: COSMOS.dim,
              width: 2.4,
            }).opacity(laneAlpha),
            txt(r.id, xLeft - 24, yy, 26, COSMOS.muted, 'mono', 'right').opacity(laneAlpha),
          );
          if (oSw > 0.01 && r.start <= openNow) {
            const clampedEnd = Math.min(r.end, openNow);
            if (clampedEnd > r.start + 1) {
              nodes.push(
                glowingTrail(
                  [
                    [xOf(r.start), yy],
                    [xOf(clampedEnd), yy],
                  ],
                  { color: ROLE.open, width: 5.5, glow: 8, opacity: laneAlpha },
                ),
              );
            }
            nodes.push(
              glowDot(xOf(r.start), yy, {
                radius: 6.4,
                color: ROLE.send,
                glow: 8,
                opacity: laneAlpha,
              }),
            );
            if (r.end <= openNow) {
              nodes.push(
                glowDot(xOf(r.end), yy, {
                  radius: 6.0,
                  color: ROLE.reply,
                  glow: 8,
                  opacity: laneAlpha,
                }),
              );
            }
          }
        });

        if (sixRev > 0.05) {
          nodes.push(
            txt(
              `${traffic.open.length} SENDS IN 2.0 s`,
              420,
              botBaseY + 20,
              30,
              ROLE.qualified,
              'mono',
              'left',
            )
              .glow(7, ROLE.qualified)
              .opacity(a * sixRev),
          );
        }

        nodes.push(
          ...timeAxisNodes(xLeft, xRight, botBaseY + 225, 0, maxMs, [0, 1000, 2000, 3000], {
            format: (v) => `${v / 1000}s`,
            opacity: laneAlpha,
          }),
        );
      }

      // Bottom legend / replay takeaway
      const bottomMsg =
        repFoc > 0.2
          ? 'Replay the desk arrivals to test whether the server keeps up'
          : 'Cyan dot: send   ·   Violet dot: reply   ·   Gold line: 2.0 s cutoff';
      nodes.push(
        txt(bottomMsg, 0, 444, 28, repFoc > 0.2 ? ROLE.open : COSMOS.muted, 'mono').opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, exchangeView, oscView);
  driftValue(s, c, phase, 10, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0 cues
  c.on('desk-client', () => {
    const t = c.cue('desk-client').start;
    s.play(replyProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('desk-follow-up', () => {
    const t = c.cue('desk-follow-up').start;
    s.play(followProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('desk-slowdown', () => {
    const t = c.cue('desk-slowdown').start;
    s.play(
      par(
        chartMode.to(1, { duration: clampDur(c, t, 0.55) }),
        slowdown.to(1, { duration: clampDur(c, t, 0.9) }),
      ),
    );
  });

  // Beat 1 cues: strict prediction withholding via c.after()
  c.after('desk-cutoff', () => {
    const t = c.cue('desk-cutoff').end;
    s.play(revealCutoff.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('desk-count', () => {
    const t = c.cue('desk-count').end;
    s.play(revealCount.to(1, { duration: clampDur(c, t, 0.3) }));
  });
  c.on('desk-schedule', () => {
    const t = c.cue('desk-schedule').start;
    s.play(openSweep.to(1, { duration: clampDur(c, t, 1.4) }));
  });
  c.after('desk-six', () => {
    const t = c.cue('desk-six').end;
    s.play(revealSix.to(1, { duration: clampDur(c, t, 0.3) }));
  });

  // Beat 2 cue
  c.on('desk-replay', () => {
    const t = c.cue('desk-replay').start;
    s.play(replayFocus.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
