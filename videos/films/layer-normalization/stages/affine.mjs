import { mean } from '../arithmetic.mjs';
import { affineState } from '../model.mjs';
import { equation, featureChart, text } from '../defaults.mjs';
export function drawAffine(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    fade = components.fade;
  {
    const { gain, bias, values } = affineState(state);
    api.focus.target('affine-feature-pattern', () =>
      featureChart(ctx, api, values, themeColors.pink),
    );
    api.focus.target('learned-affine-rule', () =>
      equation(
        ctx,
        api,
        String.raw`y=\gamma\odot\hat x+\beta`,
        1500,
        430,
        50,
        themeColors.pink,
        'center',
      ),
    );
    api.focus.target('first-feature-gain', () =>
      text(ctx, api, `first gain ${gain.toFixed(2)}`, 1500, 585, 36, themeColors.yellow, 'center'),
    );
    api.focus.target('last-feature-bias', () =>
      text(ctx, api, `last shift ${bias.toFixed(2)}`, 1500, 710, 36, themeColors.yellow, 'center'),
    );
    text(
      ctx,
      api,
      `output mean ≈ ${mean(values).toFixed(3)}`,
      960,
      945,
      38,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'affine',
  draw: drawAffine,
  cues: [
    'affine-learned-affine-rule-b1-1',
    'affine-first-feature-gain-b2-1',
    'affine-last-feature-bias-b2-2',
  ],
};
