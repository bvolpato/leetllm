import {
  assertEqual,
  circle,
  dot,
  dynamic,
  fadeIn,
  group,
  line,
  linear,
  place,
  polygon,
  rect,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { cloud, distance, query, right, xy } from '../parts.mjs';

export default function scene(s, c) {
  const order = xy
    .map((point, id) => ({ id, d: distance(query, point) }))
    .sort((a, b) => a.d - b.d);
  const [billing, reset] = order;
  assertEqual([billing.id, reset.id].join(','), '1,2', 'nearest messages in the full search');

  const [field, scale, result] = area.rows([6.8, 1.65, 0.95], 'normal');
  const origin = field.point('center');
  const unit = (field.height * 0.43) / reset.d;
  const position = (point) => [
    origin[0] + (point[0] - query[0]) * unit,
    origin[1] - (point[1] - query[1]) * unit,
  ];
  const card = (candidate, side, id, subject) => {
    const [x, y] = position(xy[candidate.id]);
    const width = 410;
    const cx = x + side * (width / 2 + 35);
    return group(
      line([x, y], [cx, y], { stroke: 'dim', width: 3 }),
      rect(width, 116, { radius: 18, fill: 'surface', stroke: 'dim', width: 3 }).at(cx, y),
      note('Message ' + id).moveTo([cx, y - 26]),
      label(subject, { size: 43 }).at(cx, y + 23),
      dot(6, 'cyan').at(x, y),
    );
  };

  const [x, y] = origin;
  const request = group(
    polygon(
      [
        [x - 16, y - 33],
        [x + 16, y - 33],
        [x, y - 8],
      ],
      { fill: 'yellow', stroke: null },
    ),
    rect(298, 118, { radius: 22, fill: 'yellow', stroke: null }).at(x, y - 88),
    label('Why was I', { size: 43, color: 'bg' }).at(x, y - 113),
    label('charged twice?', { size: 43, color: 'bg' }).at(x, y - 64),
    dot(10, 'yellow').moveTo(origin),
  );
  const radius = s.value(0.78);
  const ring = dynamic(() =>
    circle(radius.value * unit, { stroke: 'yellow', width: 5 }).moveTo(origin),
  ).zIndex(-1);
  const ruler = scale.inset('loose');
  const minimum = s.value(0);
  const maximum = 2;
  const along = (d, low = minimum.value) =>
    ruler.left + ((d - low) / (maximum - low)) * ruler.width;
  const baseline = ruler.cy + 34;
  const rail = line([ruler.left, baseline], [ruler.right, baseline], { stroke: 'dim', width: 4 });
  const readings = dynamic(() => [
    ...[billing, reset].map(({ d }) =>
      line([along(d), baseline - 14], [along(d), baseline + 14], { stroke: 'cyan', width: 4 }),
    ),
    dot(10, 'yellow').at(along(radius.value), baseline),
  ]);
  const fullLabels = [0, 1, 2].map((d) =>
    mono(String(d), { size: 33 }).moveTo([along(d, 0), baseline + 39]),
  );
  const opening = [
    heading(c.title),
    ring,
    request,
    card(billing, -1, 'B', 'Duplicate payment'),
    card(reset, 1, 'C', 'Missing reset link'),
    note('Distance from request').moveTo([ruler.cx, baseline - 43]),
    rail,
    readings,
    fullLabels,
  ];
  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(radius.to(1.16, { duration: 0.9, ease: linear }));
  const zoom = c.cue('ruler');
  s.play(radius.to(1.64, { duration: zoom.start - c.start - 0.9, ease: linear }));

  c.hide('ruler', fullLabels);
  c.on('ruler', () =>
    s.play(minimum.to(1.6), radius.to(1.71), { duration: zoom.end - zoom.start }),
  );
  const magnified = [billing, reset].map(({ d }, i) =>
    mono((i ? 'C  ' : 'B  ') + d.toFixed(3), { size: 37, color: 'cyan' }).moveTo([
      along(d, 1.6),
      baseline + 43,
    ]),
  );
  c.show('ruler', magnified, { after: true });
  const question = place(
    label('Which dot will it touch first?', { color: 'yellow', size: 43 }),
    result,
  );
  c.show('predict', question);
  c.on('answer', () => s.play(radius.to(billing.d, { duration: 0.55, ease: linear })));
  c.swap(
    'answer',
    question,
    place(label('B   Duplicate payment', { color: 'yellow', size: 43 }), result),
    { after: true },
  );
  c.show('answer', circle(20, { stroke: 'yellow', width: 5 }).moveTo(position(xy[billing.id])), {
    after: true,
  });

  const map = cloud();
  const q = map.p(query);
  const b = map.p(xy[billing.id]);
  const [name, measure] = right.rows(2, 'normal');
  c.swapAll('all', [
    heading('Full search across six messages'),
    map.chart,
    dot(12, 'yellow').moveTo(q),
    line(q, b, { stroke: 'yellow', width: 4 }).zIndex(-1),
    circle(16, { stroke: 'yellow', width: 4 }).moveTo(b),
    place(label('B   Duplicate payment', { size: 41, color: 'yellow' }), name, 'bottom left'),
    place(note('Two example coordinates per message'), measure, 'top left'),
  ]);
  c.keep(map.chart);
}
