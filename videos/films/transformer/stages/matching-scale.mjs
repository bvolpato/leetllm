import {
  drawExtendedArrow,
  drawExtendedMatrix,
  drawExtendedNote,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
import { dotProduct, stableSoftmax } from 'vizmatic';
import { event } from '../arithmetic.mjs';
export function paintMatchingScale(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors) {
  if (b === 0) {
    const inputs = [
      [1, 0],
      [1, 1],
    ];
    const scores = inputs.map((q) => inputs.map((k) => dotProduct(q, k)));
    const shares = scores.map((row) => stableSoftmax(row));
    const cross = event(state, 0, 'tr-matching-scale-cross', 0.08, 0.2);
    const self = event(state, 0, 'tr-matching-scale-raw', 0.2, 0.32);
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Each token compares its row with both rows',
      'A = [1, 0]     B = [1, 1]     ·     unmasked attention',
    );
    drawExtendedMatrix(
      ctx,
      api,
      C,
      f,
      scores.map((row, i) =>
        row.map((v, j) => {
          const shown = i === j ? self * 2 > i : cross * 2 > i;
          return shown ? v : '·';
        }),
      ),
      220,
      420,
      550,
      340,
      C.cyan,
    );
    for (const x of [220, 1120]) {
      for (const [i, name] of ['A', 'B'].entries()) {
        drawExtendedText(ctx, api, C, name, x - 32, 519 + 170 * i, 29, C.muted, 'right');
        drawExtendedText(ctx, api, C, name, x + 134 + 275 * i, 394, 29, C.muted, 'center');
      }
    }
    drawExtendedArrow(ctx, api, C, 820, 590, 1040, 590);
    drawExtendedMatrix(
      ctx,
      api,
      C,
      f,
      shares.map((row, i) => (known(i === 0 ? 'first' : 'shares', 0) ? row : ['?', '?'])),
      1120,
      420,
      550,
      340,
      C.green,
    );
    drawExtendedText(ctx, api, C, 'X × Xᵀ', 495, 825, 31, C.cyan, 'center');
    drawExtendedText(ctx, api, C, 'softmax separately per row', 1395, 825, 29, C.green, 'center');
    drawExtendedNote(
      ctx,
      api,
      C,
      known('shares', 0)
        ? 'The same score of 1 competes against 1 in row A and 2 in row B'
        : 'Rows are readers   ·   columns are keys A and B',
    );
  } else if (b === 1) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Track variance as coordinate products accumulate',
      'Independent, zero-mean, unit-variance components only',
    );
    const n = Math.max(1, Math.ceil(8 * p));
    for (let i = 0; i < 8; i++) {
      api.rect(ctx, 220 + i * 185, 445, 150, 140, i < n ? C.cyan : C.panel, C.muted, 1);
      drawExtendedText(
        ctx,
        api,
        C,
        i < n ? 'Var 1' : '?',
        295 + i * 185,
        525,
        27,
        i < n ? C.panel : C.muted,
        'center',
      );
    }
    drawExtendedText(ctx, api, C, 'sum of ' + n + ' products', 540, 740, 33, C.cyan, 'center');
    drawExtendedText(
      ctx,
      api,
      C,
      known('variance', 1) ? 'variance dₖ · standard deviation √dₖ' : 'variance ?',
      1320,
      740,
      33,
      C.yellow,
      'center',
    );
    drawExtendedNote(
      ctx,
      api,
      C,
      'Divide by √dₖ · learned correlated features need not satisfy this model',
    );
  } else if (b === 2) {
    const raw = [12.4, 9.1, 3.8];
    const progress = event(state, 2, 'tr-matching-scale-scaled', 0.32, 0.58);
    const divisor = 1 + progress * (Math.sqrt(64) - 1);
    const before = stableSoftmax(raw),
      after = stableSoftmax(raw.map((v) => v / divisor));
    const shareLabel = (value) => (value > 0 && value < 0.0005 ? '<0.001' : value.toFixed(3));
    const x = 770,
      width = 893;
    drawExtendedText(ctx, api, C, 'Attention share per key', 250, 286, 39, C.ink);
    drawExtendedText(ctx, api, C, '0%', x, 368, 29, C.muted, 'center');
    drawExtendedText(ctx, api, C, '100%', x + width, 368, 29, C.muted, 'center');
    drawExtendedText(ctx, api, C, 'raw score', 500, 373, 29, C.muted, 'center');
    raw.forEach((v, i) => {
      const y = 440 + 148 * i;
      drawExtendedText(ctx, api, C, 'key ' + (i + 1), 265, y + 29, 35, C.ink);
      drawExtendedText(ctx, api, C, v.toFixed(1), 500, y + 29, 35, C.ink, 'center');
      drawExtendedText(ctx, api, C, shareLabel(before[i]), x - 44, y + 10, 29, C.blue, 'right');
      api.rect(ctx, x, y - 14, Math.max(1, width * before[i]), 24, C.blue, undefined, 2);
      if (progress > 0) {
        drawExtendedText(ctx, api, C, shareLabel(after[i]), x - 44, y + 57, 29, C.green, 'right');
        api.rect(ctx, x, y + 33, Math.max(1, width * after[i]), 24, C.green, undefined, 2);
      }
    });
    drawExtendedText(ctx, api, C, 'Unscaled', 330, 931, 34, C.blue);
    if (progress > 0)
      drawExtendedText(
        ctx,
        api,
        C,
        'Scores ÷ ' + f(divisor, progress === 1 ? 0 : 1),
        1050,
        931,
        34,
        C.green,
      );
  } else {
    const growth = event(state, 3, 'tr-matching-scale-length', 0.18, 0.58);
    const n = 3 + Math.round(3 * growth);
    const side = 72;
    drawExtendedText(ctx, api, C, 'Query × key pairs', 618, 290, 37, C.ink, 'center');
    drawExtendedText(ctx, api, C, 'One projected row per token', 1370, 290, 37, C.ink, 'center');
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++)
        api.rect(
          ctx,
          395 + j * side,
          377 + i * side,
          side - 6,
          side - 6,
          i < 3 && j < 3 ? C.blue : C.cyan,
          undefined,
          3,
        );
      api.rect(ctx, 1180, 377 + i * side, 380, side - 6, i < 3 ? C.blue : C.cyan, undefined, 3);
    }
    drawExtendedText(
      ctx,
      api,
      C,
      n + ' × ' + n + ' = ' + n * n + ' scores',
      618,
      924,
      39,
      C.ink,
      'center',
    );
    drawExtendedText(
      ctx,
      api,
      C,
      n + ' rows  ·  same feature width',
      1370,
      924,
      36,
      C.ink,
      'center',
    );
  }
}
export function drawMatchingScaleStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintMatchingScale);
}
export default {
  id: 'matching-scale',
  draw: drawMatchingScaleStage,
  cues: [
    'tr-matching-scale-cross',
    'tr-matching-scale-first',
    'tr-matching-scale-raw',
    'tr-matching-scale-shares',
    'tr-matching-scale-voice-1',
    'tr-matching-scale-variance',
    'tr-matching-scale-length',
    'tr-matching-scale-scaled',
  ],
};
