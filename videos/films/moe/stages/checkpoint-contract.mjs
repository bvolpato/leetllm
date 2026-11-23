import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import {
  footer,
  mechanismMath,
  mechanismText,
  proportionStrip,
  rectangle,
  tag,
  tiles,
} from '../defaults.mjs';
export function drawCheckpointContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    Q = (id) => moeCue(state, id, 'settle'),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-checkpoint-contract-mechanism', () => {
    if (currentBeat === 0) {
      mechanismText(
        ctx,
        api,
        'GLM-5.3 · dated article configuration',
        960,
        285,
        35,
        themeColors.yellow,
      );
      for (let i = 0; i < 78; i++)
        rectangle(
          ctx,
          api,
          180 + (i % 26) * 60,
          365 + Math.floor(i / 26) * 65,
          42,
          45,
          i < 3 ? themeColors.cyan : themeColors.panel,
          i < 3 ? themeColors.cyan : themeColors.blue,
        );
      mechanismText(ctx, api, '3 dense FFNs → 75 MoE layers', 960, 620, 33, themeColors.blue);
      tiles(ctx, api, 256, 200, 700, themeColors.panel, 32, 38, 28, 17);
      const split = Array(8).fill(1 / 8);
      proportionStrip(ctx, api, cols, split, 700, 700, 360);
      mechanismText(
        ctx,
        api,
        'Eight equal illustrative selected gates · total 1',
        1170,
        655,
        28,
        themeColors.blue,
      );
      if (resultComplete('checkpoint-scale')) {
        proportionStrip(
          ctx,
          api,
          cols,
          split.map((x) => x * 2.5),
          700,
          855,
          360 + 540 * Q('checkpoint-scale'),
        );
        if (Q('checkpoint-scale') === 1)
          mechanismText(
            ctx,
            api,
            'Same scale: normalized total 1 → routed total 2.5',
            1140,
            975,
            30,
            themeColors.yellow,
          );
      }
    } else {
      mechanismText(
        ctx,
        api,
        'DeepSeek-V4-Flash-0731 · exact checkpoint contract',
        960,
        285,
        33,
        themeColors.yellow,
      );
      for (let i = 0; i < 43; i++) {
        const x = 190 + (i % 22) * 70,
          y = 405 + Math.floor(i / 22) * 95;
        rectangle(
          ctx,
          api,
          x,
          y,
          50,
          65,
          i < 3 ? themeColors.yellow : themeColors.panel,
          i < 3 ? themeColors.yellow : themeColors.blue,
        );
      }
      mechanismText(ctx, api, '43 MoE blocks', 960, 650, 33, themeColors.blue);
      if (resultComplete('checkpoint-hash'))
        tag(ctx, api, 'token ID → hash → first 3 blocks', 570, 790, 740, themeColors.yellow);
      if (resultComplete('checkpoint-affinity'))
        mechanismMath(
          ctx,
          api,
          String.raw`s_i=\sqrt{\operatorname{softplus}(z_i)}`,
          1390,
          805,
          40,
          themeColors.cyan,
        );
      if (currentBeat === 2)
        mechanismText(
          ctx,
          api,
          'Core headline ≠ extra prediction modules or hybrid state',
          960,
          955,
          31,
          themeColors.pink,
        );
    }
    footer(
      ctx,
      api,
      'Source snapshot and exact checkpoint define selected, shared, scaling and state contracts.',
    );
  });
}
export default {
  id: 'checkpoint-contract',
  draw: drawCheckpointContract,
  cues: [
    'mo-checkpoint-contract-op-0',
    'mo-checkpoint-scale',
    'mo-checkpoint-contract-op-1',
    'mo-checkpoint-hash',
    'mo-checkpoint-affinity',
    'mo-checkpoint-contract-op-2',
  ],
};
