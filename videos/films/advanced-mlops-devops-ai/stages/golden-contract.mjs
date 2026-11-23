import { cueClock } from '../cue-clock.mjs';
import { checkReceipt, drawReceipt, offlineReceipt } from '../evaluation.mjs';
import { mix } from '../arithmetic.mjs';

export function drawGoldenContract(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  const receipt = offlineReceipt;
  const { cap } = checkReceipt(receipt);
  const oneOver = cap + 1;
  const withExtra = checkReceipt(receipt, oneOver);
  const atLimit = checkReceipt(receipt, cap);
  let marker = p('edge-first') > 0 ? oneOver : undefined;
  if (p('edge-remove') > 0) marker = mix(oneOver, cap, p('edge-remove'));
  let decision = '';
  if (p('cost-scope') > 0)
    decision = 'Same token count   ·   different mix of cached input and generated output';
  else if (p('edge-pass') > 0 && atLimit.pass)
    decision = 'Pass all three point checks   ·   rerun the evaluation on the edited prompt';
  else if (p('edge-predict') > 0)
    decision = 'Does a receipt on the line pass all three comparisons?';
  else if (p('edge-fail') > 0 && !withExtra.pass && p('edge-remove') === 0)
    decision = 'Hold   ·   one token per request above the cap';
  drawReceipt(ctx, api, receipt, {
    name: 'Boundary test   /   quality and latency held fixed',
    quality: true,
    latency: true,
    allowance: true,
    base: true,
    room: 1,
    limit: true,
    marker,
    zoom: true,
    decision,
    color: p('edge-pass') > 0 ? api.C.green : api.C.yellow,
  });
}
export default {
  id: 'golden-contract',
  draw: drawGoldenContract,
  cues: ['edge-first', 'edge-fail', 'edge-remove', 'edge-predict', 'edge-pass', 'cost-scope'],
};
