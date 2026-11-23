import { rlvrGroupUpdate, vrBound } from '../arithmetic.mjs';
import { drawFooter, drawHeading, drawLine, drawText } from '../defaults.mjs';
export function drawCategoricalStep(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue categorical-step/' + id);
    return q
      ? q.phase === 'before'
        ? 0
        : q.phase === 'after'
          ? 1
          : vrBound(q.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : vrBound((progress - 0.1) / 0.8);
  };
  const operationProgress = (name, beat = currentBeat) =>
      cueProgress('vr-' + name + '-' + 'categorical-step', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'A zero loss value can contain nonzero coordinate derivatives');
    const q = operationProgress('step', 1),
      z = rlvrGroupUpdate([1, 0, 0, 1, 0, 1, 0, 1], 0.1, q);
    z.probabilities.forEach((v, i) => {
      const x = 240 + i * 195,
        base = 770,
        h = v * 2100;
      {
        const color = z.rewards[i] ? themeColors.green : themeColors.pink;
        drawLine(ctx, api, x + 65, 470, x + 65, base - h - 10, themeColors.muted, 1);
        api.rect(ctx, x, base - h, 130, h, themeColors.panel, color, 3);
        drawText(ctx, api, 'R' + (i + 1), x + 65, 830, 27, themeColors.blue, 'center');
        if (operationProgress('gradient', 0) > 0)
          drawText(ctx, api, z.gradient[i].toFixed(3), x + 65, 390, 27, color, 'center');
        if (resultComplete('step', 1))
          drawText(ctx, api, z.logits[i].toFixed(4), x + 65, 450, 26, color, 'center');
        if (resultComplete('mass', 1))
          drawText(ctx, api, v.toFixed(4), x + 65, base - 125, 27, color, 'center');
      }
    });
    if (resultComplete('zero-loss', 0))
      drawText(ctx, api, 'initial loss = 0', 960, 350, 36, themeColors.yellow, 'center');
    if (resultComplete('mass', 1))
      drawText(
        ctx,
        api,
        'rewarded probability ' + z.expectedReward.toFixed(8) + ' · total 1',
        960,
        940,
        32,
        themeColors.green,
        'center',
      );
    drawFooter(
      ctx,
      api,
      'Each bar shows the probability of drawing one of the eight responses.',
    );
  };
  api.focus.target('categorical-step-mechanism', paint);
}
export default {
  id: 'categorical-step',
  draw: drawCategoricalStep,
  cues: [
    'vr-categorical-step-b0',
    'vr-zero-loss-categorical-step',
    'vr-gradient-categorical-step',
    'vr-categorical-step-b1',
    'vr-step-categorical-step',
    'vr-mass-categorical-step',
    'vr-categorical-step-b2',
    'vr-reference-categorical-step',
  ],
};
