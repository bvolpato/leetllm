import {
  currentReceipt,
  currentResult,
  lateReceipt,
  oldResult,
  readerView,
  replayResult,
  skyClub,
  uploadWorksheet,
} from '../upload.mjs';

export function drawFreshModeration(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const done = (id) => focus.progress(id) === 1;
  if (state.beat === 0) {
    uploadWorksheet(ctx, api, {
      join: focus.progress('fresh-moderation-sum'),
      result: done('fresh-moderation-result'),
      prompt: !focus.visible('fresh-moderation-sum'),
    });
    if (focus.visible('fresh-receipt'))
      focus.target('incoming-receipt', () =>
        label(
          'New receipt    D23   /   ALLOW   /   revision 2      →      Can it publish revision 3?',
          140,
          984,
          36,
          C.ink,
        ),
      );
    return;
  }
  const stale = state.beat > 1 || done('fresh-moderation-old');
  const authorized = state.beat >= 2 && focus.visible('fresh-moderation-review');
  const committed = state.beat > 2 || done('fresh-moderation-commit');
  const replayed = state.beat === 3 && done('fresh-replay');
  const item = (replayed ? replayResult : committed ? currentResult : oldResult).item;
  const visible = item.state === 'PUBLISHED';
  focus.target('member-view', () =>
    readerView(ctx, api, {
      id: skyClub.id,
      revision: item.revision,
      kind: 'sky',
      visible,
      status: visible ? 'Published' : 'Pending',
    }),
  );
  focus.target('receipt-rows', () => {
    label('Decision receipts   /   ' + skyClub.id, 868, 339, 43);
    label(
      'Current   rev ' + skyClub.revision + '   ·   ' + item.scope + '   ·   ' + item.policy,
      868,
      407,
      33,
      C.blue,
    );
    const drawReceipt = (receipt, y, status, tone) => {
      api.line(ctx, 868, y - 60, 1780, y - 60, C.muted, 2);
      label(receipt.id + '   ' + receipt.action, 868, y, 40);
      label(
        'rev ' + receipt.revision + '   ·   ' + receipt.scope + '   ·   ' + receipt.policy,
        868,
        y + 53,
        30,
        C.muted,
      );
      label(status, 1470, y, 35, tone);
    };
    drawReceipt(lateReceipt, 546, stale ? oldResult.status : '?', stale ? C.pink : C.muted);
    if (authorized)
      drawReceipt(
        currentReceipt,
        705,
        committed ? currentResult.status : 'Authorized',
        committed ? C.green : C.blue,
      );
    if (state.beat === 3 || focus.visible('fresh-redelivery'))
      drawReceipt(currentReceipt, 864, replayed ? replayResult.status : 'Redelivery', C.blue);
  });
  focus.target('publication-effect', () => {
    const publications = item.outbox.filter((event) => event.state === 'PUBLISHED').length;
    const awaitingReplay = focus.visible('fresh-redelivery') && !done('fresh-count');
    label(
      (awaitingReplay ? 'Events before redelivery   ' : 'Publication events   ') + publications,
      140,
      982,
      40,
      visible ? C.green : C.ink,
    );
    const message = replayed
      ? 'The same D24 already has a recorded effect.'
      : awaitingReplay
        ? 'How many publication events after redelivery?'
        : done('fresh-count')
          ? 'Compare D24 with the stored receipt.'
          : committed
            ? 'D24 and its outbox event commit together.'
            : stale
              ? 'D23 still belongs to revision 2.'
              : 'Can D23 publish the club’s current profile?';
    label(message, 867, 982, 32);
  });
}
export default {
  id: 'fresh-moderation',
  draw: drawFreshModeration,
  cues: [
    'fresh-moderation-sum',
    'fresh-moderation-result',
    'fresh-receipt',
    'fresh-moderation-old',
    'fresh-moderation-pending',
    'fresh-moderation-review',
    'fresh-moderation-commit',
    'fresh-redelivery',
    'fresh-count',
    'fresh-replay',
  ],
};
