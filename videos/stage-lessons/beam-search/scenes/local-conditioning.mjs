import { barChart, graph, indicate, place } from 'vizmatic/stage';
import { heading, area, label, mono } from '../../kit-narrated.mjs';

export default function localConditioning(s, c) {
  const prefix = [0.4, 0.6],
    validNext = [0.1, 0.9];
  const joint = prefix.map((p, i) => p * validNext[i]);
  const total = joint.reduce((a, b) => a + b, 0);
  const [header, body, footer] = area.rows([1, 4.5, 1.2], 'wide');
  const [left, right] = body.columns(2, 'loose');
  const original = place(
    graph(
      [
        { id: 'root', label: 'prefix', width: 180, height: 80 },
        { id: 'A', label: 'A', value: prefix[0].toFixed(2), width: 140, height: 110 },
        { id: 'B', label: 'B', value: prefix[1].toFixed(2), width: 140, height: 110 },
        { id: 'Ax', label: 'A x', value: 'p(x|A) = .10', width: 270, height: 110 },
        { id: 'By', label: 'B y', value: 'p(y|B) = .90', width: 270, height: 110 },
      ],
      [
        { from: 'root', to: 'A' },
        { from: 'root', to: 'B' },
        { from: 'A', to: 'Ax' },
        { from: 'B', to: 'By' },
      ],
      {
        direction: 'LR',
        fit: true,
        width: left.width * 0.98,
        height: left.height * 0.9,
        labelSize: 34,
        valueSize: 34,
        edgeLabelSize: 34,
      },
    ),
    left,
  );
  const chart = place(
    barChart(
      [
        { label: 'A x', value: validNext[0], color: 'cyan' },
        { label: 'B y', value: validNext[1], color: 'blue' },
      ],
      {
        width: right.width * 0.8,
        height: right.height * 0.65,
        max: 1,
        labelSize: 40,
        showValues: true,
        format: (v) => v.toFixed(3),
      },
    ),
    right,
  );
  const inputs = place(label('Model continuation p(x|A) / p(y|B)', { size: 34 }), header, 'right');
  const local = place(label('Local masks: .40 / .60'), header, 'right');
  const conditioned = place(
    label('Whole-string conditioning', { color: 'yellow', size: 34 }),
    header,
    'right',
  );
  const equation = place(
    mono(`Valid mass ${joint[0].toFixed(2)} + ${joint[1].toFixed(2)} = ${total.toFixed(2)}`, {
      size: 34,
    }),
    footer,
  );
  s.add(heading(c.title), [original, chart, inputs]);
  c.swap('conditioning-local', inputs, local, { after: true });
  c.after('conditioning-local', () => s.play(chart.update(prefix, { duration: 1.2 })));
  c.on('local-conditioning-build-0', () =>
    s.play(indicate(original, { scale: 1, color: 'yellow' })),
  );
  c.on('local-conditioning-build-1', () =>
    s.play(indicate(original, { scale: 1, color: 'yellow' })),
  );
  c.after('conditioning-joint', () =>
    s.play(
      original.setValue('Ax', `.4 × .1 = ${joint[0].toFixed(2)}`, { duration: 0.6 }),
      original.setValue('By', `.6 × .9 = ${joint[1].toFixed(2)}`, { duration: 0.6 }),
    ),
  );
  c.show('local-conditioning-build-2', equation, { after: true });
  c.after('conditioning-result', () =>
    s.play(
      chart.update(
        joint.map((p) => p / total),
        { duration: 1.2 },
      ),
    ),
  );
  c.swap('conditioning-result', local, conditioned, { after: true });
}
