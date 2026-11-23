// Scene `accumulating-evidence`: more labels with the same fraction, and what they change.
//
// The picture: one group of 25 labels with 4 specialist cases, and its interval at the top of the
// field. 15 more groups arrive in the tray. With each arrival the interval goes down one row and
// contracts, and it leaves a faint copy behind. The dots stay in one column at 16%, and the bars
// make a funnel that ends at the axis.
import {
  beside,
  clamp,
  column,
  dot,
  draw,
  dynamic,
  fade,
  group,
  indicate,
  lerp,
  line,
  linear,
  place,
  polyline,
  rect,
  smoothstep,
  text,
} from 'vizmatic/stage';
import { batches400 } from '../../../films/estimation/fixtures.mjs';
import { count, wilson } from '../../../films/estimation/model.mjs';
import { heading, label, mono, note, para } from '../../kit-narrated.mjs';
import {
  COLOR,
  PANELS,
  POINT,
  READOUT,
  RIGHT_PANEL,
  TRAY_HEAD,
  mark,
  rateAxis,
  slots,
} from '../parts.mjs';

/** The groups of the illustration: 16 groups of 25 labels, each with 4 specialist cases. */
const GROUPS = 16,
  EACH = 25,
  SPECIALIST = 4;
/** The side of a group in marks. */
const SIDE = 5;

