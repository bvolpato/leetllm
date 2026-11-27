// Scene 10: chunk-boundaries - What did the client actually receive?
// Dual-instrument oscilloscope comparing per-token emissions (5 timestamps) against bundled
// client text chunks (2 timestamps, 160 ms chunk gap) plus live visible reply screen.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
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

const WORDS = Object.freeze(['The', 'answer', 'is', '42', '.']);

export default function chunkBoundaries(s, c) {
  const nowMs = s.value(200); // 200 -> 320 -> 480 -> 500

  const firstChunk = tokenTimes[2]; // 320
  const lastChunk = tokenTimes.at(-1); // 480

  const header = cinemaHeader(
    'OBSERVATION BOUNDARIES',
    'What did the client',
    'actually receive?',
    {
      x: -860,
      y: -435,
      accent: ROLE.focus,
      size: 50,
    },
  );

  const stageAura = aura(120, 20, 680, '#5ce1e61a', '#ffd1661c');

  const oscView = guardedDynamic(
    () => 1,
    () => {
      const now = nowMs.value;
      const xLeft = -460;
      const xRight = 680;
      const minMs = 200;
      const maxMs = 520;
      const xOf = (ms) => xLeft + ((ms - minMs) / (maxMs - minMs)) * (xRight - xLeft);

      const tokY = -125;
      const chunkY = 125;
      const nodes = [
        // Top-right live stream clock radial dial (balances frame from t = 0!)
        radialGauge(
          700,
          -335,
          90,
          Math.max(0.05, (now - minMs) / (tokenTerminalMs - minMs)),
          ROLE.focus,
          {
            width: 9,
            glow: 10,
          },
        ),
        txt(`${Math.round(now)}`, 700, -348, 38, COSMOS.ink, 'mono').glow(6, ROLE.focus),
        txt('ms', 700, -300, 26, COSMOS.muted, 'mono'),
        txt('DUAL-INSTRUMENT ALIGNMENT', 110, -345, 26, COSMOS.muted, 'mono'),
      ];

      // Subtle vertical oscilloscope calibration gridlines across [200..500] ms
      for (const tTick of [200, 300, 400, 500]) {
        const gx = xOf(tTick);
        nodes.push(dashedRule(gx, tokY - 36, gx, chunkY + 36, '#1e2c4d', 0.45, 1.4));
      }

      // Upper instrument: Token trace
      nodes.push(
        txt('TOKEN TRACE', -860, tokY - 12, 30, ROLE.send, 'mono', 'left').glow(5, ROLE.send),
        txt('5 observed tokens', -860, tokY + 32, 26, COSMOS.muted, 'sans', 'left'),
        line([xLeft, tokY], [xRight, tokY], { stroke: '#233254', width: 2.6 }),
      );
      if (now > minMs + 1) {
        nodes.push(
          glowingTrail(
            [
              [xOf(minMs), tokY],
              [xOf(now), tokY],
            ],
            { color: ROLE.send, width: 5.5, glow: 8 },
          ),
        );
      }

      // Lower instrument: Client chunk stream
      nodes.push(
        txt('CLIENT STREAM', -860, chunkY - 12, 30, ROLE.focus, 'mono', 'left').glow(5, ROLE.focus),
        txt('2 text chunks', -860, chunkY + 32, 26, COSMOS.muted, 'sans', 'left'),
        line([xLeft, chunkY], [xRight, chunkY], { stroke: '#233254', width: 2.6 }),
      );
      if (now > minMs + 1) {
        nodes.push(
          glowingTrail(
            [
              [xOf(minMs), chunkY],
              [xOf(now), chunkY],
            ],
            { color: ROLE.focus, width: 5.5, glow: 8 },
          ),
        );
      }

      // Token events + bundling funnel rays down to chunk arrival points
      tokenTimes.forEach((tk, i) => {
        if (tk > now + 0.5) return;
        const xt = xOf(tk);
        const targetChunk = i <= 2 ? firstChunk : lastChunk;
        nodes.push(
          glowDot(xt, tokY, { radius: 9.5, color: ROLE.send, glow: 10 }),
          txt(WORDS[i], xt, tokY - 46, 30, ROLE.send, 'sans'),
          txt(String(tk), xt, tokY + 42, 26, COSMOS.ink, 'mono'),
        );
        if (now >= targetChunk - 0.5) {
          nodes.push(
            dashedRule(xt, tokY + 64, xOf(targetChunk), chunkY - 82, ROLE.focus, 0.58, 2.0),
          );
        }
      });

      // Chunk 1 at 320 ms
      if (now >= firstChunk - 0.5) {
        const xc1 = xOf(firstChunk);
        nodes.push(
          glowDot(xc1, chunkY, { radius: 11, color: ROLE.focus, glow: 12 }),
          txt('"The answer is"', xc1, chunkY - 46, 30, ROLE.focus, 'sans').glow(6, ROLE.focus),
          txt('320 ms', xc1, chunkY + 46, 26, COSMOS.ink, 'mono'),
        );
      }

      // Chunk 2 at 480 ms + 160 ms inter-chunk gap bracket
      if (now >= lastChunk - 0.5) {
        const xc2 = xOf(lastChunk);
        nodes.push(
          glowDot(xc2, chunkY, { radius: 11, color: ROLE.focus, glow: 12 }),
          txt('"42."', xc2, chunkY - 46, 30, ROLE.focus, 'sans').glow(6, ROLE.focus),
          txt('480 ms', xc2, chunkY + 46, 26, COSMOS.ink, 'mono'),
          ...spanBracket(
            xOf(firstChunk),
            xc2,
            chunkY + 96,
            '160 ms chunk gap (do not divide)',
            ROLE.burst,
            {
              labelSize: 26,
            },
          ),
        );
      }

      // Terminal close marker at 500 ms (anchored cleanly to the RIGHT of xTerm!)
      if (now >= tokenTerminalMs - 0.5) {
        const xTerm = xOf(tokenTerminalMs);
        nodes.push(
          dashedRule(xTerm, tokY - 60, xTerm, chunkY + 75, ROLE.terminal, 0.9, 3.2),
          glowDot(xTerm, chunkY, { radius: 10, color: ROLE.terminal, glow: 12 }),
          txt('500 ms done', xTerm + 18, chunkY - 96, 26, ROLE.terminal, 'mono', 'left').glow(
            5,
            ROLE.terminal,
          ),
        );
      }

      // Shared millisecond axis (generous gap below the 160 ms chunk gap label)
      nodes.push(
        ...timeAxisNodes(xLeft, xRight, 314, minMs, maxMs, [200, 250, 300, 350, 400, 450, 500], {
          format: (v) => `${v}ms`,
        }),
      );

      // Visible reply stream readout at bottom
      const replyText =
        now < firstChunk - 0.5
          ? '...'
          : now < lastChunk - 0.5
            ? 'The answer is'
            : 'The answer is 42.';
      nodes.push(
        txt('VISIBLE REPLY:', -860, 434, 28, COSMOS.muted, 'mono', 'left'),
        txt(replyText, -520, 434, 46, COSMOS.ink, 'serif', 'left').glow(6, ROLE.focus),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, oscView);

  c.on('chunk-first', () => {
    const t = c.cue('chunk-first').start;
    s.play(nowMs.to(firstChunk, { duration: clampDur(c, t, 1.1) }));
  });
  c.on('chunk-next', () => {
    const t = c.cue('chunk-next').start;
    s.play(nowMs.to(lastChunk, { duration: clampDur(c, t, 1.1) }));
  });
  c.on('chunk-end', () => {
    const t = c.cue('chunk-end').start;
    s.play(nowMs.to(tokenTerminalMs, { duration: clampDur(c, t, 0.6) }));
  });
}
