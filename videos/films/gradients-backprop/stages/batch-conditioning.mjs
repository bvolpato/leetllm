import { cueProgress, number } from '../latency-ruler.mjs';
import { BATCH_FEATURES } from '../fixtures.mjs';
import { BATCH_HISTORY, batchGradientState, gradientClamp, gradientPhase } from '../arithmetic.mjs';
import { gradientCue } from '../construction.mjs';
import {
  drawExtensionCaption,
  drawExtensionEquation,
  drawExtensionText,
  withTarget,
} from '../defaults.mjs';
export function drawBatchConditioning(ctx, scene, state, api) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = gradientClamp(state.beatP ?? 0),
    cues = state.cues;
  const progress = (id, beat, a = 0.1, z = 0.8) =>
    currentBeat < beat
      ? 0
      : currentBeat > beat
        ? 1
        : gradientCue(cues, id, gradientPhase(progress2, a, z));
  const paint = () => {
    if (currentBeat < 2) {
      const base = batchGradientState();
      const lastRow = progress('batch-column-sum', 1, 0.14, 0.36);
      const promptMean = progress('batch-average', 1, 0.36, 0.48);
      const queueMean = progress('batch-queue-average', 1, 0.48, 0.68);
      drawExtensionText(ctx, api, 'request', 190, 330, 27, themeColors.muted);
      drawExtensionText(ctx, api, '[prompt, queue]', 610, 330, 29, themeColors.blue, 'center');
      drawExtensionText(ctx, api, 'target', 980, 330, 29, themeColors.green, 'center');
      drawExtensionText(ctx, api, 'per-row gradient', 1430, 330, 29, themeColors.pink, 'center');
      function drawRow(r, i) {
        const yy = 440 + i * 120;
        drawExtensionText(ctx, api, r.id, 190, yy, 30, themeColors.muted);
        drawExtensionText(
          ctx,
          api,
          `[${r.features.join(', ')}]`,
          610,
          yy,
          33,
          themeColors.blue,
          'center',
        );
        drawExtensionText(ctx, api, r.target, 980, yy, 33, themeColors.green, 'center');
        if ((i === 3 && lastRow === 1) || i < Math.floor(3 * promptMean))
          drawExtensionText(
            ctx,
            api,
            `[${r.gradient.join(', ')}]`,
            1430,
            yy,
            33,
            themeColors.pink,
            'center',
          );
      }
      base.rows.forEach((r, i) => {
        if (i === 3) withTarget(ctx, api, 'batch-last-row', () => drawRow(r, i));
        else drawRow(r, i);
      });
      withTarget(ctx, api, 'batch-gradient-result', () => {
        if (currentBeat === 0)
          drawExtensionText(
            ctx,
            api,
            'W = [0, 0] · mean squared loss ' + base.loss + ' s²',
            960,
            925,
            35,
            themeColors.yellow,
            'center',
          );
        else if (promptMean === 1)
          drawExtensionEquation(
            ctx,
            api,
            progress('batch-first-step', 1, 0.82, 0.94) === 1
              ? String.raw`\overline g=(-36,-14.75)\quad w_{\rm next}=(1.08,0.4425)`
              : String.raw`\overline g=(-36,${queueMean === 1 ? '-14.75' : '?'})`,
            960,
            925,
            42,
            themeColors.yellow,
          );
        else
          drawExtensionText(
            ctx,
            api,
            lastRow > 0 ? 'Last row     2 × (−10) × 4 = ' + (lastRow === 1 ? '−80' : '?') : 'Weights [0, 0]',
            960,
            925,
            31,
            themeColors.muted,
            'center',
          );
      });
      drawExtensionCaption(ctx, api, 'Same four paired requests · one full-batch mean');
    } else if (currentBeat === 2) {
      const n = Math.floor(10 * progress('batch-first-ten', 2, 0.05, 0.28)
        + 90 * progress('batch-next-ninety', 2, 0.32, 0.59)
        + progress('batch-last-update', 2, 0.65, 0.81)),
        pl = teaching.axes({
          x: 330,
          y: 420,
          width: 1240,
          height: 400,
          xDomain: [0, 101],
          yDomain: [-4, 2],
          xTicks: [0, 10, 50, 100],
          yTicks: [-4, -3, -2, -1, 0, 1, 2],
          xLabel: 'completed update count',
          yLabel: '',
          fontSize: 25,
        });
      api.path(
        ctx,
        BATCH_HISTORY.slice(0, n + 1).map((s) => pl.point(s.step, Math.log10(s.loss))),
        {
          color: themeColors.cyan,
          width: 5,
        },
      );
      drawExtensionText(
        ctx,
        api,
        'log10 mean squared loss',
        960,
        310,
        33,
        themeColors.cyan,
        'center',
      );
      const s = BATCH_HISTORY[n];
      drawExtensionText(
        ctx,
        api,
        `${n} completed updates   ·   MSE ${s.loss.toFixed(6)}   ·   W [${s.weights.map((x) => x.toFixed(4)).join(', ')}]`,
        960,
        925,
        32,
        themeColors.yellow,
        'center',
      );
      for (const [i, count] of [10, 100].entries()) {
        if (n < count) continue;
        const loss = BATCH_HISTORY[count].loss;
        const point = pl.point(count, Math.log10(loss));
        const color = i === 0 ? themeColors.blue : themeColors.pink;
        api.circle(ctx, point.x, point.y, 9, color);
        drawExtensionText(ctx, api, count + ' updates   ·   ' + loss.toFixed(6) + ' s²',
          i === 0 ? 560 : 1380, 997, 30, color, 'center');
      }
    } else {
      drawConditioning(ctx, state, api);
    }
  };
  withTarget(ctx, api, 'batch-conditioning-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'batch-conditioning',
  draw: drawBatchConditioning,
  cues: [
    'batch-conditioning-b1',
    'batch-conditioning-b2',
    'batch-column-sum',
    'batch-average',
    'batch-queue-average',
    'batch-first-step',
    'batch-conditioning-b3',
    'batch-history',
    'batch-first-ten',
    'batch-next-ninety',
    'batch-last-update',
    'batch-conditioning-b4',
    'batch-prompt-offset',
    'batch-queue-minus',
    'batch-queue-plus',
  ],
};

