import { indicate, boxOf, line } from 'vizmatic/stage';
import { REPEATED_CURSOR_PAGES } from '../../../films/ai-lab-technical-presentation/fixtures.mjs';
import { addTitle, work, route, ledger, CASE, caption } from '../parts.mjs';

export default function path(s, c) {
  addTitle(s, c);
  const [meta, upper, header, lower] = work.rows([0.55, 1.2, 0.55, 1.85], 'tight');
  const trace = route(upper, ['Support UI', 'Gateway', 'Tenant auth', 'Adapter', 'Tenant store'], {
    size: 34,
  });
  const pages = ledger(
    lower,
    ['Receipt', 'Requested', 'Returned', 'Decision'],
    [
      { id: 'one', Receipt: 'Page 1', Requested: 'START', Returned: ' ', Decision: ' ' },
      { id: 'two', Receipt: 'Page 2', Requested: ' ', Returned: ' ', Decision: ' ' },
    ],
  );
  const cursor = REPEATED_CURSOR_PAGES[0].nextCursor,
    request = CASE.request;
  const nameX = (i) => boxOf(trace.names[i]).point('center')[0];
  const boundaryWidth = (nameX(3) - nameX(2)) * 1.85;
  const middle = (nameX(3) + nameX(2)) / 2;
  const bracketY = upper.top + upper.height * 0.04;
  const left = middle - boundaryWidth / 2,
    right = middle + boundaryWidth / 2;
  const boundary = [
    line([left, bracketY], [right, bracketY], { stroke: 'cyan', width: 3 }),
    ...[left, right].map((x) =>
      line([x, bracketY], [x, bracketY + 18], { stroke: 'cyan', width: 3 }),
    ),
  ];
  const allowed = caption(meta, 'Credential access permitted', 'cyan', 33).moveTo([
    middle,
    meta.point('center')[1],
  ]);
  const owner = caption(meta, 'Store team owns this', 'dim', 32).moveTo([
    nameX(4),
    meta.point('center')[1],
  ]);
  const traceTitle = caption(header, 'Sanitized trace', 'dim', 36);
  const traceIds = caption(
    header,
    'Sanitized trace     ·     source-8     ·     ' + request,
    'yellow',
    38,
  );
  s.add(boundary, allowed, owner, trace, traceTitle, pages);
  c.on('ui', () => s.play(trace.put({ id: request }, { duration: 0.26 })));
  for (const [cue, station] of [
    ['gateway', 'Gateway'],
    ['auth', 'Tenant auth'],
    ['adapter', 'Adapter'],
    ['store', 'Tenant store'],
  ])
    c.on(cue, () => s.play(trace.move(request, station, { duration: 0.3 })));
  c.on('credential', () => s.play(indicate(allowed, { scale: 1, color: 'yellow' })));
  c.on('first', () =>
    s.play(
      trace.move(request, 'Adapter'),
      pages.setCell('one', 'Returned', cursor),
      pages.setCell('one', 'Decision', 'Remember'),
    ),
  );
  c.after('again', () =>
    s.play(
      pages.setCell('two', 'Requested', cursor),
      pages.setCell('two', 'Returned', cursor),
      pages.light('two'),
    ),
  );
  c.after('stop', () =>
    s.play(trace.stop(request), pages.setCell('two', 'Decision', 'Incomplete')),
  );
  c.on('test', () => s.play(pages.light('two', 'Decision')));
  c.clear(trace.laneNodes, 0.7, 0.16);
  c.swap('trace', traceTitle, traceIds);
}
