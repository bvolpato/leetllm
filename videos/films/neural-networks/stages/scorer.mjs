import { sigmoid } from '../arithmetic.mjs';
import { neuralFrame } from '../construction.mjs';
import { axes, equation, focusTarget, formatNumber, head, note, text } from '../defaults.mjs';
export function drawScorer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'scorer-mechanism', () => {
    head(ctx, api, 'Prompt size 6     •     Queue wait 8');
    const terms = [
        {
          id: 'prompt-product',
          label: 'prompt 6 × 0.7',
          weight: 0.7,
          values: [6],
          color: themeColors.cyan,
        },
        {
          id: 'queue-product',
          label: 'queue 8 × 0.3',
          weight: 0.3,
          values: [8],
          color: themeColors.blue,
        },
        {
          id: 'bias-product',
          label: 'bias −4',
          weight: 1,
          values: [-4],
          color: themeColors.pink,
        },
      ],
      progress =
        currentBeat === 0
          ? (2 / 3) * cueProgress('weighted-features', 0)
          : currentBeat === 1
            ? 2 / 3 + cueProgress('shift-baseline', 1) / 3
            : 1;
    focusTarget(ctx, api, 'weighted-sum', () => {
      const range = (7.7 * 310) / 850,
        plot = axes(ctx, api, {
          x: 240,
          y: 490,
          width: 850,
          height: 310,
          xDomain: [-0.5, 7.2],
          yDomain: [-range / 2, range / 2],
          xTicks: [0, 2, 4, 6],
          yTicks: [],
          xLabel: 'signed contribution to the logit',
        });
      api.teaching.vectorAccumulation({
        terms,
        initial: [0],
        progress,
        plot,
        projection: {
          label: 'one scalar axis',
          point: (v) => [v[0], 0],
        },
        ledger: {
          x: 1190,
          y: 355,
          width: 580,
          height: 460,
        },
        fontSize: 28,
        format: (v) => formatNumber(ctx, api, v),
        revealTotal: currentBeat > 0 || cueProgress('weighted-features', 0) === 1,
        totalLabel: progress === 1 ? 'logit' : 'running sum',
        totalTarget: 'bias-shift',
        color: themeColors.yellow,
      });
    });
    focusTarget(ctx, api, 'bounded-score', () => {
      if (currentBeat === 2) {
        equation(
          ctx,
          api,
          String.raw`\sigma(z)=\frac{1}{1+e^{-z}}`,
          1510,
          900,
          44,
          themeColors.green,
        );
        if (resultComplete('timeout-score', 2))
          text(
            ctx,
            api,
            'z 2.6 → score ' + formatNumber(ctx, api, sigmoid(2.6)),
            1510,
            960,
            33,
            themeColors.green,
            'center',
          );
      } else equation(ctx, api, String.raw`z=w^\top x+b`, 960, 930, 45, themeColors.ink);
    });
    if (currentBeat < 2) note(ctx, api, 'Example weights for this request scorer');
    return;
  });
}
export default {
  id: 'scorer',
  draw: drawScorer,
  cues: ['weighted-features', 'shift-baseline', 'sigmoid-score', 'timeout-score'],
};
