import { dot, dynamic, line, place } from 'vizmatic/stage';
import { area, label, mono, note } from '../kit-narrated.mjs';

const fmt = (value) => String(Number(value.toFixed(5))).replace('-', '−');

export function networkMap(s, m) {
  const [header, upper, lower, foot] = area.rows([1, 3, 3, 2], 'normal');
  const context = place(
    mono('x = ' + fmt(m.x) + '     measured ' + m.target + ' ms     SGD rate ' + m.rate, {
      size: 43,
    }),
    header,
  );
  const signal = s.value(0);
  const names = ['Upper', 'Lower'];
  const rows = [upper, lower].map((region, i) => {
    const [titles, values, wires, derivatives] = region.rows([1, 1.6, 1, 1], 'tight');
    const columns = (r) => r.columns([3, 2, 3], 'wide');
    const [a, gate, v] = columns(values);
    const heads = columns(titles).map((slot, j) =>
      place(
        note(
          [names[i] + ' unit   ·   w × x + b', 'ReLU   ·   in → out', 'Output weight × activation'][
            j
          ],
        ),
        slot,
      ),
    );
    const [aGrad, , vGrad] = columns(derivatives);
    const [start, y] = columns(wires)[0].point('center');
    const [middle] = columns(wires)[1].point('center');
    const [end] = columns(wires)[2].point('center');
    const track = line([start, y], [end, y], { stroke: 'grid', width: 5 });
    const gateOpen = m.z[i] > 0;
    const gateColor = gateOpen ? 'green' : 'pink';
    const gateMark = gateOpen
      ? line([middle - 20, y], [middle + 20, y], { stroke: gateColor, width: 10 })
      : line([middle, y - 20], [middle, y + 20], { stroke: gateColor, width: 10 });
    function state(w, b, z, h, out) {
      const affine = place(
        mono(fmt(w) + ' × ' + fmt(m.x) + ' + ' + fmt(b), { size: 45, color: 'blue' }),
        a,
      );
      const activation = place(mono(fmt(z) + ' → ' + fmt(h), { size: 48, color: gateColor }), gate);
      const product = place(
        mono(fmt(out) + ' × ' + fmt(h) + ' = ' + fmt(out * h), { size: 45 }),
        v,
      );
      return { affine, activation, product };
    }
    const old = state(m.weights[i], m.biases[i], m.z[i], m.hidden[i], m.outWeights[i]);
    const next = state(
      m.nextWeights[i],
      m.nextBiases[i],
      m.nextZ[i],
      m.nextHidden[i],
      m.nextOut[i],
    );
    const dw = place(
      mono('∂L/∂w ' + fmt(m.gradWeights[i]) + '   ∂L/∂b ' + fmt(m.gradZ[i]), {
        color: 'yellow',
        size: 37,
      }),
      aGrad,
    );
    const dv = place(
      mono('∂L/∂v = ' + fmt(m.residual) + ' × ' + fmt(m.hidden[i]) + ' = ' + fmt(m.gradOut[i]), {
        color: 'yellow',
        size: 34,
      }),
      vGrad,
    );
    const passed = place(
      mono('∂L/∂z ' + fmt(m.gradZ[i]), { size: 36, color: 'yellow' }),
      columns(derivatives)[1],
    );
    const pulse = dynamic(() => {
      const t = signal.value;
      if (t <= 0) return [];
      const x =
        t < 1 ? end + (middle - end) * t : middle + (gateOpen ? (start - middle) * (t - 1) : 0);
      const color = gateOpen || t < 1 ? 'yellow' : 'pink';
      return [
        dot(13, color).moveTo([x, y]),
        mono(fmt(m.gradHidden[i]), { size: 34, color }).moveTo([x + 65, y - 36]),
      ];
    });
    return { base: [heads, track], old, next, gateMark, dw, dv, passed, pulse };
  });
  const pair = (key) => rows.map((r) => r[key]);
  const state = (key, cell) => rows.map((r) => r[key][cell]);
  const [outRow, messageRow] = foot.rows(2, 'tight');
  function result(h, v, b, y) {
    const terms = h.map((value, i) => fmt(value * v[i]));
    return place(
      mono(terms.join(' + ') + ' + ' + fmt(b) + '  =  ' + fmt(y) + ' ms', {
        size: 51,
        color: 'blue',
      }),
      outRow,
    );
  }
  const oldOutput = result(m.hidden, m.outWeights, m.outBias, m.prediction);
  const nextOutput = result(m.nextHidden, m.nextOut, m.nextOutBias, m.nextPrediction);
  const residual = place(
    mono('prediction − measured = ' + fmt(m.residual) + ' ms     loss = ' + fmt(m.loss) + ' ms²', {
      size: 38,
    }),
    messageRow,
  );
  const loss = place(
    mono(
      'loss = ½ × (' +
        fmt(m.nextPrediction - m.target) +
        ')² ≈ ' +
        Number(m.nextLoss.toFixed(3)) +
        ' ms²',
      { size: 40, color: 'yellow' },
    ),
    messageRow,
  );
  const question = (words) => place(label(words, { color: 'yellow', size: 43 }), messageRow);
  const gradBias = place(
    mono('output bias gradient  ' + fmt(m.gradOutBias), { color: 'yellow', size: 38 }),
    messageRow,
  );
  return {
    base: [context, pair('base')],
    resultArea: outRow,
    oldW: state('old', 'affine'),
    gates: [state('old', 'activation'), pair('gateMark')],
    oldV: state('old', 'product'),
    oldOutput,
    residual,
    question,
    gradBias,
    loss,
    outputGrads: pair('dv'),
    reached: [pair('dw'), pair('passed')],
    pulses: pair('pulse'),
    nextW: state('next', 'affine'),
    nextGates: state('next', 'activation'),
    nextV: state('next', 'product'),
    nextOutput,
    oldGates: state('old', 'activation'),
    arrive: () => s.play(signal.to(1, { duration: 1.2 })),
    pass: () => s.play(signal.to(2, { duration: 1.2 })),
  };
}
