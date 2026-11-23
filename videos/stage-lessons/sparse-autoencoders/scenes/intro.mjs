import {
  boxOf,
  column,
  dynamic,
  fade,
  fadeIn,
  group,
  line,
  linear,
  place,
  rect,
  rightAngle,
  row,
  shift,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, SIDE, board, vec } from '../parts.mjs';
import { credential, resetState, urgency } from '../reset-example.mjs';

export default function intro(s, c) {
  const [message, meter] = area.inset('loose', 'normal').rows([1, 1.6], 'wide');
  const question = heading(c.title);
  const field = place(
    rect(message.width, 200, { radius: 34, fill: 'surface', stroke: 'faint', width: 4 }),
    message,
  );
  const prompt = label('Reset my password', { size: 100 });
  const word = group(
    rect(242, 130, { radius: 12, fill: 'ink', stroke: null }),
    label('now', { size: 95, color: 'bg' }),
  );
  place(row([prompt, word], { gap: 30 }), message);
  const slot = boxOf(word);
  const caret = line([slot.left, slot.top], [slot.left, slot.bottom], { stroke: 'ink', width: 5 });
  word.shift(220, 0);

  const extra = s.value(0);
  const initial = resetState(0).activation[0];
  const current = () => resetState(1, { pink: extra.value }).activation[0];
  const unit = meter.width / 3;
  const x = (value) => meter.left + value * unit;
  const y = meter.cy;
  const meterName = place(label('First activation coordinate', { size: 49 }), meter, 'top left');
  const track = rect(meter.width, 60, { fill: 'surface', stroke: null }).at(meter.cx, y);
  const segment = (from, to, color) =>
    rect(unit * (to - from), 60, { fill: color, stroke: null }).at((x(from) + x(to)) / 2, y);
  const joined = dynamic(() => segment(0, current(), COLOR.mark));
  const reading = dynamic(() =>
    mono(current().toFixed(2), { size: 94, color: COLOR.mark }).at(x(current()), y - 99),
  );
  const tick = line([x(initial), y + 34], [x(initial), y + 65], { stroke: 'dim', width: 4 });
  const before = mono(`Before  ${initial.toFixed(2)}`, { size: 41, color: 'dim' }).at(
    x(initial),
    y + 107,
  );
  const opening = [
    question, field, prompt, caret, word, meterName, track, joined, reading, tick, before,
  ];
  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(shift(word, -220, 0), { duration: c.cue('intro-now').end - c.window.from, ease: linear });
  c.hide('intro-now', caret, { after: true });
  c.on('intro-meter', () => s.play(extra.to(1, { duration: 1.25 })));

  const total = resetState(1).activation[0];
  const split = [segment(0, initial, COLOR.first), segment(initial, total, COLOR.second)];
  const inside = (name, from, to) =>
    label(name, { size: 42, color: 'bg' }).at((x(from) + x(to)) / 2, y);
  c.swap('intro-unpack', joined, split, { lead: 0 });
  c.show('intro-same', inside(`password  ${initial.toFixed(2)}`, 0, initial));
  c.show('intro-urgency', inside(`urgency  ${(total - initial).toFixed(2)}`, initial, total));
  c.swap('intro-urgency', question, heading('Two features share this coordinate'), { after: true });

  const b = board();
  const length = s.value(0);
  const tip = () => vec.add(credential, vec.scale(urgency, length.value));
  const projection = () => [tip()[0], 0];
  const blue = b.arrowOf([0, 0], credential, COLOR.first);
  const pink = b.arrowOf(credential, tip, COLOR.second);
  const mark = b.dotOf(tip, COLOR.activation);
  const drop = b.segmentOf(tip, projection, COLOR.mark, { width: 4, dash: [9, 8] });
  const horizontal = b.segmentOf(credential, projection, COLOR.second, {
    lift: [0, 76],
    width: 13,
  });
  const [inputs, result] = SIDE.rows([3, 2], 'normal');
  const blueName = label('Credential', { color: COLOR.first });
  const blueVector = mono('1.5 × [1, 0]', { color: COLOR.first });
  const pinkName = label('Urgency', { color: COLOR.second });
  const pinkVector = mono('1 × [0.8, 0.6]', { color: COLOR.second });
  place(
    column([blueName, blueVector, pinkName, pinkVector], { gap: 'normal', align: 'left' }),
    inputs,
    'left',
  );
  const pointLabel = dynamic(() =>
    mono(
      `x = [${tip()
        .map((v) => v.toFixed(2))
        .join(', ')}]`,
      {
        size: 48,
        color: COLOR.activation,
      },
    ).at(result.cx, result.cy),
  );
  const title = heading('How two directions share one coordinate');
  c.swapAll('intro-arrows', [title, b.plane, blue, mark, blueName, blueVector, pointLabel]);
  c.show('intro-slant', [pink, drop, horizontal, pinkName, pinkVector]);
  c.on('intro-slant', () => s.play(length.to(1, { duration: 1.6 })));

  const turn = s.value(0);
  const u = () => [Math.cos(turn.value), Math.sin(turn.value)];
  const v = () => [Math.sin(turn.value), -Math.cos(turn.value)];
  const pair = [
    b.arrowOf([0, 0], u, COLOR.other),
    b.arrowOf([0, 0], v, COLOR.other),
    dynamic(() => rightAngle(b.P([0, 0]), b.P(u()), b.P(v()), { stroke: COLOR.other, width: 4 })),
    b.shadowOf(u, [1, 0], COLOR.other),
    b.shadowOf(v, [1, 0], COLOR.other),
  ];
  const orthogonal = [
    label('2 directions in 2 dimensions'),
    mono('90° apart', { color: COLOR.other }),
    note('Both shadows lie on the horizontal axis.'),
  ];
  place(column(orthogonal, { gap: 'wide', align: 'left' }), SIDE, 'left');
  c.swap(
    'intro-rotate',
    [blue, pink, mark, drop, horizontal, pointLabel, blueName, blueVector, pinkName, pinkVector],
    [...pair, ...orthogonal.slice(0, 2)],
  );
  c.on('intro-rotate', () => s.play(fade(b.plane.numbers, 0), { duration: 0.25 }));
  c.on('intro-turn', () => s.play(turn.to(Math.atan2(urgency[1], urgency[0]), { duration: 1.5 })));
  c.show('intro-shadows', orthogonal[2]);
  c.hide('intro-find', pair);
  c.on('intro-find', () => s.play(fade(b.plane.numbers, 1), { duration: 0.3 }));
  c.swap('intro-find', orthogonal, [
    blue,
    pink,
    mark,
    blueName,
    blueVector,
    pinkName,
    pinkVector,
    pointLabel,
  ]);
  c.keep(b.plane);
}
