// Scene 17: cache - Reuse earlier computation and still decode the answer
// Stable 1,200-token header + 80-token delta: Cache Miss (72ms prefill + 24ms decode = 96ms)
// vs Cache Hit (11ms prefill + 24ms decode = 35ms) showing decode stays fixed!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function cache(s, c) {
  const phase = s.value(0);
  const decodeOn = s.value(0);

  const header = cinemaHeader('PREFIX KV REUSE', 'Reuse prefill, still', 'decode the answer', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const dc = decodeOn.value;
      const nodes = [];

      // Top: Prompt header (1,200 stable) + 80 changed delta
      const x0 = -740;
      nodes.push(
        txt(
          'PROMPT GEOMETRY: 1,200 STABLE HEADER + 80 NEW DELTA TOKENS',
          x0,
          -195,
          26,
          ROLE.ed,
          'mono',
          'left',
        ),
        rect(1220, 44, { fill: ROLE.gpu, stroke: '#ffffff', width: 1.5, radius: 6 }).at(
          x0 + 610,
          -135,
        ),
        txt(
          'REUSABLE STABLE FILE HEADER (1,200 TOKENS)',
          x0 + 610,
          -135,
          26,
          '#070910',
          'mono',
          'center',
        ),
        rect(220, 44, { fill: ROLE.focus, stroke: '#ffffff', width: 1.5, radius: 6 }).at(
          x0 + 1234 + 110,
          -135,
        ),
        txt('DELTA (80)', x0 + 1234 + 110, -135, 26, '#070910', 'mono', 'center'),
      );

      // Service Time Bars: Miss (72 + 24 = 96 ms) vs Hit (11 + 24 = 35 ms)
      const mapMs = (ms) => x0 + (ms / 110) * 1240;
      const yMiss = 15;
      const yHit = 115;

      const xM72 = mapMs(72);
      const xM96 = mapMs(96);
      const xH11 = mapMs(11);
      const xH35 = mapMs(35);

      nodes.push(
        txt('CACHE MISS (96 ms)', x0, yMiss - 46, 26, ROLE.warn, 'mono', 'left'),
        rect(xM72 - x0 - 4, 46, { fill: ROLE.warn, stroke: '#ffffff', width: 1.5, radius: 6 }).at(
          (x0 + xM72) * 0.5,
          yMiss,
        ),
        txt('PREFILL 72 ms', (x0 + xM72) * 0.5, yMiss, 26, '#070910', 'mono', 'center'),
        rect(xM96 - xM72, 46, { fill: ROLE.model, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((xM72 + xM96) * 0.5, yMiss)
          .glow(dc > 0.4 ? 8 : 0, ROLE.model),
        txt('DEC 24 ms', (xM72 + xM96) * 0.5, yMiss, 26, '#070910', 'mono', 'center'),

        txt('CACHE HIT (35 ms)', x0, yHit - 46, 26, ROLE.ok, 'mono', 'left'),
        rect(xH11 - x0 - 4, 46, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x0 + xH11) * 0.5, yHit)
          .glow(8, ROLE.ok),
        txt('11', (x0 + xH11) * 0.5, yHit, 26, '#070910', 'mono', 'center'),
        rect(xH35 - xH11, 46, { fill: ROLE.model, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((xH11 + xH35) * 0.5, yHit)
          .glow(dc > 0.4 ? 8 : 0, ROLE.model),
        txt('DEC 24 ms', (xH11 + xH35) * 0.5, yHit, 26, '#070910', 'mono', 'center'),
        txt(
          '<- PREFILL DROPPED 72 -> 11 ms, DECODE UNCHANGED (24 ms)!',
          xH35 + 24,
          yHit,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
      );

      nodes.push(
        txt('ISOLATION & SNAPSHOT', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Other tenant = miss · Top edit invalidates',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        line([-840, 210], [840, 210], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Neither prefix reuse nor response caching can ever bypass the live editor snapshot check',
          0,
          285,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
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
  driftValue(s, c, phase, 4.0);

  c.on('cache-beat-2-focus-1', () => {
    s.play(decodeOn.to(1, { duration: clampDur(c, c.cue('cache-beat-2-focus-1').start, 0.35) }));
  });
}