export default function accumulatingEvidence(s, c) {
  const axis = rateAxis(s);
  const rate = SPECIALIST / EACH;
  const intervals = Array.from({ length: GROUPS }, (_, index) =>
    wilson(SPECIALIST * (index + 1), EACH * (index + 1)),
  );
  // The rows of the funnel: the first interval under the names, and the last one on the axis.
  const first = PANELS.inset('none', 'loose').top,
    last = axis.rowY(0);
  const rowAt = (index) => lerp(first, last, index / (GROUPS - 1));

  // The value of the scene: the groups in the tray. A part of a group is a group on its way.
  const groups = s.value(1);

  // The tray: 16 places for a group, 4 in a row.
  const middles = slots(GROUPS, 4);
  const pitch = middles[1][0] - middles[0][0];
  const step = (pitch - 18) / SIDE,
    radius = step * 0.36;
  const pink = (index) =>
    new Set(Array.from({ length: SPECIALIST }, (_, k) => (3 + 7 * k + 5 * index) % EACH));
  const frame = (index) =>
    rect(pitch - 10, pitch - 10, { stroke: 'grid', width: 2, fill: null, radius: 10 }).at(
      middles[index],
    );
  const frames = group(...middles.map((_, index) => frame(index)));
  const tray = dynamic(() => {
    const marks = [];
    for (let index = 0; index < GROUPS; index++) {
      const part = index === 0 ? 1 : clamp(groups.value - index);
      const specialist = pink(index),
        rise = part > 0 ? (1 - smoothstep(part)) * pitch * 0.4 : 0;
      for (let slot = 0; slot < EACH; slot++)
        marks.push(
          mark(
            part > 0 ? (specialist.has(slot) ? 'specialist' : 'regular') : 'slot',
            radius,
            part > 0 ? part : 1,
          ).at(
            middles[index][0] + ((slot % SIDE) - (SIDE - 1) / 2) * step,
            middles[index][1] + (Math.floor(slot / SIDE) - (SIDE - 1) / 2) * step + rise,
          ),
        );
    }
    return marks;
  });
  const trayName = place(label('groups of 25 labels'), TRAY_HEAD);

  // The count of the tray, which follows the groups.
  const over = mono('00', { size: 64, color: COLOR.specialist }),
    under = mono('000', { size: 64, color: COLOR.sample });
  const stroke = rect(150, 5, { fill: 'ink', stroke: null, radius: 2 });
  place(column([over, stroke, under], { gap: 'tight', align: 'center' }), READOUT, 'top');
  const completeGroups = () => Math.floor(groups.value + 1e-6);
  const live = (slot, each, color) =>
    dynamic(() =>
      text(String(each * completeGroups()), { font: 'mono', size: 64, color }).at(
        slot.get('x'),
        slot.get('y'),
      ),
    );
  const fraction = [
    live(over, SPECIALIST, COLOR.specialist),
    stroke,
    live(under, EACH, COLOR.sample),
  ];

  // The funnel: the interval of the groups that are in the tray, and a faint copy for each row before.
  const bar = (range, at, opacity) => [
    line([axis.x(range.low), at], [axis.x(range.high), at], {
      stroke: COLOR.accepted,
      width: 9,
      opacity,
    }),
    ...[range.low, range.high].map((end) =>
      line([axis.x(end), at - 13], [axis.x(end), at + 13], {
        stroke: COLOR.accepted,
        width: 4,
        opacity,
      }),
    ),
    dot(POINT - 3, COLOR.sample, { opacity: Math.min(1, opacity * 1.6) }).at(axis.x(rate), at),
  ];
  const funnel = dynamic(() => {
    const row = groups.value - 1,
      done = completeGroups() - 1,
      part = smoothstep(row - done);
    const marks = [];
    for (let index = 0; index < done + (part > 0 ? 1 : 0); index++)
      marks.push(...bar(intervals[index], rowAt(index), 0.32));
    const next = Math.min(done + 1, GROUPS - 1);
    marks.push(
      ...bar(
        intervals[done],
        lerp(rowAt(done), rowAt(next), part),
        1,
      ),
    );
    return marks;
  });

  // The first picture: one group in the tray, and its interval over the axis.
  s.add(heading('What changes when more labels arrive?'), frames, tray, trayName, funnel);
  c.take(axis.standing);
  c.keep(axis.standing);

  c.show('one-group', fraction);
  c.on('same-fraction', () => s.play(indicate(trayName, { color: COLOR.mark, scale: 1 })));
  const asks = [
    beside(label('center?', { color: COLOR.mark }), [axis.x(rate), first], 'under', 'normal'),
    beside(
      label('width?', { color: COLOR.mark }),
      [axis.x(intervals[0].high), first],
      'under',
      'normal',
    ),
  ];
  c.show('predict', asks);

  // The groups arrive: one row of the funnel for each.
  c.hide('add-groups', asks);
  const arrive = c.cue('add-groups'),
    stays = c.cue('stays');
  c.on(
    'add-groups',
    () => s.play(groups.to(GROUPS, { duration: stays.end - arrive.start - 0.6, ease: linear })),
    0.3,
  );
  const center = line([axis.x(rate), first], [axis.x(rate), last], {
    stroke: COLOR.mark,
    width: 3,
    opacity: 0.8,
  });
  const centerName = beside(
    mono('16%', { color: COLOR.sample }),
    [axis.x(rate), first],
    'above',
    'normal',
  );
  c.show('stays', [draw(center), centerName]);
  const edges = ['low', 'high'].map((end) =>
    polyline(
      intervals.map((range, index) => [axis.x(range[end]), rowAt(index)]),
      { stroke: COLOR.mark, width: 3, opacity: 0.8 },
    ),
  );
  c.show(
    'contracts',
    edges.map((edge) => draw(edge)),
  );
  const firstName = beside(note('25 labels'), [axis.x(intervals[0].low), first], 'left', 'normal');
  c.show('faint-first', firstName);

  // 400 labels: the last row. Real samples of 400 would also move their center.
  const lastName = beside(
    label('400 labels', { color: COLOR.accepted }),
    [axis.x(intervals.at(-1).low), last],
    'left',
    'normal',
  );
  c.show('narrower', lastName);
  c.hide('narrower', [center, ...edges]);
  const real = group(
    ...batches400.map((rows) =>
      dot(7, COLOR.larger, { opacity: 0.7 }).at(axis.x(count(rows) / rows.length), axis.y),
    ),
  );
  const side = RIGHT_PANEL.columns([1, 3], 'none')[1].rows(2, 'none')[1];
  const moves = place(
    para('Random samples of 400 land at these centers.', side.width, { color: COLOR.larger }),
    side,
    'bottom left',
  );
  const fixed = place(
    para('A large share of a fixed queue also needs a finite-population correction.', side.width),
    side,
    'bottom left',
  );
  c.show('random-center', [real, moves]);
  c.swap('finite', moves, fixed);
  // The fraction was held on purpose: the random centers go quiet again.
  c.on('held-fixed', () => s.play(fade(real, 0.35)));
}
