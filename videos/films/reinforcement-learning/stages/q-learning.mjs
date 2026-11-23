import { equation, line, moveValue, rectangle, text } from '../defaults.mjs';
export function drawQLearning(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const step = (i, a = 0.1, z = 0.72) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    text(
      ctx,
      api,
      'Only Q[new request, ask evidence] changes',
      960,
      275,
      36,
      themeColors.yellow,
      'center',
    );
    const target = 59,
      old = 0,
      amount = step(1, 0.4, 0.78),
      next = old + 0.5 * (target - old) * amount;
    ['approve', 'ask evidence', 'review'].forEach((name, i) => {
      const x = 400 + i * 560;
      rectangle(ctx, api, x - 210, 355, 420, 150, i === 1 ? themeColors.green : themeColors.muted);
      text(ctx, api, name, x, 405, 32, i === 1 ? themeColors.green : themeColors.muted, 'center');
      text(
        ctx,
        api,
        i === 1 ? next.toFixed(1) : 'unchanged',
        x,
        470,
        43,
        i === 1 ? themeColors.green : themeColors.muted,
        'center',
      );
    });
    const map = (x) => 360 + (x / 70) * 1200;
    line(ctx, api, map(0), 745, map(70), 745, themeColors.muted, 4);
    [0, 29.5, 59, 70].forEach((x) => {
      line(ctx, api, map(x), 732, map(x), 758, themeColors.muted);
      text(ctx, api, String(x), map(x), 810, 31, themeColors.muted, 'center');
    });
    line(ctx, api, map(old), 745, map(next), 745, themeColors.green, 12);
    api.circle(ctx, map(next), 745, 15, themeColors.green);
    moveValue(
      ctx,
      api,
      'target 59',
      [map(59), 620],
      [map(29.5), 620],
      amount,
      themeColors.yellow,
      27,
    );
    equation(
      ctx,
      api,
      String.raw`-4+0.9(70)=59\qquad Q\leftarrow0+0.5(59-0)=29.5`,
      960,
      965,
      42,
      themeColors.yellow,
    );
  };
  if (api.focus) api.focus.target('q-learning-construction', body);
  else body();
}
export default {
  id: 'q-learning',
  draw: drawQLearning,
  cues: ['q-learning-voice-1', 'q-learning-voice-2', 'q-learning-voice-3'],
};
