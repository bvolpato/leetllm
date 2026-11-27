// Scene 3: arrival-schedule - When does the next request go out?
// Dual-channel open-loop vs closed-loop client-slot oscilloscope tracking r03 (705..1220)
// and r04 (due 760, sent 765 open-loop vs 1300 closed-loop after 80 ms think time).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SERVING_COHORT,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  glowDot,
  glowingTrail,
  guardedDynamic,
  spanBracket,
  timeAxisNodes,
  txt,
} from '../parts.mjs';

export default function arrivalSchedule(s, c) {
  const openProg = s.value(0);
  const thinkProg = s.value(0);
  const replayMark = s.value(0);

  const longR = SERVING_COHORT[2]; // r03: sent 705, terminal 1220
  const shortR = SERVING_COHORT[3]; // r04: scheduled 760, sent 765, terminal 1310
  const thinkMs = 80;
  const closedNext = longR.terminal + thinkMs; // 1300

  const header = cinemaHeader('CLIENT-SLOT TIMELINE', 'When does the next', 'request go out?', {
    x: -860,
    y: -435,
    accent: ROLE.open,
    size: 50,
  });

  const stageAura = aura(140, 20, 680, '#5ce1e61c', '#ffd16614');

  const oscView = guardedDynamic(
    () => 1,
    () => {
      const op = openProg.value;
      const th = thinkProg.value;
      const rm = replayMark.value;

      const xLeft = -520;
      const xRight = 820;
      const minMs = 680;
      const maxMs = 1360;
      const xOf = (ms) => xLeft + ((ms - minMs) / (maxMs - minMs)) * (xRight - xLeft);

      const openY = -95;
      const openR4Y = -175;
      const closedY = 195;

      const nodes = [];

      // Gold vertical due-time curtain at r04 scheduled = 760 ms
      const xDue = xOf(shortR.scheduled);
      nodes.push(
        dashedRule(xDue, -255, xDue, 305, ROLE.window, 0.85, 2.8),
        txt(`r04 due ${shortR.scheduled} ms`, xDue, -286, 26, ROLE.window, 'mono').glow(
          6,
          ROLE.window,
        ),
      );

      // UPPER LANE: Open-loop stored schedule
      nodes.push(
        txt('OPEN-LOOP', -860, openY - 30, 28, ROLE.open, 'mono', 'left').glow(5, ROLE.open),
        txt('Stored schedule', -860, openY + 14, 26, COSMOS.muted, 'sans', 'left'),
        line([xLeft, openY], [xRight, openY], { stroke: '#223052', width: 2.0 }),
        glowingTrail(
          [
            [xOf(longR.sent), openY],
            [xOf(longR.terminal), openY],
          ],
          { color: ROLE.workload, width: 7.0, glow: 9 },
        ),
        glowDot(xOf(longR.sent), openY, { radius: 8, color: ROLE.send, glow: 10 }),
        glowDot(xOf(longR.terminal), openY, { radius: 8, color: ROLE.reply, glow: 10 }),
        txt(`r03 sent ${longR.sent}`, xOf(longR.sent), openY + 46, 26, ROLE.send, 'mono'),
        txt(`r03 done ${longR.terminal}`, xOf(longR.terminal), openY + 46, 26, ROLE.reply, 'mono'),
      );

      // r04 independent slot firing at 765 ms
      if (op > 0.02) {
        const endMs = shortR.sent + op * (shortR.terminal - shortR.sent);
        nodes.push(
          line([xLeft, openR4Y], [xRight, openR4Y], { stroke: '#192540', width: 1.6 }).opacity(op),
          glowingTrail(
            [
              [xOf(shortR.sent), openR4Y],
              [xOf(endMs), openR4Y],
            ],
            { color: ROLE.open, width: 6.5, glow: 10, opacity: op },
          ),
          glowDot(xOf(shortR.sent), openR4Y, {
            radius: 8,
            color: ROLE.send,
            glow: 10,
            opacity: op,
          }),
          glowDot(xOf(endMs), openR4Y, { radius: 7, color: '#ffffff', glow: 10, opacity: op }),
          txt(
            `r04 sent ${shortR.sent} ms (free slot)`,
            xOf(shortR.sent) + 235,
            openR4Y - 38,
            26,
            ROLE.open,
            'mono',
          ).opacity(op),
        );
      }

      // LOWER LANE: Closed-loop 1 virtual user
      nodes.push(
        txt('CLOSED-LOOP', -860, closedY - 30, 28, ROLE.closed, 'mono', 'left').glow(
          5,
          ROLE.closed,
        ),
        txt('1 virtual user', -860, closedY + 14, 26, COSMOS.muted, 'sans', 'left'),
        line([xLeft, closedY], [xRight, closedY], { stroke: '#223052', width: 2.0 }),
        glowingTrail(
          [
            [xOf(longR.sent), closedY],
            [xOf(longR.terminal), closedY],
          ],
          { color: ROLE.workload, width: 7.0, glow: 9 },
        ),
        glowDot(xOf(longR.sent), closedY, { radius: 8, color: ROLE.send, glow: 10 }),
        glowDot(xOf(longR.terminal), closedY, { radius: 8, color: ROLE.reply, glow: 10 }),
        txt('Slot busy with r03', xOf(960), closedY - 40, 26, ROLE.workload, 'mono'),
      );

      // 80 ms think time extending to 1300 ms
      if (th > 0.02) {
        const curThink = longR.terminal + thinkMs * th;
        nodes.push(
          glowingTrail(
            [
              [xOf(longR.terminal), closedY],
              [xOf(curThink), closedY],
            ],
            { color: ROLE.focus, width: 7.0, glow: 10, opacity: th },
          ),
          glowDot(xOf(curThink), closedY, {
            radius: 8.5,
            color: ROLE.focus,
            glow: 12,
            opacity: th,
          }),
        );
        if (th > 0.6) {
          nodes.push(
            txt(`+80 ms think`, xOf(1260), closedY - 82, 26, ROLE.focus, 'mono').opacity(th),
            txt(
              `next send ${closedNext}`,
              xOf(closedNext) - 36,
              closedY + 50,
              26,
              ROLE.focus,
              'mono',
            )
              .glow(6, ROLE.focus)
              .opacity(th),
          );
        }
      }

      // Shared millisecond time axis at bottom
      nodes.push(
        ...timeAxisNodes(
          xLeft,
          xRight,
          316,
          minMs,
          maxMs,
          [700, 800, 900, 1000, 1100, 1200, 1300],
          {
            format: (v) => `${v}`,
          },
        ),
        txt('CLIENT CLOCK (MS)', -860, 316, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Highlight two marks (due vs actual send) on arrival-replay
      if (rm > 0.05) {
        nodes.push(
          ...spanBracket(xOf(shortR.scheduled), xOf(shortR.sent), -30, '', ROLE.focus, {
            opacity: rm,
          }),
          txt(
            'KEEP BOTH MARKS FOR r04: DUE (760 ms) & ACTUAL SEND (765 ms)',
            0,
            428,
            28,
            ROLE.focus,
            'mono',
          )
            .glow(6, ROLE.focus)
            .opacity(rm),
        );
      } else {
        nodes.push(
          txt(
            th > 0.3
              ? 'Closed-loop shifts arrival from 760 ms to 1300 ms when r03 slows down'
              : 'Open-loop keeps offered arrivals independent of earlier completions',
            0,
            428,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, oscView);

  c.on('arrival-independent', () => {
    const t = c.cue('arrival-independent').start;
    s.play(openProg.to(1, { duration: clampDur(c, t, 0.9) }));
  });
  c.on('arrival-think', () => {
    const t = c.cue('arrival-think').start;
    s.play(thinkProg.to(1, { duration: clampDur(c, t, 0.85) }));
  });
  c.on('arrival-replay', () => {
    const t = c.cue('arrival-replay').start;
    s.play(replayMark.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
