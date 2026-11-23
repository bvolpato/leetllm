import { cueProgress, sampleModel, tokenMeanTrace } from '../model.mjs';
import {
  drawTrainingLine,
  drawTrainingMath,
  drawTrainingText,
  formatTrainingNumber,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintBatches(ctx, scene, state, api, C, c, b, s, P) {
  if (b === 1 && P('token-mean', 1) > 0) {
    drawTokenMean(ctx, state, api);
    return;
  }
  if (b === 2 && P('batch-updates', 2) > 0) {
    drawTrainingText(
      ctx,
      api,
      C,
      'Changed fixture · 60 presentations of a six-example dataset',
      960,
      300,
      36,
      C.ink,
      'center',
    );
    withTrainingFocus(ctx, api, 'batch-regimes', () =>
      [6, 2, 1].forEach((size, i) => {
        const y = 430 + i * 190;
        drawTrainingText(ctx, api, C, 'Batch size ' + size, 250, y + 35, 31, C.blue, 'center');
        for (let j = 0; j < 60; j++) {
          const x = 470 + j * 20;
          c.panel({
            x,
            y,
            width: 15,
            height: 50,
            fill: [C.blue, C.cyan, C.pink][i],
            stroke: [C.blue, C.cyan, C.pink][i],
            radius: 0,
          });
          if (j % size === size - 1)
            drawTrainingLine(ctx, api, C, x + 18, y - 15, x + 18, y + 70, C.yellow, 2);
        }
        drawTrainingText(
          ctx,
          api,
          C,
          60 / size + ' optimizer updates',
          1180,
          y + 120,
          32,
          C.yellow,
          'center',
        );
      }),
    );
    drawTrainingText(
      ctx,
      api,
      C,
      'Identical presentation count · different step count and update noise',
      960,
      1030,
      30,
      C.muted,
      'center',
    );
    return;
  }
  drawTrainingText(
    ctx,
    api,
    C,
    'Three requests · weight 0 · bias 0',
    960,
    285,
    34,
    C.muted,
    'center',
  );
  const baseline = 690,
    heightPerUnit = 570,
    colors = [C.blue, C.cyan, C.pink];
  withTrainingFocus(ctx, api, 'batch-shares', () =>
    s.rows.forEach(([x, y], i) => {
      const left = 330 + i * 510,
        height = s.weights[i] * heightPerUnit;
      drawTrainingText(
        ctx,
        api,
        C,
        `x = ${x} · measured ${y}`,
        left + 115,
        365,
        31,
        colors[i],
        'center',
      );
      c.panel({
        x: left,
        y: baseline - height,
        width: 230,
        height,
        fill: colors[i],
        stroke: colors[i],
        radius: 0,
      });
      drawTrainingText(
        ctx,
        api,
        C,
        s.step < 2 || s.weights[i] === 1 / 3
          ? '1/3'
          : formatTrainingNumber(ctx, api, s.weights[i], 3),
        left + 115,
        baseline - height / 2 + 12,
        33,
        C.bg,
        'center',
      );
      drawTrainingText(ctx, api, C, 'influence', left + 115, baseline + 55, 28, C.muted, 'center');
    }),
  );
  drawTrainingLine(ctx, api, C, 260, baseline, 1700, baseline, C.muted, 3);
  withTrainingFocus(ctx, api, 'chunk-partition', () => {
    if (b > 0) {
      drawTrainingLine(ctx, api, C, 305, 780, 1085, 780, C.blue, 4);
      drawTrainingLine(ctx, api, C, 1325, 780, 1625, 780, C.pink, 4);
      drawTrainingText(ctx, api, C, 'chunk of 2 · mean −6.5', 695, 835, 30, C.blue, 'center');
      drawTrainingText(ctx, api, C, 'chunk of 1 · mean −21', 1475, 835, 30, C.pink, 'center');
    } else
      drawTrainingText(
        ctx,
        api,
        C,
        'One mean over the three examples',
        960,
        810,
        31,
        C.ink,
        'center',
      );
  });
  withTrainingFocus(ctx, api, 'batch-regimes', () => {
    drawTrainingText(ctx, api, C, 'Full batch: all rows', 410, 965, 26, C.blue, 'center');
    drawTrainingText(ctx, api, C, 'Online: one row', 960, 965, 26, C.cyan, 'center');
    drawTrainingText(ctx, api, C, 'Mini-batch: several rows', 1490, 965, 26, C.pink, 'center');
  });
  withTrainingFocus(ctx, api, 'chunk-gradient-buffer', () => {
    if (b > 0) {
      drawTrainingMath(
        ctx,
        api,
        C,
        `g_w=${formatTrainingNumber(ctx, api, s.accumulated)}`,
        720,
        920,
        45,
        b === 2 ? C.pink : C.green,
      );
      drawTrainingMath(
        ctx,
        api,
        C,
        `g_b=${formatTrainingNumber(ctx, api, s.biasAccumulated)}`,
        1220,
        920,
        45,
        b === 2 ? C.pink : C.green,
      );
    } else {
      drawTrainingMath(ctx, api, C, String.raw`g_w=-11.333\ldots`, 710, 900, 39, C.green);
      drawTrainingMath(ctx, api, C, String.raw`g_b=-5`, 1230, 900, 39, C.green);
    }
  });
  if (b > 0)
    drawTrainingText(
      ctx,
      api,
      C,
      b === 1
        ? 'Chunk shares 2/3 + 1/3 preserve equal per-request influence'
        : 'Equal chunk shares 1/2 + 1/2 give the last request twice the influence',
      960,
      1040,
      28,
      b === 1 ? C.green : C.pink,
      'center',
    );
  return;
}
export function drawBatchesStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat);
  return paintBatches(ctx, scene, state, api, C, c, b, s, P);
}
function drawTokenMean(ctx, state, api) {
  const { C, components: c } = api,
    trace = tokenMeanTrace(),
    T = (v, x, y, size = 32, color = C.ink) =>
      api.text(ctx, String(v), x, y, size, color, 'center');
  T('Changed fixture · two chunks · valid-token losses below', 960, 290, 34, C.ink);
  api.focus.target('token-weights', () => {
    trace.chunks.forEach((losses, i) => {
      const y = 420 + i * 245,
        color = i ? C.pink : C.blue;
      T('Chunk ' + (i + 1), 230, y + 40, 32, color);
      T(i ? '1 request' : '2 requests', 230, y + 110, 28, C.muted);
      for (let j = 0; j < 7; j++) {
        const x = 470 + j * 180,
          valid = j < losses.length;
        c.card({
          label: valid ? String(losses[j]) : 'PAD',
          x,
          y,
          width: 150,
          height: 90,
          fontSize: 31,
          fill: C.panel,
          stroke: valid ? color : C.muted,
          textColor: valid ? color : C.muted,
        });
      }
      T(
        'Valid ' +
          trace.counts[i] +
          ' · mean loss ' +
          trace.means[i] +
          ' · share ' +
          trace.weights[i].toFixed(1),
        1100,
        y + 155,
        32,
        color,
      );
    });
    const ready = cueProgress(state, 'token-result', 1) > 0;
    api.math(
      ctx,
      ready
        ? String.raw`L=\frac3{10}\,2+\frac7{10}\,4=3.4`
        : String.raw`L=\frac{n_1}{n_1+n_2}\,L_1+\frac{n_2}{n_1+n_2}\,L_2`,
      960,
      950,
      43,
      C.yellow,
      'center',
    );
    T('Each valid token keeps weight 1/10 · padding contributes zero', 960, 1030, 29, C.muted);
  });
}
export default {
  id: 'batches',
  draw: drawBatchesStage,
  cues: [
    'batch-rows',
    'batch-regimes',
    'batch-group',
    'batch-weight',
    'token-mean',
    'token-result',
    'batch-wrong',
    'batch-objective',
    'batch-updates',
  ],
};
