import { CANDIDATES, FIXTURE_PAGE_LIMIT, FIXTURE_RETRY_LIMIT } from '../fixtures.mjs';
import { runSearchFixture } from '../model.mjs';

const [reader, shortcut] = CANDIDATES.map(runSearchFixture);
const attempts = [
  { target: 'first-call', event: reader.trace[0], output: 'throttle-reply' },
  {
    target: 'retry-call',
    event: reader.trace[1],
    input: 'same-request',
    output: 'page-one-names',
    cursor: 'next-value',
  },
  { target: 'third-call', event: reader.trace[2], input: 'third-input', output: 'third-response' },
  {
    target: 'oversize-call',
    event: shortcut.trace[0],
    input: 'oversize-limit',
    output: 'oversize-status',
  },
];

export function drawVerifier(ctx, scene, state, api) {
  const { C, focus } = api;
  const seen = (id) => focus.progress(id, 0) > 0;
  const done = (id) => focus.progress(id, 0) === 1;
  focus.target('contract', () => {
    api.text(ctx, 'Two-page search', 140, 254, 39, C.ink);
    api.text(
      ctx,
      'Page limit ' +
        FIXTURE_PAGE_LIMIT +
        '    ·    At most ' +
        FIXTURE_RETRY_LIMIT +
        ' retries per page',
      1780,
      254,
      34,
      C.blue,
      'right',
    );
  });

  const columns = [145, 365, 625, 845, 1090, 1380];
  [
    'Client / call',
    'Cursor sent',
    'Limit',
    'HTTP reply',
    'Next cursor',
    'Collected so far',
  ].forEach((label, i) => api.text(ctx, label, columns[i], 378, 30, C.muted));
  api.line(ctx, 140, 402, 1780, 402, C.muted, 2);

  for (const [i, step] of attempts.entries()) {
    const question = i === 2 && seen('third-prediction');
    const pending = i === 3 && seen('other-proposal');
    const inputReady = !step.input || seen(step.input);
    if (!inputReady && !question && !pending) continue;
    const y = [481, 589, 697, 866][i];
    focus.target(step.target, () => {
      if (i === 3) api.line(ctx, 140, y - 84, 1780, y - 84, C.muted, 2);
      const { request, response } = step.event;
      const cursor = request.cursor ?? 'start';
      const showInput = inputReady && (i !== 2 || done('third-input'));
      const hasResponse = done(step.output);
      const names =
        i === 3
          ? shortcut.result.items
          : reader.trace.slice(0, i + 1).flatMap((event) => event.response.items);
      const cells = [
        i === 3 ? 'C4  /  1' : 'C1  /  ' + (i + 1),
        showInput ? cursor : '?',
        showInput ? request.limit.toLocaleString('en-US') : '…',
        hasResponse ? String(response.status) : '…',
        hasResponse && (!step.cursor || done(step.cursor))
          ? response.status === 200
            ? (response.nextCursor ?? 'null')
            : '—'
          : '…',
        hasResponse ? (names.length ? names.join(', ') : '0 names') : '…',
      ];
      cells.forEach((value, k) => {
        const colored = (k === 1 && (i === 1 || i === 2)) || (k === 4 && i === 1);
        const color =
          k === 0
            ? C.blue
            : colored
              ? C.yellow
              : k === 3 && hasResponse && response.status >= 400
                ? C.pink
                : C.ink;
        api.text(ctx, value, columns[k], y, k === 5 ? 35 : 39, color);
      });
    });
  }
  focus.target('receipt', () => {
    let label = 'C1   ·   retry client';
    if (seen('third-prediction') && !seen('third-input'))
      label = 'Which cursor belongs in request three?';
    if (done('complete-client'))
      label =
        'C1   ·   ' +
        reader.result.items.length +
        ' names collected   ·   ' +
        reader.retryCount +
        ' retry';
    if (seen('other-proposal')) label = 'C4   ·   same fixture, fresh start';
    if (done('empty-result'))
      label =
        'C4   ·   ' +
        shortcut.result.items.length +
        ' names collected   ·   request exceeds the page limit';
    api.text(
      ctx,
      label,
      145,
      993,
      39,
      done('empty-result')
        ? C.pink
        : done('complete-client') && !seen('other-proposal')
          ? C.green
          : C.yellow,
    );
  });
}
export default {
  id: 'verifier',
  draw: drawVerifier,
  cues: [
    'fixture-limit',
    'throttle-reply',
    'same-request',
    'page-one-names',
    'next-value',
    'third-prediction',
    'third-input',
    'third-response',
    'complete-client',
    'other-proposal',
    'oversize-limit',
    'oversize-status',
    'empty-result',
  ],
};