function drawConditioning(ctx, state, api) {
  const { C, text, line, circle } = api;
  const prompt = 0.1 * cueProgress(state, api, 'batch-prompt-offset', 3, 0.23, 0.48);
  const down = cueProgress(state, api, 'batch-queue-minus', 4, 0.06, 0.32);
  const up = cueProgress(state, api, 'batch-queue-plus', 5, 0.1, 0.5);
  const queue = -0.25 * down + 0.5 * up;
  const batch = batchGradientState([2 + prompt, 1 + queue]);
  const X = offset => 438 + 910 * offset, Y = offset => 620 - 910 * offset;
  const plot = { x: X(-0.31), y: Y(0.31), width: 0.62 * 910, height: 0.62 * 910 };
  // Along a unit direction the batch loss is r² times the mean squared projected feature.
  for (const loss of [0.011, 0.05, 0.15, 0.31]) {
    const points = Array.from({ length: 241 }, (_, i) => {
      const angle = 2 * Math.PI * i / 240;
      const a = Math.cos(angle), b = Math.sin(angle);
      const mean = BATCH_FEATURES.reduce((total, [p, q]) => total + (p * a + q * b) ** 2, 0) / BATCH_FEATURES.length;
      const radius = Math.sqrt(loss / mean);
      return { x: X(radius * a), y: Y(radius * b) };
    });
    api.path(ctx, points, { color: C.muted + '66', width: 2, clip: plot });
  }
  line(ctx, X(-0.31), Y(0), X(0.31), Y(0), C.muted, 2);
  line(ctx, X(0), Y(-0.31), X(0), Y(0.31), C.muted, 2);
  text(ctx, 'Queue weight offset', X(0), 295, 31, C.muted, 'center');
  text(ctx, 'Prompt weight offset', X(0), 965, 31, C.muted, 'center');
  const hue = up > 0 ? C.pink : C.cyan;
  if (up > 0) {
    line(ctx, X(0), Y(0), X(prompt), Y(-0.25), C.muted, 3);
    circle(ctx, X(prompt), Y(-0.25), 9, C.bg, C.muted, 3);
  }
  line(ctx, X(0), Y(0), X(prompt), Y(queue), hue, 5);
  circle(ctx, X(0), Y(0), 8, C.yellow);
  circle(ctx, X(prompt), Y(queue), 9, hue);
  text(ctx, 'Weights   [' + number(batch.weights[0], 3) + ', ' + number(batch.weights[1], 3) + ']',
    945, 295, 38, C.yellow);
  text(ctx, 'Blocks', 1030, 393, 30, C.muted, 'center');
  text(ctx, 'Queue', 1150, 393, 30, C.muted, 'center');
  text(ctx, 'Prediction error (seconds)', 1500, 393, 32, C.ink, 'center');
  const origin = 1295, scale = 390;
  for (const [i, row] of batch.rows.entries()) {
    const y = 480 + i * 93, tip = origin + scale * row.error;
    const rowColor = i === 2 ? C.ink : C.muted;
    text(ctx, row.id, 924, y + 8, 30, rowColor);
    text(ctx, number(row.features[0]), 1030, y + 8, 30, rowColor, 'center');
    text(ctx, number(row.features[1]) + ' s', 1150, y + 8, 30, rowColor, 'center');
    line(ctx, origin - 68, y, origin + scale, y, C.muted + '66', 2);
    line(ctx, origin, y - 16, origin, y + 16, C.green, 3);
    line(ctx, origin, y, tip, y, hue, 6);
    circle(ctx, tip, y, 8, hue);
    text(ctx, number(row.error, 3), 1800, y + 9, 28, hue, 'right');
  }
  text(ctx, '0', origin, 800, 26, C.green, 'center');
  if (down === 1 && (up === 0 || up === 1)) {
    const row = batch.rows[2];
    const queueTime = queue * row.features[1];
    const calculation = number(prompt * row.features[0], 3) + (queueTime < 0 ? ' − ' : ' + ')
      + number(Math.abs(queueTime), 3) + ' = ' + number(row.error, 3) + ' s';
    text(ctx, 'R3   ' + calculation, 940, 854, 38, hue);
  }
  const prior = batchGradientState([2.1, 0.75]);
  if (state.beat >= 5) text(ctx, 'First offset   MSE ' + number(prior.loss, 7), 940, 907, 31, C.muted);
  text(ctx, 'Current MSE   ' + number(batch.loss, 7), 940, 966, 37, hue);
}
