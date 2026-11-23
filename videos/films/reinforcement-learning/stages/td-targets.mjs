import { line, ownedState, rectangle, text } from '../defaults.mjs';
export function drawTdTargets(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const body = () => {
    if (currentBeat === 0) {
      text(
        ctx,
        api,
        'One sampled episode · estimate the tail or wait for it',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      line(ctx, api, 580, 535, 1330, 535, themeColors.muted, 4);
      [-4, 70].forEach((r, i) =>
        ownedState(
          ctx,
          api,
          String(r),
          480 + i * 950,
          535,
          i ? themeColors.green : themeColors.pink,
          i ? 'completed reward' : 'observed reward',
        ),
      );
      text(ctx, api, 'MC: completed return 59', 490, 820, 40, themeColors.green, 'center');
      text(ctx, api, 'TD: −4 + 0.9 V(next)', 1430, 820, 40, themeColors.yellow, 'center');
    } else if (currentBeat === 1) {
      text(
        ctx,
        api,
        'Same sample, different next-action ownership',
        960,
        290,
        37,
        themeColors.yellow,
        'center',
      );
      ownedState(ctx, api, '−4', 270, 530, themeColors.pink, 'sample reward');
      ownedState(ctx, api, '70', 960, 400, themeColors.green, 'greedy next action');
      ownedState(ctx, api, '62', 960, 750, themeColors.cyan, 'behavior next action');
      line(ctx, api, 340, 515, 880, 420, themeColors.green, 5);
      line(ctx, api, 340, 550, 880, 730, themeColors.cyan, 5);
      text(ctx, api, 'Q-learning target 59', 1580, 425, 39, themeColors.green, 'center');
      text(ctx, api, 'SARSA target 51.8', 1580, 775, 39, themeColors.cyan, 'center');
    } else {
      text(
        ctx,
        api,
        'The collector stopped; did the task end?',
        960,
        290,
        39,
        themeColors.yellow,
        'center',
      );
      [false, true].forEach((terminal, i) => {
        const x = 490 + i * 930;
        rectangle(
          ctx,
          api,
          x - 300,
          390,
          600,
          360,
          terminal ? themeColors.pink : themeColors.green,
        );
        text(
          ctx,
          api,
          terminal ? 'terminal outcome' : 'external time limit',
          x,
          455,
          34,
          terminal ? themeColors.pink : themeColors.green,
          'center',
        );
        text(ctx, api, 'reward −18 · next estimate 80', x, 545, 30, themeColors.muted, 'center');
        text(
          ctx,
          api,
          terminal ? 'target −18' : 'target 54',
          x,
          665,
          64,
          terminal ? themeColors.pink : themeColors.green,
          'center',
        );
      });
      text(
        ctx,
        api,
        'Bootstrap from the actual final observation; mask genuine termination',
        960,
        965,
        33,
        themeColors.yellow,
        'center',
      );
    }
  };
  if (api.focus) api.focus.target('td-targets-construction', body);
  else body();
}
export default {
  id: 'td-targets',
  draw: drawTdTargets,
  cues: ['td-targets-voice-1', 'td-targets-voice-2', 'td-targets-voice-3'],
};
