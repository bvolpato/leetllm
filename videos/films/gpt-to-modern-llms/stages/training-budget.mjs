import { sampleModel } from '../construction.mjs';
import { card, math, text } from '../defaults.mjs';
export function drawTrainingBudget(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('training-budget', state);
  {
    const baseline = modelState.allocation;
    const doubled =
      modelState.beat === 2 &&
      api.focus.progress('fixed-compute-budget-b3-1', modelState.p >= 0.36 ? 1 : 0) >= 1;
    const side = doubled ? 16 : 8;
    const a =
      modelState.beat === 2
        ? {
            parameters: side,
            trainingTokens: side,
            compute: 6 * side * side,
          }
        : baseline;
    api.focus.target('allocation-context', () =>
      text(
        ctx,
        api,
        modelState.beat === 2
          ? 'Starting allocation  ·  8 × 8'
          : 'Toy allocation units · approximate dense training work',
        960,
        305,
        27,
        themeColors.muted,
        'center',
      ),
    );
    api.focus.target('parameter-allocation', () =>
      card(ctx, api, `Parameters N = ${a.parameters}`, 200, 380, 650, 82, themeColors.blue, 30),
    );
    api.focus.target('token-allocation', () =>
      card(
        ctx,
        api,
        `Training tokens D = ${a.trainingTokens}`,
        1070,
        380,
        650,
        82,
        themeColors.green,
        30,
      ),
    );
    const blocks = (count, x, color) => {
      for (let i = 0; i < 16; i++)
        api.focus.target('allocation-block-' + x + '-' + i, () =>
          api.rect(
            ctx,
            x + (i % 4) * 126,
            520 + Math.floor(i / 4) * 62,
            110,
            46,
            i < count ? color : themeColors.panel,
            themeColors.muted,
            1,
          ),
        );
    };
    blocks(a.parameters, 275, themeColors.blue);
    blocks(a.trainingTokens, 1145, themeColors.green);
    api.focus.target('fixed-compute-budget', () =>
      math(
        ctx,
        api,
        String.raw`C\approx6ND=6\times${a.parameters}\times${a.trainingTokens}=${a.compute}`,
        960,
        875,
        42,
      ),
    );
  }
}
export default {
  id: 'training-budget',
  draw: drawTrainingBudget,
  cues: [
    'fixed-compute-budget-b1-1',
    'parameter-allocation-b2-1',
    'token-allocation-b2-2',
    'double-again',
    'fixed-compute-budget-b3-1',
  ],
};
