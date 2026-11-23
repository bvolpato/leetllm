import {
  dot,
  dynamic,
  fadeIn,
  group,
  line,
  linear,
  place,
  polygon,
  rect,
  to,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { ACTUALS, CENTER, DEADLINE, PREDICTIONS, RESIDUALS } from '../parts.mjs';
import { deadlinePlot } from '../deadline-plot.mjs';

function train() {
  const body = polygon(
    [
      [-420, -168],
      [-96, -168],
      [-65, -156],
      [-9, -98],
      [0, -78],
      [0, -48],
      [-15, -35],
      [-420, -35],
    ],
    { fill: 'cyan', stroke: null },
  );
  const cab = polygon(
    [
      [-109, -147],
      [-83, -147],
      [-33, -97],
      [-109, -97],
    ],
    { fill: 'bg', stroke: null },
  );
  return group(
    ...[-355, -78].map((cx) => dot(23, 'dim').at(cx, -25)),
    body,
    cab,
    ...[-368, -292, -216].map((cx) =>
      rect(58, 46, { radius: 7, fill: 'bg', stroke: null }).at(cx, -123),
    ),
    rect(34, 95, { radius: 4, fill: 'cyan', stroke: 'bg', width: 5 }).at(-151, -87),
    rect(376, 9, { fill: 'blue', stroke: null }).at(-231, -60),
    rect(24, 8, { radius: 3, fill: 'ink', stroke: null }).at(-18, -77),
    line([0, -46], [0, 25], { stroke: 'ink', width: 3 }),
    polygon(
      [
        [-10, 24],
        [10, 24],
        [0, 38],
      ],
      { fill: 'ink', stroke: null },
    ),
  );
}

export default function intro(s, c) {
  const [board, result] = area.inset('normal').rows([4, 1], 'normal');
  const forecast = 40;
  const radius = 2;
  const lower = forecast - radius;
  const upper = forecast + radius;
  const replay = upper + 1;
  const time = (minute) => '8:' + minute;
  const x = (minute) => board.cx + ((minute - forecast) * board.width) / 8;
  const y = board.cy + 35;
  const bandY = y + 51;
  const car = train().at(x(lower), y);
  const verdict = s.value(0);
  const later = s.value(0);
  const opening = group(
    heading(c.title),
    line([board.left, y], [board.right, y], { stroke: 'dim', width: 5 }),
    ...Array.from({ length: 38 }, (_, i) => {
      const px = board.left + ((i + 0.5) / 38) * board.width;
      return line([px, y + 4], [px - 7, y + 15], { stroke: 'faint', width: 4 });
    }),
    line([x(lower), bandY], [x(upper), bandY], { stroke: 'yellow', width: 15 }),
    ...[lower, upper].map((m) =>
      line([x(m), bandY - 16], [x(m), bandY + 17], { stroke: 'yellow', width: 7 }),
    ),
    ...[lower, forecast, upper].map((m) =>
      mono(time(m), { size: 55, color: m === forecast ? 'cyan' : 'yellow' }).at(x(m), bandY + 74),
    ),
    dynamic(() =>
      later.value
        ? [
            line([x(replay), bandY - 9], [x(replay), bandY + 9], { stroke: 'dim', width: 3 }),
            mono(time(replay), { size: 55, color: 'ink' }).at(x(replay), bandY + 74),
          ]
        : [],
    ),
    dot(14, 'cyan').at(x(forecast), bandY),
    label('Forecast', { color: 'cyan', size: 39 }).at(x(forecast), bandY + 144),
    car,
    dynamic(() => {
      if (!verdict.value) return [];
      const arrival = verdict.value === 1 ? upper : replay;
      const covered = lower <= arrival && arrival <= upper;
      return [
        place(
          mono(time(arrival) + (covered ? '   covered' : '   outside'), {
            size: 65,
            color: covered ? 'green' : 'red',
          }),
          result,
        ),
      ];
    }),
  );
  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(to(car, (node) => node.at(x(upper), y), { duration: c.cue('stop').end, ease: linear }));
  c.after('covered', () => verdict.set(1));
  c.on('later', () => {
    verdict.set(0);
    later.set(1);
    s.play(to(car, (node) => node.at(x(replay), y), { duration: 0.85 }));
  });
  c.after('miss', () => verdict.set(2));

  const clock = deadlinePlot(s, { prediction: CENTER, deadline: DEADLINE, showDeadline: false });
  const [top] = area.rows([2, 5], 'wide');
  const [operands, errors] = top.columns([3, 2], 'wide');
  const slots = errors.columns(9, 'tight');
  const question = place(mono('40 − ?     to     40 + ?', { size: 59, color: 'yellow' }), top);
  const calibration = group(
    place(label('Nine held-out requests', { size: 51 }), operands),
    ...slots.flatMap((slot, i) => {
      const end = top.cy - 4.5 * (ACTUALS[i] - PREDICTIONS[i]);
      return [
        line([slot.cx, top.cy], [slot.cx, end], { stroke: 'yellow', width: 5 }),
        dot(8, 'cyan').at(slot.cx, top.cy),
        dot(8, 'green').at(slot.cx, end),
        mono(String(RESIDUALS[i]), { size: 29 }).at(slot.cx, top.bottom - 33),
      ];
    }),
    note('Absolute error (ms)', { size: 29 }).at(errors.cx, top.bottom + 11),
  );
  c.swap('server', opening, [
    heading('How wide should the interval be?'),
    clock.frame,
    clock.marks,
    question,
  ]);
  c.after('deadline', () => clock.deadlineOn.set(1));
  c.swap('held-out', question, calibration);
}
