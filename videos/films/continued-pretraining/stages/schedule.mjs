import { bounded } from '../arithmetic.mjs';
import { controlledSgd, learningRate } from '../model.mjs';
import {
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionText,
} from '../defaults.mjs';
export function drawSchedule(ctx, scene, state, api) {
  const supported = new Set([
    'schedule',
    'replay',
    'intro',
    'incident-controls',
    'prompt-gradient',
    'scored-objective',
    'fertility-cost',
    'vocabulary-shapes',
    'vocabulary-denominator',
    'grouped-holdout',
    'manifest-gate',
    'normalized-overlap',
    'packed-remainder',
    'optimizer-restart',
    'exact-schedule',
    'dapt-tapt',
    'fixed-budget',
    'target-weighting',
    'byte-normalization',
    'corpus-reduction',
    'retained-outcomes',
    'select',
    'selection-and-stopping',
    'objective-and-parameters',
    'earned-adaptation',
  ]);
  if (!supported.has('schedule')) return;
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id)) throw Error('Undeclared cue schedule/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : bounded(cue.progress)
      : state.beat < beat
        ? 0
        : state.beat > beat
          ? 1
          : bounded((progress - 0.12) / 0.76);
  };
  const construct = () => {
    const step = currentBeat === 0 ? 1 : currentBeat === 1 ? Math.round(2 + 9 * progress) : 11,
      rate = learningRate(step),
      v = controlledSgd(rate, -0.5);
    drawExtensionHeading(ctx, api, 'Authored display units · same controlled gradient');
    drawExtensionF(ctx, api, 'learning-rate-curve', () => {
      const plot = teaching.axes({
        x: 270,
        y: 375,
        width: 1380,
        height: 275,
        xDomain: [0, 11],
        yDomain: [0, 3.5],
        xTicks: [0, 2, 4, 6, 8, 10],
        yTicks: [0, 1, 2, 3],
        xLabel: 'training step',
        yLabel: 'learning rate / authored units',
      });
      teaching.curve({
        plot,
        points: Array.from(
          {
            length: 12,
          },
          (_, x) => ({
            x,
            y: learningRate(x),
          }),
        ),
        color: themeColors.cyan,
        width: 5,
        progress: currentBeat === 0 ? cueProgress('schedule-b1-1', 0) : 1,
      });
      teaching.scatter({
        plot,
        points: [
          {
            x: step,
            y: rate,
            color: themeColors.yellow,
            radius: 10,
          },
        ],
      });
    });
    drawExtensionF(ctx, api, 'schedule-position', () => {
      drawExtensionText(
        ctx,
        api,
        'Supplied control: θ₀=0, g=−0.5, η=' + rate.toFixed(3),
        180,
        755,
        30,
        themeColors.muted,
      );
      drawExtensionLine(ctx, api, 350, 825, 1570, 825, themeColors.muted, 3);
      api.circle(ctx, 350, 825, 8, themeColors.muted);
      api.circle(ctx, 350 + (v.theta / 1.6) * 1220, 825, 12, themeColors.yellow);
      drawExtensionText(ctx, api, '0', 350, 885, 25, themeColors.muted);
      drawExtensionText(ctx, api, '1.6', 1570, 885, 25, themeColors.muted, 'right');
      drawExtensionText(
        ctx,
        api,
        'Δθ=−ηg=' + v.delta.toFixed(3),
        960,
        795,
        32,
        themeColors.yellow,
        'center',
      );
      drawExtensionText(
        ctx,
        api,
        'reef p=' +
          v.probabilities[0].toFixed(3) +
          ' · domain NLL=' +
          v.domainLoss.toFixed(3) +
          ' · broad NLL=' +
          v.broadLoss.toFixed(3),
        960,
        955,
        31,
        themeColors.cyan,
        'center',
      );
    });
    drawExtensionFoot(
      ctx,
      api,
      'The supplied one-logit SGD control illustrates rate × gradient; these display units are not the article’s real-valued rates.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('schedule-construction')),
    )
  )
    drawExtensionF(ctx, api, 'schedule-construction', construct);
  else construct();
  return;
}
export default {
  id: 'schedule',
  draw: drawSchedule,
  cues: ['schedule-b1-1', 'schedule-b2-1', 'schedule-b3-1'],
};
