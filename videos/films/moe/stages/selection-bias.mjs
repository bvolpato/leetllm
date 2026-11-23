import { fmt, mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { moeSelection } from '../model.mjs';
import {
  arrow,
  mechanismLine,
  mechanismText,
  proportionStrip,
  rectangle,
  tag,
} from '../defaults.mjs';
export function drawSelectionBias(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-selection-bias-mechanism', () => {
    const biased = resultComplete('selection-input'),
      f = moeSelection(undefined, biased ? [0, 0, 0.3] : [0, 0, 0]),
      chosen = resultComplete('selection-ids'),
      weights = resultComplete('selection-weights');
    mechanismText(
      ctx,
      api,
      'Selection and output weighting read different scores',
      960,
      285,
      35,
      themeColors.yellow,
    );
    for (let i = 0; i < 3; i++) {
      const y = 425 + i * 155;
      mechanismText(ctx, api, 'E' + i, 180, y + 20, 35, cols[i]);
      rectangle(ctx, api, 260, y - 25, 600 * f.affinities[i], 65, cols[i]);
      mechanismText(ctx, api, 'affinity ' + f.affinities[i], 480, y + 95, 29, cols[i]);
      if (biased) {
        rectangle(
          ctx,
          api,
          260 + 600 * f.affinities[i],
          y - 25,
          600 * f.bias[i],
          65,
          themeColors.pink,
        );
        mechanismText(
          ctx,
          api,
          'selection score ' + fmt(f.scores[i]),
          1060,
          y - 40,
          32,
          themeColors.pink,
        );
      }
      mechanismLine(ctx, api, 700, y, 1230, y, themeColors.muted, 2);
      if (chosen && f.ids.includes(i)) tag(ctx, api, 'chosen E' + i, 1450, y, 400, cols[i]);
    }
    if (weights) {
      proportionStrip(ctx, api, cols, f.weights, 1130, 865, 560, [
        themeColors.yellow,
        themeColors.blue,
      ]);
      mechanismText(
        ctx,
        api,
        'Original affinities → gates [0.4, 0.6]',
        1390,
        985,
        29,
        themeColors.cyan,
      );
    } else
      mechanismText(
        ctx,
        api,
        'Original affinities stay unchanged in the value branch',
        960,
        965,
        31,
        themeColors.cyan,
      );
    if (currentBeat === 2) {
      arrow(ctx, api, 390, 920, 390, 830, themeColors.pink);
      arrow(ctx, api, 850, 830, 850, 920, themeColors.green);
      mechanismText(
        ctx,
        api,
        'Overloaded: bias ↓ · underloaded: bias ↑',
        960,
        335,
        30,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'selection-bias',
  draw: drawSelectionBias,
  cues: [
    'mo-selection-bias-op-0',
    'mo-selection-bias-op-1',
    'mo-selection-input',
    'mo-selection-ids',
    'mo-selection-weights',
    'mo-selection-bias-op-2',
  ],
};
