import { dot, dynamic, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { open } from '../parts.mjs';

export default function time(s, c) {
  const [header, axis, board, footer] = open(s, c).rows([0.9, 0.7, 4, 1], 'wide');
  const [names, plot] = board.columns([1, 3], 'wide');
  const lanes = plot.rows(3, 'wide');
  // Hours since midnight on May 4. All three PENDING-4 rows share these clocks.
  const x = hour => plot.left + ((hour - 9) / 30) * plot.width;
  const feature = s.value(11), labelTime = s.value(36);
  const clock = hour => (Math.round(hour) % 24).toString().padStart(2, '0') + ':00';
  s.add(place(label('PENDING-4   ·   one request, three product rows   ·   UTC', { size: 39 }), header, 'left'),
    ...['Features available', 'Request served', 'Last label ready'].map((v, i) =>
      place(label(v, { size: 37 }), names.rows(3, 'wide')[i], 'left')),
    ...lanes.map(r => line([plot.left, r.cy], [plot.right, r.cy], { stroke: 'grid', width: 4 })),
    ...[[12, 'May 4 · noon'], [24, 'May 5 · freeze'], [36, 'May 5 · noon']].map(([hour, v]) =>
      note(v, { size: 30, color: hour === 24 ? 'yellow' : 'dim' }).moveTo([x(hour), axis.cy])),
    line([x(24), axis.bottom], [x(24), board.bottom], { stroke: 'yellow', width: 5, dash: [12, 8] }));
  const marker = (hour, i, color) => [
    dot(15, color).moveTo([x(hour), lanes[i].cy]),
    mono(clock(hour), { size: 32, color }).moveTo([x(hour), lanes[i].cy - 49]),
  ];
  s.add(dynamic(() => marker(feature.value, 0, 'cyan')), marker(12, 1, 'ink'));
  c.show('clock-label', dynamic(() => marker(labelTime.value, 2, 'pink')));
  const question = place(label('Can this request enter the May 5 training freeze?', { color: 'yellow' }), footer);
  c.show('clock-question', question);
  const pending = place(label('Leave all three rows out. The labels arrive after the freeze.'), footer);
  c.swap('clock-pending', question, pending, { after: true });
  c.hide('clock-earlier', pending);
  c.on('clock-earlier', () => s.play(labelTime.to(18, { duration: 0.9 })));
  const include = place(label('All three labels mature in time. Include the request.', { color: 'green' }), footer);
  c.show('clock-include', include, { after: true });
  c.hide('clock-late-feature', include);
  c.on('clock-late-feature', () => s.play(feature.to(15, { duration: 0.8 })));
  c.show('clock-invalid', place(label('Reject the feature. It became available after serving.', { color: 'red' }), footer), { after: true });
}
