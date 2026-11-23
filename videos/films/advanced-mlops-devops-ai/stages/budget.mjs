import { cueClock } from '../cue-clock.mjs';
import { checkReceipt, drawReceipt, offlineReceipt } from '../evaluation.mjs';

export function drawBudget(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  const receipt = offlineReceipt;
  const { cap, growth } = checkReceipt(receipt);
  const gap = receipt.candidate.tokens - cap;
  const showGap = p('budget-gap') > 0;
  const hold = p('budget-hold') > 0;
  drawReceipt(ctx, api, receipt, {
    name: 'Prompt evaluation   /   same requests',
    quality: p('budget-quality') > 0,
    latency: p('budget-latency') > 0,
    allowance: state.beat >= 1,
    base: p('budget-base') > 0,
    room: p('budget-room'),
    limit: p('budget-limit') > 0,
    marker: p('budget-candidate') > 0 ? receipt.candidate.tokens : undefined,
    bracket: p('budget-predict') > 0,
    decision: hold
      ? 'Hold   ·   ' + gap + ' tokens over the cap   ·   ' + growth.toFixed(1) + '% growth'
      : showGap
        ? gap + ' tokens per request above the cap'
        : p('budget-predict') > 0
          ? 'How many tokens per request over the cap?'
          : '',
    color: showGap ? api.C.pink : api.C.yellow,
  });
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'budget-quality',
    'budget-latency',
    'budget-base',
    'budget-room',
    'budget-limit',
    'budget-candidate',
    'budget-predict',
    'budget-gap',
    'budget-hold',
  ],
};
