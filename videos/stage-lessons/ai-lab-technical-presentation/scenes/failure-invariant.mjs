import { assertEqual, indicate } from 'vizmatic/stage';
import { inspectPageTrace } from '../../../films/ai-lab-technical-presentation/model.mjs';
import { addTitle, caption, ledger, work } from '../parts.mjs';

export default function failureInvariant(s, c) {
  addTitle(s, c);
  const common = [
    { page: 1, requestedCursor: null, nextCursor: 'C-17' },
    { page: 2, requestedCursor: 'C-17', nextCursor: 'C-24' },
  ];
  const commonState = inspectPageTrace(common);
  const third = (nextCursor) =>
    inspectPageTrace([...common, { page: 3, requestedCursor: commonState.nextCursor, nextCursor }]);
  const repeated = third(common[0].nextCursor);
  const terminal = third(null);
  assertEqual(
    repeated.duplicate && !repeated.canRequest && !repeated.complete,
    true,
    'a cycle stops paging as incomplete',
  );
  assertEqual(
    terminal.complete && !terminal.canRequest,
    true,
    'a terminal cursor completes paging',
  );
  const [requests, memory, verdict] = work.rows([3.2, 1.1, 1], 'normal');
  const t = ledger(
    requests,
    ['Page', 'Requested cursor', 'Returned cursor'],
    [
      { id: 'first', Page: '1', 'Requested cursor': 'START', 'Returned cursor': ' ' },
      { id: 'second', Page: '2', 'Requested cursor': ' ', 'Returned cursor': ' ' },
      { id: 'third', Page: '3', 'Requested cursor': ' ', 'Returned cursor': ' ' },
    ],
    { size: 40 },
  );
  const saved = (ids) =>
    caption(memory, 'Previously returned   { ' + ids.join(',  ') + ' }', 'cyan', 48);
  const empty = saved([]),
    one = saved([common[0].nextCursor]),
    two = saved(commonState.cursors);
  const choose = caption(
    verdict,
    'Send a fourth request, report complete, or report incomplete?',
    'yellow',
    43,
  );
  const status = (state) =>
    state.complete
      ? 'Stop   ·   complete'
      : state.duplicate
        ? 'Stop   ·   incomplete'
        : 'Fetch next page';
  const stop = caption(verdict, status(repeated), 'pink', 55);
  const done = caption(verdict, status(terminal), 'green', 55);
  s.add(t, empty);
  c.after('first', () => s.play(t.setCell('first', 'Returned cursor', common[0].nextCursor)));
  c.swap('save', empty, one);
  c.on('second', () => s.play(t.setCell('second', 'Requested cursor', common[1].requestedCursor)));
  c.after('new', () => s.play(t.setCell('second', 'Returned cursor', common[1].nextCursor)));
  c.swap('both', one, two, { after: true });
  c.on('third', () => s.play(t.setCell('third', 'Requested cursor', commonState.nextCursor)));
  c.after('repeat', () => s.play(t.setCell('third', 'Returned cursor', repeated.nextCursor)));
  c.show('ask', choose);
  c.on('found', () => s.play(t.light('first', 'Returned cursor'), indicate(two, { scale: 1.03 })));
  c.swap('stop', choose, stop, { after: true });
  c.hide('replay', stop);
  c.after('terminal', () =>
    s.play(t.setCell('third', 'Returned cursor', 'null'), t.light('third', 'Returned cursor')),
  );
  c.show('done', done, { after: true });
}
