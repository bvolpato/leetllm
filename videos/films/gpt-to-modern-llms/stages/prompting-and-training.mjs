import { hidden } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, math, probabilities, text } from '../defaults.mjs';
export function drawPromptingAndTraining(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('prompting-and-training', state);
  {
    if (modelState.beat === 0) {
      card(ctx, api, 'INPUT CONTEXT', 180, 350, 740, 70, themeColors.blue, 27);
      api.focus.target('prompt-demonstration', () =>
        card(ctx, api, 'The guide is stale. → Docs', 180, 460, 740, 95, themeColors.cyan, 29),
      );
      card(
        ctx,
        api,
        'The page names an old button. → Label:',
        180,
        610,
        740,
        110,
        themeColors.yellow,
        26,
      );
      api.focus.target('fixed-model-weights', () =>
        card(
          ctx,
          api,
          'Model weights · fixed for this forward pass',
          1040,
          490,
          670,
          145,
          themeColors.green,
          28,
        ),
      );
      text(
        ctx,
        api,
        'Demonstrations become part of the input',
        960,
        940,
        30,
        themeColors.cyan,
        'center',
      );
    } else {
      const learned = modelState.learned;
      text(
        ctx,
        api,
        'Gradient descent on the supplied label target · Docs',
        960,
        315,
        28,
        themeColors.muted,
        'center',
      );
      card(ctx, api, `Update ${learned.step}/12`, 180, 400, 350, 80, themeColors.yellow, 29);
      api.focus.target('trained-label-weights', () =>
        card(
          ctx,
          api,
          `Docs weights\n[${learned.weights[0].map((x) => x.toFixed(2)).join(', ')}]`,
          180,
          540,
          350,
          140,
          themeColors.blue,
          27,
        ),
      );
      api.focus.target('learned-probabilities', () => probabilities(ctx, api, learned, 430));
      text(
        ctx,
        api,
        `Docs score ${learned.logits[0].toFixed(2)} · target probability ${learned.probabilities[0].toFixed(3)}`,
        960,
        920,
        29,
        themeColors.green,
        'center',
      );
      math(
        ctx,
        api,
        `L=-\\log p_{\\rm Docs}=${(-Math.log(learned.probabilities[0])).toFixed(2)}`,
        960,
        1000,
        32,
        themeColors.yellow,
      );
      const nextDelta = hidden.map((value) => 0.7 * (1 - learned.probabilities[0]) * value);
      text(
        ctx,
        api,
        `Target error: 1 − p = ${(1 - learned.probabilities[0]).toFixed(3)}`,
        400,
        775,
        27,
        themeColors.yellow,
        'center',
      );
      math(
        ctx,
        api,
        `\\Delta w_{next}=[${nextDelta.map((v) => v.toFixed(3)).join(',')}]`,
        400,
        845,
        29,
        themeColors.green,
      );
    }
  }
}
export default {
  id: 'prompting-and-training',
  draw: drawPromptingAndTraining,
  cues: ['fixed-model', 'update-rows', 'training-loss'],
};
