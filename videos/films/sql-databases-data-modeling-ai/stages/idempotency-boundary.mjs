import { directed } from '../construction.mjs';
import { drawExtendedSqlGrid, drawSqlText } from '../defaults.mjs';

export function drawIdempotencyBoundary(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const done = (id, index, start, end) => directed(state, id, index, start, end) === 1;
  if (beat === 0) {
    const stored = done('commit-request', 0, 0.2, 0.39);
    const skipped = done('skip-local-retry', 0, 0.4, 0.55);
    const rejected = done('reject-local-reuse', 0, 0.56, 0.77);
    api.focus.target('local-request', () => {
      drawSqlText(ctx, api, 'Acme   /   Import request req-30', 145, 300, 44, C.cyan);
      drawSqlText(
        ctx,
        api,
        'Workspace, document ID, source key, title, start time, chunk ID and text',
        145,
        390,
        37,
        C.ink,
      );
      drawExtendedSqlGrid(
        ctx,
        api,
        [
          ['Request key', 'Input fingerprint', 'Importer result'],
          [
            'req-30',
            done('fingerprint-fields', 0, 0.05, 0.18) ? 'SHA-256 of 7 fields' : '',
            stored ? 'Saved d30 and c30' : '',
          ],
          ['req-30', skipped ? 'Same fingerprint' : '', skipped ? 'Skip write' : ''],
          ['req-30', rejected ? 'Changed text' : '', rejected ? 'Reject reuse' : ''],
        ],
        145,
        459,
        1630,
        320,
        C.blue,
        33,
      );
    });
    api.focus.target('private-grant', () => {
      drawSqlText(ctx, api, 'Permission for Bob', 145, 914, 35, C.muted);
      if (stored) drawSqlText(ctx, api, 'No grant for c30', 645, 914, 40, C.pink);
    });
    return;
  }

  const job = 42;
  const saved = done('start-remote-job', 1, 0.1, 0.42);
  const lost = done('lose-remote-reply', 1, 0.43, 0.59);
  const recorded = done('record-job-number', 2, 0.22, 0.45);
  const pathLabel = recorded
    ? 'Reply received'
    : beat === 2
      ? 'Retry with the same key'
      : lost
        ? 'Reply lost'
        : 'First request';
  const row = (x, title, number, color) => {
    drawSqlText(ctx, api, title, x, 322, 45, color);
    api.line(ctx, x, 355, x + 605, 355, color, 3);
    drawSqlText(ctx, api, 'Request key', x, 462, 29, C.muted);
    api.text(ctx, 'embed-c30', x, 542, 56, C.ink, 'left', 'mono');
    drawSqlText(ctx, api, 'Job number', x, 674, 29, C.muted);
    if (number !== null) api.text(ctx, String(number), x, 844, 154, color, 'left', 'serif');
    else api.line(ctx, x, 827, x + 224, 827, C.muted, 3);
  };
  api.focus.target('worker-record', () =>
    row(140, 'Worker’s record', recorded ? job : null, C.green),
  );
  api.focus.target('remote-receipt', () =>
    row(1180, 'Service receipt', saved ? job : null, C.cyan),
  );
  api.focus.target('reply-path', () => {
    const color = recorded ? C.green : lost && beat === 1 ? C.pink : C.yellow;
    drawSqlText(ctx, api, pathLabel, 960, 584, 30, color, 'center');
    if (recorded) api.arrow(ctx, 1110, 631, 810, 631, color, 5);
    else if (beat === 1 && lost) {
      api.line(ctx, 1110, 631, 1030, 631, color, 5);
      api.line(ctx, 1008, 619, 984, 643, color, 4);
      api.line(ctx, 984, 619, 1008, 643, color, 4);
    } else api.arrow(ctx, 810, 631, 1110, 631, color, 5);
  });
}

export default {
  id: 'idempotency-boundary',
  draw: drawIdempotencyBoundary,
  cues: [
    'fingerprint-fields',
    'commit-request',
    'skip-local-retry',
    'reject-local-reuse',
    'check-private-grant',
    'start-remote-job',
    'lose-remote-reply',
    'find-remote-receipt',
    'record-job-number',
  ],
};
