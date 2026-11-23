import { column, decimal, dynamic, line, place, row } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { example, updated } from '../parts.mjs';
import { latencyStrip, work } from '../latency.mjs';

export default function oneUpdate(s, c) {
  const p = latencyStrip(s, updated.prediction, example.target);
  const [premise, numbers, result] = work.rows([1, 2, 1], 'wide');
  const rule = place(mono('new parameter = old parameter − 0.1 × gradient', { size: 40 }), premise);
  const w = s.value(example.weight),
    b = s.value(example.bias);
  const changes = place(
    row(
      [
        column([
          note('weight  ·  gradient ' + updated.gradWeight),
          decimal(() => w.value, { prefix: 'w = ', digits: 1, size: 60, color: 'blue' }),
        ]),
        column([
          note('bias  ·  gradient ' + updated.gradBias),
          decimal(() => b.value, { prefix: 'b = ', digits: 1, size: 60, color: 'cyan' }),
        ]),
      ],
      { gap: 160 },
    ),
    numbers,
  );
  const weightGain = (updated.weight - example.weight) * example.x;
  const boundary = updated.prediction + weightGain;
  function span(from, to, color) {
    const [x0, y] = p.ruler.world(from),
      [x1] = p.ruler.world(to);
    return line([x0, y - 37], [x1, y - 37], { stroke: color, width: 14 });
  }
  const gains = dynamic(() => {
    const end = p.model.value;
    if (end <= updated.prediction) return [];
    const weight = span(updated.prediction, Math.min(end, boundary), 'blue');
    return end > boundary ? [weight, span(boundary, end, 'cyan')] : [weight];
  });
  const [wl, bl] = result.columns(2, 'normal');
  const gainW = place(mono('2 × 0.8 = +' + weightGain + ' ms', { size: 40, color: 'blue' }), wl);
  const gainB = place(
    mono('+' + (updated.bias - example.bias) + ' ms from bias', { size: 40, color: 'cyan' }),
    bl,
  );
  const loss = place(
    label('Half the gap  ·  loss ' + updated.loss + ' → ' + updated.nextLoss + ' ms²', {
      color: 'yellow',
    }),
    result,
  );
  s.add(heading(c.title), p.picture, changes, gains);
  c.show('update-rule', rule);
  c.on('update-apply', () => {
    w.set(updated.weight);
    b.set(updated.bias);
  });
  c.show('update-weight-contribution', gainW);
  c.show('update-bias-contribution', gainB);
  const answer = c.cue('update-payoff');
  c.on('update-payoff', () =>
    s.play(p.model.to(updated.nextPrediction, { duration: answer.end - answer.start })),
  );
  c.swap('update-loss', [gainW, gainB], loss, { after: true, lead: 0 });
}
