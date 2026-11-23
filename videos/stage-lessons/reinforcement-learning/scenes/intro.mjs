import {
  boxOf,
  circle,
  column,
  group,
  indicate,
  line,
  linear,
  place,
  polygon,
  polyline,
  shift,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { routeSlip } from '../desk.mjs';

function accessSlip() {
  const paper = polygon(
    [
      [-282, -195],
      [201, -195],
      [282, -114],
      [282, 195],
      [-282, 195],
    ],
    {
      fill: 'surface',
      stroke: 'cyan',
      width: 5,
    },
  );
  const fold = polygon(
    [
      [201, -195],
      [282, -114],
      [201, -114],
    ],
    { fill: 'cyan', stroke: null },
  );
  const key = group(
    circle(43, { stroke: 'cyan', width: 17, fill: null }).at(-61, 0),
    polyline(
      [
        [-18, 0],
        [102, 0],
        [102, 28],
      ],
      { stroke: 'cyan', width: 17 },
    ),
    line([70, 0], [70, 28], { stroke: 'cyan', width: 17 }),
  ).shift(0, -96);
  return group(
    paper,
    fold,
    key,
    label('Access request', { size: 60 }).moveTo([0, 20]),
    label('Proof missing', { color: 'yellow', size: 42 }).moveTo([0, 82]),
    mono('09:00  ·  REQ-10234', { color: 'dim', size: 30 }).moveTo([0, 149]),
  );
}

export default function intro(s, c) {
  const desk = routeSlip();
  const [ask, review] = desk.rows;
  const [arrival, fork, destinations] = area.columns([4, 1, 3], 'normal');
  const ticket = place(accessSlip(), arrival, 'left');
  const junction = fork.point('left');
  const travel = arrival.right - boxOf(ticket).right;
  const inlet = line([boxOf(ticket).right, junction[1]], junction, { stroke: 'cyan', width: 8 });
  const routes = destinations.rows(2).map((region, i) => {
    const color = i === 0 ? 'green' : 'blue';
    const wording = place(
      column(
        [
          label(i === 0 ? 'Ask for proof' : 'Human review', { color, size: 62 }),
          note(i === 0 ? 'Wait for a reply' : 'Join the review queue', { size: 36 }),
        ],
        { gap: 'normal', align: 'left' },
      ),
      region,
      'left',
    );
    const end = [boxOf(wording).left - 36, region.cy];
    const rail = polyline([junction, [fork.cx, region.cy], end], { stroke: color, width: 8 });
    return group(rail, ...wording.nodes);
  });
  const firstPicture = [heading(c.title), inlet, ...routes, ticket];
  s.add(firstPicture);
  for (const node of firstPicture) node.opacity(1);
  s.play(shift(ticket, travel, 0), { duration: 1, ease: linear });
  c.on('ask-route', () => s.play(indicate(routes[0], { scale: 1, color: 'green' })));
  c.on('review-route', () => s.play(indicate(routes[1], { scale: 1, color: 'blue' })));
  c.swap('certain', firstPicture.slice(1), [
    desk.skeleton,
    desk.certain,
    ask.name,
    ask.open,
    review.name,
    review.open,
  ]);
  c.show('ask-cost', ask.paid, { after: true });
  c.show('ask-later', ask.reward, { after: true });
  c.show('review-cost', review.paid, { after: true });
  c.show('review-later', review.reward, { after: true });
  c.show('discount', desk.discount, { after: true });
  c.show('decide', desk.question);
  c.keep([...desk.skeleton, ...desk.filled]);
}
