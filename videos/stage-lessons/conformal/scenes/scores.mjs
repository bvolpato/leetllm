import { dot, dynamic, group, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  ACTUALS,
  DISPLAY_ORDER,
  FOOT,
  PREDICTIONS,
  RESIDUALS,
  latencyRuler,
  scoreRail,
} from '../parts.mjs';

export default function scores(s, c) {
  const title = heading(c.title);
  const [examples, prompt] = area.rows([5, 1], 'wide');
  const rows = examples.rows(2, 'loose');
  const cards = [1, 2].map((i, j) => {
    const [facts, track] = rows[j].columns([1, 4], 'wide');
    const x = (ms) => track.left + ((ms - 29) / 17) * track.width;
    const prediction = PREDICTIONS[i];
    const actual = ACTUALS[i];
    const y = track.cy;
    const visible = s.value(0);
    const board = group(
      place(label('Request C' + (i + 1), { size: 43 }), facts),
      line([track.left, y], [track.right, y], { stroke: 'faint', width: 3 }),
      dot(14, 'cyan').moveTo([x(prediction), y]),
      mono('forecast ' + prediction, { size: 38, color: 'cyan' }).moveTo([x(prediction), y - 57]),
      dynamic(() =>
        visible.value
          ? [
              line([x(prediction), y], [x(actual), y], { stroke: 'yellow', width: 7 }),
              dot(14, 'green').moveTo([x(actual), y]),
              mono('actual ' + actual, { size: 38, color: 'green' }).moveTo([x(actual), y + 58]),
            ]
          : [],
      ),
    );
    return { board, visible };
  });
  const ask = place(label('Which forecast missed by more?'), prompt);
  const equal = place(
    mono('C2  |32 − 35| = ' + RESIDUALS[1] + ' ms     C3  |43 − 40| = ' + RESIDUALS[2] + ' ms', {
      size: 43,
      color: 'yellow',
    }),
    prompt,
  );
  const rail = scoreRail(s);
  const ruler = latencyRuler(s);
  const legend = place(note('Absolute error (ms) · one stick per held-out request'), FOOT);
  const collection = [rail.frame, rail.sticks, ruler.frame, ruler.point, ruler.limit];
  s.add(title, cards[0].board);
  c.after('first', () => cards[0].visible.set(1));
  c.show('second', cards[1].board);
  c.after('second-actual', () => cards[1].visible.set(1));
  c.show('ask', ask);
  c.swap('tie', ask, equal, { after: true });
  c.swapAll('nine', [...collection, legend], { keep: [title] });
  c.on('reorder', () => {
    rail.names.set(0);
    s.play(...rail.positions.map((v, i) => v.to(DISPLAY_ORDER.indexOf(i), { duration: 1.5 })));
    rail.names.set(1);
  });
  c.keep(collection);
}
