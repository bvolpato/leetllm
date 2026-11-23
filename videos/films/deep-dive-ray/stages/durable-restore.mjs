import { chapterCard, panel, text } from '../defaults.mjs';
import { drawLedger, eighteen, motion, nineteen, passed, recorded, replay } from '../ledger.mjs';

export function drawDurableRestore(ctx, scene, state, api) {
  const { C } = api;
  const loaded = passed(state, 'ray-restore-load', 0);
  const staged = passed(state, 'ray-batch-pending', 1);
  const committed = passed(state, 'ray-transaction-after', 1);
  const lost = passed(state, 'durable-reply-lost', 1);
  const later = passed(state, 'durable-b19', 2);
  const answered = passed(state, 'ray-old-result', 3);
  const ledger = later ? nineteen.ledger : committed ? eighteen.ledger : recorded;
  const lookup = state.beat === 3;
  api.focus.target('durable-disk', () =>
    drawLedger(ctx, api, {
      x: 145,
      y: 283,
      w: 710,
      ledger,
      selected: lookup ? 'B18' : undefined,
      rowTarget: 'durable-b18',
    }),
  );
  api.focus.target('durable-hand', () => {
    panel(ctx, api, 1040, 283, 730, 520, C.cyan);
    const title = ['Constructor', 'B18 transaction', 'After actor restart', 'Reply to B18'][
      state.beat
    ];
    text(ctx, api, title, 1095, 351, 42);
    if (state.beat === 0) {
      text(
        ctx,
        api,
        loaded ? 'Loaded count' : 'Reading durable state',
        1405,
        493,
        37,
        C.muted,
        'center',
      );
      if (loaded) text(ctx, api, String(recorded.count), 1405, 640, 124, C.green, 'center');
    } else if (state.beat === 1) {
      text(
        ctx,
        api,
        committed ? 'Committed together' : '2 new documents',
        1405,
        455,
        36,
        committed ? C.green : C.yellow,
        'center',
      );
      if (staged && !committed) {
        const writes = 'Pending: count' + eighteen.ledger.count + ' + B18→' + eighteen.result;
        chapterCard(ctx, api, writes, 1090, 519, 630, C.yellow, 102, 37);
      } else if (committed) {
        chapterCard(
          ctx,
          api,
          'Reply to caller   ' + eighteen.result,
          1115,
          519,
          580,
          C.green,
          102,
          37,
        );
      }
      if (lost) text(ctx, api, 'First reply lost', 1405, 753, 36, C.pink, 'center');
    } else if (state.beat === 2) {
      text(
        ctx,
        api,
        later ? 'B19 added 1 document' : 'Read count and receipts',
        1405,
        468,
        38,
        C.cyan,
        'center',
      );
      if (later) {
        text(ctx, api, 'B18 comes back', 1405, 592, 43, C.yellow, 'center');
        text(ctx, api, 'Reply   ?', 1405, 724, 65, C.yellow, 'center');
      }
    } else {
      text(ctx, api, 'Receipt lookup   B18', 1405, 477, 39, C.yellow, 'center');
      text(
        ctx,
        api,
        answered ? String(replay.result) : '?',
        1405,
        659,
        122,
        answered ? C.green : C.yellow,
        'center',
      );
      if (answered)
        text(ctx, api, 'Documents added on retry   0', 1405, 753, 31, C.green, 'center');
    }
  });
  if (lookup) {
    const q = motion(state, 'ray-old-result', 3);
    if (q > 0) api.arrow(ctx, 872, 663, 872 + 145 * q, 663, C.yellow, 4);
  }
  if (state.beat === 2 && later)
    text(ctx, api, 'Which number should B18’s caller get back?', 960, 935, 42, C.ink, 'center');
  if (answered)
    text(
      ctx,
      api,
      'B18 returned ' + replay.result + '     ·     Current count ' + replay.ledger.count,
      960,
      935,
      43,
      C.green,
      'center',
    );
}
export default {
  id: 'durable-restore',
  draw: drawDurableRestore,
  cues: [
    'ray-restore-load',
    'ray-batch-pending',
    'ray-transaction-after',
    'durable-reply-lost',
    'durable-b19',
    'durable-ask',
    'ray-old-result',
  ],
};
