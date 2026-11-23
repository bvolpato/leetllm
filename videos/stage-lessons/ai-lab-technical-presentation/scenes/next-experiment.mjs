import { assertEqual, place, rect, to } from 'vizmatic/stage';
import { namedBox } from '../../kit-narrated.mjs';
import { DNS_QUERY, PAIRED, PAIR_FIXTURE, addTitle, caption, work } from '../parts.mjs';

export default function nextExperiment(s, c) {
  addTitle(s, c);
  const losses = PAIR_FIXTURE.filter((row) => row.baseline && !row.candidate)
    .map((row) => row.id)
    .sort();
  assertEqual(losses.length, PAIRED.counts.baselineOnly, 'retain every lost query ID');
  const example = DNS_QUERY.id;
  const index = losses.indexOf(example);
  assertEqual(index >= 0, true, 'replay the illustrated lost query');
  const [observed, design] = work.columns([1, 1.6], 'wide');
  const [leftTitle, ids, original, issue] = observed.rows([0.7, 2.1, 0.9, 1.1], 'normal');
  const [rightTitle, shared, arms, outputs, status] = design.rows(
    [0.7, 1.1, 1.3, 1.2, 0.9],
    'normal',
  );
  const idSlots = ids.rows(4, 'tight').flatMap((row) => row.columns(2, 'normal'));
  const cards = losses.map((id, i) =>
    place(
      namedBox(id, {
        width: idSlots[i].width * 0.93,
        height: 57,
        color: id === example ? 'pink' : 'dim',
      }),
      idSlots[i],
    ),
  );
  const observedName = caption(
    leftTitle,
    'Observed losses   ·   ' + losses.length + ' / ' + PAIRED.n,
    'ink',
    44,
  );
  const receipt = caption(original, example + '   ·   hit → miss', 'pink', 44);
  const confound = caption(issue, 'Did the path or the index change?', 'yellow', 37);
  const proposed = caption(rightTitle, 'Proposed connector-only comparison', 'ink', 45);
  const [inputs, frozen] = shared.rows(2, 'tight');
  const fixed = [
    caption(inputs, 'Same queries, labels, corpus and tenant permissions', 'cyan', 36),
    caption(frozen, 'Same index, model and settings', 'cyan', 36),
  ];
  const sides = arms.columns(2, 'wide');
  const places = sides.map((side) => side.rows(2, 'tight'));
  const pathNames = places.map(([slot], i) =>
    caption(slot, i ? 'Candidate path' : 'Old path', i ? 'cyan' : 'blue', 41),
  );
  const copies = places.map(([, slot]) => {
    const card = namedBox(example, { width: slot.width * 0.7, height: 67, color: 'pink' });
    return place(card, slot);
  });
  const [prompt, result] = outputs.rows([1, 1.3], 'tight');
  const field = caption(prompt, 'Did ' + DNS_QUERY.runbook + ' make the top five?', 'dim', 35);
  const wells = result.columns(2, 'wide').map((slot) =>
    place(
      rect(slot.width * 0.76, slot.height * 0.9, {
        fill: null,
        stroke: 'dim',
        dash: [10, 7],
        width: 3,
        radius: 12,
      }),
      slot,
    ),
  );
  const wait = caption(status, 'Record a hit or miss for each path', 'yellow', 42);
  s.add(observedName, cards, receipt);
  c.show('mix', confound);
  c.show('fix', [proposed, fixed]);
  c.show('vary', pathNames);
  c.show('pairs', [field, wells]);
  c.show('inspect', copies);
  c.on('inspect', () =>
    s.play(
      to(cards[index].frame, (n) => n.stroke('yellow')),
      { duration: 0.5 },
    ),
  );
  c.show('unknown', wait, { after: true });
  c.on('distinguish', () =>
    s.play(
      to(wells[1], (n) => n.stroke('yellow')),
      { duration: 0.5 },
    ),
  );
}
