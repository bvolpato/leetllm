import {
  drawCompleteBox,
  drawCompleteEquation,
  drawCompleteHead,
  drawCompleteLine,
  drawCompleteNote,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteVocabularyTiles(
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
      ? 'Size the actual token-by-vocabulary allocation'
      : 'Separate four-class tile toy · target is class2',
  );
  if (b === 0) {
    const w = 1290 * progress('vocab-matrix'),
      h = 420 * progress('vocab-positions');
    api.rect(ctx, 350, 380, w, h, C.panel, C.blue, 3);
    if (w > 0) {
      for (let i = 1; i < 8; i++)
        drawCompleteLine(
          ctx,
          api,
          C,
          350 + (w * i) / 8,
          380,
          350 + (w * i) / 8,
          380 + h,
          C.muted,
          1,
        );
      drawCompleteText(ctx, api, C, 'V = 128,256 columns', 995, 345, 32, C.blue, 'center');
    }
    if (h > 0) {
      drawCompleteText(
        ctx,
        api,
        C,
        'B × S = 16 × 4,096 = 65,536 positions',
        960,
        850,
        33,
        C.cyan,
        'center',
      );
    }
    if (started('vocab-bytes'))
      drawCompleteText(
        ctx,
        api,
        C,
        m.bytes.toLocaleString('en-US') + ' bytes × 1 allocation',
        960,
        935,
        37,
        C.yellow,
        'center',
      );
    if (started('vocab-gib'))
      drawCompleteText(
        ctx,
        api,
        C,
        '33.62 GB = 31.3125 GiB · float32 logits alone',
        960,
        1005,
        31,
        C.yellow,
        'center',
      );
  } else {
    const second = started('tile-incoming') || b === 2,
      t = m.tiles[second ? 1 : 0];
    [2, -1, 4, 0].forEach((z, i) => {
      const x = 420 + i * 350;
      drawCompleteBox(ctx, api, C, String(z), x, 390, 240, 90, i < 2 ? C.blue : C.green, 41);
      drawCompleteText(ctx, api, C, 'class' + i, x, 490, 27, i === 2 ? C.pink : C.muted, 'center');
    });
    const bracket = second ? 1120 : 420;
    drawCompleteLine(
      ctx,
      api,
      C,
      bracket - 130,
      530,
      bracket + 480,
      530,
      second ? C.green : C.blue,
      5,
    );
    drawCompleteText(
      ctx,
      api,
      C,
      'running maximum m = ' + t.maximum,
      500,
      650,
      35,
      C.cyan,
      'center',
    );
    drawCompleteText(
      ctx,
      api,
      C,
      'scaled sum s = ' + t.total.toFixed(6),
      1390,
      650,
      35,
      C.yellow,
      'center',
    );
    if (second) {
      drawCompleteText(
        ctx,
        api,
        C,
        'old sum × exp(2 − 4) = ' + t.retained.toFixed(6),
        500,
        765,
        31,
        C.blue,
        'center',
      );
      drawCompleteText(
        ctx,
        api,
        C,
        'new tile at m4 = ' + t.incoming.toFixed(6),
        1390,
        765,
        31,
        C.green,
        'center',
      );
    }
    if (started('tile-result') || b === 2) {
      drawCompleteEquation(ctx, api, C, 'L=m+\\log s-z_{target}', 960, 865, 42, C.ink);
      drawCompleteText(
        ctx,
        api,
        C,
        t.maximum + ' + ' + Math.log(t.total).toFixed(6) + ' − 4 = ' + (t.logSumExp - 4).toFixed(6),
        960,
        945,
        36,
        C.pink,
        'center',
      );
    }
    drawCompleteNote(
      ctx,
      api,
      C,
      b === 2
        ? 'Real fused implementations project tiles without a full global logit matrix; filtering and hardware need evaluation.'
        : 'When the maximum changes, rescale the previous sum before merging. Target logit is read separately.',
    );
  }
}
export function drawVocabularyTilesStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteVocabularyTiles);
}
export default {
  id: 'vocabulary-tiles',
  draw: drawVocabularyTilesStage,
  cues: [
    'vocabulary-tiles-0',
    'vocab-matrix',
    'vocab-positions',
    'vocab-bytes',
    'vocab-gib',
    'vocabulary-tiles-1',
    'tile-incoming',
    'tile-result',
    'vocabulary-tiles-2',
    'tile-full-contract',
  ],
};
