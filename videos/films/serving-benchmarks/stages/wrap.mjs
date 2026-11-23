import { SERVING_COHORT } from '../fixtures.mjs';
import { servingReceipt } from '../model.mjs';
import { cueProgress } from '../construction.mjs';
import { drawReceiptClock } from '../receipt-clock.mjs';
import { text } from '../defaults.mjs';

export function drawWrap(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const progress = cueProgress(state.cues, 'wrap-drain', beat >= 1 ? 1 : 0);
  const receipt = servingReceipt();
  const end = 2000;
  focus.target('wrap-ledger', () =>
    drawReceiptClock(ctx, api, SERVING_COHORT, {
      windowEnd: end,
      horizon: receipt.horizon,
      until: end + progress * (receipt.horizon - end),
    }),
  );
  text(ctx, api, receipt.offered + ' offered requests', 125, 860, 37, C.cyan, 'left');
  if (progress === 1) {
    text(ctx, api, receipt.success + ' successful', 745, 860, 37, C.ink, 'left');
    text(ctx, api, receipt.qualified + ' qualified', 1330, 860, 37, C.green, 'left');
  }
  if (beat === 2) {
    text(
      ctx,
      api,
      receipt.qualified +
        ' qualified / ' +
        receipt.horizon / 1000 +
        ' s = ' +
        receipt.qualifiedRps +
        ' per second',
      125,
      979,
      36,
      C.green,
      'left',
    );
    text(ctx, api, 'Sustained capacity: unmeasured', 1780, 979, 33, C.muted, 'right');
  }
}
export default { id: 'wrap', draw: drawWrap, cues: ['wrap-window', 'wrap-drain', 'wrap-receipt'] };
