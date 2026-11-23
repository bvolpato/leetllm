import { drawBankDesk } from '../bank-desk.mjs';

export function drawStrideTransfer(ctx, scene, state, api) {
  const p = (key) => api.focus.progress(key, 0);
  const done = (key) => api.focus.cue(key)?.phase === 'after';
  const changed = done('stride-34');
  const count = changed
    ? Math.floor(16 * p('even-banks')) +
      Number(done('wrap-back')) +
      Math.floor(15 * p('second-half'))
    : 32;
  let detail = 'Lane 1   ·   value 65   ·   shared word 33   ·   bank 1';
  let caption = 'For any fixed column c:  word = lane × stride + c,    bank = word mod 32';
  if (changed) {
    detail = done('wrap-back')
      ? 'Lane 16   ·   word 544   ·   544 mod 32 = 0'
      : 'Lane 16 needs word 16 × 34 = 544. Which bank serves it?';
    caption = done('even-banks')
      ? 'Lane 0 already requested word 0 from bank 0.'
      : 'Column 0   ·   count the first sixteen lane requests';
    if (done('two-words'))
      caption = '16 banks × 2 distinct words   ·   gcd(34, 32) = 2 words per used bank';
  }
  drawBankDesk(ctx, api, {
    stride: changed ? 34 : 33,
    lanes: count,
    rowLanes: changed ? [0, 1, 16] : [0, 1, 2],
    detail,
    caption,
    tally: true,
  });
}
export default {
  id: 'stride-transfer',
  draw: drawStrideTransfer,
  cues: ['stride-34', 'even-banks', 'wrap-back', 'second-half', 'two-words'],
};
