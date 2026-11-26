// Scene 8: stream-timing - Follow one answer to its last event
// Signature glowing Token-Stream Oscilloscope for r01: send (0) -> T1 (240) -> T2..T5
// (280, 320, 440, 480) exposing the 120 ms ITL stall -> Terminal completion (500 ms).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  gaps,
  glowDot,
  glowingTrail,
  guardedDynamic,
  radialGauge,
  spanBracket,
  timeAxisNodes,
  tokenTerminalMs,
  tokenTimes,
  txt,
} from '../parts.mjs';

export default function streamTiming(s, c) {
  const phase = s.value(0);
  const elapsedMs = s.value(0); // 0 -> 240 -> 480 -> 500
  const showMean = s.value(0);

  const first = tokenTimes[0]; // 240
  const last = tokenTimes.at(-1); // 480
  const meanTpot = (last - first) / gaps.length; // 60

  const header = cinemaHeader(
    'TOKEN-STREAM OSCILLOSCOPE',
    'Follow one answer',
    'to its last event',
    {
      x: -860,
      y: -435,
      accent: ROLE.send,
      size: 50,
    },
  );

  const stageAura = aura(100, -10, 680, '#5ce1e620', '#a78bfa18');

  const oscView = guardedDynamic(
    () => 1,
    () => {
      const now = elapsedMs.value;
      const sm = showMean.value;

      const xLeft = -740;
      const xRight = 680;
      const maxMs = 520;
      const xOf = (ms) => xLeft + (ms / maxMs) * (xRight - xLeft);
      const railY = 20;

      const nodes = [];

      // Live oscilloscope clock readout top-right
      const dialX = 685;
      const dialY = -325;
      nodes.push(
        radialGauge(dialX, dialY, 90, Math.min(1, now / tokenTerminalMs), ROLE.send, {
          width: 9,
          glow: 10,
        }),
        txt(`${Math.round(now)}`, dialX, dialY - 12, 40, COSMOS.ink, 'mono').glow(6, ROLE.send),
        txt('ms CLOCK', dialX, dialY + 34, 26, COSMOS.muted, 'mono'),
      );

      // Main oscilloscope rail + active glowing beam
      nodes.push(
        line([xLeft, railY], [xRight, railY], { stroke: '#233254', width: 3.0 }),
        ...timeAxisNodes(xLeft, xRight, railY + 135, 0, maxMs, [0, 100, 200, 300, 400, 500], {
          format: (v) => `${v}ms`,
        }),
      );

      if (now > 1) {
        nodes.push(
          glowingTrail(
            [
              [xOf(0), railY],
              [xOf(now), railY],
            ],
            { color: ROLE.send, width: 6.5, glow: 10 },
          ),
        );
      }

      // Send marker at 0 ms
      nodes.push(
        glowDot(xOf(0), railY, { radius: 10, color: ROLE.send, glow: 12 }),
        txt('Send', xOf(0), railY - 62, 28, ROLE.send, 'mono'),
        txt('0', xOf(0), railY + 52, 26, COSMOS.ink, 'mono'),
      );

      // Token arrival spikes & ITL gap arcs
      tokenTimes.forEach((tk, i) => {
        if (now < tk - 0.5) return;
        const xt = xOf(tk);
        const isAfterStall = i === 3;
        const tokCol = isAfterStall ? ROLE.burst : ROLE.send;

        // Vertical oscilloscope spike (ends cleanly below T1..T5; ITL gap arcs arch OVER T1..T5!)
        nodes.push(
          glowingTrail(
            [
              [xt, railY - 30],
              [xt, railY],
            ],
            { color: tokCol, width: 4.5, glow: 9 },
          ),
          glowDot(xt, railY, { radius: 9.5, color: tokCol, glow: 11 }),
          txt(`T${i + 1}`, xt, railY - 58, 26, tokCol, 'mono'),
          txt(String(tk), xt, railY + 52, 26, COSMOS.ink, 'mono'),
        );

        // Inter-token gap arc arching cleanly OVER the T1..T5 labels!
        if (i > 0) {
          const prevX = xOf(tokenTimes[i - 1]);
          const gMs = gaps[i - 1];
          const isStall = gMs >= 100;
          const arcCol = isStall ? ROLE.burst : ROLE.focus;
          const midX = (prevX + xt) * 0.5;
          const baseArcY = railY - 88;
          const liftY = isStall ? railY - 178 : railY - 138;
          nodes.push(
            glowingTrail(
              [
                [prevX, baseArcY],
                [midX, liftY],
                [xt, baseArcY],
              ],
              { color: arcCol, width: isStall ? 4.4 : 2.8, glow: isStall ? 11 : 6 },
            ),
            txt(`${gMs}`, midX, liftY - 28, isStall ? 30 : 26, arcCol, 'mono').glow(
              isStall ? 7 : 0,
              arcCol,
            ),
          );
        }
      });

      // Terminal completion laser at 500 ms (labels anchored cleanly to the RIGHT of xTerm!)
      if (now >= tokenTerminalMs - 1) {
        const xTerm = xOf(tokenTerminalMs);
        nodes.push(
          dashedRule(xTerm, railY - 115, xTerm, railY + 95, ROLE.terminal, 0.95, 3.6),
          glowDot(xTerm, railY, { radius: 10.5, color: ROLE.terminal, glow: 12 }),
          txt('Terminal', xTerm + 18, railY - 96, 28, ROLE.terminal, 'mono', 'left').glow(
            6,
            ROLE.terminal,
          ),
          txt('500 ms', xTerm + 18, railY + 76, 26, ROLE.terminal, 'mono', 'left'),
        );
      }

      // Three clean floating bottom telemetry readouts (no boxes!)
      const metricY = 278;
      if (now >= first - 1) {
        nodes.push(
          txt('TTFT (T1 - SEND)', -640, metricY, 26, COSMOS.muted, 'mono'),
          txt(`${first} ms`, -640, metricY + 62, 54, ROLE.send, 'mono').glow(9, ROLE.send),
        );
      }
      if (sm > 0.1) {
        nodes.push(
          txt('MEAN TPOT (4 GAPS)', 0, metricY, 26, COSMOS.muted, 'mono').opacity(sm),
          txt(`${meanTpot} ms`, 0, metricY + 62, 54, ROLE.focus, 'mono')
            .glow(9, ROLE.focus)
            .opacity(sm),
          txt('hides 120 ms stall', 0, metricY + 118, 26, ROLE.burst, 'sans').opacity(sm),
        );
      }
      if (now >= tokenTerminalMs - 1) {
        nodes.push(
          txt('TERMINAL E2E', 620, metricY, 26, COSMOS.muted, 'mono'),
          txt(`${tokenTerminalMs} ms`, 620, metricY + 62, 54, ROLE.terminal, 'mono').glow(
            9,
            ROLE.terminal,
          ),
          txt('last token was 480 ms', 620, metricY + 118, 26, COSMOS.muted, 'sans'),
        );
      }

      // Early guidance before metrics fill
      if (now < first - 1) {
        nodes.push(txt('r01 clock starts at client send (0 ms)', 0, 315, 30, COSMOS.muted, 'sans'));
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, oscView);
  driftValue(s, c, phase, 7, { startOffset: 0.1, endMargin: 0.5 });

  c.on('stream-first', () => {
    const t = c.cue('stream-first').start;
    s.play(elapsedMs.to(first, { duration: clampDur(c, t, 0.9) }));
  });
  c.on('stream-rest', () => {
    const t = c.cue('stream-rest').start;
    s.play(elapsedMs.to(last, { duration: clampDur(c, t, 1.35) }));
  });
  c.on('stream-mean', () => {
    const t = c.cue('stream-mean').start;
    s.play(showMean.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('stream-done', () => {
    const t = c.cue('stream-done').start;
    s.play(elapsedMs.to(tokenTerminalMs, { duration: clampDur(c, t, 0.55) }));
  });
}
