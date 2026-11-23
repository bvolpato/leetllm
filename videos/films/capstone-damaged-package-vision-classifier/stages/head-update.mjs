import { visionFrame } from '../model.mjs';
import { visionNote, visionText, visionValue } from '../defaults.mjs';
export function drawHeadUpdate(ctx, scene, state, api) {
  const frameState = visionFrame('head-update', state);
  return api.focus.target('dv-head-update-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after,
      h = frameState.head;
    {
      visionText(
        ctx,
        api,
        'Same input [2, −1] · target 1 · learning rate .1',
        960,
        295,
        35,
        themeColors.ink,
        'center',
      );
      const showGradient = resultComplete('logit-gradient', 0),
        showParams = resultComplete('parameter-gradients', 0),
        updated = resultComplete('parameter-update', 1),
        prediction = resultComplete('updated-prediction', 1);
      visionValue(
        ctx,
        api,
        'p − y',
        h.logitGradient.toFixed(4),
        190,
        375,
        showGradient,
        themeColors.pink,
      );
      h.gradients.forEach((g, i) =>
        visionValue(
          ctx,
          api,
          '∂L / ∂w' + (i + 1),
          g.toFixed(4),
          730 + i * 510,
          375,
          showParams,
          themeColors.pink,
        ),
      );
      const rows = [
        ['w₁', h.weights[0], h.gradients[0], h.nextWeights[0]],
        ['w₂', h.weights[1], h.gradients[1], h.nextWeights[1]],
        ['bias', h.bias, h.logitGradient, h.nextBias],
      ];
      rows.forEach(([name, old, g, next], i) => {
        const y = 570 + i * 90;
        visionText(ctx, api, name, 190, y + 36, 29, themeColors.muted);
        visionText(ctx, api, old.toFixed(4), 380, y + 36, 32, themeColors.yellow);
        visionText(
          ctx,
          api,
          showParams ? '− .1 × (' + g.toFixed(4) + ')' : '− rate × gradient',
          670,
          y + 36,
          29,
          themeColors.ink,
        );
        api.arrow(ctx, 1110, y + 25, 1320, y + 25, themeColors.cyan, 3);
        visionText(
          ctx,
          api,
          updated ? next.toFixed(4) : 'pending',
          1480,
          y + 36,
          35,
          updated ? themeColors.cyan : themeColors.muted,
          'center',
        );
      });
      if (currentBeat > 0)
        visionText(
          ctx,
          api,
          prediction
            ? `z ${h.nextLogit.toFixed(4)}   p ${h.nextProbability.toFixed(4)}   loss ${h.nextLoss.toFixed(4)}`
            : 'Recompute with the unchanged features',
          960,
          912,
          35,
          prediction ? themeColors.green : themeColors.muted,
          'center',
        );
      visionNote(
        ctx,
        api,
        currentBeat === 2
          ? 'Lower training loss on one positive example establishes no held-out damage recall.'
          : 'Subtract the signed gradient. Both features, both weights, and the bias remain visible.',
      );
    }
  });
}
export default {
  id: 'head-update',
  draw: drawHeadUpdate,
  cues: [
    'dv-head-update-0',
    'dv-head-update-operation-0',
    'dv-logit-gradient',
    'dv-parameter-gradients',
    'dv-head-update-1',
    'dv-head-update-operation-1',
    'dv-parameter-update',
    'dv-updated-prediction',
    'dv-head-update-2',
    'dv-head-update-operation-2',
  ],
};
