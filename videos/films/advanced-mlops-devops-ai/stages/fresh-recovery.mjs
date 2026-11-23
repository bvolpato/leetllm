import { cueClock } from '../cue-clock.mjs';
import { checkReceipt, correctedReceipt, drawReceipt } from '../evaluation.mjs';

export function drawFreshRecovery(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  const receipt = correctedReceipt;
  const { cap, growth, pass } = checkReceipt(receipt);
  const spare = cap - receipt.candidate.tokens;
  let decision = '';
  if (p('keep-identity') > 0) decision = 'Carry this exact release into safety and capacity checks';
  else if (p('fresh-pass') > 0 && pass)
    decision = 'Three point checks pass   ·   ' + growth.toFixed(0) + '% token growth';
  else if (p('fresh-room') > 0) decision = spare + ' tokens per request to spare';
  else if (p('fresh-question') > 0) decision = 'Does this receipt clear the three point checks?';
  drawReceipt(ctx, api, receipt, {
    name: 'Separate evaluation   /   corrected feature path',
    quality: p('fresh-quality') > 0,
    latency: p('fresh-latency') > 0,
    base: p('fresh-base') > 0,
    allowance: p('fresh-policy') > 0,
    marker: p('fresh-use') > 0 ? receipt.candidate.tokens : undefined,
    room: p('fresh-cap'),
    limit: p('fresh-cap') === 1,
    bracket: p('fresh-room') > 0,
    decision,
    color: p('fresh-room') > 0 ? api.C.green : api.C.yellow,
  });
}
export default {
  id: 'fresh-recovery',
  draw: drawFreshRecovery,
  cues: [
    'fresh-base',
    'fresh-use',
    'fresh-policy',
    'fresh-quality',
    'fresh-latency',
    'fresh-question',
    'fresh-cap',
    'fresh-room',
    'fresh-pass',
    'keep-identity',
  ],
};
