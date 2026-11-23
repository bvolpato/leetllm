import { rectangle, tensor, text } from '../defaults.mjs';
export function drawSubjectIntro(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    text(
      ctx,
      api,
      'R4219 · model M17/r5 · four displayed token rows',
      960,
      275,
      35,
      themeColors.yellow,
      'center',
    );
    tensor(ctx, api, 150, 395, 1, 'prefill owns computed state');
    tensor(ctx, api, 1220, 395, q(1), 'decode receives the same values');
    const amount = q(1),
      x = 750 + 390 * amount;
    rectangle(ctx, api, x - 80, 525, 160, 95, themeColors.yellow);
    text(
      ctx,
      api,
      't' + Math.min(4, Math.floor(amount * 4) + 1) + ' K/V',
      x,
      585,
      29,
      themeColors.yellow,
      'center',
    );
    text(ctx, api, 'first output token', 1480, 900, 33, themeColors.muted, 'center');
    rectangle(ctx, api, 1310, 920, 340, 70, amount === 1 ? themeColors.green : themeColors.pink);
    text(
      ctx,
      api,
      amount === 1 ? 'state ready → generate' : 'wait for valid state',
      1480,
      966,
      28,
      amount === 1 ? themeColors.green : themeColors.pink,
      'center',
    );
    text(
      ctx,
      api,
      'Each row carries token position and model identity across the boundary',
      960,
      1040,
      32,
      themeColors.ink,
      'center',
    );
  };
  if (api.focus)
    api.focus.target('subject-intro-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['subject-intro-b1', 'subject-intro-b2', 'subject-intro-b3'],
};
