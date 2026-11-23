import { draw } from 'vizmatic/stage';
import { QUERY_VECTORS } from '../../../films/grouped-query-attention/fixtures.mjs';
import {
  ATTENTION,
  C,
  foot,
  change,
  mono,
  note,
  place,
  readout,
  right,
  start,
  vectorPlane,
  wall,
} from '../parts.mjs';

export default function attention(s, c) {
  start(s, c.title);
  const cache = wall(s, c);
  const [head, ...lanes] = right.rows([1, 4, 4], 'normal');
  s.add(place(note('Rain: K = V = (1, 0)       fell: K = V = (0, 1)'), head, 'left'));
  change(s, c, 'positions', cache.cursor, -1, false, 0.16);
  change(s, c, 'weights', cache.cursor, 0, true, 0.16);
  change(s, c, 'second', cache.cursor, -1, false, 0.16);
  change(s, c, 'answer', cache.cursor, 1, true, 0.16);
  const fmt = (pair) => pair.map((n) => n.toFixed(2)).join(', ');
  for (const [i, lane] of lanes.entries()) {
    const { scores, weights, output } = ATTENTION[i];
    const [plot, values] = lane.columns([2, 3], 'normal');
    const [q, score, weight, result] = values.rows(4, 'tight');
    const plane = vectorPlane(s, plot, { extent: 0.82, origin: [0.16, 0.83] });
    s.add(plane.vector([1, 0], C.value, 4), plane.vector([0, 1], C.value, 4));
    const questionCue = i ? 'second' : 'score';
    const answerCue = i ? 'answer' : 'weights';
    const resultCue = i ? 'combination' : 'blend';
    const pointer = plane.vector(QUERY_VECTORS[i], C.query, 7);
    c.show(questionCue, draw(pointer));
    const query = mono('Q' + i + ' = [' + QUERY_VECTORS[i].join(', ') + ']', {
      size: 41,
      color: C.query,
    });
    c.show(questionCue, place(query, q, 'left'));
    const scoreRows = i ? [] : [['score', 'Dot products   2, 0', C.key, true]];
    scoreRows.push([i ? 'answer' : 'scale', 'Scaled scores   ' + fmt(scores), C.key, true]);
    readout(s, c, score, scoreRows, { size: 33 });
    readout(s, c, weight, [[answerCue, 'Weights   ' + fmt(weights), 'ink', true]], { size: 35 });
    readout(s, c, result, [[resultCue, 'Output   (' + fmt(output) + ')', C.result, true]], {
      size: 36,
    });
    c.show(resultCue, draw(plane.vector(output, C.result, 8)), { after: true });
    change(s, c, questionCue, cache.lit, i);
  }
  readout(
    s,
    c,
    foot,
    [
      [
        'score',
        'Scaled score = (query · key) / √2     ·     weight = softmax over visible positions',
      ],
      ['ask', 'Q1 reads Rain and fell. Which token gets more weight?', C.result],
      ['answer', 'Q1 gives more weight to fell.', 'ink', true],
    ],
    { size: 36, align: 'center' },
  );
}
