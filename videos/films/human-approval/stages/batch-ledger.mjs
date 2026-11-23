import { createHash } from 'node:crypto';
import { cueClock, footer } from '../routing.mjs';

const items = Array.from({ length: 50 }, (_, i) => ({
  key: 'note-' + (i + 1),
  destination: 'release-feed-a',
  content: 'Release note ' + (i + 1),
  expectedRevision: 1,
}));
const retargeted = items.map((p, i) => (i === 28 ? { ...p, destination: 'release-feed-b' } : p));
const batchDigest = (ordered) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        version: 1,
        scope: 'platform-release-notes',
        items: ordered,
      }),
    )
    .digest('hex');
const saved = batchDigest(items);
const edited = batchDigest(retargeted);
const firstUnconfirmed = 42;

export function drawBatchLedger(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const review = state.beat === 0;
  const altered = review && cue('batch-binding').phase === 'after';
  const receipts = Math.floor((firstUnconfirmed - 1) * cue('batch-receipts').progress);
  const timedOut = cue('batch-unknown').phase === 'after';
  api.focus.target('batch-ledger-mechanism', () => {
    api.text(
      ctx,
      review ? 'Reviewed publication order' : 'Publication ledger',
      115,
      291,
      43,
      C.ink,
      'left',
      'serif',
    );
    api.text(
      ctx,
      review ? 'Stored digest  ' + saved.slice(0, 12) + '…' : receipts + ' verified receipts',
      1805,
      291,
      34,
      review ? C.yellow : C.green,
      'right',
    );
    items.forEach((_, i) => {
      const x = 120 + (i % 10) * 170,
        y = 370 + Math.floor(i / 10) * 91;
      const uncertain = timedOut && i + 1 === firstUnconfirmed;
      const color =
        i < receipts ? C.green : uncertain ? C.yellow : altered && i === 28 ? C.pink : C.muted;
      api.rect(ctx, x, y, 145, 70, C.panel, color, 4);
      api.text(ctx, String(i + 1), x + 72, y + 48, 36, color, 'center');
    });
    if (review) {
      api.text(
        ctx,
        altered ? 'Note 29  ·  feed A → feed B' : 'Note 29  ·  release feed A',
        115,
        884,
        37,
        altered ? C.pink : C.ink,
      );
      if (altered)
        api.text(
          ctx,
          'Edited digest  ' + edited.slice(0, 12) + '…',
          1805,
          884,
          34,
          C.pink,
          'right',
        );
    } else if (timedOut) {
      api.text(ctx, '1–41   /   verified', 115, 884, 35, C.green);
      api.text(ctx, '42   /   unknown', 960, 884, 35, C.yellow, 'center');
      api.text(ctx, '43–50   /   unsent', 1805, 884, 35, C.muted, 'right');
    }
    if (cue('batch-reconcile').phase !== 'before')
      footer(
        ctx,
        api,
        state.beat === 2
          ? 'Check dependencies before sending the eight remaining notes.'
          : 'Look up ' + items[firstUnconfirmed - 1].key + ' at the destination.',
        C.yellow,
      );
  });
}
export default {
  id: 'batch-ledger',
  draw: drawBatchLedger,
  cues: ['batch-binding', 'batch-receipts', 'batch-unknown', 'batch-reconcile', 'batch-dependency'],
};
