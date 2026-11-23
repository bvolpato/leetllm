import { assertEqual, beside, dot, draw, line, place, rect, to, tokens } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { longestLookup } from '../../../films/prefix-reuse/arithmetic.mjs';
import { board, body, caption, readings } from '../parts.mjs';

export default function lookupWindow(s, c) {
  board(s, c, 'Can the lookup still reach the stored entry?', 'Claude · eligible positions');
  const entry = 15,
    length = 20,
    first = entry + length - 1,
    next = first + 1;
  assertEqual(
    longestLookup([entry], [next], length),
    0,
    'Position 15 is outside the second window.',
  );
  const [names, track, notes] = body.rows([1, 2, 1], 'wide');
  const cells = track.columns(length + 1, 'none');
  const centers = cells.map((x) => x.point('center'));
  const ticks = cells.map((cell) => place(rect(4, 44, { fill: 'dim', stroke: 'dim' }), cell));
  const labels = cells.map((cell, i) =>
    place(
      mono(String(entry + i), { size: 34, color: i < 2 || i >= length - 1 ? 'ink' : 'dim' }),
      cell,
      'top',
    ),
  );
  const left = centers[0],
    right = centers[length];
  const axis = line(left, right, { stroke: 'blue', width: 5 });
  const frame = rect(cells[0].width * length, 112, {
    fill: 'transparent',
    stroke: 'yellow',
    width: 5,
  });
  const framePoint = (i) => [(centers[i][0] + centers[i + length - 1][0]) / 2, left[1]];
  frame.moveTo(framePoint(0));
  const pointer = dot(12, 'yellow').moveTo(centers[length - 1]);
  const stored = dot(15, 'green').moveTo(left);
  const second = rect(cells[0].width * 0.7, 90, {
    fill: 'transparent',
    stroke: 'green',
    width: 5,
  }).moveTo(left);
  const captionNode = caption('Stored entry at ' + entry, notes, { color: 'green', align: 'left' });
  const prior = caption('Previous window   ' + entry + '–' + first, notes, {
    color: 'dim', align: 'right', size: 36,
  });
  const slots = place(
    tokens(['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4'], {
      label: 'Breakpoints',
      size: 34,
      minWidth: 156,
      color: 'dim',
    }),
    names,
  );
  const automatic = place(
    tokens(['Auto', 'Slot 2', 'Slot 3', 'Slot 4'], {
      label: 'Breakpoints',
      size: 34,
      minWidth: 156,
      colors: ['yellow', 'dim', 'dim', 'dim'],
    }),
    names,
  );
  const [startRegion, readyRegion, endRegion] = notes.columns([1, 1.3, 1.6], 'normal');
  const points = [startRegion, readyRegion, endRegion].map((r) => r.point('center'));
  const dots = points.map((p, i) => dot(10, i === 1 ? 'green' : 'yellow').moveTo(p));
  const timeLabels = dots.map((d, i) =>
    beside(
      note(['Request starts', 'Response starts · ready', 'Expiry · 5 min or 1 h'][i], { size: 31 }),
      d,
      'under',
      'tight',
    ),
  );
  const wait = line(points[0], points[1], { stroke: 'dim', width: 4 });
  const available = line(points[1], points[2], { stroke: 'green', width: 5 });
  c.show('window-slots', slots);
  c.swap('window-auto', slots, automatic);
  c.hide('window-ready', captionNode);
  c.show('window-ready', [dots[0], timeLabels[0]], { lead: -0.25 });
  c.on('window-ready', () => s.play(draw(wait), { duration: 0.45 }), 0.3);
  c.show('window-ready', [dots[1], timeLabels[1]], { after: true });
  c.on('window-life', () => s.play(draw(available), { duration: 0.6 }));
  c.show('window-life', [dots[2], timeLabels[2]], { after: true });
  s.add(ticks, labels, axis, stored, captionNode);
  c.show('window-twenty', frame);
  c.show('window-34', pointer);
  c.show('window-35', prior);
  c.hide('window-slide', prior);
  c.after('window-35', () => s.play(to(pointer, (n) => n.moveTo(centers[length])), { duration: 0.45 }));
  c.on('window-slide', () => s.play(to(frame, (n) => n.moveTo(framePoint(1))), { duration: 0.8 }));
  c.show('window-repair', second, { after: true });
  readings(s, c, 'Count from the selected endpoint, including the endpoint itself.', [
    ['window-34', 'Breakpoint ' + first + ' searches ' + first + ' through ' + entry + '.'],
    ['window-question', 'Marker ' + next + '   ·   can it still reach entry ' + entry + '?'],
    [
      'window-miss',
      'Miss · breakpoint ' + next + ' searches ' + next + ' through ' + (entry + 1) + '.',
      'red',
    ],
    [
      'window-repair',
      'A second marker searches position ' + longestLookup([entry], [next, entry], length) + '.',
      'green',
    ],
    ['window-longest', 'Use the longest compatible, available prefix.', 'green'],
    ['window-slots', 'Four marker slots · automatic placement uses one'],
    ['window-ready', 'Concurrent reads can begin after the first response starts.'],
    ['window-life', 'Lifetime from request start · 5 minutes or 1 hour'],
  ]);
}
