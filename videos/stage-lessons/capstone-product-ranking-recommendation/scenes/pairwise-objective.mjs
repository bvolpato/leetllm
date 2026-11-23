import { dot, dynamic, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { TRAINING_PAIRS, TRAINING_REQUESTS } from '../../../films/capstone-product-ranking-recommendation/training-data.mjs';
import { near, open } from '../parts.mjs';

export default function objective(s, c) {
  const [work, ruler] = open(s, c).columns([1.15, 1], 'loose');
  const rows = work.rows(7, 'normal');
  const [head, upper, lower, readout, detail] = ruler.rows([1, 1.25, 1.25, 1, 1.5], 'wide');
  const [weak, better] = TRAINING_REQUESTS[0].products;
  const { difference } = TRAINING_PAIRS.find(p => p.better === better[0] && p.worse === weak[0]);
  const gradient = difference.map(value => -value / 2);
  const step = 0.3;
  const weights = gradient.map(value => -step * value);
  const margin = weights.reduce((sum, w, i) => sum + w * difference[i], 0);
  near(margin, 0.0555, 'One preferred pair at step 0.3');
  function row(i, values, color = 'ink') {
    return rows[i].columns([1.6, 1, 1], 'normal').map((cell, j) =>
      place(j === 0 ? label(values[j], { size: 33, color }) : mono(values[j], { size: 37, color }), cell, j ? 'center' : 'left'));
  }
  const signed = (x, digits) => (x < 0 ? '−' : '+') + Math.abs(x).toFixed(digits);
  const amount = (p, ws) => p[1] * ws[0] + p[2] * ws[1];
  const progress = s.value(0);
  const direction = [
    { p: better, lane: upper, color: 'green' }, { p: weak, lane: lower, color: 'blue' },
  ];
  s.add(row(0, ['TRAIN-1', 'Match', 'Quality'], 'dim'),
    ...direction.map(({ p, color }, i) => row(i + 1, [p[0] + ' · grade ' + p[3], p[1].toFixed(2), p[2].toFixed(2)], color)),
    place(label('Scores from the same weights', { size: 39 }), head));
  for (const { p, lane, color } of direction) {
    const [name, track] = lane.columns([0.45, 2.6], 'wide');
    const start = track.left + 15, width = track.width - 50;
    s.add(place(mono(p[0], { color }), name),
      line([start, track.cy], [start + width, track.cy], { stroke: 'dim', width: 3 }),
      ...[0, 0.04, 0.08].map(t => note(String(t), { size: 27 }).moveTo([start + width * t / 0.08, track.cy + 39])),
      dynamic(() => {
        const score = amount(p, weights) * progress.value;
        const x = start + width * score / 0.08;
        return [dot(13, color).moveTo([x, track.cy]), mono(score.toFixed(5), { size: 31, color }).moveTo([x, track.cy - 43])];
      }));
  }
  c.show('pair-difference', row(3, ['A2 minus A1', ...difference.map(x => signed(x, 2))], 'yellow'));
  const tie = place(mono('Margin = 0', { size: 42 }), readout);
  c.show('pair-tie', tie);
  c.show('pair-gradient', row(4, ['Gradient', ...gradient.map(x => signed(x, 2))]));
  c.show('pair-update', row(5, ['New weights', ...weights.map(x => signed(x, 3))], 'cyan'));
  c.hide('pair-move', tie);
  c.on('pair-move', () => s.play(progress.to(1, { duration: 1.2 })));
  const gap = place(mono('A2 − A1 = +' + margin.toFixed(4), { size: 42, color: 'yellow' }), readout);
  c.show('pair-margin', gap, { after: true });
  c.show('pair-average', place(note('Full fit · average all pair gradients'), detail, 'top'));
  c.show('pair-regularize', place(mono('∇L = mean(∇pair loss) + λw', { size: 37 }), detail));
}
