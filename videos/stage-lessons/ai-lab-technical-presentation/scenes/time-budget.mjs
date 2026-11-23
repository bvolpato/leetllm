import { rehearsalClock, totalMinutes, addTitle, caption } from '../parts.mjs';

export default function timeBudget(s, c) {
  addTitle(s, c);
  const clock = rehearsalClock();
  const { lower } = clock;
  const initial = caption(lower, 'Rehearsal clock    ·    15 minutes', 'dim');
  const sum = caption(lower, 'Full rehearsal    ·    ' + totalMinutes + ' minutes', 'yellow');
  const short = caption(lower, '90 seconds    ·    problem and hardest decision', 'cyan');
  const core = caption(
    lower,
    'Problem    →    decision    →    owned change    →    evidence',
    'cyan',
  );
  const buffer = caption(lower, 'Two minutes remain available for questions.', 'yellow');
  s.add(clock.ruler, initial);
  ['context', 'path', 'decision', 'evidence', 'limit', 'questions'].forEach((cue, i) =>
    c.show(cue, clock.blocks[i].nodes, { after: true }),
  );
  c.swap('total', initial, sum, { after: true });
  c.swap('brief', sum, short);
  c.swap('core', short, core, { after: true });
  c.swap('buffer', core, buffer);
  c.keep([clock.ruler, clock.blocks.map((b) => b.nodes)].flat(Infinity));
}
