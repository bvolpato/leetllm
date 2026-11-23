import { isolationFixture } from '../arithmetic.mjs';
import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawTreeLeak(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-tree-leak-mechanism', () => {
    const changed = currentBeat === 1 && done(1, 'sd-tree-perturb'),
      f = isolationFixture(changed ? 10000 : 100),
      show = done(0, 'sd-tree-correct') || currentBeat > 0,
      flat = done(0, 'sd-tree-flat') || currentBeat > 0;
    drawConstructionsCenter(ctx, api, 'Query node 2 · change only the off-branch value', 245);
    ['key 0', 'key 1', 'key 2', 'key 3'].forEach((name, i) => {
      const x = 300 + i * 435;
      drawConstructionsBox(
        ctx,
        api,
        name,
        x - 150,
        365,
        300,
        i === 1 ? themeColors.pink : themeColors.blue,
      );
      drawConstructionsText(
        ctx,
        api,
        'score ' + f.scores[i],
        x,
        545,
        30,
        themeColors.muted,
        'center',
      );
      drawConstructionsText(
        ctx,
        api,
        'value ' + f.values[i],
        x,
        615,
        34,
        i === 1 ? themeColors.pink : themeColors.blue,
        'center',
      );
      drawConstructionsText(
        ctx,
        api,
        i === 0 || i === 2 ? 'tree visible' : 'tree blocked',
        x,
        700,
        28,
        i === 0 || i === 2 ? themeColors.cyan : themeColors.muted,
        'center',
      );
      if (currentBeat > 0 || done(0, 'sd-tree-weights'))
        drawConstructionsText(
          ctx,
          api,
          'w tree ' + f.tree.weights[i].toFixed(9),
          x,
          765,
          24,
          themeColors.cyan,
          'center',
        );
      if (currentBeat > 0 || done(0, 'sd-flat-weights'))
        drawConstructionsText(
          ctx,
          api,
          'w flat ' + f.flat.weights[i].toFixed(9),
          x,
          810,
          24,
          themeColors.pink,
          'center',
        );
    });
    const finalFlat = currentBeat === 0 ? flat : done(1, 'sd-tree-perturbed-result');
    drawConstructionsText(
      ctx,
      api,
      show ? 'Tree result ' + f.tree.result.toFixed(3) : 'Tree result pending',
      520,
      875,
      38,
      themeColors.green,
      'center',
    );
    drawConstructionsText(
      ctx,
      api,
      finalFlat
        ? 'Flat-causal result ' + f.flat.result.toFixed(changed ? 2 : 3)
        : 'Flat-causal result pending',
      1420,
      875,
      38,
      themeColors.pink,
      'center',
    );
    drawConstructionsCenter(
      ctx,
      api,
      'Results use unrounded weights · off-branch influence is zero under the tree mask',
      1010,
      themeColors.muted,
      28,
    );
  });
  return;
}
export default {
  id: 'tree-leak',
  draw: drawTreeLeak,
  cues: [
    'sd-tree-leak-b0',
    'sd-tree-correct',
    'sd-tree-flat',
    'sd-tree-weights',
    'sd-flat-weights',
    'sd-tree-leak-b1',
    'sd-tree-perturb',
    'sd-tree-perturbed-result',
  ],
};
