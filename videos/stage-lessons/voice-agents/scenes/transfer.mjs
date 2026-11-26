// Scene 28: transfer - When did the phone finish playing "open"?
// Full call clock tying first sound (380 ms), factual reply start (955 ms), confirmed end of
// "open" (955 + 520 = 1475 ms, STRICTLY withheld until recap-total!), and cut-in (+130 ms = 1605 ms).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  commitToAudio,
  driftValue,
  firstAudioLatency,
  glowDot,
  guardedDynamic,
  interrupt,
  speechChunks,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const phase = s.value(0);
  const clocksOn = s.value(0);
  const factsOn = s.value(0);
  const totalReveal = s.value(0); // STRICT after recap-total!
  const stopOn = s.value(0);

  const factStart = speechChunks[2].play[0]; // 955
  const openWallEnd = factStart + interrupt.acknowledgedThrough; // 1475
  const cutGap = interrupt.wallMs - openWallEnd; // 130

  const header = cinemaHeader('END-TO-END CALL CLOCK', 'When did the phone', 'finish “open”?', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const cl = clocksOn.value;
      const fc = factsOn.value;
      const tr = totalReveal.value;
      const st = stopOn.value;
      const nodes = [];

      // Full call clock: 0 .. 1800 ms across x = [-780 .. +780]
      const x0 = -780;
      const x1 = 780;
      const mapT = (t) => x0 + (t / 1800) * (x1 - x0);
      const rY = 15;

      nodes.push(line([x0, rY], [x1, rY], { stroke: '#344770', width: 5 }));
      for (const t of [0, 380, 955, 1475, 1605]) {
        const tx = mapT(t);
        const showTick = t <= 955 || (t === 1475 && tr > 0.4) || (t === 1605 && st > 0.4);
        if (showTick) {
          nodes.push(
            line([tx, rY - 12], [tx, rY + 12], { stroke: '#6078ad', width: 2.5 }),
            txt(
              `${t} ms`,
              tx,
              t === 1605 ? rY + 96 : rY + 52,
              26,
              t === 1475 ? ROLE.ok : t === 1605 ? ROLE.cut : COSMOS.dim,
              'mono',
              'center',
            ),
          );
        }
      }

      // First sound marker ("I'll check that" at 380 ms)
      const x380 = mapT(firstAudioLatency);
      nodes.push(
        line([x380, rY - 110], [x380, rY + 18], { stroke: ROLE.audio, width: 4 }).glow(
          8,
          ROLE.audio,
        ),
        txt('"I’ll check that"', x380, rY - 142, 26, ROLE.audio, 'mono', 'center'),
        txt(
          cl > 0.4 ? `380 ms speech  |  ${commitToAudio} ms commit` : '380 ms first sound',
          x380,
          rY + 104,
          26,
          ROLE.audio,
          'mono',
          'center',
        ),
      );

      // Factual reply start (955 ms) + confirmed "Incident is open" span (520 ms -> 1475 ms)
      const x955 = mapT(factStart);
      const x1475 = mapT(openWallEnd);
      const x1605 = mapT(interrupt.wallMs);

      if (fc > 0.1) {
        nodes.push(
          line([x955, rY - 110], [x955, rY + 18], { stroke: ROLE.focus, width: 4 })
            .glow(8, ROLE.focus)
            .opacity(fc),
          txt('FACTUAL START (955)', x955, rY - 142, 26, ROLE.focus, 'mono', 'center').opacity(fc),
        );
      }

      // STRICT withholding of 1475 ms span until recap-total!
      if (tr > 0.35) {
        const wSpan = x1475 - x955;
        nodes.push(
          rect(wSpan, 44, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(x955 + wSpan * 0.5, rY)
            .glow(9, ROLE.ok)
            .opacity(tr * 0.9),
          txt(
            '+520 ms ("open")',
            x955 + wSpan * 0.5,
            rY - 52,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(tr),
        );
      } else if (fc > 0.35) {
        nodes.push(
          txt('955 + 520 = ? ms', (x955 + x1475) * 0.5, rY - 52, 28, ROLE.focus, 'mono', 'center'),
        );
      }

      if (st > 0.35) {
        nodes.push(
          line([x1605, rY - 110], [x1605, rY + 18], { stroke: ROLE.cut, width: 4, dash: [8, 6] })
            .glow(9, ROLE.cut)
            .opacity(st),
          txt(`CUT IN (+${cutGap} ms)`, x1605, rY - 142, 26, ROLE.cut, 'mono', 'center').opacity(
            st,
          ),
        );
      }

      // Top-right rule
      nodes.push(
        txt('FIRST SOUND != USEFUL ANSWER', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          tr > 0.4
            ? `955 + 520 = ${openWallEnd} ms on call clock`
            : 'Align reply receipt onto call clock',
          480,
          -378,
          26,
          tr > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom prediction prompt -> reveal
      const botY = 305;
      if (tr > 0.35) {
        nodes.push(
          txt(
            st > 0.35
              ? `EVIDENCE FOR "open" REACHES ${openWallEnd} ms (ALEX CUTS IN ${cutGap} ms LATER AT ${interrupt.wallMs} ms)`
              : `EVIDENCE FOR "open" REACHES ${openWallEnd} ms (${factStart} + ${interrupt.acknowledgedThrough} ms)`,
            0,
            botY,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
          txt(
            'A dashboard stopping at 380 ms completely hides the wait for the actual answer!',
            0,
            botY + 52,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (fc > 0.35) {
        nodes.push(
          txt(
            'Factual reply starts at 955 ms with 520 ms acked: when did "open" finish?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Both 380 ms and 320 ms clocks stop at the very same first speaker sound',
            0,
            botY,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('recap-clocks', () => {
    s.play(clocksOn.to(1, { duration: clampDur(c, c.cue('recap-clocks').start, 0.35) }));
  });
  c.on('recap-facts', () => {
    s.play(factsOn.to(1, { duration: clampDur(c, c.cue('recap-facts').start, 0.4) }));
  });
  c.after('recap-total', () => {
    s.play(totalReveal.to(1, { duration: clampDur(c, c.cue('recap-total').end, 0.4) }));
  });
  c.on('recap-stop', () => {
    s.play(stopOn.to(1, { duration: clampDur(c, c.cue('recap-stop').start, 0.35) }));
  });
}
