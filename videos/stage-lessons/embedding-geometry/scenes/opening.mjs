import {
  arc,
  arrow,
  assertEqual,
  circle,
  dot,
  dynamic,
  fadeIn,
  group,
  line,
  linear,
  polygon,
  polyline,
  rect,
} from 'vizmatic/stage';
import { area, label, mono } from '../../kit-narrated.mjs';
import { guides, QUERY } from '../guide-plot.mjs';

function guidePage(guide, tip) {
  const { color } = guide;
  const paper = group(
    polygon(
      [
        [-34, -45],
        [10, -45],
        [34, -21],
        [34, 45],
        [-34, 45],
      ],
      {
        fill: 'surface',
        stroke: color,
        width: 4,
      },
    ),
    polyline(
      [
        [10, -43],
        [10, -21],
        [32, -21],
      ],
      { stroke: color, width: 4 },
    ),
    ...[-5, 10, 25].map((y, i) =>
      line([-20, y], [i === 2 ? 5 : 20, y], { stroke: color, width: 3 }),
    ),
  ).moveTo([tip[0] + 70, tip[1]]);
  const left = tip[0] + 132;
  const name = label(guide.name + ' guide', { color, size: 56 });
  name.moveTo([left + name.bounds().width / 2, tip[1]]);
  const aboveName = (node) => node.moveTo([left + node.bounds().width / 2, tip[1] - 65]);
  const coordinates = aboveName(mono('[' + guide.vector.join(', ') + ']', { size: 39 }));
  const angle = Math.atan2(guide.vector[1], guide.vector[0]) - Math.atan2(QUERY[1], QUERY[0]);
  const degrees = Math.round((angle * 180) / Math.PI);
  const angleLabel = aboveName(mono('≈ ' + degrees + '°', { size: 42, color }));
  return { page: group(paper, name), coordinates, angle, degrees, angleLabel };
}

export default function opening(s, c) {
  const origin = [area.left + 90, area.bottom - 214];
  const unit = area.width * 0.167;
  const tip = ([x, y]) => [origin[0] + x * unit, origin[1] - y * unit];
  const queryTip = tip(QUERY);
  const pages = guides.map((guide) => guidePage(guide, tip(guide.vector)));
  assertEqual(pages.map((p) => p.degrees).join(','), '11,27', 'guide angles with the query');
  const queryText = label('How do I rotate an API key?', { size: 64 });
  const searchWidth = queryText.bounds().width + 182;
  const search = group(
    rect(searchWidth, 116, { radius: 58, fill: 'surface', stroke: 'cyan', width: 4 }),
    circle(18, { fill: null, stroke: 'cyan', width: 6 }).at(61 - searchWidth / 2, -5),
    line([74 - searchWidth / 2, 8], [89 - searchWidth / 2, 24], { stroke: 'cyan', width: 7 }),
    queryText.moveTo([40, 0]),
  ).moveTo([area.left + searchWidth / 2, area.top - 9]);

  const ink = s.value(0.35);
  const trace = (v, color) =>
    dynamic(() =>
      arrow(origin, tip(v.map((x) => x * ink.value)), {
        stroke: color,
        width: 11,
        tip: 29,
        pad: 0,
      }),
    );
  const base = group(
    search,
    ...guides.map((g) => line(origin, tip(g.vector), { stroke: 'faint', width: 2 })),
    ...guides.map((g) => trace(g.vector, g.color)),
    ...pages.map((p) => p.page),
    trace(QUERY, 'cyan'),
    dot(12, 'ink').moveTo(origin),
    label('Query', { size: 43, color: 'cyan' }).moveTo([queryTip[0] - 58, queryTip[1] + 48]),
  );
  s.add(base);
  s.play(fadeIn(base, { duration: 0 }), ink.to(1, { duration: 1.1, ease: linear }));

  const question = label('Which guide makes the smaller angle?', {
    size: 49,
    color: 'yellow',
  });
  question.moveTo([area.left + question.bounds().width / 2, area.top + 150]);
  c.show('ask', question);
  c.hide('winner', question);
  const rotation = guides[0],
    audit = guides[1];
  const sweep = s.value(0);
  const wedge = dynamic(() =>
    arc(200, -pages[0].angle * sweep.value, 0, {
      stroke: rotation.color,
      width: 9,
    }).at(...origin),
  );
  c.show('winner', wedge, { after: true });
  c.after('winner', () => s.play(sweep.to(1, { duration: 0.6 })));
  c.show('small-angle', pages[0].angleLabel, { after: true });
  c.show(
    'wider',
    arc(155, -pages[1].angle, 0, {
      stroke: audit.color,
      width: 7,
    }).at(...origin),
  );
  c.show('large-angle', pages[1].angleLabel, { after: true });
  const coordinates = mono('[' + QUERY.join(', ') + ']', { size: 39 }).moveTo([
    queryTip[0] + 110,
    queryTip[1] + 48,
  ]);
  c.swap(
    'coordinates',
    pages.map((p) => p.angleLabel),
    [coordinates, ...pages.map((p) => p.coordinates)],
  );
  const reaches = guides.map((g) =>
    line(tip(g.vector), tip([g.vector[0], 0]), {
      stroke: g.color,
      width: 4,
      dash: [9, 8],
    }),
  );
  c.show('reach', [
    line(origin, tip([4.3, 0]), { stroke: 'faint', width: 2 }).zIndex(-1),
    ...reaches,
  ]);
}
