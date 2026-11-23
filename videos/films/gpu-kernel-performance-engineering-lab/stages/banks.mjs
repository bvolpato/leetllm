import { drawBankDesk } from '../bank-desk.mjs';

export function drawBanks(ctx, scene, state, api) {
  const p = (key) => api.focus.progress(key, 0);
  const done = (key) => api.focus.cue(key)?.phase === 'after';
  const padded = done('new-stride');
  const stride = padded ? 33 : 32;
  const count = padded
    ? (done('new-word') ? 2 : 0) + Math.floor(30 * p('padded-walk'))
    : Math.floor(3 * p('first-three')) + Math.floor(29 * p('other-lanes'));
  const detail =
    padded && !done('new-word')
      ? 'Lane 1 still carries 65. Which bank gets its word?'
      : count >= 2 || padded
        ? `Lane 1   ·   value 65   ·   shared word ${stride}   ·   bank ${stride % 32}`
        : 'Lane 1 carries 65 from shared[1, 0] to B[32, 1]';
  let caption = 'The address strip enlarges the first four banks. The count below covers all 32.';
  if (done('old-collision')) caption = '32 different words queue at bank 0';
  if (padded) caption = 'Gray cells are padding. The global input and output stay the same.';
  if (done('padded-result'))
    caption = '32 banks serve one word each   ·   128 extra shared bytes per block';
  drawBankDesk(ctx, api, {
    stride,
    lanes: count,
    detail,
    caption,
    rowLanes: [0, 1, 2],
    tally: padded,
  });
}
export default {
  id: 'banks',
  draw: drawBanks,
  cues: [
    'first-three',
    'other-lanes',
    'old-collision',
    'new-stride',
    'new-word',
    'padded-walk',
    'padded-result',
  ],
};
