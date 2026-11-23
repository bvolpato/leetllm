import { gradientClamp, gradientPhase, latencyExample } from '../arithmetic.mjs';
import { gradientCue, gradientDone } from '../construction.mjs';
import { BATCH_FEATURES } from '../fixtures.mjs';
import { number } from '../latency-ruler.mjs';
import {
  drawExtensionCaption,
  drawExtensionText,
  formatGradientValue,
  withTarget,
} from '../defaults.mjs';
export function drawVectorSeed(ctx, scene, state, api) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = gradientClamp(state.beatP ?? 0),
    cues = state.cues;
  const progress = (id, beat, a = 0.1, z = 0.8) =>
    currentBeat < beat
      ? 0
      : currentBeat > beat
        ? 1
        : gradientCue(cues, id, gradientPhase(progress2, a, z));
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && gradientDone(cues, id, progress2 > at));
  const paint = () => {
    const rows = [BATCH_FEATURES[0], BATCH_FEATURES[2]];
    const modelWeights = [1.3, 1.1];
    const predictions = rows.map(features => latencyExample(modelWeights, features).prediction);
    if (currentBeat === 0) {
      const { text, rect, C } = api;
      text(ctx, 'Both requests queued for 0.5 s', 210, 300, 43, C.ink);
      for (const [i, [blocks, queued]] of rows.entries()) {
        const left = 465, y = 412 + i * 202, scale = 238;
        const queueWidth = scale * queued * modelWeights[1];
        const blockWidth = scale * modelWeights[0];
        text(ctx, 'Request ' + (i + 1), 205, y + 70, 40, C.ink);
        rect(ctx, left, y, queueWidth, 114, C.yellow + '32', C.yellow, 8);
        text(ctx, 'queue', left + queueWidth / 2, y + 69, 32, C.yellow, 'center');
        for (let j = 0; j < blocks; j++) {
          const start = left + queueWidth + j * blockWidth;
          rect(ctx, start + 3, y, blockWidth - 3, 114, C.cyan + '36', C.cyan, 8);
          text(ctx, '100 tokens', start + blockWidth / 2, y + 69, 34, C.ink, 'center');
        }
        text(ctx, number(predictions[i]) + ' s', left + predictions[i] * scale + 26, y + 72, 45, C.cyan);
      }
      text(ctx, 'Model weights    1.3 s per block    ·    1.1 × queue time', 960, 888, 37, C.muted, 'center');
      return;
    }
    const sum = currentBeat === 2 && done('seed-sum', 2, 0.7),
      advance = currentBeat === 1 ? progress('seed-accumulate', 1, 0.45, 0.93) : 1,
      weights = sum ? [1, 1] : [-1, 1],
      pl = teaching.axes({
        x: 270,
        y: 350,
        width: 800,
        height: 480,
        xDomain: [-1, 4],
        yDomain: [-1.5, 1.5],
        xTicks: [-1, 0, 1, 2, 3, 4],
        yTicks: [-1, 0, 1],
        xLabel: 'prompt sensitivity',
        yLabel: '',
        fontSize: 24,
      });
    drawExtensionText(ctx, api, 'queue sensitivity', 680, 325, 31, themeColors.cyan, 'center');
    const terms = [
      {
        id: 'seed-first',
        label: 'Request 1',
        weight: weights[0],
        values: rows[0],
        color: themeColors.blue,
      },
      {
        id: 'seed-second',
        label: 'Request 2',
        weight: weights[1],
        values: rows[1],
        color: themeColors.pink,
      },
    ];
    withTarget(ctx, api, 'seed-geometry', () =>
      teaching.vectorAccumulation({
        terms,
        progress: advance,
        plot: pl,
        ledger: {
          x: 1200,
          y: 390,
          width: 550,
          height: 420,
        },
        fontSize: 25,
        revealTotal: advance === 1,
        totalLabel: sum ? 'sum sensitivity' : 'difference sensitivity',
        totalTarget: 'seed-result',
        format: (v) => String(formatGradientValue(ctx, api, v, 3)),
      }),
    );
    drawExtensionText(
      ctx,
      api,
      sum ? 'Seed [1, 1] adds the predictions' : 'Seed [−1, 1] subtracts the first prediction from the second',
      960,
      945,
      32,
      themeColors.yellow,
      'center',
    );
    drawExtensionCaption(
      ctx,
      api,
      sum ? 'Same requests    ·    new objective' :
        'Predicted time gap    ' + number(predictions[1]) + ' − ' + number(predictions[0]) + ' = ' +
        number(predictions[1] - predictions[0]) + ' s',
    );
  };
  withTarget(ctx, api, 'vector-seed-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'vector-seed',
  draw: drawVectorSeed,
  cues: ['vector-seed-b1', 'vector-seed-b2', 'seed-accumulate', 'vector-seed-b3', 'seed-sum'],
};
