import { FRESH_LOGITS, LOGITS } from '../fixtures.mjs';
import {
  drawCompleteArrow,
  drawCompleteBox,
  drawCompleteEquation,
  drawCompleteHead,
  drawCompleteNote,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteTokenReduction(
  ctx,
  scene,
  state,
  api,
  C,
  m,
  f,
  b,
  colors,
  xs,
  started,
  progress,
) {
  drawCompleteHead(
    ctx,
    api,
    C,
    b === 0
      ? 'Ignored row adds zero loss and zero count'
      : b === 1
        ? 'Combine sums and counts before dividing'
        : 'Guard the optimizer boundary before an empty update',
  );
  if (b === 0) {
    const n = progress('ignore-row-change'),
      rows = [LOGITS, FRESH_LOGITS, [100 + 100 * n, -100 + 50 * n, -60 * n]];
    rows.forEach((v, i) => {
      const y = 400 + i * 150;
      drawCompleteText(
        ctx,
        api,
        C,
        'row ' + (i + 1),
        220,
        y + 10,
        30,
        i === 2 ? C.muted : colors[i],
      );
      drawCompleteBox(
        ctx,
        api,
        C,
        '[' +
          v
            .map((x) => (Number.isInteger(x) ? String(x) : Number(x.toFixed(3)).toString()))
            .join(', ') +
          ']',
        690,
        y,
        650,
        85,
        i === 2 ? C.muted : colors[i],
        32,
      );
      drawCompleteText(
        ctx,
        api,
        C,
        i === 2 ? 'target −100 · ignored' : 'target ' + [1, 2][i],
        1310,
        y + 10,
        31,
        i === 2 ? C.muted : colors[i],
      );
    });
    if (started('ignore-denominator'))
      drawCompleteText(
        ctx,
        api,
        C,
        '(' + m.sequence.numerator.toFixed(6) + ' + 0) / 2 = ' + m.sequence.mean.toFixed(6),
        960,
        925,
        40,
        C.green,
        'center',
      );
    drawCompleteNote(
      ctx,
      api,
      C,
      'Changing only the finite ignored row does not change its zero loss, zero gradient or zero count.',
    );
  } else if (b === 1) {
    drawCompleteBox(ctx, api, C, 'sequence A: [2]', 500, 420, 600, 100, C.blue, 38);
    drawCompleteBox(ctx, api, C, 'sequence B: [0, 0, 0]', 1400, 420, 650, 100, C.green, 36);
    if (started('ignore-pooled')) {
      drawCompleteArrow(ctx, api, C, 500, 500, 760, 630, C.blue);
      drawCompleteArrow(ctx, api, C, 1400, 500, 1160, 630, C.green);
      drawCompleteEquation(ctx, api, C, '(2+0+0+0)/(1+3)=0.5', 960, 725, 43, C.cyan);
    }
    if (started('ignore-means')) {
      drawCompleteEquation(ctx, api, C, '(2+0)/2=1', 960, 875, 43, C.pink);
      drawCompleteText(
        ctx,
        api,
        C,
        'mean of sequence means gives each sequence equal weight',
        960,
        975,
        30,
        C.pink,
        'center',
      );
    }
  } else {
    const empty = started('ignore-empty'),
      nan = started('ignore-empty-nan'),
      skip = started('ignore-empty-decision');
    ['A', 'B', 'C'].forEach((v, i) => {
      drawCompleteText(ctx, api, C, 'row ' + v, xs[i], 400, 32, colors[i], 'center');
      drawCompleteBox(
        ctx,
        api,
        C,
        empty ? 'ignored' : i === 2 ? 'ignored' : 'supervised',
        xs[i],
        540,
        360,
        100,
        empty ? C.muted : colors[i],
        31,
      );
    });
    drawCompleteText(
      ctx,
      api,
      C,
      'supervised count: ' + (empty ? 0 : 2),
      960,
      740,
      38,
      empty ? C.pink : C.green,
      'center',
    );
    if (nan) drawCompleteText(ctx, api, C, 'empty mean → NaN', 600, 850, 37, C.pink, 'center');
    if (skip) drawCompleteBox(ctx, api, C, 'SKIP UPDATE', 1390, 850, 420, 100, C.yellow, 38);
    if (started('ignore-input-context'))
      drawCompleteText(
        ctx,
        api,
        C,
        'Loss ignored here can still be input context for a later supervised position.',
        960,
        980,
        28,
        C.cyan,
        'center',
      );
  }
}
export function drawTokenReductionStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteTokenReduction);
}
export default {
  id: 'token-reduction',
  draw: drawTokenReductionStage,
  cues: [
    'token-reduction-0',
    'ignore-denominator',
    'ignore-row-change',
    'token-reduction-1',
    'ignore-pooled',
    'ignore-means',
    'token-reduction-2',
    'ignore-empty',
    'ignore-input-context',
    'ignore-empty-nan',
    'ignore-empty-decision',
  ],
};
