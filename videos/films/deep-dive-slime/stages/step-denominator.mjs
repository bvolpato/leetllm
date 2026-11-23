import { sum } from '../arithmetic.mjs';
import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeNote,
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTile,
  drawSlimeTitle,
} from '../defaults.mjs';
export function drawStepDenominator(ctx, scene, state, api) {
  return api.focus.target('sl-step-denominator-mechanism', () =>
    paintStepDenominator(ctx, scene, state, api),
  );
}
function paintStepDenominator(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('step-denominator', state, scene),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    const failedLocal = currentBeat === 1 && modelState.wrongReady;
    const perToken = currentBeat === 2;
    drawSlimeTitle(
      ctx,
      api,
      perToken
        ? 'Per-token mode adds the selected terms'
        : failedLocal
          ? 'Failure: each microbatch divides by its own local count'
          : 'The denominator belongs to the complete rollout',
    );
    const split = modelState.split,
      rowY = [420, 640];
    drawSlimeText(ctx, api, 'microbatch A', 140, 470, 29, themeColors.blue);
    drawSlimeText(ctx, api, 'microbatch B', 140, 690, 29, themeColors.pink);
    modelState.terms.forEach((value, i) => {
      const inFirst = i < split,
        y = rowY[inFirst ? 0 : 1],
        x = 450 + i * 300;
      drawSlimeTile(
        ctx,
        api,
        `term ${i + 1} · ${value}`,
        x,
        y,
        245,
        inFirst ? themeColors.blue : themeColors.pink,
        90,
        31,
      );
      drawSlimeText(
        ctx,
        api,
        perToken ? String(value) : `${value} / ${failedLocal ? (inFirst ? split : 4 - split) : 4}`,
        x + 122,
        y + 137,
        32,
        failedLocal ? themeColors.pink : inFirst ? themeColors.blue : themeColors.pink,
        'center',
      );
    });
    drawSlimeTile(
      ctx,
      api,
      perToken ? 'masked sum' : failedLocal ? 'local counts: 1 and 3' : 'shared D = 4',
      750,
      330,
      470,
      failedLocal ? themeColors.pink : themeColors.yellow,
      65,
      31,
    );
    const partials = modelState.parts.map((a) => sum(a) / 4);
    drawSlimeRule(
      ctx,
      api,
      perToken
        ? modelState.rawReady
          ? `${modelState.terms.join(' + ')} = ${sum(modelState.terms)}`
          : 'Add the terms across both microbatches.'
        : modelState.wrongReady && currentBeat === 1
          ? 'Separate local means at 1 + 3: 1 + 5 = 6 · wrong objective'
          : modelState.resultReady
            ? `${partials[0]} + ${partials[1]} = 4${modelState.derivativeReady ? ' · each term derivative = ¼' : ''}`
            : 'Move the partition; retain each term and its shared denominator',
      935,
      modelState.wrongReady && currentBeat === 1 ? themeColors.pink : themeColors.cyan,
      31,
    );
    drawSlimeNote(
      ctx,
      api,
      perToken
        ? 'The training loop applies the configured normalization.'
        : 'Each sibling uses the count for the whole rollout.',
    );
    return;
  }
}
export default {
  id: 'step-denominator',
  draw: drawStepDenominator,
  cues: [
    'sl-step-denominator-b0-operation',
    'sl-step-denominator-b0-s0',
    'sl-step-denominator-b0-s1',
    'sl-step-denominator-b0-s2',
    'sl-step-denominator-b0-s3',
    'sl-step-denominator-b1-operation',
    'sl-step-denominator-b1-s0',
    'sl-step-denominator-b1-s1',
    'sl-step-denominator-b1-s2',
    'sl-step-denominator-b1-s3',
    'sl-step-denominator-b2-operation',
    'sl-step-denominator-b2-s0',
    'sl-step-denominator-b2-s1',
    'sl-step-denominator-b2-s2',
    'sl-step-denominator-b2-s3',
  ],
};
