import { lp, mask } from '../fixtures.mjs';
import { sum } from '../arithmetic.mjs';
import { progress } from '../phrase-clock.mjs';
import { receipt, receiptTarget, responseTape } from '../response-tape.mjs';

export function drawLedger(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  return api.focus.target(receiptTarget, () => {
    receipt(ctx, api, 'Clean grader  /  reward 1.0');
    const truncated = p('short-mask') === 1;
    const masks = truncated ? mask.slice(0, 4) : mask;
    responseTape(ctx, api, { masks, probabilities: lp });
    const selected = lp.filter((_, i) => mask[i]);
    let message = 'Which positions supply the divisor?';
    let color = C.yellow;
    if (p('loss-mean') > 0)
      message = `−(−0.2 − 0.3 − 0.4 − 0.5) / ${sum(mask)} = ${p('loss-mean') === 1 ? (-sum(selected) / sum(mask)).toFixed(2) : '?'}`;
    if (truncated) {
      message = `${masks.length} mask entries for ${lp.length} response positions. Hold this Sample.`;
      color = C.pink;
    }
    api.text(ctx, message, 960, 960, 44, color, 'center');
  });
}
export default {
  id: 'ledger',
  draw: drawLedger,
  cues: ['inspect-terms', 'loss-mean', 'short-mask'],
};
