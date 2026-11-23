// Scene `sampling`: a counted batch becomes one point, and many batches become a hill.
//
// The picture: one simulated batch of 100 labels is in the tray. It is counted, it closes into one
// point, and the point drops on the axis at its fraction. 39 more batches follow, and the points
// pile up around the true rate. Then batches of 400 build a second hill over the first, on the same
// axis. The second hill is half as wide.
import {
  arrow,
  beside,
  circle,
  clamp,
  column,
  dot,
  dynamic,
  lerp,
  line,
  linear,
  place,
  rect,
  smoothstep,
  tex,
} from 'vizmatic/stage';
import { batches100, batches400 } from '../../../films/estimation/fixtures.mjs';
import { count } from '../../../films/estimation/model.mjs';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  FIELD,
  HEAD,
  HEAD_RIGHT,
  READOUT,
  TRAY_GRID,
  TRAY_HEAD,
  labelOf,
  mark,
  radiusOf,
  rateAxis,
  slots,
} from '../parts.mjs';

/** The rate of the simulation. */
const RATE = 0.16;
/** The radius of one point of a hill. */
const DOT = 11;
/** How many points are on their way to a hill at one time. */
const IN_FLIGHT = 3;

export default function sampling(s, c) {
  const axis = rateAxis(s);
  const small = batches100.map((rows) => count(rows) / rows.length),
    large = batches400.map((rows) => count(rows) / rows.length);
  const tray = { small: slots(100, 10), large: slots(400, 20) };
  const home = [TRAY_GRID.cx, tray.small[0][1] + (tray.small[99][1] - tray.small[0][1]) / 2];

  // The places of the points of a hill: each one at its rate, on the lowest free level.
  const hill = (rates, base) => {
    const placed = [];
    return rates.map((rate) => {
      const x = axis.x(rate);
      let level = 0;
      while (placed.some((p) => p.level === level && Math.abs(p.x - x) < 2 * DOT + 1)) level++;
      placed.push({ x, level });
      return [x, base - DOT - 3 - level * (2 * DOT + 2)];
    });
  };
  const smallHill = hill(small, axis.y);
  const smallTop = Math.min(...smallHill.map((at) => at[1])) - DOT;
  // The second hill stands on a line of its own, over the first hill and the room for one bar.
  const largeBase = smallTop - 6 * DOT;
  const largeHill = hill(large, largeBase);
  const largeTop = Math.min(...largeHill.map((at) => at[1])) - DOT;

  // The values of the scene.
  const counted = s.value(0); // the labels of the first batch that are counted
  const squeeze = s.value(0); // the first batch closes into one point
  const drop = s.value(0); // the point of the first batch drops on the axis
  const piled = s.value(0); // the batches of 100 that left the tray
  const view = s.value(0); // the batch of 100 that the tray shows
  const empty = s.value(0); // 1 while the tray has no batch
  const big = s.value(0); // from the tray of 100 to the tray of 400
  const piledLarge = s.value(0),
    viewLarge = s.value(0);
  const shrink = s.value(0); // the standard error bar goes from the first hill to the second

  const labels = dynamic(() => {
    const marks = [];
    if (big.value < 1 && empty.value < 0.5) {
      const index = Math.round(view.value);
      const close = smoothstep(squeeze.value);
      const radius = lerp(radiusOf(10), 3, close);
      batches100[index].forEach((row, slot) => {
        const kind = index > 0 || slot < Math.floor(counted.value + 1e-6) ? labelOf(row) : 'selected';
        marks.push(
          mark(kind, radius, 1 - big.value).at(
            lerp(tray.small[slot][0], home[0], close),
            lerp(tray.small[slot][1], home[1], close),
          ),
        );
      });
    }
    if (big.value > 0)
      batches400[Math.round(viewLarge.value)].forEach((row, slot) =>
        marks.push(mark(labelOf(row), radiusOf(20), big.value).at(tray.large[slot])),
      );
    return marks;
  });

  // A point leaves the tray and lands on its hill. `part` is its way, from 0 to 1.
  const flying = (to, part, color) => {
    const eased = smoothstep(part);
    return dot(DOT, color).at(
      lerp(home[0], to[0], eased),
      lerp(home[1], to[1], eased) - 90 * Math.sin(Math.PI * eased),
    );
  };
  const hills = dynamic(() => {
    const marks = [];
    smallHill.forEach((to, index) => {
      const part = index === 0 ? drop.value : clamp((piled.value - index) / IN_FLIGHT);
      if (part > 0) marks.push(flying(to, part, COLOR.sample));
    });
    largeHill.forEach((to, index) => {
      const part = clamp((piledLarge.value - index) / IN_FLIGHT);
      if (part > 0) marks.push(flying(to, part, COLOR.larger));
    });
    return marks;
  });

  // The true rate of the simulation, and the names of the tray.
  const truth = axis.upright(() => RATE);
  const truthName = beside(
    label('true rate 16%', { color: COLOR.specialist }),
    [axis.x(RATE), HEAD.cy],
    'left',
    'tight',
  );
  const trayName = place(label('one batch: 100', { color: COLOR.sample }), TRAY_HEAD);
  const trayLarge = place(label('one batch: 400', { color: COLOR.larger }), TRAY_HEAD);
  const first = batches100[0];
  const over = mono(String(count(first)), { size: 64, color: COLOR.specialist }),
    under = mono(String(first.length), { size: 64, color: COLOR.sample });
  const stroke = rect(150, 5, { fill: 'ink', stroke: null, radius: 2 });
  place(column([over, stroke, under], { gap: 'tight', align: 'center' }), READOUT, 'top');

  // The first picture: an uncounted batch in the tray, and the axis with the staffing line.
  s.add(heading(c.title), labels, hills, trayName);
  c.take(axis.standing);
  c.keep(axis.standing);

  c.show('true-rate', [truth, truthName]);
  const countCue = c.cue('batch-count');
  c.on('batch-count', () =>
    s.play(counted.to(first.length, { duration: countCue.end - countCue.start, ease: linear })),
  );
  c.after('batch-count', () => counted.set(first.length));
  c.show('batch-count', [stroke, under]);
  c.show('batch-count', over, { after: true });
  // The batch closes into one point, and the point drops on the axis at its fraction.
  c.on('batch-point', () => {
    s.play(squeeze.to(1, { duration: 0.8 }));
    empty.set(1);
    squeeze.set(0);
    s.play(drop.to(1, { duration: 0.8 }));
  });
  c.hide('batch-repeat', [over, stroke, under]);
  c.on('batch-repeat', () => {
    empty.set(0);
    view.set(1);
    s.play(
      piled.to(small.length + IN_FLIGHT, { duration: 5.4, ease: linear }),
      view.to(small.length - 1, { duration: 5, ease: linear }),
    );
  });

  // Some land low, some land high: the spread of the hill.
  const ring = (at) => circle(DOT + 7, { stroke: COLOR.mark, width: 4, fill: null }).at(at);
  const lowest = small.indexOf(Math.min(...small)),
    highest = small.indexOf(Math.max(...small));
  const extremes = [ring(smallHill[lowest]), ring(smallHill[highest])];
  const spreadY = smallTop - 2 * DOT;
  const spread = arrow([axis.x(small[lowest]), spreadY], [axis.x(small[highest]), spreadY], {
    stroke: COLOR.mark,
    width: 4,
    both: true,
  });
  const spreadName = beside(
    label('sampling variation', { color: COLOR.mark }),
    [axis.x(small[highest]), spreadY],
    'right',
    'wide',
  );
  const one = ring(smallHill[0]);
  const frame = rect(TRAY_GRID.width, TRAY_GRID.width, {
    stroke: COLOR.mark,
    width: 4,
    fill: null,
    radius: 16,
  }).at(home);
  const left = axis.x(small[lowest]) - 2 * DOT,
    right = axis.x(small[highest]) + 2 * DOT;
  const cloud = rect(right - left, axis.y - smallTop + DOT, {
    stroke: COLOR.mark,
    width: 4,
    fill: null,
    radius: 16,
  }).at((left + right) / 2, (axis.y + smallTop - DOT) / 2);
  c.show('high-low', extremes);
  c.show('spread', [spread, spreadName]);
  c.hide('one-sample', extremes);
  c.on('one-sample', () => view.set(0));
  c.show('one-sample', [one, frame]);
  c.swap('whole-cloud', [one, frame], cloud);

  // Batches of 400: a second hill on the same axis.
  const largeLine = line([FIELD.left, largeBase], [FIELD.right, largeBase], {
    stroke: 'grid',
    width: 3,
  });
  const names = [
    beside(
      label('samples of 100', { color: COLOR.sample }),
      [FIELD.right, (axis.y + smallTop) / 2],
      'left',
      'none',
    ),
    beside(
      label('samples of 400', { color: COLOR.larger }),
      [FIELD.right, (largeBase + largeTop) / 2],
      'left',
      'none',
    ),
  ];
  c.hide('four-hundred', [cloud, spread, spreadName]);
  c.on('four-hundred', () => s.play(big.to(1, { duration: 0.6 })));
  c.swap('four-hundred', trayName, trayLarge);
  c.show('four-hundred', [largeLine, ...names]);
  c.on('larger-cloud', () =>
    s.play(
      piledLarge.to(large.length + IN_FLIGHT, { duration: 4.4, ease: linear }),
      viewLarge.to(large.length - 1, { duration: 4, ease: linear }),
    ),
  );

  // The standard error of each hill, as a bar: four times the labels, half the bar.
  const error = (labels) => Math.sqrt((RATE * (1 - RATE)) / labels);
  const smallBar = axis.bar(() => ({ low: RATE - error(100), high: RATE + error(100) }), {
    row: () => spreadY,
    color: COLOR.sample,
    weight: 8,
  });
  const largeBar = axis.bar(
    () => {
      const reach = error(400);
      return { low: RATE - reach, high: RATE + reach };
    },
    { row: () => lerp(spreadY, largeTop - 2 * DOT, shrink.value), color: COLOR.larger, weight: 8 },
  );
  const errorName = beside(
    note('standard error'),
    [axis.x(RATE - error(100)), spreadY],
    'left',
    'normal',
  );
  const rule = place(
    tex('4\\times\\ \\text{labels}\\ \\Rightarrow\\ \\tfrac{1}{2}\\ \\text{spread}', {
      size: 40,
      color: COLOR.mark,
    }),
    HEAD_RIGHT,
    'right',
  );
  c.show('four-times', [smallBar, errorName]);
  c.show('halves', largeBar, { after: true });
  c.after('halves', () => s.play(shrink.to(1, { duration: 1.4 })));
  c.show('halves', rule, { after: true });
}
