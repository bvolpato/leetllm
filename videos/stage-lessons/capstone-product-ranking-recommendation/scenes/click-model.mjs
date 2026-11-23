import { dot, dynamic, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { weightedClickExpectation } from '../../../films/capstone-product-ranking-recommendation/model.mjs';
import { open } from '../parts.mjs';

export default function clickModel(s, c) {
  const [title, header, first, third, key, footer] = open(s, c).rows([0.8, 0.65, 2.1, 2.1, 0.65, 0.95], 'wide');
  const cells = r => r.columns([0.95, 1.1, 1.15, 1, 3], 'wide');
  const names = ['Position', 'P(examined)', 'P(click)', 'Weight', 'Expected weighted clicks per impression'];
  const labels = names.map((v, i) => place(note(v), cells(header)[i]));
  const mode = place(label('Both listings    P(relevant) = 0.50', { size: 41 }), title, 'left');
  const rule = place(mono('P(click) = P(examined) × 0.50', { size: 39 }), key);
  s.add(mode, labels);
  const factors = [], clickRates = [], marks = [], weights = [], ordinary = [], capped = [];
  [0.8, 0.2].forEach((exam, i) => {
    const [pos, propensity, raw, mult, track] = cells([first, third][i]);
    const value = weightedClickExpectation(exam, 0.5, 1);
    ordinary.push(value.weight);
    capped.push(weightedClickExpectation(exam, 0.5, 1, 2).weight);
    const w = s.value(1);
    weights.push(w);
    s.add(place(label(i ? '3' : '1'), pos));
    factors.push(place(mono(exam.toFixed(2)), propensity));
    clickRates.push(place(mono(value.raw.toFixed(2)), raw));
    const left = track.left + 55, right = track.right - 65, x = v => left + (right - left) * v / 0.5;
    s.add(line([left, track.cy], [right, track.cy], { stroke: 'dim', width: 4 }),
      ...[0, 0.25, 0.5].flatMap(tick => [
        line([x(tick), track.cy - 9], [x(tick), track.cy + 9], { stroke: 'dim', width: 3 }),
        note(tick.toFixed(2), { size: 27 }).moveTo([x(tick), track.cy + 44]),
      ]));
    marks.push(dynamic(() => {
      const expected = value.raw * w.value;
      const color = i ? 'pink' : 'cyan';
      return [place(mono('×' + w.value.toFixed(2), { size: 38 }), mult),
        line([left, track.cy], [x(expected), track.cy], { stroke: color, width: 6 }),
        dot(13, color).moveTo([x(expected), track.cy]),
        mono(expected.toFixed(2), { size: 35, color }).moveTo([x(expected), track.cy - 42])];
    }));
  });
  c.show('click-product', [rule, ...factors]);
  c.show('click-raw', [...clickRates, ...marks], { after: true });
  const move = (cue, targets) => c.on(cue, () =>
    s.play(...weights.map((w, i) => w.to(targets[i], { duration: 0.85 }))));
  const inverse = place(mono('Weight = 1 / examination probability', { size: 39 }), key);
  c.swap('click-inverse', rule, inverse);
  move('click-inverse', ordinary);
  const proposed = place(mono('Proposed weight cap = 2', { size: 39 }), key);
  const cap = place(mono('Weight = min(inverse weight, 2)', { size: 39 }), key);
  c.swap('click-cap', inverse, proposed);
  const prompt = place(label('With a cap of 2, which position loses weight?', { color: 'yellow' }), footer);
  c.show('click-question', prompt);
  move('click-clip', capped);
  c.swap('click-clip', proposed, cap, { lead: -0.86 });
  const clipped = place(note('Position three falls below the shared relevance probability.'), footer);
  c.swap('click-clip', prompt, clipped);
  const one = place(mono('Weight = min(inverse weight, 1)', { size: 39 }), key);
  c.swap('click-one', cap, one);
  c.hide('click-one', clipped);
  move('click-one', [1, 1]);
}
