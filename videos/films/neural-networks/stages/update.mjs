import { gradientStep, parameterVector } from '../arithmetic.mjs';
import { PARAMETERS } from '../fixtures.mjs';
import { batchGradient } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import { focusTarget, formatNumber, head, network, note, text } from '../defaults.mjs';
export function drawUpdate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'update-mechanism', () => {
    const g = batchGradient(),
      p = cueProgress('all-parameter-step', 1),
      next = gradientStep(PARAMETERS, g, 0.1 * p);
    head(ctx, api, 'Average the four request gradients, then update each actual owner');
    network(ctx, api, 'update', next, {
      x: [2, 5],
      gradient: g,
      gradientVisible: () => true,
    });
    focusTarget(ctx, api, 'batch-loss', () => {
      text(
        ctx,
        api,
        'mean BCE ' +
          formatNumber(ctx, api, g.loss, 4) +
          ' → ' +
          formatNumber(ctx, api, batchGradient(next).loss, 4),
        960,
        1000,
        37,
        themeColors.green,
        'center',
      );
    });
    if (currentBeat === 1) {
      const values = parameterVector(PARAMETERS),
        now = parameterVector(next);
    }
    note(
      ctx,
      api,
      'Every displayed ∇ stays beside its owner; this loss decrease is on the same batch.',
    );
    return;
  });
}
export default {
  id: 'update',
  draw: drawUpdate,
  cues: ['batch-gradient', 'all-parameter-step'],
};
