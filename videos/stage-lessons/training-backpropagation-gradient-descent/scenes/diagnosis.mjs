import {
  assertEqual,
  arrow,
  axes,
  boxOf,
  column,
  decimal,
  dot,
  dynamic,
  indicate,
  line,
  numberLine,
  place,
  rect,
  row,
} from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import {
  updateOnce,
  nonlinearTrace,
  simulateStopping,
} from '../../../films/training-backpropagation-gradient-descent/model.mjs';
import { relay } from '../parts.mjs';
export default function diagnosis(s, c) {
  const [head, body, foot] = area.rows([1, 5, 1], 'wide');
  const regions = body.columns(3, 'loose');
  const invalidValue = -1;
  assertEqual(Number.isNaN(Math.sqrt(invalidValue)), true, 'injected square-root failure');
  const local = nonlinearTrace(),
    rate = s.value(0.1);
  const w = s.value(1),
    b = s.value(0),
    loss = s.value(8),
    buffer = s.value(-8),
    fault = s.value(0);
  const cases = [
    'Reproducible batch: x = 2, target = 6',
    'Same batch   ·   first attempt',
    'Same batch   ·   replay from the original weights',
    'Two backward calls   ·   same weights',
    'First nonfinite value',
    'One hidden unit   ·   saved forward state',
  ];
  const caseName = dynamic(() =>
    label(cases[Math.round(fault.value)]).moveTo(head.point('center')),
  );
  const [parameterName, rulerRegion, valuesRegion] = regions[0].rows([1, 2, 2], 'wide');
  const parameterTitle = place(label('Parameters'), parameterName);
  const ruler = place(
    numberLine({
      range: [0, 6],
      ticks: [0, 1, 3, 5, 6],
      length: rulerRegion.width * 0.8,
      labelSize: 34,
    }),
    rulerRegion,
  );
  const parameter = dynamic(() =>
    dot(13, fault.value === 1 ? 'red' : 'blue').moveTo([
      ruler.get('x') + ((w.value - 3) / 6) * ruler.length,
      ruler.get('y') - 18,
    ]),
  );
  const values = place(
    column(
      [
        decimal(() => w.value, { prefix: 'w ', digits: 1, size: 40, color: 'blue' }),
        decimal(() => b.value, { prefix: 'b ', digits: 1, size: 40, color: 'cyan' }),
        decimal(() => rate.value, { prefix: 'rate ', digits: 1, size: 34, color: 'yellow' }),
      ],
      { gap: 'tight' },
    ),
    valuesRegion,
  );
  const saved = place(
    column(
      [
        label('Saved graph'),
        mono('x = 2', { color: 'cyan' }),
        mono('× w, then + b', { size: 34 }),
        note('Finite forward values'),
      ],
      { gap: 'wide' },
    ),
    regions[1],
  );
  const graphRows = regions[1].rows([1, 1, 1], 'loose');
  const invalidInput = place(mono('input ' + invalidValue, { color: 'cyan' }), graphRows[0]);
  const invalidOp = place(namedBox('sqrt', { width: 210, height: 90, color: 'red' }), graphRows[1]);
  const invalidOut = place(mono('NaN', { color: 'red' }), graphRows[2]);
  const invalidEdges = [
    arrow(boxOf(invalidInput).point('bottom'), boxOf(invalidOp).point('top'), {
      pad: 20,
      stroke: 'dim',
    }),
    arrow(boxOf(invalidOp).point('bottom'), boxOf(invalidOut).point('top'), {
      pad: 20,
      stroke: 'red',
    }),
  ];
  const invalid = [invalidInput, invalidOp, invalidOut, invalidEdges];
  const gateInput = place(mono('saved z = ' + local.z[1], { color: 'cyan' }), graphRows[0]);
  const gate = place(
    namedBox('ReLU: closed', { width: 300, height: 90, color: 'dim' }),
    graphRows[1],
  );
  const gateOut = place(
    mono('incoming ' + local.residual + ' → ' + local.gradZ[1], { color: 'yellow', size: 34 }),
    graphRows[2],
  );
  const gateEdges = [
    arrow(boxOf(gateInput).point('bottom'), boxOf(gate).point('top'), { pad: 20, stroke: 'dim' }),
    arrow(boxOf(gateOut).point('top'), boxOf(gate).point('bottom'), { pad: 20, stroke: 'yellow' }),
  ];
  const blocked = [gateInput, gate, gateOut, gateEdges];
  const [bufferHead, bufferBody, bufferReadout] = regions[2].rows([1, 2, 2], 'wide');
  const bufferTitle = place(label('Gradient buffer'), bufferHead);
  const frame = place(
    rect(bufferBody.width * 0.9, 90, { stroke: 'grid', fill: 'surface' }),
    bufferBody,
  );
  const bufferBar = dynamic(() => {
    const width = Math.max(
      2,
      boxOf(frame).width * (Number.isFinite(buffer.value) ? Math.abs(buffer.value) / 16 : 0),
    );
    return rect(width, 60, { fill: fault.value === 3 ? 'red' : 'yellow', stroke: 'yellow' }).moveTo(
      [boxOf(frame).left + width / 2, boxOf(frame).point('center')[1]],
    );
  });
  const bufferNumber = place(
    decimal(() => buffer.value, { digits: 0, size: 58, color: 'yellow' }),
    bufferReadout,
  );
  const lossNumber = place(
    decimal(() => loss.value, { prefix: 'loss ', digits: 1, size: 48, color: 'yellow' }),
    foot,
  );
  const title = heading(c.title);
  const reset = (caseId) => {
    fault.set(caseId);
    rate.set(0.1);
    w.set(1);
    b.set(0);
    loss.set(8);
    buffer.set(-8);
  };
  const ax = place(
    axes({
      x: [1, 7],
      y: [0, 5],
      width: body.width * 0.85,
      height: body.height * 0.8,
      xStep: 2,
      yStep: 2,
      labelSize: 34,
      tips: false,
      grid: true,
    }),
    body,
  );
  const stop = simulateStopping(),
    progress = s.value(7),
    shape = s.value(0);
  const interpolate = (values, x) => {
    const j = Math.min(values.length - 2, Math.max(0, Math.floor(x) - 1));
    return values[j] + (values[j + 1] - values[j]) * (x - j - 1);
  };
  ax.plot((x) => (1 - shape.value) * stop.values[0] + shape.value * interpolate(stop.values, x), {
    to: () => progress.value,
    stroke: 'green',
    width: 4,
  });
  const training = stop.values.map((v, i) => v / (1 + i * 0.2));
  ax.plot((x) => (1 - shape.value) * stop.values[1] + shape.value * interpolate(training, x), {
    to: () => progress.value,
    stroke: 'blue',
    width: 4,
  });
  const legend = place(
    row(
      [
        label('training', { color: 'blue' }),
        label('validation', { color: 'green' }),
        note('Compatible evaluation conditions'),
      ],
      { gap: 'wide' },
    ),
    foot,
  );
  s.add(
    title,
    caseName,
    parameterTitle,
    ruler,
    parameter,
    values,
    saved,
    bufferTitle,
    frame,
    bufferBar,
    bufferNumber,
    lossNumber,
  );
  c.on('diagnostic-step', () => {
    reset(1);
    rate.set(0.5);
    const bad = updateOnce(0.5);
    s.play(w.to(bad.weight, { duration: 0.9 }), b.to(bad.bias, { duration: 0.9 }));
    loss.set(bad.nextLoss);
  });
  c.on('diagnostic-repair', () => {
    reset(2);
  });
  c.on('diagnostic-retry', () => {
    const good = updateOnce(0.1);
    s.play(w.to(good.weight, { duration: 0.7 }), b.to(good.bias, { duration: 0.7 }));
    loss.set(good.nextLoss);
  });
  c.on('diagnostic-buffer', () => {
    reset(3);
    s.play(buffer.to(-16, { duration: 0.8 }));
  });
  c.swap('diagnostic-state', saved, invalid);
  c.on('diagnostic-state', () => {
    reset(4);
    loss.set(NaN);
    buffer.set(NaN);
  });
  c.on('diagnostic-state', () => s.play(indicate(invalidOp, { scale: 1, color: 'red' })), 0.8);
  c.swap('diagnostic-small', invalid, blocked);
  c.on('diagnostic-small', () => {
    reset(5);
    buffer.set(0);
    relay(s, gateOut, gate, { duration: 0.8 });
  });
  c.swapAll('diagnostic-high', [ax, legend], { keep: [title] });
  c.on('diagnostic-curves', () =>
    s.play(shape.to(1, { duration: 2 }), progress.to(4, { duration: 2 })),
  );
  c.on('diagnostic-gap', () => s.play(progress.to(7, { duration: 2 })));
}
