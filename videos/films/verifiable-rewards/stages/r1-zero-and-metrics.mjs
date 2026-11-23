import { vrBound } from '../arithmetic.mjs';
import { drawFooter, drawHeading, drawLine, drawText } from '../defaults.mjs';
export function drawR1ZeroAndMetrics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue r1-zero-and-metrics/' + id);
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
      cueProgress('vr-' + name + '-' + 'r1-zero-and-metrics', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'Keep the edition, response count and aggregation attached');
    const bars = [
      [
        'Original curve · 16 correctness labels',
        15.6,
        resultComplete('single', 1) ? 71 : 15.6,
        themeColors.blue,
      ],
      [
        'Table 2 · consensus over 64',
        0,
        resultComplete('consensus', 1) ? 86.7 : 0,
        themeColors.cyan,
      ],
      ['Expanded curve endpoint', 0, resultComplete('edition', 2) ? 77.9 : 0, themeColors.yellow],
    ];
    bars.forEach(([label, start, value, color], i) => {
      const y = 410 + i * 180;
      drawText(ctx, api, label, 210, y, 29, color);
      drawLine(ctx, api, 800, y - 20, 1680, y - 20, themeColors.muted, 2);
      if (value > 0) {
        api.rect(ctx, 800, y - 45, 8.8 * value, 50, themeColors.panel, color, 3);
        drawText(ctx, api, value.toFixed(1) + '%', 1690, y, 31, color);
      }
      if (i === 0) drawText(ctx, api, '15.6% start', 800, y + 60, 26, themeColors.muted);
    });
    if (currentBeat === 0 && operationProgress('base', 0) > 0)
      drawText(
        ctx,
        api,
        'R1-Zero: V3-Base → direct RL; no preliminary reasoning SFT',
        960,
        930,
        31,
        themeColors.blue,
        'center',
      );
    drawFooter(
      ctx,
      api,
      'Average correctness, modal-answer consensus and any-correct are different evaluation questions.',
    );
  };
  api.focus.target('r1-zero-and-metrics-mechanism', paint);
}
export default {
  id: 'r1-zero-and-metrics',
  draw: drawR1ZeroAndMetrics,
  cues: [
    'vr-r1-zero-and-metrics-b0',
    'vr-base-r1-zero-and-metrics',
    'vr-r1-zero-and-metrics-b1',
    'vr-single-r1-zero-and-metrics',
    'vr-average-r1-zero-and-metrics',
    'vr-consensus-r1-zero-and-metrics',
    'vr-r1-zero-and-metrics-b2',
    'vr-edition-r1-zero-and-metrics',
  ],
};
