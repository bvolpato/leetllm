import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, ease } from '../construction.mjs';
import {
  instructionCell,
  instructionF,
  instructionFoot,
  instructionLine,
  instructionRow,
  instructionSumBar,
  instructionT,
} from '../defaults.mjs';
export function drawSyntheticMethods(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['synthetic-methods'] ?? [], () =>
    instructionF(ctx, api, 'synthetic-methods-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat === 0) {
      instructionT(
        ctx,
        api,
        'Self-Instruct · 175 human seed tasks',
        180,
        315,
        36,
        themeColors.blue,
      );
      for (let i = 0; i < 175; i++)
        api.rect(ctx, 180 + (i % 25) * 35, 400 + Math.floor(i / 25) * 35, 26, 26, themeColors.blue);
      instructionT(ctx, api, 'generated task / instance', 1230, 470, 33, themeColors.green);
      instructionLine(ctx, api, 1100, 490, 1180, 490, themeColors.green, 4);
      instructionF(ctx, api, 'im-similarity', () => {
        const p = cueProgress2('im-similarity');
        instructionT(ctx, api, 'ROUGE-L similarity screen', 180, 780, 35, themeColors.yellow);
        instructionSumBar(ctx, api, [0.7 * p], 180, 840, {
          width: 1000,
          max: 1,
          colors: [themeColors.yellow],
        });
        instructionT(ctx, api, 'similarity ≠ source support', 1280, 870, 32, themeColors.pink);
      });
    } else if (beat === 1) {
      instructionT(ctx, api, 'One seed: explain a policy', 180, 320, 36, themeColors.blue);
      instructionF(ctx, api, 'im-evolve', () => {
        const p = cueProgress2('im-evolve', 1);
        instructionRow(ctx, api, ['add constraint', 'deeper reasoning', 'broader task'], 180, 440, {
          step: 535,
          w: 500,
          size: 32,
          color: p > 0 ? themeColors.yellow : themeColors.muted,
        });
      });
      instructionF(ctx, api, 'im-simulated-turns', () => {
        const n = Math.floor(cueProgress2('im-simulated-turns', 1) * 4);
        for (let i = 0; i < n; i++) {
          instructionCell(
            ctx,
            api,
            i % 2 ? 'A' : 'U',
            260 + i * 360,
            680,
            75,
            75,
            i % 2 ? themeColors.green : themeColors.blue,
            34,
          );
          instructionT(
            ctx,
            api,
            i % 2 ? 'simulated answer' : 'simulated question',
            260 + i * 360,
            850,
            28,
            themeColors.muted,
          );
        }
      });
    } else {
      instructionT(ctx, api, 'Generated code owner C1', 180, 320, 36, themeColors.blue);
      instructionF(ctx, api, 'im-runner', () => {
        const p = cueProgress2('im-runner', 2);
        instructionLine(ctx, api, 1010, 390, 1720, 390, themeColors.yellow, 2);
        instructionLine(ctx, api, 1720, 390, 1720, 770, themeColors.yellow, 2);
        instructionLine(ctx, api, 1720, 770, 1010, 770, themeColors.yellow, 2);
        instructionLine(ctx, api, 1010, 390, 1010, 505, themeColors.yellow, 2);
        instructionLine(ctx, api, 1010, 635, 1010, 770, themeColors.yellow, 2);
        instructionT(ctx, api, 'isolated runner', 1365, 450, 36, themeColors.yellow, 'center');
        instructionCell(
          ctx,
          api,
          'code C1',
          180 + 980 * ease(p),
          525,
          410,
          90,
          themeColors.blue,
          38,
        );
        instructionT(
          ctx,
          api,
          p === 1 ? 'checked case passes' : 'case result pending',
          1365,
          710,
          31,
          p === 1 ? themeColors.green : themeColors.muted,
          'center',
        );
        instructionT(
          ctx,
          api,
          'Uncovered cases, timeout or flakiness → source review',
          180,
          885,
          34,
          themeColors.pink,
        );
      });
    }
    instructionFoot(
      ctx,
      api,
      'Version source evidence, generator prompt, gates and accepted rows together',
    );
  }
}
export default {
  id: 'synthetic-methods',
  draw: drawSyntheticMethods,
  cues: [
    'synthetic-methods-b1',
    'im-similarity',
    'synthetic-methods-b2',
    'im-evolve',
    'im-simulated-turns',
    'synthetic-methods-b3',
    'im-runner',
  ],
};
