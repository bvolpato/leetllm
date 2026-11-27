// Scene 16: publish - A verdict applies to one draft and evidence revision
// Identity-bound publication gate backed by `apply`: Event 1 (stale draft 1 / rev 1) ignored,
// Event 2 (matching draft 2 / rev 2) emits once, Replay of Event 2 deduplicated -> publications stay 1.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  apply,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function publish(s, c) {
  const bindOn = s.value(0);
  const acceptOn = s.value(0);
  const replayOn = s.value(0);
  const memoryOn = s.value(0);

  const header = cinemaHeader('VERDICT BINDING', 'Bind every decision to', 'draft and revision', {
    accent: ROLE.policy,
    size: 46,
  });

  const stageAura = aura(0, 50, 700, '#60a5fa1c', '#6ee7b718');

  const view = guardedDynamic(
    () => 1,
    () => {
      const acc = acceptOn.value > 0.5;
      const rep = replayOn.value > 0.5;
      const mem = memoryOn.value > 0.5;

      const staleEv = { id: 1, draft: 1, revision: 1, accept: true };
      const currEv = { id: 2, draft: 2, revision: 2, accept: true };
      const events = [staleEv, ...(acc ? [currEv] : []), ...(rep ? [{ ...currEv }] : [])];
      const result = apply(events);
      const emitted = result.emitted;
      const nodes = [];

      // Active target header bar
      nodes.push(
        rect(1680, 96, { fill: '#0c1528', stroke: ROLE.policy, width: 2.8, radius: 14 })
          .at(0, -205)
          .glow(6 + bindOn.value * 4, ROLE.policy),
        txt(
          'ACTIVE TARGET:  Request R1   ·   Draft Hash 2   ·   Evidence Revision 2',
          0,
          -205,
          30,
          ROLE.policy,
          'mono',
          'center',
        ),
      );

      // Three incoming decision envelopes
      const cards = [
        {
          x: -560,
          title: 'EVENT 1  (STALE)',
          detail: 'draft 1 · rev 1 · accept',
          verdict: 'IGNORED · stale identity',
          col: ROLE.deny,
          show: true,
        },
        {
          x: 0,
          title: 'EVENT 2  (MATCHING)',
          detail: 'draft 2 · rev 2 · accept',
          verdict: 'ACCEPTED · releases once',
          col: ROLE.ok,
          show: acc,
        },
        {
          x: 560,
          title: 'REPLAY OF EVENT 2',
          detail: 'same event ID = 2',
          verdict: 'DUPLICATE · already seen',
          col: ROLE.replay,
          show: rep,
        },
      ];

      cards.forEach((card, i) => {
        const col = card.show ? card.col : COSMOS.dim;
        nodes.push(
          rect(510, 178, { fill: '#0d1527', stroke: col, width: card.show ? 3 : 1.8, radius: 14 })
            .at(card.x, -25)
            .glow(card.show ? 8 : 0, col)
            .opacity(card.show ? 1 : 0.42),
          txt(card.title, card.x, -76, 26, col, 'mono', 'center'),
          txt(card.detail, card.x, -24, 27, COSMOS.ink, 'mono', 'center'),
          txt(
            card.show ? card.verdict : 'not arrived yet',
            card.x,
            30,
            26,
            card.show ? col : COSMOS.dim,
            'mono',
            'center',
          ),
        );
        if (card.show && i === 1) {
          nodes.push(
            beamWithPhotons(quadArcPts([0, 68], [-220, 165], 0, 16), ROLE.ok, 0, {
              width: 3.6,
              glow: 9,
            }),
          );
        }
      });

      // Lower delivery state + publication counter
      const pubCol = emitted ? ROLE.ok : ROLE.pending;
      nodes.push(
        rect(1160, 150, { fill: '#0d1626', stroke: pubCol, width: 3, radius: 14 })
          .at(-260, 240)
          .glow(emitted ? 9 : 4, pubCol),
        txt(
          emitted ? `STATE: ${result.state}  ·  RELEASED` : `STATE: ${result.state}  ·  HELD`,
          -800,
          202,
          26,
          pubCol,
          'mono',
          'left',
        ),
        txt(
          emitted
            ? 'Published: "60 days with security approval" (R1 · draft 2 · rev 2)'
            : 'Draft 2 held: stale decision leaves new claim pending',
          -800,
          266,
          29,
          COSMOS.ink,
          'sans',
          'left',
        ),

        rect(460, 150, { fill: '#0d1626', stroke: pubCol, width: 3, radius: 14 })
          .at(610, 240)
          .glow(emitted ? 9 : 4, pubCol),
        txt('PUBLICATIONS', 610, 198, 26, COSMOS.muted, 'mono', 'center'),
        txt(String(emitted), 610, 264, 58, pubCol, 'mono', 'center').glow(8, pubCol),

        txt(
          mem
            ? 'Event 2 already released Draft 2 -> 1 claim.'
            : rep
              ? 'Duplicate Event 2 ignored -> still 1 publication.'
              : acc
                ? 'Matching decision 2 releases the claim once.'
                : 'Stale acceptance leaves draft 2 / rev 2 pending.',
          0,
          388,
          30,
          mem || rep ? ROLE.focus : COSMOS.muted,
          'serif',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('publish-beat-1-focus-1', () => {
    s.play(bindOn.to(1, { duration: clampDur(c, c.cue('publish-beat-1-focus-1').start, 0.35) }));
  });
  c.on('publish-current-accept', () => {
    s.play(acceptOn.to(1, { duration: clampDur(c, c.cue('publish-current-accept').start, 0.35) }));
  });
  c.on('publish-replayed-event', () => {
    s.play(replayOn.to(1, { duration: clampDur(c, c.cue('publish-replayed-event').start, 0.35) }));
  });
  c.on('publish-beat-2-focus-2', () => {
    s.play(memoryOn.to(1, { duration: clampDur(c, c.cue('publish-beat-2-focus-2').start, 0.35) }));
  });
}
