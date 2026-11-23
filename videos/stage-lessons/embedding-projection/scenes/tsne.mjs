import { boxOf, column, dot, dynamic, group, line, place } from 'vizmatic/stage';
import { display, label, mono, note } from '../../kit-narrated.mjs';
import {
  begin,
  FOOT,
  LEFT,
  RIGHT,
  mathPlot,
  pairDistanceFor,
  TSNE_PAIR,
  tsneTerm,
  taskHeader,
} from '../parts.mjs';
export default function tsne(s, c) {
  const header = taskHeader(),
    q = s.value(TSNE_PAIR.map[0]),
    zero = s.value(0);
  const chart = mathPlot(LEFT, { x: [-1, 9], y: [-2, 2] });
  const pair = dynamic(() => {
    const dist = pairDistanceFor(q.value);
    const a = chart.world(0, 0),
      b = chart.world(dist, 0);
    return group(
      line(a, b, { stroke: 'yellow', width: 5 }),
      dot(16, 'ink').moveTo(a),
      dot(16, 'ink').moveTo(b),
    );
  });
  const rows = RIGHT.rows(3, 'wide');
  const original = place(
    column([
      note('source pair probability'),
      mono('p = ' + TSNE_PAIR.original.toFixed(2), { size: 56, color: 'ink' }),
    ]),
    rows[0],
  );
  const qCaption = place(note('map probability'), rows[1], 'top');
  const termCaption = place(note('pair contribution'), rows[2], 'top');
  const qFrame = place(mono('q = 0.000', { size: 56, color: 'ink' }), rows[1]);
  const termFrame = place(mono('0.000', { size: 71, color: 'yellow' }), rows[2]);
  const qNumber = dynamic(() =>
    mono('q = ' + q.value.toFixed(3), { size: 56, color: 'ink' }).moveTo(
      boxOf(qFrame).point('center'),
    ),
  );
  const term = dynamic(() => {
    const value = tsneTerm(TSNE_PAIR.original, q.value);
    if (value === 0 && zero.value < 0.5) return group();
    const words = value > 0 && value < 0.001 ? value.toExponential(1) : value.toFixed(3);
    return mono(words, { size: 71, color: 'yellow' }).moveTo(boxOf(termFrame).point('center'));
  });
  const formula = place(label('pair contribution: p ln(p/q)', { size: 36 }), FOOT);
  begin(
    s,
    c,
    'tsne',
    'A lost neighbor pulls closer',
    [chart, pair, original.nodes[0], qCaption, termCaption],
    header,
  );
  c.on('tsne-beat-1-focus-2', () => s.play(q.to(0.012, { duration: 1.2 })));
  c.on('tsne-beat-1-focus-1', () => s.play(q.to(0.01, { duration: 1.2 })));
  c.show('tsne-beat-2-focus-1', [original.nodes[1], qNumber], { after: true });
  c.show('tsne-beat-2-focus-2', [term, formula], { after: true });
  c.on('tsne-beat-3-focus-1', () =>
    s.play(
      q.to(TSNE_PAIR.original, {
        duration: c.cue('tsne-beat-3-focus-1').end - c.cue('tsne-beat-3-focus-1').start,
      }),
    ),
  );
  c.after('tsne-zero', () => s.play(zero.to(1, { duration: 0.1 })));
}
