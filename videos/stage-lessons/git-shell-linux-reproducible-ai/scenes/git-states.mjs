import { delay, fade, place, to } from 'vizmatic/stage';
import { label, mono, namedBox } from '../../kit-narrated.mjs';
import { repositoryContext, rows } from '../parts.mjs';

export default function gitStates(s, c) {
  const { main } = repositoryContext(s, c);
  const request = rows[1];
  const [reference, heads, editBand, diffBand] = main.rows([1, 1, 2.4, 2], 'normal');
  const lanes = editBand.columns(3, 'loose');
  const labels = heads
    .columns(3, 'loose')
    .map((region, i) =>
      place(label(['Working tree', 'Index', 'New commit'][i], { size: 43 }), region),
    );
  const expected = place(
    mono('request 102     expected: ' + request.expected, { size: 46, color: 'cyan' }),
    reference,
  );
  function prediction(value, i, color) {
    return place(
      namedBox(value, { width: lanes[i].width * 0.9, height: 136, color, size: 51, font: 'mono' }),
      lanes[i],
    );
  }
  const working = prediction(request.prediction, 0, 'pink');
  const repaired = prediction(request.expected, 0, 'pink');
  const staged = prediction(request.prediction, 0, 'cyan').opacity(0);
  const recorded = prediction(request.prediction, 1, 'green').opacity(0);
  const before = place(
    mono('git add eval/access_requests.jsonl', { size: 40, color: 'blue' }),
    diffBand,
  );
  const [commandBand, diff] = diffBand.rows(2, 'normal');
  const unstaged = place(mono('git diff', { color: 'blue' }), commandBand);
  const delta = place(mono('− escalated     + blocked', { color: 'yellow' }), diff);
  const cached = place(mono('git diff --cached', { color: 'blue' }), commandBand);
  const selection = place(mono('+ prediction: escalated', { color: 'yellow' }), diff);
  const save = place(mono('git commit', { color: 'blue' }), diffBand);
  s.add(labels, expected, working);
  c.show('stage-row', before);
  c.on(
    'stage-row',
    () =>
      s.play(
        to(staged, (n) => n.moveTo(lanes[1].point('center')), { duration: 1 }),
        delay(fade(staged, 1, { duration: 0.4 }), 0.45),
      ),
    0.2,
  );
  c.swap('edit-row', working, repaired);
  c.swap('working-diff', before, [unstaged, delta]);
  c.swap('cached-diff', [unstaged, delta], [cached, selection]);
  c.swap('commit-row', [cached, selection], save);
  c.on(
    'commit-row',
    () =>
      s.play(
        to(recorded, (n) => n.moveTo(lanes[2].point('center')), { duration: 1 }),
        delay(fade(recorded, 1, { duration: 0.4 }), 0.45),
      ),
    0.2,
  );
}
