import { REQUESTS, REQUEST_IDS, TARGETS } from '../fixtures.mjs';
import { backward } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  arrow,
  axes,
  dot,
  focusTarget,
  formatNumber,
  head,
  note,
  pill,
  text,
} from '../defaults.mjs';
export function drawSavedValues(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'saved-values-mechanism', () => {
    head(
      ctx,
      api,
      currentBeat === 0
        ? 'Sum the four actual saved-hidden products'
        : 'Checkpoint worksheet: x=[1,4], original parameter version',
    );
    const rows = [
      {
        x: [1, 4],
        h: [0, 2.5],
        delta: backward([1, 4], 1).dz2,
      },
    ];
    if (currentBeat === 0) {
      const progress = cueProgress('saved-values-beat-0', 0),
        terms = REQUESTS.map((x, i) => {
          const row = backward(x, TARGETS[i]);
          return {
            id: 'saved-row-' + i,
            label: REQUEST_IDS[i] + ' · saved H',
            weight: row.dz2 / 4,
            values: row.h,
            color: row.dz2 < 0 ? themeColors.blue : themeColors.cyan,
          };
        }),
        plot = axes(ctx, api, {
          x: 1030,
          y: 350,
          width: 560,
          height: 560,
          xDomain: [-0.45, 0.45],
          yDomain: [-0.45, 0.45],
          xTicks: [-0.4, -0.2, 0, 0.2, 0.4],
          yTicks: [-0.4, -0.2, 0, 0.2, 0.4],
          xLabel: 'first output-weight gradient',
          yLabel: 'second output-weight gradient',
          fontSize: 23,
        });
      api.teaching.vectorAccumulation({
        terms,
        initial: [0, 0],
        progress,
        plot,
        projection: {
          label: 'the two output-weight owners',
          point: (v) => v,
        },
        ledger: {
          x: 200,
          y: 350,
          width: 640,
          height: 560,
        },
        fontSize: 25,
        format: (v) => formatNumber(ctx, api, v, 4),
        revealTotal: progress === 1,
        totalLabel: 'mean BCE ∇W₂',
        totalTarget: 'saved-output-gradient',
        color: themeColors.yellow,
      });
    } else {
      const discard = S('checkpoint-discard', 1),
        recompute = cueProgress('checkpoint-recompute', 1);
      pill(ctx, api, 'retain x + parameter version', 410, 420, 650, themeColors.ink, 33);
      pill(
        ctx,
        api,
        discard && recompute < 1 ? 'H omitted' : 'H = [0,2.5]',
        1310,
        420,
        650,
        discard && recompute < 1 ? themeColors.muted : themeColors.cyan,
        34,
      );
      arrow(ctx, api, 770, 420, 950, 420);
      if (recompute > 0) {
        arrow(ctx, api, 410, 545, 1310, 545, themeColors.muted, 2);
        if (recompute < 1) dot(ctx, api, 410 + 900 * recompute, 545, themeColors.yellow, 9);
        text(ctx, api, 'forward again', 960, 620, 31, themeColors.yellow, 'center');
        text(
          ctx,
          api,
          'same inputs · same weights · same stochastic state',
          960,
          710,
          32,
          themeColors.yellow,
          'center',
        );
        pill(ctx, api, 'gradient operands restored', 1310, 835, 650, themeColors.green, 33);
      } else
        text(ctx, api, 'less saved activation storage', 960, 750, 36, themeColors.cyan, 'center');
      if (currentBeat === 2) {
        text(
          ctx,
          api,
          'weights + gradients + optimizer state remain',
          960,
          935,
          33,
          themeColors.pink,
          'center',
        );
      }
    }
    note(
      ctx,
      api,
      currentBeat === 0
        ? 'δᵢ=(pᵢ−yᵢ)/4 · saved H, original X and the active masks remain actual gradient operands.'
        : 'Matching recomputation exchanges extra execution for fewer stored intermediate activations.',
    );
    return;
  });
}
export default {
  id: 'saved-values',
  draw: drawSavedValues,
  cues: [
    'saved-values-beat-0',
    'saved-values-beat-1',
    'checkpoint-discard',
    'checkpoint-recompute',
    'saved-values-beat-2',
  ],
};
