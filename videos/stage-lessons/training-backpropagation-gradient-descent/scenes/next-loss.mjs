import { dot, dynamic, line, numberLine, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { classificationTrace } from '../../../films/training-backpropagation-gradient-descent/model.mjs';

export default function nextLoss(s, c) {
  const m = classificationTrace();
  const [head, body, foot] = area.rows([1, 5, 1], 'wide');
  const [names, graph, values] = body.columns([1, 3.7, 1], 'normal');
  const axis = place(
    numberLine({
      range: [-1, 1],
      ticks: [-1, -0.5, 0, 0.5, 1],
      length: graph.width * 0.9,
      labelSize: 34,
    }),
    graph,
    'bottom',
  );
  const [zero] = axis.world(0);
  const tracks = graph.rows([1, 1, 1, 0.55], 'normal').slice(0, 3);
  const north = tracks[0].point('top')[1],
    south = tracks.at(-1).point('bottom')[1];
  const baseline = line([zero, north], [zero, south], { stroke: 'dim', width: 4 });
  const logits = place(mono('raw class scores  →  softmax', { size: 44 }), head);
  const probability = place(label('Probability assigned to each issue class'), head);
  const gradient = place(label('Gradient at each logit   ·   probability minus target'), head);
  const target = place(label('Resolved issue   ·   docs', { color: 'pink' }), foot);
  const question = place(label('Which logit needs to rise?', { color: 'yellow' }), foot);
  const classes = ['bug', 'docs', 'security'];
  const rows = tracks.map((track, i) => {
    const y = track.point('center')[1];
    const v = s.value(0);
    const name = label(classes[i], { size: 48 }).moveTo([names.point('center')[0], y]);
    const bar = dynamic(() => {
      const [end] = axis.world(v.value);
      return [
        rect(Math.max(1, Math.abs(end - zero)), 48, { fill: 'blue', stroke: 'blue' }).moveTo([
          (end + zero) / 2,
          y,
        ]),
        dot(9, 'ink').moveTo([end, y]),
      ];
    });
    const marker = mono('target ' + m.target[i], {
      size: 33,
      color: i === 1 ? 'pink' : 'dim',
    }).moveTo([names.point('center')[0], y + 51]);
    const value = dynamic(() =>
      mono(v.value.toFixed(2), { size: 47, color: 'blue' }).moveTo([values.point('center')[0], y]),
    );
    return { v, name, bar, marker, value };
  });
  const title = heading(c.title);
  s.add(
    title,
    logits,
    axis,
    baseline,
    rows.map((r) => r.name),
  );
  c.swap('classification-softmax', logits, probability);
  c.show(
    'classification-softmax',
    rows.map((r) => [r.bar, r.value]),
  );
  c.on('classification-softmax', () =>
    s.play(...rows.map((r, i) => r.v.to(m.probabilities[i], { duration: 1.2 }))),
  );
  c.show('classification-target', [target, rows.map((r) => r.marker)]);
  c.swap('classification-question', target, question);
  c.swap('classification-gradient', probability, gradient);
  c.on('classification-result', () => s.play(rows[1].v.to(m.gradient[1], { duration: 1.3 })));
  const table = body.rows(4, 'tight').map((r) => r.columns([1, 1, 1.3, 1.5], 'normal'));
  const raw = [place(label('Raw logit'), table[0][1])];
  const shifted = [place(label('Logit − largest'), table[0][2])];
  const exponentials = [place(label('exp(shifted logit)'), table[0][3])];
  const largest = Math.max(...m.logits);
  for (const [i, logit] of m.logits.entries()) {
    const [name, score, difference, exp] = table[i + 1];
    const color = logit === largest ? 'yellow' : 'ink';
    const delta = logit - largest;
    raw.push(place(label(classes[i]), name), place(mono(logit.toFixed(2), { color }), score));
    shifted.push(place(mono(delta.toFixed(2), { color }), difference));
    exponentials.push(place(mono(Math.exp(delta).toFixed(2), { color }), exp));
  }
  const call = place(mono('F.cross_entropy(logits, target)', { size: 50 }), head);
  const targetIndex = m.target.indexOf(1);
  const targetLabel = place(
    label(`target = ${targetIndex}  (${classes[targetIndex]})`, { color: 'pink' }),
    foot,
  );
  c.swapAll('classification-logits', [raw, call, targetLabel], { keep: [title] });
  c.show('classification-shift', shifted, { after: true, lead: 0 });
  c.show('classification-exp', exponentials, { after: true, lead: 0 });
}
