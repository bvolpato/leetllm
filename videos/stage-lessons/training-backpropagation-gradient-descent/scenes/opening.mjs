import {
  arc,
  circle,
  column,
  dot,
  dynamic,
  fadeIn,
  group,
  indicate,
  line,
  linear,
  place,
  rect,
  row,
} from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { example } from '../parts.mjs';
import { latencyStrip, work } from '../latency.mjs';

export default function opening(s, c) {
  const prediction = example.weight * example.x + example.bias;
  const elapsed = s.value(1);
  const displayedMs = () => Math.floor(elapsed.value * 10 + 1e-8) / 10;
  const [dial, reply] = area.columns([1, 1.2], 'loose');
  const [cx, cy] = dial.point('center');
  const radius = dial.width * 0.35;
  const tip = (ms, length) => {
    const angle = (2 * Math.PI * ms) / 8;
    return [cx + length * Math.sin(angle), cy - length * Math.cos(angle)];
  };
  const watch = group(
    rect(60, 78, { fill: 'dim' }).moveTo([cx, cy - radius - 18]),
    rect(134, 46, { fill: 'ink', radius: 12 }).moveTo([cx, cy - radius - 66]),
    circle(radius, { fill: 'surface', stroke: 'dim', width: 9 }).moveTo([cx, cy]),
    ...Array.from({ length: 32 }, (_, tick) => {
      const ms = tick / 4;
      const forecast = ms === prediction;
      const length = tick % 4 === 0 ? 33 : 14;
      return line(tip(ms, radius - length), tip(ms, radius - 7), {
        stroke: forecast ? 'blue' : 'dim',
        width: forecast ? 15 : 4,
      });
    }),
    ...[0, 2, 4, 6].map((ms) =>
      mono(String(ms), {
        size: 44,
        color: ms === prediction ? 'blue' : 'ink',
      }).moveTo(tip(ms, radius - 68)),
    ),
  );
  const dialAngle = (ms) => ((ms - 2) * Math.PI) / 4;
  const overrun = dynamic(() => {
    if (elapsed.value <= prediction) return [];
    return arc(radius + 14, dialAngle(prediction), dialAngle(elapsed.value), {
      stroke: 'yellow',
      width: 9,
    }).at(cx, cy);
  });
  const hand = dynamic(() => [
    line([cx, cy], tip(elapsed.value, radius - 112), { stroke: 'pink', width: 11 }),
    dot(15, 'pink').moveTo([cx, cy]),
  ]);

  const [wordsArea, readings] = reply.rows([1, 1], 'normal');
  const prefix = mono('Ready, set,', { size: 85 });
  const cursor = mono('▍', { size: 85, color: 'pink' });
  const word = mono('go', { size: 85, color: 'pink' });
  place(row([prefix, word], { gap: 'normal' }), wordsArea);
  cursor.moveTo([word.get('x'), word.get('y')]);
  const token = dynamic(() => (displayedMs() < example.target ? cursor : word));
  const panel = place(
    rect(wordsArea.width, 210, {
      fill: 'surface',
      stroke: 'grid',
      radius: 36,
      width: 4,
    }),
    wordsArea,
  );
  const [forecastArea, clockArea] = readings.columns(2, 'normal');
  const forecast = place(
    column([label('Predicted extra wait'), mono(prediction + ' ms', { size: 76, color: 'blue' })]),
    forecastArea,
    'top',
  );
  const clock = place(
    column([
      label('Simulated server clock'),
      dynamic(() => mono(displayedMs().toFixed(1) + ' ms', { size: 76, color: 'pink' })),
    ]),
    clockArea,
    'top',
  );

  const title = heading(c.title);
  const openingPicture = [watch, overrun, hand, panel, prefix, token, forecast, clock];
  s.add(title, openingPicture);
  s.play(fadeIn([title, ...openingPicture], { duration: 0 }));
  const firstFrame = c.window.from;
  const predicted = c.cue('open-clock');
  c.on(
    'open-clock',
    () => s.play(elapsed.to(prediction, { duration: predicted.end - firstFrame, ease: linear })),
    firstFrame - predicted.start,
  );
  const arrival = c.cue('open-observe').start;
  c.after('open-clock', () =>
    s.play(elapsed.to(example.target, { duration: arrival - predicted.end, ease: linear })),
  );
  c.on('open-predict', () => s.play(indicate(forecast, { color: 'blue', scale: 1 })));

  const p = latencyStrip(s, prediction, example.target);
  const missed = label('Extra time the model missed');
  const terms = `${example.target} − ${prediction}`;
  const gapLine = (value) => mono(value, { size: 83, color: 'yellow' });
  const operands = gapLine(`${terms} = ? ms`);
  place(column([missed, operands], { gap: 'normal' }), work);
  const gap = gapLine(`${terms} = ${example.target - prediction} ms`).moveTo([
    operands.get('x'),
    operands.get('y'),
  ]);
  c.swapAll('open-gap', [p.picture, missed, operands], { keep: [title], lead: 0 });
  c.swap('open-gap-value', operands, gap, { after: true });
  c.keep(p.picture);
}
