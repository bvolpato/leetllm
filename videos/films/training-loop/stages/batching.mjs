import { epochMean } from '../arithmetic.mjs';
import { card, equation, optionalFocusTarget } from '../defaults.mjs';
export function drawBatching(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) => (beat < i ? 0 : beat > i ? 1 : api.phase(progress, 0.04, 0.96));
  {
    const rowMean = epochMean([0.2, 0.5], [4, 2]),
      equalMean = (0.2 + 0.5) / 2;
    optionalFocusTarget(ctx, api, 'batching-object-batch-a-4-rows-mean-0-20-32', () =>
      card(ctx, api, 'Batch A · 4 rows · mean 0.20', 250, 325, 630, 90, themeColors.blue),
    );
    optionalFocusTarget(ctx, api, 'batching-batch-b', () =>
      card(ctx, api, 'Batch B · 2 rows · mean 0.50', 1040, 325, 630, 90, themeColors.pink),
    );
    ctx.save();
    ctx.globalAlpha *= phaseForBeat(0);
    optionalFocusTarget(ctx, api, 'batching-object-distribution-batching-34', () =>
      teaching.bars({
        x: 360,
        y: 500,
        width: 1200,
        height: 235,
        values: [0.2 * 4, 0.5 * 2],
        labels: ['4 × 0.20', '2 × 0.50'],
        colors: [themeColors.blue, themeColors.pink],
        max: 2,
        progress: 1,
        showValues: true,
        format: (value) => value.toFixed(2),
        fontSize: 31,
        gap: 180,
      }),
    );
    ctx.restore();
    equation(
      ctx,
      api,
      String.raw`L_{\mathrm{rows}}=\frac{4(0.20)+2(0.50)}{6}=${rowMean.toFixed(2)}`,
      960,
      855,
      48,
      themeColors.green,
    );
    optionalFocusTarget(ctx, api, 'batching-object-equal-batch-weighting-36', () =>
      card(
        ctx,
        api,
        `Equal batch weighting · ${equalMean.toFixed(2)}`,
        570,
        905,
        780,
        76,
        themeColors.yellow,
        phaseForBeat(1),
        30,
      ),
    );
  }
}
export default {
  id: 'batching',
  draw: drawBatching,
  cues: [
    'batching-beat-1-focus-1',
    'batching-beat-1-focus-2',
    'batching-beat-2-focus-1',
    'batching-beat-2-focus-2',
  ],
};
