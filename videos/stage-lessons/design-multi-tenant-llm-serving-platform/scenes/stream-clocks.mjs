// Scene 03: stream-clocks - Measure the events you can actually observe
// Luminous 0-240 ms timeline showing arrival (0), token 1 (100), bundled 4 tokens (220),
// and completion (240), then constructing 120 ms gap, 140 ms span, 35 ms TPOT, 20 ms overhead.
import { circle, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  playAfter,
  playOn,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function streamClocks(s, c) {
  const clockMs = s.value(0);
  const firstOn = s.value(0);
  const bundleOn = s.value(0);
  const termOn = s.value(0);
  const b1On = s.value(0);
  const gapOn = s.value(0);
  const elapsedOn = s.value(0);
  const tpotOn = s.value(0);
  const overOn = s.value(0);
  const b2On = s.value(0);

  const stageAura = aura(0, 20, 760, '#5ce1e61c', '#ffd16614');
  const header = cinemaHeader(
    'OBSERVED STREAM TIMESTAMPS',
    'Measure the events',
    'you can actually observe',
    { x: -860, y: -450, accent: ROLE.stream, size: 46 },
  );

  const xOf = (ms) => -760 + (ms / 240) * 1520;
  const axisY = 30;

  const view = guardedDynamic(
    () => 1,
    () => {
      const ms = clockMs.value;
      const fOn = firstOn.value > 0.5 || b1On.value > 0.5;
      const bnOn = bundleOn.value > 0.5 || b1On.value > 0.5;
      const tOn = termOn.value > 0.5 || b1On.value > 0.5;
      const b1 = b1On.value > 0.5;
      const gOk = gapOn.value > 0.5;
      const eOk = elapsedOn.value > 0.5;
      const tpOk = tpotOn.value > 0.5;
      const ovOk = overOn.value > 0.5;
      const b2 = b2On.value > 0.5;

      const nodes = [];

      // Beat 2 external TTFT stage chain at top right (no overlap with header)
      if (b2) {
        const stages = [
          ['Arrival', -180, ROLE.shared],
          ['Queue', 40, ROLE.held],
          ['Adapter', 260, ROLE.model],
          ['Prefill', 480, ROLE.A],
          ['Token 1', 710, ROLE.ok],
        ];
        nodes.push(
          txt(
            'EXTERNAL TTFT BOUNDARY (ALL STAGES INCLUDED)',
            -270,
            -445,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
        );
        stages.forEach(([label, sx, col], idx) => {
          nodes.push(
            rect(176, 62, { fill: '#0d1528', stroke: col, width: 2.4, radius: 10 })
              .at(sx, -372)
              .glow(6, col),
            txt(label, sx, -372, 26, col, 'mono', 'center'),
          );
          if (idx < stages.length - 1) {
            nodes.push(
              line([sx + 92, -372], [stages[idx + 1][1] - 92, -372], {
                stroke: COSMOS.muted,
                width: 2.6,
              }),
            );
          }
        });
      }

      // Main 0-240 ms horizontal clock axis
      nodes.push(line([xOf(0), axisY], [xOf(240), axisY], { stroke: '#3a4e7a', width: 4 }));
      if (ms > 1) {
        nodes.push(
          beamWithPhotons(
            [
              [xOf(0), axisY],
              [xOf(Math.min(240, ms)), axisY],
            ],
            ROLE.stream,
            0,
            { width: 4.5, glow: 9 },
          ),
        );
      }

      // Tick marks at 0, 100, 220, 240 ms
      for (const t of [0, 100, 220, 240]) {
        const tx = xOf(t);
        nodes.push(
          line([tx, axisY - 16], [tx, axisY + 16], { stroke: '#6c82b0', width: 3 }),
          txt(`${t} ms`, tx, axisY + 52, 26, COSMOS.muted, 'mono', 'center'),
        );
      }

      // Arrival node (always visible)
      nodes.push(
        circle(11, { fill: COSMOS.ink, stroke: ROLE.shared, width: 3 })
          .at(xOf(0), axisY)
          .glow(7, ROLE.shared),
        txt('Arrival', xOf(0), axisY - 46, 26, COSMOS.ink, 'mono', 'center'),
      );

      // Token 1 at 100 ms
      if (fOn) {
        const x1 = xOf(100);
        nodes.push(
          circle(12, { fill: ROLE.stream, stroke: '#ffffff', width: 2 })
            .at(x1, axisY)
            .glow(10, ROLE.stream),
          line([x1, axisY - 14], [x1, axisY - 82], { stroke: ROLE.stream, width: 2.6 }),
          rect(172, 74, { fill: '#0b1b2c', stroke: ROLE.stream, width: 2.8, radius: 12 })
            .at(x1, axisY - 122)
            .glow(8, ROLE.stream),
          txt('Token 1', x1, axisY - 122, 28, ROLE.stream, 'mono', 'center'),
        );
      }

      // Bundled 4 tokens at 220 ms (one observed event!)
      if (bnOn) {
        const x2 = xOf(220);
        nodes.push(
          circle(12, { fill: ROLE.ok, stroke: '#ffffff', width: 2 })
            .at(x2, axisY)
            .glow(10, ROLE.ok),
          line([x2, axisY - 14], [x2, axisY - 76], { stroke: ROLE.ok, width: 2.6 }),
          rect(324, 102, { fill: '#0b1e1c', stroke: ROLE.ok, width: 3.0, radius: 14 })
            .at(x2 - 40, axisY - 130)
            .glow(9, ROLE.ok),
          txt('ONE OBSERVED EVENT', x2 - 40, axisY - 210, 26, ROLE.ok, 'mono', 'center'),
        );
        for (let k = 0; k < 4; k++) {
          const bx = x2 - 154 + k * 76;
          nodes.push(
            rect(64, 56, { fill: '#12332c', stroke: ROLE.ok, width: 2, radius: 8 }).at(
              bx,
              axisY - 130,
            ),
            txt(`t${k + 2}`, bx, axisY - 130, 26, COSMOS.ink, 'mono', 'center'),
          );
        }
      }

      // Completion at 240 ms
      if (tOn) {
        const x3 = xOf(240);
        nodes.push(
          circle(12, { fill: ROLE.focus, stroke: '#ffffff', width: 2 })
            .at(x3, axisY)
            .glow(10, ROLE.focus),
          txt('Done', x3, axisY - 46, 26, ROLE.focus, 'mono', 'center'),
        );
      }

      // Lower derivation zone (y = 140 .. 430)
      if (!b1) {
        const now = Math.round(Math.min(240, ms));
        nodes.push(
          rect(720, 88, { fill: '#0d1528', stroke: ROLE.focus, width: 2.6, radius: 14 }).at(0, 225),
          txt(`Observed trace clock: ${now} ms`, 0, 225, 32, ROLE.focus, 'mono', 'center'),
          txt(
            'Four bundled tokens carry no separate internal decoding timestamps.',
            0,
            365,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else {
        // 120 ms observed event gap bracket (100 -> 220 ms)
        if (gOk) {
          const xA = xOf(100);
          const xB = xOf(220);
          const by = 142;
          nodes.push(
            line([xA, by], [xB, by], { stroke: ROLE.stream, width: 4 }).glow(7, ROLE.stream),
            line([xA, by - 14], [xA, by + 14], { stroke: ROLE.stream, width: 3 }),
            line([xB, by - 14], [xB, by + 14], { stroke: ROLE.stream, width: 3 }),
            txt(
              'Event gap = 220 - 100 = 120 ms',
              (xA + xB) * 0.5,
              by + 44,
              28,
              ROLE.stream,
              'mono',
              'center',
            ),
          );
        }

        // 20 ms completion overhead bracket (220 -> 240 ms)
        if (ovOk) {
          const xB = xOf(220);
          const xC = xOf(240);
          const oy = 142;
          nodes.push(
            line([xB, oy], [xC, oy], { stroke: ROLE.warn, width: 4 }).glow(7, ROLE.warn),
            txt('20 ms overhead', xC, oy + 44, 26, ROLE.warn, 'mono', 'right'),
          );
        }

        // 140 ms span and 35 ms TPOT calculation cards
        nodes.push(
          rect(760, 128, {
            fill: '#0d1528',
            stroke: eOk ? ROLE.A : '#2c3d66',
            width: 2.6,
            radius: 14,
          })
            .at(-430, 325)
            .glow(eOk ? 8 : 0, ROLE.A),
          txt('COMPLETION - FIRST OUTPUT', -780, 294, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            eOk ? '240 - 100 = 140 ms' : 'measuring span...',
            -780,
            346,
            36,
            eOk ? ROLE.A : COSMOS.dim,
            'mono',
            'left',
          ),

          rect(760, 128, {
            fill: '#0b1b1c',
            stroke: tpOk ? ROLE.ok : '#2c3d66',
            width: 2.8,
            radius: 14,
          })
            .at(430, 325)
            .glow(tpOk ? 10 : 0, ROLE.ok),
          txt('REQUEST TPOT  (4 ADDITIONAL TOKENS)', 80, 294, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            tpOk ? '140 / 4 = 35 ms / token' : 'dividing by 4 tokens...',
            80,
            346,
            36,
            tpOk ? ROLE.ok : COSMOS.dim,
            'mono',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('mt-stream-clocks-b0', () => {
    s.play(clockMs.to(40, { duration: clampDur(c, c.cue('mt-stream-clocks-b0').start, 0.5) }));
  });
  c.on('mt-stream-clocks-s0-1', () => {
    s.play(clockMs.to(80, { duration: clampDur(c, c.cue('mt-stream-clocks-s0-1').start, 0.5) }));
  });
  c.on('mt-stream-clocks-first', () => {
    s.play(clockMs.to(100, { duration: clampDur(c, c.cue('mt-stream-clocks-first').start, 0.45) }));
  });
  stepAfter(s, c, 'mt-stream-clocks-first', firstOn, 1);
  c.on('mt-stream-clocks-bundle', () => {
    s.play(
      clockMs.to(220, { duration: clampDur(c, c.cue('mt-stream-clocks-bundle').start, 0.55) }),
    );
  });
  stepAfter(s, c, 'mt-stream-clocks-bundle', bundleOn, 1);
  c.on('mt-stream-clocks-terminal', () => {
    s.play(
      clockMs.to(240, { duration: clampDur(c, c.cue('mt-stream-clocks-terminal').start, 0.35) }),
    );
  });
  stepAfter(s, c, 'mt-stream-clocks-terminal', termOn, 1);

  stepOn(s, c, 'mt-stream-clocks-b1', b1On, 1);
  stepAfter(s, c, 'mt-stream-clocks-s1-0', gapOn, 1);
  stepAfter(s, c, 'mt-stream-clocks-s1-1', elapsedOn, 1);
  stepAfter(s, c, 'mt-stream-clocks-s1-2', tpotOn, 1);
  stepAfter(s, c, 'mt-stream-clocks-s1-3', overOn, 1);
  stepOn(s, c, 'mt-stream-clocks-b2', b2On, 1);
}
