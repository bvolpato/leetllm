// Scene 18: typed-reducer - A verdict must match the current typed identity
// Driven by real `strictPublication`: Beat 0 rejects 4 malformed types (true, 2.5, 1, "false"),
// Beat 1 runs stale -> Event 7 checked (terminal) -> duplicate -> Event 8 inert, Beat 2 live auth.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  strictPublication,
  txt,
} from '../parts.mjs';

export default function typedReducer(s, c) {
  const pulse = s.value(0);
  const typeRuleOn = s.value(0);
  const invalidProg = s.value(0);
  const beat1On = s.value(0);
  const staleOn = s.value(0);
  const termOn = s.value(0);
  const inertOn = s.value(0);
  const beat2On = s.value(0);

  const base = {
    id: 7,
    revision: 2,
    request: 'request-a',
    draft: 'draft-2',
    kind: 'check',
    accepted: true,
  };
  const malformedEvents = [
    { ...base, id: true },
    { ...base, id: 4, revision: 2.5 },
    { ...base, id: 5, accepted: 1 },
    { ...base, id: 6, accepted: 'false' },
  ];
  const validTraceEvents = [
    { ...base, id: 3, draft: 'draft-1', revision: 1 },
    base,
    { ...base },
    { ...base, id: 8, accepted: false },
  ];

  const header = cinemaHeader('TYPED REDUCER', 'Validate types and make', 'first match terminal', {
    accent: ROLE.policy,
    size: 46,
  });

  const stageAura = aura(0, 40, 700, '#60a5fa1a', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const inv = invalidProg.value;
      const b1 = beat1On.value > 0.5;
      const st = staleOn.value > 0.5;
      const tm = termOn.value > 0.5;
      const inr = inertOn.value > 0.5;
      const b2 = beat2On.value > 0.5;

      const events = b1 || b2 ? validTraceEvents : malformedEvents;
      const count = b2 ? 4 : b1 ? (inr ? 4 : tm ? 2 : st ? 1 : 0) : Math.ceil(inv * 4);
      const res = strictPublication(events.slice(0, count));
      const nodes = [];

      nodes.push(
        txt(
          'TARGET: request-a  ·  draft-2  ·  source revision 2',
          -840,
          -235,
          28,
          ROLE.policy,
          'mono',
          'left',
        ),
        txt(
          b1 || b2 ? 'TRACE MODE: IDENTITY & TERMINAL GATE' : 'STRICT TYPE GATE (NO COERCION)',
          840,
          -235,
          26,
          b1 || b2 ? ROLE.ok : ROLE.focus,
          'mono',
          'right',
        ).opacity(0.65 + 0.35 * typeRuleOn.value),
      );

      events.forEach((ev, i) => {
        const y = -142 + i * 114;
        const done = i < count;
        const dec = res.decisions[i];
        const isChecked = done && dec.reason === 'checked';
        const col = !done ? '#334873' : isChecked ? ROLE.ok : ROLE.deny;

        nodes.push(
          rect(1680, 88, { fill: '#0d1527', stroke: col, width: done ? 2.8 : 1.8, radius: 12 })
            .at(0, y)
            .glow(isChecked ? 9 : done ? 5 : 0, col),
          txt(
            `id: ${JSON.stringify(ev.id)}   ·   draft: ${ev.draft}   ·   rev: ${ev.revision}   ·   accepted: ${JSON.stringify(ev.accepted)}`,
            -805,
            y,
            27,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            done ? dec.reason.toUpperCase() : 'queued',
            805,
            y,
            27,
            done ? col : COSMOS.dim,
            'mono',
            'right',
          ),
        );
      });

      const stateCol = res.emitted ? ROLE.ok : ROLE.focus;
      nodes.push(
        txt(
          `REDUCER STATE: ${res.status.toUpperCase()}   ·   EMITTED CLAIMS: ${res.emitted}`,
          -840,
          312,
          32,
          stateCol,
          'mono',
          'left',
        ).glow(7, stateCol),
        txt(
          b2
            ? 'Event 7 released the claim; in production, authenticate sender & recheck Alice access before sending.'
            : b1
              ? 'First matching check while pending is terminal -> later duplicate or reject events stay inert.'
              : 'Require nonnegative int id/revision and literal bool verdict (annotations alone do not validate).',
          -840,
          388,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-typed-reducer-0', () => {
    s.play(typeRuleOn.to(1, { duration: clampDur(c, c.cue('se-typed-reducer-0').start, 0.3) }));
  });
  c.on('se-typed-reducer-invalid', () => {
    s.play(
      invalidProg.to(1, { duration: clampDur(c, c.cue('se-typed-reducer-invalid').start, 1.0) }),
    );
  });
  c.on('se-typed-reducer-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-typed-reducer-1').start, 0.25) }));
  });
  c.on('se-typed-reducer-stale', () => {
    s.play(staleOn.to(1, { duration: clampDur(c, c.cue('se-typed-reducer-stale').start, 0.3) }));
  });
  c.on('se-typed-reducer-terminal', () => {
    s.play(termOn.to(1, { duration: clampDur(c, c.cue('se-typed-reducer-terminal').start, 0.3) }));
  });
  c.on('se-typed-reducer-inert', () => {
    s.play(inertOn.to(1, { duration: clampDur(c, c.cue('se-typed-reducer-inert').start, 0.3) }));
  });
  c.on('se-typed-reducer-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-typed-reducer-2').start, 0.3) }));
  });
}
