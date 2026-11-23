import { assertEqual, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function negatives(s, c) {
  const candidates = [
    { caption: 'A dog sleeps', score: 0.76, matches: false },
    { caption: 'A hound sprints', score: 0.76, matches: true },
    { caption: 'The sky is blue', score: -0.32, matches: false },
  ];
  const [queryArea, header, ...slots] = area.rows([1, 0.7, 1.3, 1.3, 1.3, 1], 'normal');
  const split = (r) => r.columns([2.4, 1.2, 1.8], 'wide');
  const heads = split(header),
    foot = slots.pop();
  const names = ['Retrieved caption', 'Toy cosine', 'Use in training'];
  const cols = slots.map(split);
  const query = place(
    label('Find footage of a dog running.', { color: 'cyan', size: 48 }),
    queryArea,
  );
  const headers = names.map((name, i) => place(note(name, { size: 34 }), heads[i], 'left'));
  const cards = cols.map(([name, score], i) => [
    place(label(candidates[i].caption, { size: 48 }), name, 'left'),
    place(mono(candidates[i].score.toFixed(2), { size: 46 }), score, 'left'),
  ]);
  const admissible = candidates.filter((item) => !item.matches);
  const hard = admissible.reduce((best, item) => (item.score > best.score ? item : best));
  const roles = candidates.map((item, i) =>
    place(
      label(item.matches ? 'valid answer' : item === hard ? 'hard negative' : 'easy negative', {
        size: 40,
        color: item.matches ? 'green' : item === hard ? 'pink' : 'blue',
      }),
      cols[i][2],
      'left',
    ),
  );
  const selection = place(
    label('Which high scorer can be used as a negative?', { size: 42, color: 'yellow' }),
    foot,
  );
  const evidence = place(
    note('Compare the action in the caption with the action in the query.', { size: 34 }),
    foot,
  );
  assertEqual(hard.caption, 'A dog sleeps', 'highest-scoring verified non-match');
  s.add(heading(c.title), query, headers, cards[2]);
  c.show('mine-easy', roles[2]);
  c.show('mine-pair', cards.slice(0, 2));
  c.show('mine-choose', selection);
  c.show('mine-sleeper', roles[0], { after: true });
  c.show('mine-sprinter', roles[1], { after: true });
  c.swap('mine-sprinter', selection, evidence, { after: true });
}
