import {
  assertEqual,
  boxOf,
  column,
  draw,
  fadeIn,
  group,
  indicate,
  line,
  place,
  polygon,
  rect,
  to,
} from 'vizmatic/stage';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { pool } from '../../../films/active-labeling/fixtures.mjs';
import { footer, picture, sourceBand, sourceStrip } from '../parts.mjs';

function ticket(name, model) {
  const probability = model.probability;
  const a = Math.round(100 * probability);
  const edge = [
    [-360, -113],
    [360, -113],
    [360, -17],
    [344, 0],
    [360, 17],
    [360, 113],
    [-360, 113],
    [-360, 17],
    [-344, 0],
    [-360, -17],
  ];
  const track = 594;
  const bar = (width, start, color) =>
    rect(width, 24, { fill: color, stroke: null }).at((start - 0.5) * track + width / 2, 14);
  return group(
    polygon(edge, { fill: 'ink', stroke: null }),
    label(name, { size: 52, color: 'bg' }).at(0, -64),
    bar(track * probability, 0, 'blue'),
    bar(track * (1 - probability), probability, 'grid'),
    mono('A  ' + a + '%', { size: 39, color: 'bg' }).at(-196, 69),
    mono('B  ' + (100 - a) + '%', { size: 39, color: 'bg' }).at(196, 69),
  );
}

export default function subjectIntro(s, c) {
  const [tickets, inbox] = picture.columns(2, 'loose');
  const [resetPlace, handoffPlace] = tickets.rows(2, 'normal');
  const routine = pool.find((item) => item.label === 'routine response');
  const exception = pool.find((item) => item.label === 'exception handoff');
  const choices = [
    { model: routine, paper: ticket('Password reset', routine), location: resetPlace },
    { model: exception, paper: ticket('My approver is away', exception), location: handoffPlace },
  ];
  const selected = choices.reduce((best, item) =>
    item.model.uncertainty > best.model.uncertainty ? item : best,
  );
  assertEqual(selected.model.id, exception.id, 'the closer preference split gets the review');
  const [reset, handoff] = choices.map(({ paper, location }) =>
    paper.moveTo([location.cx - 95, location.cy]),
  );
  const question = heading(c.title);
  const [leftHead, rightHead] = sourceBand.columns(2, 'loose');
  const key = place(note('Eligible tickets  ·  predicted reviewer preference'), leftHead, 'left');
  const inboxLabel = place(label('Reviewer inbox', { size: 44 }), rightHead);
  const tray = place(
    rect(756, 262, { radius: 22, stroke: 'dim', width: 5, dash: [16, 12] }),
    inbox,
  );
  const empty = place(label('1 open place', { size: 52, color: 'dim' }), inbox);
  const method = place(label('Uncertainty sampling', { size: 46, color: 'cyan' }), footer);
  const opening = [question, key, inboxLabel, tray, empty, reset, handoff];
  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(
    ...choices.map(({ paper, location }) => to(paper, (n) => n.moveTo(location.point('center')))),
    {
      duration: 0.85,
    },
  );
  c.on('reset-split', () => s.play(indicate(reset, { scale: 1.03 })));
  c.on('handoff-split', () => s.play(indicate(handoff, { scale: 1.03 })));
  c.hide('take-ticket', empty, { after: true, fade: 0.12 });
  c.after('take-ticket', () =>
    s.play(
      to(selected.paper, (n) => n.moveTo(inbox.point('center'))),
      {
        duration: 0.9,
      },
    ),
  );
  c.show('name-selector', method, { after: true });

  const [pairRow, registryArea, logArea] = picture.rows([2.4, 1.4, 1.4], 'wide');
  const [left, right] = pairRow.columns(2, 'wide');
  const release = heading('Where does this release case belong?');
  const owner = place(mono('Review copy    Owner  [EMAIL_1]', { size: 34 }), sourceBand, 'left');
  const reply = (id, words, region) =>
    group(
      place(
        rect(region.width - 6, region.height - 6, { fill: 'surface', stroke: 'grid', radius: 14 }),
        region,
      ),
      ...place(column([note('Reply ' + id), label(words, { size: 43 })], { gap: 'wide' }), region)
        .nodes,
    );
  const a = reply('A', '“Request sign-off.”', left).moveTo([left.cx, picture.cy]);
  const b = reply('B', '“All traffic has moved.”', right).moveTo([right.cx, picture.cy]);
  const preferred = place(chip('Reviewer prefers A', { color: 'green' }), sourceBand, 'right');
  const evidence = (region, name, fact, destination) => {
    const [field, contents, route] = region.columns([1.3, 3.4, 2], 'normal');
    const factLabel = place(label(fact, { size: 36 }), contents, 'left');
    const [last, y] = boxOf(factLabel).point('right');
    return {
      fact: [
        place(note(name), field, 'left'),
        factLabel,
        place(
          rect(route.width - 6, route.height - 8, { stroke: 'grid', radius: 10 }),
          route,
        ).zIndex(-1),
      ],
      link: line([last + 22, y], [route.left - 12, y], { stroke: 'pink', width: 3 }),
      routed: place(label(destination, { size: 36, color: 'pink' }), route),
    };
  };
  const registry = evidence(
    registryArea,
    'Case registry',
    'attack-014  ·  private test',
    'Frozen evaluation',
  );
  const log = evidence(
    logArea,
    'Action log',
    'Change attempted before approval',
    'Incident review',
  );
  const routeQuestion = place(label('Which records do we keep?', { color: 'yellow' }), footer);
  const held = place(label('Test family held out', { color: 'pink' }), footer);
  const permitted = sourceStrip();
  const next = [
    heading('A pair cleared for review'),
    place(label('Propose an approval-gated canary.', { size: 53 }), pairRow),
    reply('A', 'Cites approval and canary scope', left).moveTo([left.cx, logArea.cy - 50]),
    reply('B', 'Claims traffic has moved', right).moveTo([right.cx, logArea.cy - 50]),
  ];

  c.swapAll('release-case', [release, owner, a, b]);
  c.show('prefer-a', preferred, { after: true });
  c.on('read-registry', () =>
    s.play(
      to(a, (n) => n.moveTo(left.point('center'))),
      to(b, (n) => n.moveTo(right.point('center'))),
      { duration: 0.65 },
    ),
  );
  c.show('read-registry', registry.fact, { lead: -0.65 });
  c.show('read-log', log.fact);
  c.show('ask-route', routeQuestion);
  c.hide('route-test', routeQuestion);
  c.on('route-test', () => s.play(draw(registry.link), { duration: 0.45 }));
  c.show('route-test', registry.routed, { after: true });
  c.on('route-incident', () => s.play(draw(log.link), { duration: 0.45 }));
  c.show('route-incident', log.routed, { after: true });
  c.show('exclude-training', held, { after: true });
  c.swapAll('permitted-source', [permitted, next]);
  c.keep(permitted);
}
