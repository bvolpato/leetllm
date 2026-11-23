import { neuralFrame } from '../construction.mjs';
import { arrow, equation, focusTarget, head, note, pill, transfer } from '../defaults.mjs';
export function drawCollapse(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'collapse-mechanism', () => {
    head(ctx, api, 'Compose the operations on one value');
    const merge = cueProgress('merge-layers', 1),
      show = S('affine-value-input', 0),
      left = 420 + 300 * merge,
      right = 1480 - 300 * merge;
    focusTarget(ctx, api, 'affine-chain', () => {
      pill(ctx, api, '2x + 1', left, 490, 370, themeColors.cyan, 43, 120);
      pill(ctx, api, '3h − 2', right, 490, 370, themeColors.blue, 43, 120);
      if (merge < 0.8) arrow(ctx, api, left + 200, 490, right - 200, 490);
      pill(ctx, api, 'x = 4', 250, 750, 220, themeColors.ink, 35);
      if (show) {
        const phase = cueProgress('affine-value-input', 0);
        if (phase < 0.5)
          transfer(
            ctx,
            api,
            {
              x: 250,
              y: 650,
            },
            {
              x: left,
              y: 650,
            },
            Math.min(1, phase * 2),
            'x = 4',
            themeColors.cyan,
          );
        else {
          pill(ctx, api, 'h = 9', left, 650, 200, themeColors.cyan, 34);
          if (phase < 1)
            transfer(
              ctx,
              api,
              {
                x: left,
                y: 700,
              },
              {
                x: right,
                y: 700,
              },
              (phase - 0.5) * 2,
              'h = 9',
              themeColors.blue,
            );
          else pill(ctx, api, 'y = 25', 1610, 750, 240, themeColors.blue, 35);
        }
      }
    });
    focusTarget(ctx, api, 'merged-rule', () => {
      if (merge > 0) {
        equation(
          ctx,
          api,
          String.raw`3(2x+1)-2\ \longrightarrow\ 6x+1`,
          960,
          820,
          55,
          themeColors.yellow,
        );
        equation(ctx, api, String.raw`W_2W_1x+W_2b_1+b_2`, 960, 950, 43, themeColors.muted);
      } else equation(ctx, api, String.raw`y=3h-2,\quad h=2x+1`, 960, 940, 43, themeColors.muted);
    });
    note(ctx, api, 'The same input and both bias contributions survive the physical merge.');
    return;
  });
}
export default {
  id: 'collapse',
  draw: drawCollapse,
  cues: ['affine-first', 'affine-second', 'affine-example', 'affine-value-input', 'merge-layers'],
};
