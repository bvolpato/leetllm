import { rect, place, boxOf, line, draw, indicate } from 'vizmatic/stage';
import { PAIRED, addTitle, work, caption, route, ledger, CASE } from '../parts.mjs';

export default function qaClaimRepair(s, c) {
  addTitle(s, c);
  const [upper, lower] = work.rows([1, 1.7]);
  const [records, request] = lower.rows([3, 1], 'tight');
  const call = route(upper, ['Gateway', 'Owned adapter', 'Store call', 'Return']);
  const [entry, exit] = call.names.slice(-2).map((name) => boxOf(name).point('center')[0]);
  const y = call.region({ lane: 0 }).bottom + 26;
  const spanStyle = { stroke: 'yellow', width: 4 };
  const open = line([entry, y - 12], [entry, y], spanStyle);
  const span = line([entry, y], [exit, y], spanStyle);
  const close = line([exit, y - 12], [exit, y], spanStyle);
  const log = ledger(
    records,
    ['Status', 'Claim', 'Basis'],
    [
      { id: 'span', Status: ' ', Claim: ' ', Basis: ' ' },
      { id: 'index', Status: ' ', Claim: ' ', Basis: ' ' },
      { id: 'own', Status: ' ', Claim: ' ', Basis: ' ' },
    ],
  );
  const [planName, empty] = request.columns([1, 1.8], 'normal');
  const heading = caption(planName, 'Query plan requested', 'yellow', 36);
  const slot = place(
    rect(empty.width * 0.9, empty.height * 0.75, {
      radius: 8,
      fill: null,
      stroke: 'dim',
      dash: [10, 7],
      width: 3,
    }),
    empty,
  );
  const repair = ledger(
    lower,
    ['Claim', 'Slide', 'Consequence'],
    [
      { id: 'unit', Claim: 'Net gain', Slide: '7 percent', Consequence: 'Repair the unit' },
      {
        id: 'tenant',
        Claim: 'Required tenant',
        Slide: 'If a query regresses',
        Consequence: 'Inspect release gate',
      },
    ],
  );
  s.add(call, log);
  c.on('trace', () => {
    s.play(call.put({ id: CASE.request }, { duration: 0.35 }));
    s.play(call.move(CASE.request, 'Store call'));
  });
  const wait = c.cue('wait');
  c.on('wait', () => {
    s.play(draw(open, { duration: 0.15 }));
    s.play(call.move(CASE.request, 'Return'), draw(span), {
      duration: wait.end - wait.start - 0.15,
    });
  });
  c.after('wait', () =>
    s.play(
      draw(close, { duration: 0.15 }),
      log.setCell('span', 'Status', 'Observed'),
      log.setCell('span', 'Claim', 'Wait in store call'),
      log.setCell('span', 'Basis', CASE.request + ' · call to return'),
      log.light('span'),
    ),
  );
  c.after('hypothesis', () =>
    s.play(
      log.setCell('index', 'Status', 'Hypothesis'),
      log.setCell('index', 'Claim', 'Possible missing index'),
      log.light('index'),
    ),
  );
  c.on('test', () => s.play(log.setCell('index', 'Basis', 'Comparison needed')));
  c.on('own', () =>
    s.play(
      log.setCell('own', 'Status', 'Owned'),
      log.setCell('own', 'Claim', 'Adapter tests'),
      log.setCell('own', 'Basis', 'Regression fixture'),
      log.light('own'),
    ),
  );
  c.show('hypothesis', [heading, slot], { after: true });
  c.on('plan', () => s.play(indicate(slot, { color: 'yellow', scale: 1 })));
  c.swap('error', [log, heading, slot], repair);
  c.after('unit', () =>
    s.play(
      repair.light('unit'),
      repair.setCell('unit', 'Slide', PAIRED.percentagePointChange + ' percentage points'),
    ),
  );
  c.after('decision', () =>
    s.play(repair.light('tenant'), repair.setCell('tenant', 'Consequence', 'Reassess rollout')),
  );
  c.clear(call.laneNodes, 0.7, 0.16);
}
